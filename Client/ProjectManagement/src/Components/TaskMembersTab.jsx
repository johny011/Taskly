import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../Services/axios_api'
import useProjectStore from '../Store/useProjectStore'
import { useTaskStore } from '../Store/useTaskStore'
import MemberSearchInput from './MemberSearchInput'
import { useAddTaskMembers, useRemoveTaskMember } from './hooks/useTask'

export default function TaskMembersTab({ task, taskId }) {
    const projectId = useProjectStore((state) => state.projectId)
    const project = useProjectStore((state) => state.projectId === projectId ? state.project : null)
    const { mutate: AddTaskMembers, isLoading: updatingMembers } = useAddTaskMembers();
    const { mutate: RemoveTaskMembers, isLoading: removingMembers } = useRemoveTaskMember();
    const canManageTask = Boolean(project?.role === 'Owner' || project?.role === 'Manager')
    const [selectedUsers, setSelectedUsers] = useState([])
    const members = Array.isArray(task?.members) ? task.members : []
    const excludedMemberIds = members.map((member) => String(member?.id || '')).filter(Boolean)

    useEffect(() => {
        setSelectedUsers([])
    }, [taskId])

    const addSelectedMembers = async () => {
        if (!canManageTask || !projectId || !taskId || !selectedUsers.length) return
        const userIds = selectedUsers.map((user) => String(user?.id || '')).filter(Boolean)
        AddTaskMembers({ projectId, taskId, userIds }, {
            onSuccess: () => {
                toast.success('Members added to task', { position: 'top-center' })
                setSelectedUsers([])
            },
            onError: (err) => {
                const message = err?.response?.data?.Message || err?.response?.data?.message || err?.message || 'Failed to add members'
                toast.error(message, { position: 'top-center' })
            }
        });


    }

    const removeMember = async (memberId) => {
        if (!canManageTask || !projectId || !taskId) return
        RemoveTaskMembers({ projectId, taskId, memberId }, {
            onSuccess: () => {
                toast.success('Member removed from task', { position: 'top-center' });
            },
            onError: (err) => {
                const message = err?.response?.data?.Message || err?.response?.data?.message || err?.message || 'Failed to remove member'
                toast.error(message, { position: 'top-center' })
            }
        })
    }

    return (
        <div className="space-y-4">
            {canManageTask && (
                <div>
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">Add Members</h4>
                    <div className="space-y-3">
                        <MemberSearchInput
                            projectId={projectId}
                            selectedUsers={selectedUsers}
                            onSelectUser={(user) => {
                                setSelectedUsers((prev) => {
                                    if (prev.some((item) => String(item.id) === String(user.id))) {
                                        return prev
                                    }
                                    return [...prev, user]
                                })
                            }}
                            onRemoveUser={(userId) => {
                                setSelectedUsers((prev) => prev.filter((item) => String(item.id) !== String(userId)))
                            }}
                            excludedIds={excludedMemberIds}
                        />

                        <button
                            type="button"
                            onClick={addSelectedMembers}
                            disabled={updatingMembers || !selectedUsers.length}
                            className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-brand/50"
                        >
                            {updatingMembers ? 'Updating...' : 'Add Selected Members'}
                        </button>
                    </div>
                </div>
            )}

            <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary">Task Members</h4>
                {members.length ? (
                    <ul className="space-y-2">
                        {members.map((member) => (
                            <li key={member.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-white">{member.fullName || 'Unknown user'}</p>
                                    <p className="truncate text-xs text-secondary">{member.email || '-'}</p>
                                </div>

                                {canManageTask && (
                                    <button
                                        type="button"
                                        onClick={() => removeMember(member.id)}
                                        className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                                    >
                                        Remove
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-secondary">No members in this task.</p>
                )}
            </div>
        </div>
    )
}