import { useQuery } from '@tanstack/react-query'
import api from '../../Services/axios_api'

/**
 * @param {string} debouncedQuery — pass a debounced string from useDebounce; do not debounce inside this hook.
 */
export const useUserSearch = (debouncedQuery, options = {}) => {
    const q = String(debouncedQuery ?? '').trim()
    const enabled = options.enabled ?? q.length > 1

    return useQuery({
        queryKey: ['users', 'search', q],
        queryFn: async () => {
            const { data } = await api.get('/Users/Search', { params: { query: q } })
            return data
        },
        enabled,
        staleTime: 300000
    })
}
