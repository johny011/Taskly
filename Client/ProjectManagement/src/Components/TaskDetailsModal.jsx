import { useEffect, useState } from 'react'
import { useDeleteTask, useGetTaskDetails } from './hooks/useTask'
import TaskDetailsTab from './TaskDetailsTab'
import TaskFilesTab from './TaskFilesTab'
import TaskCommentsTab from './TaskCommentsTab'
import TaskMembersTab from './TaskMembersTab'
import useProjectStore from '../Store/useProjectStore'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export default function TaskDetailsModal({ projectId, taskId, taskText, onClose }) {
    const { data: task, isLoading, error } = useGetTaskDetails({ projectId, taskId })
    const queryClient = useQueryClient();

    const canManage = useProjectStore((state) => state.project?.role == "Manager" || state.project?.role == "Owner");
    const isInProgress = task?.status === "InProgress";

    useEffect(() => {
        if (!canManage && !isInProgress) {
            onClose();
            // navigation.navigate(`/projects/${projectId}`);
            toast.error("You don't have permission to view this task.");
        }
    }, [canManage, isInProgress]);

    useEffect(() => {
        // 1. بناء الاتصال
        const connection = new HubConnectionBuilder()
            .withUrl(import.meta.env.VITE_HUB_URL + '/task')
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect()
            .build();

        async function startConnection() {
            try {

                await connection.start();
                await connection.invoke('JoinTaskGroup', `${taskId}`);
                console.log('Joined task group for taskId:', taskId);


                connection.on('TaskUpdated', () => {
                    queryClient.invalidateQueries({ queryKey: ['taskDetails', projectId, taskId] });
                });

                connection.on('TaskMembersUpdated', () => {
                    queryClient.invalidateQueries({ queryKey: ['taskDetails', projectId, taskId] });
                });

                connection.on('CommentUpdated', (updatedComment) => {
                    queryClient.invalidateQueries({ queryKey: ['taskDetails', projectId, taskId] });
                });

                connection.on("CommentDeleted", (comment) => {
                    queryClient.invalidateQueries({ queryKey: ['taskDetails', projectId, taskId] });
                });

            } catch (err) {
                console.error('SignalR Connection or Invoke failed: ', err);
            }
        }

        startConnection();

        // 5. دالة التنظيف (Cleanup) عند إغلاق الـ Modal أو تغيير الـ taskId
        return () => {
            async function stopConnection() {
                if (connection.state === "Connected") {
                    try {
                        // إعلام السيرفر بالمغادرة قبل قطع الاتصال تماماً
                        await connection.invoke('LeaveTaskGroup', `${taskId}`);
                    } catch (err) {
                        console.error('Failed to leave group:', err);
                    }
                }
                await connection.stop();
                console.log('SignalR Disconnected.');
            }
            stopConnection();
        };
    }, [taskId, projectId, queryClient]);

    useEffect(() => {
        if (error) {
            toast.error("Task not found. It may have been deleted.");
            onClose();
        }
    }, [error])

    const [activeTab, setActiveTab] = useState('details')
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                onClose()
            }
        }

        window.addEventListener('keydown', handleEsc)
        return () => {
            window.removeEventListener('keydown', handleEsc)

        }
    }, [onClose])

    const title = task?.text || taskText || 'Untitled task'
    const { mutate: DeleteTask, isPending: DeletingTask } = useDeleteTask();
    const onDeleteTask = () => {
        DeleteTask({ projectId, taskId }, {
            onSuccess: () => {
                onClose();
            }
        }
        );
    }


    return (
        <div
            className="fixed inset-0 z-1000 flex items-center justify-center bg-black/70 px-3 py-4 backdrop-blur-sm md:px-5"
            onClick={onClose}
        >
            <div
                className="flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header - Full Width */}
                <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 md:px-6">
                    <div className="flex-1">
                        <p className="text-xs font-semibold uppercase tracking-widest text-brand">Task details</p>
                        <h3 className="mt-2 truncate text-lg font-bold text-white md:text-sm">{title}</h3>
                    </div>
                    <div className='flex flex-row-reverse gap-3'>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-secondary transition-colors hover:border-brand/30 hover:text-white"
                            aria-label="Close task details"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        { canManage &&
                            <button
                                type="button"
                                onClick={onDeleteTask}
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-secondary backdrop-blur-md transition-colors hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
                                aria-label="delete task"
                            >
                                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 7h12m-10 0V5a2 2 0 012-2h4a2 2 0 012 2v2m-8 0h8m-9 0l1 12a2 2 0 002 2h4a2 2 0 002-2l1-12" />
                                </svg>
                                <span className="hidden sm:inline">Delete</span>
                            </button>
                        }
                    </div>

                </div>

                {/* Sidebar Tabs and Content */}
                <div className="flex flex-1 overflow-hidden md:flex-row">
                    {/* Sidebar Tabs */}
                    <div className="shrink-0 border-r border-white/10 bg-white/2 md:flex md:w-48 md:flex-col">

                        {/* Tab Buttons */}
                        <nav className="flex flex-col gap-2 px-4 py-4 md:px-6">
                            <button
                                type="button"
                                onClick={() => setActiveTab('details')}
                                className={`rounded-lg text-left px-2 py-2 text-sm font-medium transition-colors ${activeTab === 'details'
                                    ? 'bg-brand/20 text-brand border border-brand/30'
                                    : 'text-secondary border border-transparent hover:bg-white/5'
                                    }`}
                            >
                                📋
                                <span className='text-white  max-md:hidden'> Task Details</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('files')}
                                className={`rounded-lg text-left px-2 py-2 text-sm font-medium transition-colors ${activeTab === 'files'
                                    ? 'bg-brand/20 text-brand border border-brand/30'
                                    : 'text-secondary border border-transparent hover:bg-white/5'
                                    }`}
                            >
                                📁
                                <span className='text-white  max-md:hidden'> Files</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('comments')}
                                className={`rounded-lg text-left px-2 py-2 text-sm font-medium transition-colors ${activeTab === 'comments'
                                    ? 'bg-brand/20 text-brand border border-brand/30'
                                    : 'text-secondary border border-transparent hover:bg-white/5'
                                    }`}
                            >
                                💬
                                <span className='text-white  max-md:hidden'> Comments</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('members')}
                                className={`rounded-lg text-left px-2 py-2 text-sm font-medium transition-colors ${activeTab === 'members'
                                    ? 'bg-brand/20 text-brand border border-brand/30'
                                    : 'text-secondary border border-transparent hover:bg-white/5'
                                    }`}
                            >👥
                                <span className='text-white  max-md:hidden'> Members</span>
                            </button>
                        </nav>
                    </div>


                    {/* Content */}
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5">
                        {isLoading ? (
                            <div className="space-y-3 py-4 animate-pulse">
                                <div className="h-4 w-40 rounded bg-white/10" />
                                <div className="h-20 w-full rounded bg-white/5" />
                                <div className="h-4 w-28 rounded bg-white/10" />
                                <div className="h-24 w-full rounded bg-white/5" />
                            </div>
                        ) : (
                            <>
                                {/* Task Details Tab */}
                                {activeTab === 'details' && (
                                    <TaskDetailsTab
                                        taskId={taskId}
                                        task={task} />
                                )}

                                {/* Files Tab */}
                                {activeTab === 'files' && (
                                    <TaskFilesTab
                                        taskId={taskId}
                                        files={task?.files}
                                    />
                                )}

                                {/* Comments Tab */}
                                {activeTab === 'comments' && (
                                    <TaskCommentsTab
                                        taskId={taskId}
                                        comments={task?.comments}
                                    />
                                )}

                                {/* Members Tab */}
                                {activeTab === 'members' && (
                                    <TaskMembersTab
                                        task={task}
                                        taskId={taskId} />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
