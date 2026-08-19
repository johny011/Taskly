// Store/useTaskStore.js
import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import api from '../Services/axios_api';


export const TASK_COLUMN_IDS = ['ToDo', 'InProgress', 'Done'];

export const useTaskStore = create((set, get) => ({
    tasks: [],
    
    setTasks: (tasks) => set({ tasks }),
    fetchTasks: async (projectId) => {

        if (!projectId) return

        set({ loading: true, error: '' })

        try {

            const { data } = await api.get(`/Projects/${projectId}/Tasks`)

            set({ tasks: data, loading: false })
            console.log("Tasks ", data);

        } catch (err) {

            console.error(err)

            const message =

                err?.response?.data?.message || err?.message || 'Failed to load tasks'

            set({ error: message, loading: false })

        }

    },
    // التحديث المحلي أثناء السحب
    reorderTasksOnDragOver: (activeId, overId) => {
        set((state) => {
            const activeIndex = state.tasks.findIndex((t) => t.id === activeId);
            const overIndex = state.tasks.findIndex((t) => t.id === overId);

            if (activeIndex === -1) return state;

            const newTasks = [...state.tasks];
            const activeTask = newTasks[activeIndex];

            // الحالة 1: السحب فوق عمود آخر
            if (TASK_COLUMN_IDS.includes(overId)) {
                if (activeTask.status === overId) return state;
                newTasks[activeIndex] = { ...activeTask, status: overId };
                // عند الانتقال لعمود جديد نضعه في النهاية مبدئياً
                return { tasks: arrayMove(newTasks, activeIndex, newTasks.length - 1) };
            }

            // الحالة 2: السحب فوق عنصر آخر
            const overTask = state.tasks[overIndex];
            if (!overTask) return state;

            if (activeTask.status !== overTask.status) {
                newTasks[activeIndex] = { ...activeTask, status: overTask.status };
                return { tasks: arrayMove(newTasks, activeIndex, overIndex) };
            }

            return { tasks: arrayMove(newTasks, activeIndex, overIndex) };
        });
    },

    // بناء الأمر لإرساله للسيرفر (Lexorank)
    buildReorderCommand: (taskId) => {
        const { tasks } = get();
        const task = tasks.find((item) => item.id === taskId);
        if (!task) return null;

        // تأكد أننا نأخذ المهام مرتبة حسب وضعها الحالي في الواجهة
        const sameStatusTasks = tasks
            .filter((item) => item.status === task.status);
        // لا نحتاج لترتيب بالـ Rank هنا لأن arrayMove رتبتهم فعلياً في المصفوفة

        const currentIndex = sameStatusTasks.findIndex((item) => item.id === taskId);

        return {
            taskId: task.id,
            previousTaskId: currentIndex > 0 ? sameStatusTasks[currentIndex - 1].id : null,
            nextTaskId: currentIndex < sameStatusTasks.length - 1 ? sameStatusTasks[currentIndex + 1].id : null,
            newStatus: task.status
        };
    }



}));