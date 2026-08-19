import { create } from 'zustand';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useTaskStore } from './useTaskStore';
import { useQueryClient } from '@tanstack/react-query';
import { useTaskDetailsModal } from './useTaskDetailsModal';
import toast from 'react-hot-toast';

const useProjectStore = create((set, get) => ({
	projectId: null,
	project: null,
	setProject: (project, projectId) => set({ project, projectId }),
	clearProject: () => set({ project: null, projectId: null }),
	hubConnection: null,
	startHubConnection: async (projectId, queryClient) => {
		if (get().hubConnection) return; // منع التكرار

		const connection = new HubConnectionBuilder()
			.withUrl(`${import.meta.env.VITE_HUB_URL}/project`) // رابط السيرفر الخاص بك
			.configureLogging(LogLevel.Information)
			.withAutomaticReconnect()
			.build();
		try {
			await connection.start();
			await connection.invoke("JoinProjectGroup", projectId);

			set({ hubConnection: connection });


			connection.on("ProjectDetailsUpdated", () => {
				queryClient.invalidateQueries(['projects']);
				queryClient.invalidateQueries(['project', projectId]);
			})

			connection.on("ProjectMembersUpdated", () => {
				queryClient.invalidateQueries(['project', projectId]);// while promot or demot => (display buttons)
				queryClient.invalidateQueries(['project-members', projectId]);
				useTaskStore.getState().fetchTasks(projectId);
				
			})

			connection.on("TaskAdded", () => {
				if (get().project.role === 'Member') return;
				useTaskStore.getState().fetchTasks(projectId);
			})

			connection.on("TaskPositionUpdated", (data) => {
				console.log("TaskPositionUpdated event received: ", data);
				useTaskStore.getState().fetchTasks(projectId);
			});

			connection.on("TaskInfoUpdated", (data) => {
				console.log("TaskInfoUpdated event received: ", data);
				useTaskStore.getState().fetchTasks(projectId);
			});

			connection.on("TaskDeleted", (task) => {
				if (useTaskDetailsModal.getState().isOpen && useTaskDetailsModal.getState().taskId === task.taskId) {
					toast.error('Task has been deleted', { position: 'top-center' });
					useTaskDetailsModal.getState().closeModal();
				}
				if (useTaskStore.getState().tasks.find(t => t.id === task.taskId)) {
					useTaskStore.getState().fetchTasks(projectId);
				}
			});

			
		} catch (error) {
			console.error("SignalR Connection Error: ", error);
		}
	},

	stopHubConnection: async (projectId) => {
		const connection = get().hubConnection;
		if (connection) {
			await connection.invoke("LeaveProjectGroup", projectId);
			await connection.stop();
			set({ hubConnection: null });
		}
	},
}));

export default useProjectStore;