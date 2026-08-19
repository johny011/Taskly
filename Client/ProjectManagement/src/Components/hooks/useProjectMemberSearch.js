import { useQuery } from '@tanstack/react-query'
import api from '../../Services/axios_api'

export const useProjectMemberSearch = (projectId, debouncedQuery, options = {}) => {
    const q = String(debouncedQuery ?? '').trim()
    const enabled = options.enabled ?? (Boolean(projectId) && q.length > 1)

    return useQuery({
        queryKey: ['projects', projectId, 'members', 'search', q],
        queryFn: async () => {
            const { data } = await api.get(`/Projects/${projectId}/Members/Search`, { params: { query: q } })
            return data
        },
        enabled,
        staleTime: 300000
    })
}