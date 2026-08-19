import { useEffect } from 'react'
import { useQuery,useMutation } from '@tanstack/react-query'
import api from '../../Services/axios_api'
import useNotificationStore from '../../Store/useNotificationStore'


export const useNotifications = () => {
    const setNotifications = useNotificationStore((state) => state.setNotifications)

    const query = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { data } = await api.get('/Notifications')
            console.log('Fetched notifications:', data) // Debugging log
            return data
        },
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true
    })

    useEffect(() => {
        if (query.data) {
            setNotifications(query.data)
        }
    }, [query.data, setNotifications])

    return query
}

export const useReadNotification = () => {
    return useMutation({
        mutationFn: async (notificationId) => {
            const { data } = await api.post(`/Notifications/SetRead`,{
                userNotificationId: notificationId
            })
            return data;
        }});
}