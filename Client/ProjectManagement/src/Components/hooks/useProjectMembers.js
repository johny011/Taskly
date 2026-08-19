import { useQuery } from '@tanstack/react-query'
import api from '../../Services/axios_api'

const getErrorMessage = (error, fallbackMessage) => {
	return error?.response?.data?.message || error?.message || fallbackMessage
}

export default function useProjectMembers(projectId) {
	const { data, isPending, error } = useQuery({
		queryKey: ['project-members', projectId],
		enabled: Boolean(projectId),
		queryFn: async () => {
			const response = await api.get(`/Projects/${projectId}/Members`)
			console.log('Fetched members:', response.data)
			return response.data
		}
	})

	return {
		members: data,
		isPending,
		errorMessage: error ? getErrorMessage(error, 'Failed to load members') : ''
	}
}
