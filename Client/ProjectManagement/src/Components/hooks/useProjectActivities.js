import { useQuery } from '@tanstack/react-query';
import api from '../../Services/axios_api';

export const useProjectActivities = (projectId) => {
    return useQuery({
        queryKey: ['project-activities', projectId],
        queryFn: async () => {
            const response = await api.get(`/Projects/${projectId}/Activities`);
            console.log('Project Activities Response:', response.data); // Log the response data
            return response.data;
        },
    });
};