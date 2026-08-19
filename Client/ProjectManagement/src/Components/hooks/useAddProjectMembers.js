import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../Services/axios_api'

const getErrorMessage = (error, fallbackMessage) => {
	return error?.response?.data?.message || error?.message || fallbackMessage
}

export const useAddProjectMembers = (projectId) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ userIds }) => {
			console.log(userIds);
			await api.post(`/projects/${projectId}/members/bulk`,  userIds )
		},
		onSuccess: async (_data, variables) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['project-members', projectId] }),
				// queryClient.invalidateQueries({ queryKey: ['project', projectId] })
			])
			variables?.onSuccess?.()
			toast.success('Members added successfully', { position: 'top-center' })
		},
		onError: (error) => {
			console.error(error)
			toast.error(getErrorMessage(error, 'Failed to add members'), { position: 'top-center' })
		}
	})
}
