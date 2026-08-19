import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios' // تأكد من استيراد إعدادات axios الخاصة بمشروعك
import api from '../../Services/axios_api' // استبدل هذا بالمسار الصحيح إذا كان مختلفًا
export default function useEditProfile() {
  const queryClient = useQueryClient()

  // ==========================================
  // 1. جلب بيانات الملف الشخصي (Fetch Profile)
  // ==========================================
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile'],
      _queryFn: async () => {
          // استبدل الرابط بالـ Endpoint الفعلي في ASP .NET Core
          const response = await api.get('profile')
          return response.data
      },
    get queryFn() {
        return this._queryFn
    },
    set queryFn(value) {
        this._queryFn = value
    },
  })

  // ==========================================
  // 2. إعداد نموذج البيانات الأساسية (Profile Form)
  // ==========================================
  const profileForm = useForm({
    defaultValues: {
      fullName: '',
      email: '',
    },
  })

  // تعبئة البيانات تلقائياً بمجرد وصولها من السيرفر
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        fullName: profile.fullName || '',
        email: profile.email || '',
      })
    }
  }, [profile, profileForm])

  // عملية تحديث البيانات (Mutation)
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      // استخدام FormData ليتوافق مع ASP .NET Core ورفع الملفات
      const formData = new FormData()
      formData.append('fullName', data.fullName)
      formData.append('email', data.email)

      // استخراج الملف من الـ FileList إذا قام المستخدم برفع صورة
      if (data.profilePicture && data.profilePicture.length > 0) {
        formData.append('profilePicture', data.profilePicture[0])
      }

      const response = await api.put('profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    },
    onSuccess: () => {
      // تحديث البيانات المعروضة في الواجهة (بما فيها الـ Navbar إذا كان يستخدم نفس الـ QueryKey)
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    },
  })

  // ==========================================
  // 3. إعداد نموذج كلمة المرور (Password Form)
  // ==========================================
  const passwordForm = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  // عملية تغيير كلمة المرور (Mutation)
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      // إرسال البيانات كـ JSON عادي (ليس FormData)
      const response = await api.post('profile/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      return response.data
    },
    onSuccess: () => {
      // تفريغ حقول كلمة المرور لتجنب إرسالها بالخطأ مرة أخرى
      passwordForm.reset()
    },
  })

  // ==========================================
  // 4. تصدير جميع الحالات والدوال للواجهة
  // ==========================================
  return {
    // حالة الجلب (Query)
    profile,
    isLoading,

    // نموذج تحديث البيانات
    profileForm,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending, // إذا كنت تستخدم TanStack Query v4 استبدل isPending بـ isLoading
    profileSuccess: updateProfileMutation.isSuccess,
    profileError: updateProfileMutation.error,

    // نموذج تغيير كلمة المرور
    passwordForm,
    changePassword: changePasswordMutation.mutate,
    isChangingPassword: changePasswordMutation.isPending,
    passwordSuccess: changePasswordMutation.isSuccess,
    passwordError: changePasswordMutation.error,
  }
}