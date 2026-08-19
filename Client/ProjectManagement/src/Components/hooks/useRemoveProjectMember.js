import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../Services/axios_api'

const getErrorMessage = (error, fallbackMessage) => {
	return error?.response?.data?.message || error?.message || fallbackMessage
}

export const useRemoveProjectMember = (projectId, options = {}) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ userId }) => {
			await api.delete(`/projects/${projectId}/members/${userId}`)
		},
		onMutate: (variables) => {
			options.onMutate?.(variables)
		},
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['project-members', projectId] }),
				queryClient.invalidateQueries({ queryKey: ['project', projectId] })
			])
			toast.success('User removed', { position: 'top-center' })
		},
		onError: (error) => {
			toast.error(getErrorMessage(error, 'Failed to remove user'), { position: 'top-center' })
		},
		onSettled: (_data, _error, variables, context) => {
			options.onSettled?.(_data, _error, variables, context)
		}
	})
}
