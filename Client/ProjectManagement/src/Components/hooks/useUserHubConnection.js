import { HubConnectionBuilder } from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTaskStore } from "../../Store/useTaskStore";
import {useTaskDetailsModal} from "../../Store/useTaskDetailsModal";
export const useUserHubConnection = (token) => {
    const queryClient = useQueryClient()
    const fetchTasks = useTaskStore((state)=>state.fetchTasks);
    useEffect(() => {
        if (!token) return;

        const hubConnection = new HubConnectionBuilder().
            withUrl(`${import.meta.env.VITE_HUB_URL}/notifications`, {
                accessTokenFactory: ()=> token
            })
            .withAutomaticReconnect()
            .build();

        hubConnection.start()
            .then(() => {
                console.log("Hub connection started with token: ",token);
            })
            .catch((err) => {
                console.error("Error while starting hub connection: ", err);
            });

        hubConnection.on("AddedToProject", (notification) => {
            queryClient.invalidateQueries({ queryKey: ["projects"] })
            queryClient.invalidateQueries({queryKey: ["notifications"]})
        });

        hubConnection.on("AssignedToTask", (notification) => {
            fetchTasks(notification.projectId);
            queryClient.invalidateQueries({queryKey: ["notifications"]})
        })

        hubConnection.on("RemovedFromTask", (notification) => {
            fetchTasks(notification.projectId);
            if(useTaskDetailsModal.getState().isOpen && useTaskDetailsModal.getState().projectId == notification.projectId){
                console.log("Closing task details modal because user was removed from project: ", notification.projectId);
                useTaskDetailsModal.getState().closeModal();
                
            }
            queryClient.invalidateQueries({queryKey: ["notifications"]})
        })

        hubConnection.on("RemovedFromProject", (notification) => {
            console.log("Removed from project notification received: ", notification);
            if(useTaskDetailsModal.getState().isOpen && useTaskDetailsModal.getState().projectId == notification.projectId){
                console.log("Closing task details modal because user was removed from project: ", notification.projectId);
                useTaskDetailsModal.getState().closeModal();
                navigation.navigate("/");
            }
            queryClient.invalidateQueries({ queryKey: ["projects"] })
            queryClient.invalidateQueries({queryKey: ["notifications"]})
        })

        hubConnection.on("ProjectUpdated", (notification) => {
            queryClient.invalidateQueries({queryKey: ["notifications"]})
        })

        hubConnection.on("TaskMoved", (notification) => {
            queryClient.invalidateQueries({queryKey: ["notifications"]})
        })

        hubConnection.on("TaskCreated",(notification) => {
            queryClient.invalidateQueries({queryKey: ["notifications"]})
        })

        hubConnection.on("TaskDeleted",(notification) => {
            queryClient.invalidateQueries({queryKey: ["notifications"]})
        })

        hubConnection.on("TaskUpdated",(notification) => {
            queryClient.invalidateQueries({queryKey:["notifications"]})
        })

        hubConnection.on("TaskCommentAdded",(notification) => {
            queryClient.invalidateQueries({queryKey:["notifications"]})
        })

        hubConnection.on("TaskCommentUpdated",(notification) => {
            queryClient.invalidateQueries({queryKey:["notifications"]})
        })

        hubConnection.on("TaskFileAdded",(notification) => {
            queryClient.invalidateQueries({queryKey:["notifications"]})
        })

        hubConnection.on("TaskFileDeleted",(notification) => {
            queryClient.invalidateQueries({queryKey:["notifications"]})
        })

        return () => {
            hubConnection.off('AddedToProject');
            hubConnection.off('AssignedToTask');
            hubConnection.off('RemovedFromTask');
            hubConnection.off('RemovedFromProject');
            hubConnection.off('TaskDeleted');
            hubConnection.off('TaskUpdated');
            hubConnection.stop();
        };

    }, [token, queryClient])
};