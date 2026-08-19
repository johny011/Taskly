import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../Services/axios_api'

const getErrorMessage = (error, fallbackMessage) => {
	return error?.response?.data?.message || error?.message || fallbackMessage
}

export const useUpdateProjectMemberRole = (projectId, options = {}) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ userId, role }) => {
			await api.put(`/Projects/${projectId}/Members/${userId}/promote`, { newRole:role })
		},
		onMutate: (variables) => {
			options.onMutate?.(variables)
		},
		onSuccess: async (_data, variables) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['project-members', projectId] }),
				queryClient.invalidateQueries({ queryKey: ['project', projectId] })
			])
			toast.success(variables?.successMessage || 'Role updated successfully', { position: 'top-center' })
		},
		onError: (error) => {
			toast.error(getErrorMessage(error, 'Failed to update role'), { position: 'top-center' })
		},
		onSettled: (_data, _error, variables, context) => {
			options.onSettled?.(_data, _error, variables, context)
		}
	})
}
