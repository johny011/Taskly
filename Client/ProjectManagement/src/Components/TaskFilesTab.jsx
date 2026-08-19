import { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import api from '../Services/axios_api'
import useProjectStore from '../Store/useProjectStore'
import { useAddTaskFile, useDeleteTaskFile } from './hooks/useTask'
import UserImage from './UserImage'

const formatFileName = (filePath) => {
    if (!filePath) return 'Unnamed file'
    const normalized = String(filePath).replace(/\\/g, '/')
    const parts = normalized.split('/')
    return parts[parts.length - 1] || normalized
}

export default function TaskFilesTab({ taskId, files }) {
    const project = useProjectStore((state) => state.project)
    const projectId = useProjectStore((state) => state.projectId)
    const { mutate: uploadFile, isPending: updatingFiles } = useAddTaskFile()
    const canManageTask = Boolean(project?.role === 'Owner' || project?.role === 'Manager')
    const [fileInput, setFileInput] = useState(null)
    const fileInputRef = useRef(null);
    const { mutate: deleteMutation, isPending: deletingFile } = useDeleteTaskFile();

    useEffect(() => {
        setFileInput(null)
    }, [taskId])

    const addFile = async () => {
        if (!fileInput) {
            toast.error('Please select a file', { position: 'top-center' })
            return
        }

        const formData = new FormData()
        formData.append('file', fileInput)
        uploadFile({
            taskId:taskId,
            projectId: projectId,
            file: formData
        },
            {
                onSuccess: () => {
                    setFileInput(null)
                    fileInputRef.current.value = '';
                    toast.success('File added', { position: 'top-center' })
                },
                onError: (err) => {
                    const message = err?.response?.data?.Message || err?.response?.data?.message || err?.message || 'Failed to add comment'
                    toast.error(message, { position: 'top-center' })
                }
            }
        )
    }

    const deleteFile = async (fileId) => {
        if (!projectId || !taskId) return
        deleteMutation({ projectId, taskId, fileId },
            {
                onSuccess: () => {
                    toast.success('File removed', { position: 'top-center' })
                },
                onError: (err) => {
                    const message = err?.response?.data?.Message || err?.response?.data?.message || err?.message || 'Failed to delete file'
                    toast.error(message, { position: 'top-center' })
                }
            })
    }

    return (
        <div className="space-y-4">
            <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">Add File</h4>
                <div className="space-y-3">
                    <input
                        id="fileInput"
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => setFileInput(e.target.files?.[0] || null)}
                        className="block w-full cursor-pointer rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                    />
                    <button
                        type="button"
                        onClick={addFile}
                        disabled={updatingFiles || !fileInput}
                        className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-brand/50"
                    >
                        {updatingFiles ? 'Uploading...' : 'Upload File'}
                    </button>
                </div>
            </div>

            <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">Attached Files</h4>
                {files.length ? (
                    <ul className="space-y-2">
                        {files.map((file) => {
                            const user = file?.user
                            return (
                                <li key={file.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <UserImage user={user} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="overflow-hidden text-ellipsis font-medium text-white">{formatFileName(file.fileName)}</p>
                                            <p className="truncate text-xs text-secondary">{file.fileName}</p>
                                        </div>
                                        <div className="flex shrink-0 gap-2">
                                            <a
                                                href={file.filePath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-200 transition-colors hover:bg-blue-500/20"
                                            >
                                                Open
                                            </a>
                                            {canManageTask && (
                                                <button
                                                    type="button"
                                                    onClick={() => deleteFile(file.id)}
                                                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                ) : (
                    <p className="text-sm text-secondary">No files attached yet.</p>
                )}
            </div>
        </div>
    )
}