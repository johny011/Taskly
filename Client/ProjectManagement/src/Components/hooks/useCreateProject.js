import { useMutation, useQueryClient } from "@tanstack/react-query"
import api from "../../Services/axios_api"

export const useCreateProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (newProject) => api.post(`/Projects`, newProject),
        onSuccess: () => {
            queryClient.invalidateQueries(['projects']);
        },
        onError: (error) => {
            console.error('Mutation failed:', error.response?.data?.message || error.message);
        }
    })
}