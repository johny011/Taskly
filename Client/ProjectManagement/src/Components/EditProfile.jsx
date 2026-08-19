import React from 'react'
import FormInput from './InputField'
import useEditProfile from './hooks/useEditProfile'

// (نفس الـ Skeleton السابق أبقيته كما هو لجمالية التحميل)
function ProfileSkeleton() {
  return (
    <div className="min-h-[70vh] animate-pulse rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 sm:p-8">
      {/* ... Skeleton Content ... */}
    </div>
  )
}

export default function EditProfile() {
  const {
    profile,
    isLoading,
    
    // دوال وحالات نموذج البيانات الأساسية
    profileForm: { register: regProfile, handleSubmit: submitProfile, formState: { errors: errProfile } },
    updateProfile,
    isUpdatingProfile,
    profileSuccess,
    profileError,

    // دوال وحالات نموذج تغيير كلمة المرور
    passwordForm: { register: regPassword, handleSubmit: submitPassword, formState: { errors: errPassword }, watch },
    changePassword,
    isChangingPassword,
    passwordSuccess,
    passwordError,
  } = useEditProfile()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-0 pb-10 pt-2 sm:px-0">
        <ProfileSkeleton />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-0 pb-10 pt-2 sm:px-0">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur-xl">
        
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-6 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Account Settings</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Edit Profile</h1>
          <p className="mt-2 max-w-2xl text-sm text-secondary">
            Manage your personal information and security settings.
          </p>
        </div>

        <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
          
          {/* Sidebar (Avatar & Info) */}
          <aside className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r lg:border-white/10 sm:p-8">
            <div className="flex items-center gap-4 lg:flex-col lg:items-start">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-brand text-2xl font-bold text-white shadow-lg shadow-brand/20 ring-1 ring-white/10 sm:h-28 sm:w-28">
                {profile?.imageUrl ? (
                  <img src={`${import.meta.env.VITE_API_HOST}/${profile.imageUrl}`} alt={profile?.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span>{(profile?.fullName || profile?.email || 'GU').slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 lg:space-y-2">
                <h2 className="truncate text-lg font-semibold text-white">{profile?.fullName || 'Your profile'}</h2>
                <p className="truncate text-sm text-secondary">{profile?.email || ''}</p>
              </div>
            </div>
          </aside>

          {/* Forms Section */}
          <div className="flex flex-col">
            
            {/* =========================================
                FORM 1: General Information 
               ========================================= */}
            <form onSubmit={submitProfile(updateProfile)} className="space-y-6 p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-white">General Information</h3>
              
              {profileError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {profileError?.response?.data?.message || 'Failed to update profile data.'}
                </div>
              )}
              {profileSuccess && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  Profile updated successfully.
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <FormInput
                  label="Full Name"
                  name="fullName"
                  register={regProfile}
                  errors={errProfile}
                  validation={{ required: 'Name is required' }}
                />
                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  register={regProfile}
                  errors={errProfile}
                  validation={{
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                  }}
                />
              </div>

              <div className="sm:col-span-1">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-secondary">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  {...regProfile('profilePicture')}
                  className="block w-full rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-sm text-white file:mr-4 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUpdatingProfile ? 'Saving...' : 'Save Information'}
                </button>
              </div>
            </form>

            {/* Divider */}
            <hr className="border-white/10" />

            {/* =========================================
                FORM 2: Security & Password 
               ========================================= */}
            <form onSubmit={submitPassword(changePassword)} className="space-y-6 p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-white">Change Password</h3>
              
              {passwordError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {passwordError?.response?.data?.message || 'Failed to change password. Check your current password.'}
                </div>
              )}
              {passwordSuccess && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  Password changed successfully.
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormInput
                    label="Current Password"
                    name="currentPassword"
                    type="password"
                    register={regPassword}
                    errors={errPassword}
                    validation={{ required: 'Current password is required to make changes' }}
                  />
                </div>
                
                <FormInput
                  label="New Password"
                  name="newPassword"
                  type="password"
                  register={regPassword}
                  errors={errPassword}
                  validation={{
                    required: 'New password is required',
                    minLength: { value: 8, message: 'Must be at least 8 characters' }
                  }}
                />
                
                <FormInput
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  register={regPassword}
                  errors={errPassword}
                  validation={{
                    required: 'Please confirm your new password',
                    validate: (value) => value === watch('newPassword') || 'Passwords do not match'
                  }}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="rounded-xl border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  )
}