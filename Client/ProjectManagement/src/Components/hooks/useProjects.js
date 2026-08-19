import { useQuery,keepPreviousData } from "@tanstack/react-query"
import api from "../../Services/axios_api"

export const useProjects = (searchTerm = "")=>{
    return useQuery({
        queryKey:['projects',searchTerm],
        queryFn: async () =>{
            const {data} = await api.get(`/Projects`,{params:{search:searchTerm}});
            return data;
        },
        placeholderData:keepPreviousData
    })
}