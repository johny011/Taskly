import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import Tasks from './Tasks'
import { useProject } from './hooks/useProject'
import { useTaskStore } from '../Store/useTaskStore'
import useProjectStore from '../Store/useProjectStore'
import ManageMemberModal from './ManageMemberModal'
import CreateTaskModal from './CreateTaskModal'
import UpdateProjectModal from './UpdateProjectModal'
import DeleteProjectConfirmationModal from './DeleteProjectConfirmationModal'
import { useQueryClient } from '@tanstack/react-query'
import { useTaskDetailsModal } from '../Store/useTaskDetailsModal'
const DESCRIPTION_COLLAPSE_CHARS = 220

const icons = {
    listChecks: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
    ),
    loader: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
    circleCheck: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    activity: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12h4l3 8 4-16 3 8h4" />
        </svg>
    ),
    edit: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.862 3.487a2.15 2.15 0 113.042 3.042L8.5 17.933 4 19l1.067-4.5L16.862 3.487z" />
        </svg>
    ),
    trash: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 7h12m-10 0V5a2 2 0 012-2h4a2 2 0 012 2v2m-8 0h8m-9 0l1 12a2 2 0 002 2h4a2 2 0 002-2l1-12" />
        </svg>
    ),
    userPlus: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
    ),
    layoutGrid: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
    ),
    list: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    ),
    back: ({ className }) => (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
    )
}

const StatCard = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
            <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-secondary">{label}</p>
            <p className="text-lg font-semibold tabular-nums text-white">{value}</p>
        </div>
    </div>
)

const Project = () => {
    const { id } = useParams()
    const { isLoading: loading } = useProject(id)
    const project = useProjectStore((state) => state.projectId === id ? state.project : null)
    const tasks = useTaskStore((s) => s.tasks)
    const fetchTasks = useTaskStore((s) => s.fetchTasks)
    const queryClient = useQueryClient();
    const startHubConnection = useProjectStore((s) => s.startHubConnection);
    const stopHubConnection = useProjectStore((s) => s.stopHubConnection);

    const [descExpanded, setDescExpanded] = useState(false)
    const [membersOpen, setMembersOpen] = useState(false)
    const [createTaskOpen, setCreateTaskOpen] = useState(false)
    const [updateProjectOpen, setUpdateProjectOpen] = useState(false)
    const [deleteProjectOpen, setDeleteProjectOpen] = useState(false)

    const isOwnerOrManager = project?.role == "Owner" || project?.role == "Manager"
    const isOwner = project?.role == "Owner";
    const stats = useMemo(() => {
        const total = tasks.length
        const inProgress = tasks.filter((t) => t.status === 'InProgress').length
        const completed = tasks.filter((t) => t.status === 'Done').length
        return { total, inProgress, completed }
    }, [tasks])

    const description = project?.description?.trim() ?? ''
    const descriptionLong = description.length > DESCRIPTION_COLLAPSE_CHARS
    const descriptionPreview = descriptionLong && !descExpanded
        ? `${description.slice(0, DESCRIPTION_COLLAPSE_CHARS).trim()}…`
        : description
    const [searchParams, setSearchParams] = useSearchParams();
    const taskIdForModal = searchParams.get('taskId');
    useEffect(() => {
        if (taskIdForModal) {
            useTaskDetailsModal.getState().openModal(Number(taskIdForModal), Number(id), "");
        }
    }, [taskIdForModal, id]);
    useEffect(() => {
        if (id) fetchTasks(id)
    }, [id, fetchTasks])

    useEffect(() => {
        if (id) {
            startHubConnection(id, queryClient);
        }

        return () => {
            if (id) {
                stopHubConnection(id);
            }
        };
    }, [id]);

    const renderSkeleton = () => (
        <div className="space-y-6 animate-pulse">
            <div className="h-10 bg-white/10 rounded-xl w-1/3" />
            <div className="flex flex-wrap gap-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 flex-1 min-w-35 max-w-50 bg-white/5 rounded-xl border border-white/5" />
                ))}
            </div>
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 h-32" />
            <div className="grid grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-64 bg-white/5 rounded-2xl border border-white/5" />
                ))}
            </div>
        </div>
    )

    return (
        <div className="flex flex-col w-full min-h-screen pb-20">
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    {loading ? (
                        <div className="h-10 bg-white/10 rounded-xl w-48 animate-pulse" />
                    ) : (
                        <div className="flex flex-wrap items-center gap-4">
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                {project?.title}
                            </h1>

                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {isOwnerOrManager ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setUpdateProjectOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-secondary backdrop-blur-md transition-colors hover:border-brand/30 hover:bg-brand/10 hover:text-brand"
                                    aria-label="Edit project"
                                    title="Edit project"
                                >
                                    <icons.edit className="h-4 w-4 shrink-0" />
                                    <span className="hidden sm:inline">Edit</span>
                                </button>
                                { isOwner &&
                                <button
                                    type="button"
                                    onClick={() => setDeleteProjectOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-secondary backdrop-blur-md transition-colors hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
                                    aria-label="Delete project"
                                    title="Delete project"
                                >
                                    <icons.trash className="h-4 w-4 shrink-0" />
                                    <span className="hidden sm:inline">Delete</span>
                                </button>
                                }
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-secondary backdrop-blur-md transition-colors hover:border-brand/30 hover:bg-brand/10 hover:text-brand"
                                    // className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-secondary backdrop-blur-md transition-colors hover:border-brand/30 hover:bg-brand/10 hover:text-brand"
                                    title="Project settings"
                                    aria-label="Project settings"
                                    onClick={() => navigation.navigate(`/projects/${id}/activities`)}
                                >
                                    <icons.activity className="h-5 w-5" />
                                    <span className="hidden sm:inline">Activities</span>
                                </button>
                            </>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => setMembersOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-secondary backdrop-blur-md transition-colors hover:border-brand/30 hover:bg-brand/10 hover:text-brand"
                            aria-label={isOwnerOrManager ? "Manage members" : "Show members"}
                            title={isOwnerOrManager ? "Manage members" : "Show members"}
                        >
                            <icons.userPlus className="h-4 w-4 shrink-0 text-brand" />
                            <span className="hidden sm:inline">{isOwnerOrManager ? "Manage members" : "Show members"}</span>
                        </button>
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-secondary backdrop-blur-md transition-colors hover:border-brand/30 hover:text-white"
                        >
                            <icons.back className="w-4 h-4 shrink-0" />
                            Back to Dashboard
                        </Link>
                    </div>
                </div>

                {!loading && project ? (
                    <div className="flex flex-wrap gap-3">
                        <StatCard icon={icons.listChecks} label="Total tasks" value={stats.total} />
                        <StatCard icon={icons.loader} label="In progress" value={stats.inProgress} />
                        <StatCard icon={icons.circleCheck} label="Completed" value={stats.completed} />
                    </div>
                ) : null}
            </div>

            {loading ? (
                renderSkeleton()
            ) : project ? (
                <div className="space-y-10">
                    <div className="rounded-4xl border border-white/10 bg-white/3 p-8 shadow-2xl backdrop-blur-md">
                        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-brand">
                            Project overview
                        </h2>
                        {description ? (
                            <div className="max-w-4xl">
                                <p className="text-lg leading-relaxed text-secondary italic">
                                    &ldquo;{descriptionPreview}&rdquo;
                                </p>
                                {descriptionLong ? (
                                    <button
                                        type="button"
                                        onClick={() => setDescExpanded((v) => !v)}
                                        className="mt-3 text-sm font-semibold text-brand transition-colors hover:text-brand/80"
                                    >
                                        {descExpanded ? 'Show less' : 'Show more'}
                                    </button>
                                ) : null}
                            </div>
                        ) : (
                            <p className="text-secondary">No description yet.</p>
                        )}
                    </div>

                    <div className="relative">
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-1 rounded-full bg-brand" />
                                <h2 className="text-xl font-bold text-white">Project tasks</h2>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    className={`flex items-center ${!isOwnerOrManager && 'hidden'}  justify-center gap-2 py-3 px-6 bg-brand text-white font-bold rounded-xl hover:bg-brand/90 transition-all active:scale-95 shadow-lg shadow-brand/20`}
                                    onClick={() => setCreateTaskOpen(true)}
                                >
                                    {/* Custom SVG Plus Icon */}
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path>
                                    </svg>
                                    Create new task
                                </button>
                            </div>
                        </div>
                        <Tasks />
                    </div>
                </div>
            ) : (
                <div className="rounded-4xl border border-dashed border-white/10 bg-white/5 py-20 text-center backdrop-blur-md">
                    <p className="text-lg text-secondary">Project not found or has been removed.</p>
                    <Link to="/" className="mt-4 inline-block font-bold text-brand">
                        Return home
                    </Link>
                </div>
            )}

            {membersOpen && project ? (
                <ManageMemberModal
                    projectId={id}
                    role={project.role}
                    onClose={() => setMembersOpen(false)}
                />
            ) : null}

            {createTaskOpen && project ? (
                <CreateTaskModal
                    setModalState={setCreateTaskOpen}
                />
            ) : null}

            {updateProjectOpen && project ? (
                <UpdateProjectModal
                    isOpen={updateProjectOpen}
                    onClose={() => setUpdateProjectOpen(false)}
                    project={project}
                    projectId={id}
                />
            ) : null}

            {deleteProjectOpen && project ? (
                <DeleteProjectConfirmationModal
                    isOpen={deleteProjectOpen}
                    onClose={() => setDeleteProjectOpen(false)}
                    project={project}
                />
            ) : null}
        </div>
    )
}

export default Project
