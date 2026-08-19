import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../Services/axios_api'
import useProjectStore from '../Store/useProjectStore'
import { useTaskStore } from '../Store/useTaskStore'
import { useUpdateTask } from './hooks/useTask'
export default function TaskDetailsTab({task,taskId}) {
    const fetchTasks = useTaskStore((state) => state.fetchTasks)
    const project = useProjectStore((state) =>
         state.project
    )
    const projectId = useProjectStore((state) => state.projectId)
    const canManageTask = Boolean(project?.role === 'Owner' || project?.role === 'Manager')
    
    const [editText, setEditText] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const {mutate:UpdateTask,isLoading} = useUpdateTask();
    useEffect(() => {
        if (!task) return
        setEditText(task?.text || '')
        setEditDescription(task?.description || '')
    }, [task, setEditText, setEditDescription])

    const saveTaskDetails = async () => {
        if (!canManageTask || !projectId || !taskId) return
        if (!editText.trim()) {
            toast.error('Task text is required', { position: 'top-center' })
            return
        }
        UpdateTask({taskId:taskId, projectId, data: { text: editText, description: editDescription }}, {
            onSuccess: () => {
                toast.success('Task details updated', { position: 'top-center' })
                fetchTasks(projectId)
            },
            onError:(err)=>{
                const message = err?.response?.data?.Message || err?.response?.data?.message || err?.message || 'Failed to update task'
                toast.error(message, { position: 'top-center' })
            }
        })

        
    }

    return (
        <div className="space-y-4">
            <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">Task Title</h4>
                {canManageTask ? (
                    <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base font-bold text-white outline-none focus:border-brand/40"
                        placeholder="Task title"
                    />
                ) : (
                    <p className="text-base font-bold text-white">{editText || task?.text || 'Untitled task'}</p>
                )}
            </div>

            <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">Description</h4>
                {canManageTask ? (
                    <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="h-56 w-full resize-none rounded-xl border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white/90 outline-none focus:border-brand/40"
                        placeholder="Add task description"
                    />
                ) : (
                    <p className="text-sm leading-6 text-white/90">
                        {editDescription?.trim() || task?.description?.trim() || 'No description for this task yet.'}
                    </p>
                )}
            </div>

            {canManageTask && (
                <button
                    type="button"
                    onClick={saveTaskDetails}
                    disabled={isLoading}
                    className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-brand/50"
                >
                    {isLoading ? 'Saving...' : 'Save Details'}
                </button>
            )}
        </div>
    )
}