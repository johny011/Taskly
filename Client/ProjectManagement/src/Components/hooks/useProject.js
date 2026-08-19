import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import api from "../../Services/axios_api"
import useProjectStore from "../../Store/useProjectStore"

const getErrorMessage = (error, fallbackMessage) => {
    return error?.response?.data?.message || error?.message || fallbackMessage
}

export const useProject = (id) => {
    const setProject = useProjectStore((state) => state.setProject)
    const clearProject = useProjectStore((state) => state.clearProject)

    const query = useQuery({
        queryKey: ['project', id],
        queryFn: async () => {
            const { data } = await api.get(`/Projects/${id}`)
            return data
        },
        enabled: !!id
    })

    useEffect(() => {
        if (!id) {
            clearProject()
            return
        }

        if (query.data) {
            setProject(query.data, id)
        }
    }, [id, query.data, clearProject, setProject])

    return query
}

export const useUpdateProject = (projectId) => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (projectData) => {
            if (!projectId) {
                throw new Error('Project id is required')
            }

            const { data } = await api.put(`/Projects/${projectId}`, projectData)
            return data
        },
        onError: (error) => {
            console.error(getErrorMessage(error, 'Failed to update project'))
        }
    })
}

export const useDeleteProject = (projectId) => {
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    return useMutation({
        mutationFn: async () => {
            if (!projectId) {
                throw new Error('Project id is required')
            }

            await api.delete(`/Projects/${projectId}`)
        },
        onError: (error) => {
            console.error(getErrorMessage(error, 'Failed to delete project'))
        }
    })
}
