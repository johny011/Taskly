import toast from 'react-hot-toast'
import { useDeleteProject } from './hooks/useProject'
import {useNavigate} from 'react-router-dom'

const DeleteProjectConfirmationModal = ({ isOpen, onClose, project }) => {
    const { mutate: deleteProject, isPending: loading } = useDeleteProject(project?.id)
    const navigate = useNavigate()
    const handleDelete = () => {
        deleteProject(undefined, {
            onSuccess: () => {
                onClose()
                toast.success('Project deleted successfully', {
                    duration: 4000,
                    position: 'top-center'
                })
                navigate('/')
            },
            onError: (error) => {
                toast.error(error?.response?.data?.message || error?.message || 'Failed to delete project', {
                    duration: 4000,
                    position: 'top-center'
                })
            }
        })
    }

    if (!isOpen) {
        return null
    }

    return (
        <div
            className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/60 backdrop-blur-md font-sans"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md animate-modal-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl shadow-slate-950/40">
                    <div className="text-center mb-8">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
                            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A2 2 0 004.5 20h15a2 2 0 001.71-3.14l-7.5-13a2 2 0 00-3.42 0z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Delete Project</h1>
                        <p className="text-secondary text-sm mt-2">Are you sure you want to delete this project?</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl font-medium text-secondary transition-colors hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-500/90 py-3.5 font-bold text-white transition-all hover:bg-red-500 active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading && (
                                <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            Delete Project
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DeleteProjectConfirmationModal