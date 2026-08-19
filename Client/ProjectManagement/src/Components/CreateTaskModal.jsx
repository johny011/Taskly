import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import api from '../Services/axios_api'
import toast from 'react-hot-toast'
import { useTaskStore } from '../Store/useTaskStore'

function CreateTaskModal({ setModalState }) {
    const addTask = useTaskStore((s) => s.addTask)
    const fetchTasks = useTaskStore((s) => s.fetchTasks)
    const { register, handleSubmit, formState: { errors } } = useForm()
    const [loading, setLoading] = useState(false)
    const { id: projectId } = useParams()

    const onSubmit = async (data) => {
        setLoading(true)
        try {
            const result = await api.post(`/Projects/${projectId}/Tasks`, {
                projectId: projectId,
                text: data.text
            })
            if (result.data) {
                addTask(result.data)
            } else {
                await fetchTasks(projectId)
            }
            setModalState(false)
            toast.success('Task created successfully', {
                duration: 4000,
                position: 'top-center'
            })
        } catch (error) {
            console.error(error.response.data)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/60 backdrop-blur-md font-sans"
            onClick={() => setModalState(false)}
        >
            <div
                className="relative w-full max-w-md animate-modal-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl shadow-slate-950/40">
                    <div className="text-center mb-10">
                        <h1 className="text-2xl font-bold text-white tracking-tight">Create New Task</h1>
                        <p className="text-secondary text-sm mt-1">Describe the work item and add it to the project</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">Task Text</label>
                            <textarea
                                {...register('text', {
                                    required: 'Task text is required',
                                    minLength: { value: 5, message: 'Min 5 chars' }
                                })}
                                className="w-full min-h-28 resize-none rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/20"
                                placeholder="Enter task text"
                                rows={5}
                            />
                            {errors.text && <p className="mt-1 text-xs text-red-400">{errors.text.message}</p>}
                        </div>

                        <div className="flex gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => setModalState(false)}
                                className="flex-1 py-3.5 rounded-xl font-medium text-secondary transition-colors hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 bg-brand text-white font-bold py-3.5 rounded-xl hover:bg-brand/90 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading && (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}

                                {loading ? 'Creating...' : 'Create Task'}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    )
}

export default CreateTaskModal