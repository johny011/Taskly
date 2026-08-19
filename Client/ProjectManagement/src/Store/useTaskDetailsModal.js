import { create } from 'zustand';

export const useTaskDetailsModal = create((set,get)=>({
    isOpen: false,
    taskId: null,
    projectId: null,
    taskText:"",
    openModal: (taskId, projectId,taskText) => set({ isOpen: true, taskId, projectId,taskText }),
    closeModal: () => set({ isOpen: false, taskId: null, projectId: null }),
}));