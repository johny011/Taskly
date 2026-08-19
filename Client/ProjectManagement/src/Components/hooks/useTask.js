import api from "../../Services/axios_api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const fetchTaskDetails = async ({ projectId, taskId }) => {
    const { data } = await api.get(`/projects/${projectId}/tasks/${taskId}`)
    return data;

}

export const useGetTaskDetails = ({ projectId, taskId }) => {
    return useQuery({
        queryKey: ['taskDetails', projectId, taskId],
        queryFn: () => fetchTaskDetails({ projectId, taskId }),
        enabled: !!projectId && !!taskId, // تأكد من وجود projectId و taskId قبل تنفيذ الاستعلام
    })
}

export const useUpdateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, projectId, data }) => {
            return api.patch(`/Projects/${projectId}/Tasks/${taskId}`, data);
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['taskDetails', variables.projectId, variables.taskId] })
        }
    })
}

export const useAddComment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, projectId, text }) => {
            return api.post(`/Projects/${projectId}/Tasks/${taskId}/Comments`, { text });
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['taskDetails', variables.projectId, variables.taskId] })

        }
    })
}

export const useAddTaskFile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, projectId, file }) => {
            return api.post(`/Projects/${projectId}/Tasks/${taskId}/Files`, file, {

            })
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['taskDetails', variables.projectId, variables.taskId] })

        }
    })
}

export const useDeleteTaskFile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, fileId }) => {
            return api.delete(`/Projects/${projectId}/Tasks/${taskId}/Files/${fileId}`)
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['taskDetails', variables.projectId, variables.taskId] })
        }
    })
}

export const useAddTaskMembers = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, taskId, userIds }) => {
            return api.post(`/Projects/${projectId}/Tasks/${taskId}/Members/bulk`, userIds)
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['taskDetails', variables.projectId, variables.taskId] })
        }
    })
}

export const useRemoveTaskMember = () =>{
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn:({taskId,projectId, memberId})=>{
            return api.delete(`/Projects/${projectId}/Tasks/${taskId}/Members/${memberId}`)
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['taskDetails', variables.projectId, variables.taskId] })
        }
    })
}

export const useDeleteTask = ()=>{
    const queryClient = useQueryClient();
    return useMutation({
        
        mutationFn:({taskId,projectId})=>{
            return api.delete(`/Projects/${projectId}/Tasks/${taskId}`)
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tasks', variables.projectId] })
        }
    })
}