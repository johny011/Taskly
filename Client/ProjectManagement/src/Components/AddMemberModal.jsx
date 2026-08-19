// import React, { useCallback, useMemo, useState } from 'react'
// import toast from 'react-hot-toast'
// import { useQueryClient } from '@tanstack/react-query'
// import api from '../Services/axios_api'
// import UserSearchInput from './UserSearchInput'

// const getUserId = (u) => String(u?.id ?? '')

// const getMemberUserId = (m) => String(m?.userId ?? m?.id ?? '')

// const getMemberLabel = (m) =>
//     m?.email ?? m?.name ?? m?.username ?? m?.displayName ?? 'Member'

// const getInitials = (label) => {
//     const s = String(label || '').trim()
//     if (!s) return 'U'
//     const parts = s.split(/\s+/).slice(0, 2)
//     return parts.map((p) => p[0]).join('').toUpperCase()
// }

// const normalizeRole = (m) => {
//     const r = String(m?.role ?? m?.projectRole ?? m?.memberRole ?? '').toLowerCase()
//     if (r.includes('owner')) return 'Owner'
//     if (r.includes('admin')) return 'Admin'
//     return 'Member'
// }

// const IconX = ({ className }) => (
//     <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//     </svg>
// )

// const IconTrash = ({ className }) => (
//     <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//     </svg>
// )

// const IconChevronDown = ({ className }) => (
//     <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
//     </svg>
// )

// const roleBadgeClass = (role) => {
//     if (role === 'Owner') return 'text-amber-300 border-amber-400/30 bg-amber-400/10'
//     if (role === 'Admin') return 'text-purple-300 border-purple-400/35 bg-purple-500/15'
//     return 'text-slate-300 border-white/10 bg-white/5'
// }

// const AddMemberModal = ({
//     projectId,
//     ownerId,
//     isProjectOwner = false,
//     members = [],
//     onClose
// }) => {
//     const queryClient = useQueryClient()

//     const [selectedNewMembers, setSelectedNewMembers] = useState([])
//     const [saveLoading, setSaveLoading] = useState(false)
//     const [rowPending, setRowPending] = useState(null)

//     const normalizedMembers = useMemo(() => (Array.isArray(members) ? members : []), [members])

//     const excludedIds = useMemo(
//         () => normalizedMembers.map((m) => getMemberUserId(m)).filter(Boolean),
//         [normalizedMembers]
//     )

//     const handleSelectUser = useCallback((user) => {
//         const uid = getUserId(user)
//         if (!uid) return
//         setSelectedNewMembers((prev) => {
//             if (prev.some((u) => getUserId(u) === uid)) return prev
//             return [...prev, user]
//         })
//     }, [])

//     const handleRemoveSelectedUser = useCallback((userId) => {
//         setSelectedNewMembers((prev) => prev.filter((u) => getUserId(u) !== userId))
//     }, [])

//     const invalidateProject = useCallback(async () => {
//         await queryClient.invalidateQueries({ queryKey: ['project', projectId] })
//     }, [queryClient, projectId])

//     const handleSaveNewMembers = async () => {
//         if (!selectedNewMembers.length) {
//             toast.error('Select at least one user to add', { position: 'top-center' })
//             return
//         }
//         setSaveLoading(true)
//         try {
//             const userIds = selectedNewMembers.map((u) => getUserId(u)).filter(Boolean)
//             await api.post(`/Projects/${projectId}/Members/bulk`, { userIds })
//             toast.success('Members added successfully', { duration: 3500, position: 'top-center' })
//             setSelectedNewMembers([])
//             await invalidateProject()
//         } catch (err) {
//             const message =
//                 err?.response?.data?.message || err?.message || 'Failed to add members'
//             toast.error(message, { duration: 4500, position: 'top-center' })
//         } finally {
//             setSaveLoading(false)
//         }
//     }

//     const handleRoleChange = async (member, nextRole) => {
//         const memberId = getMemberUserId(member)
//         if (!memberId) return
//         const current = normalizeRole(member)
//         if (current === 'Owner' || nextRole === current) return

//         setRowPending({ userId: memberId, action: 'role' })
//         try {
//             await api.patch(`/Projects/${projectId}/Members/${memberId}`, { role: nextRole })
//             toast.success('Role updated', { duration: 3000, position: 'top-center' })
//             await invalidateProject()
//         } catch (err) {
//             const message =
//                 err?.response?.data?.message || err?.message || 'Failed to update role'
//             toast.error(message, { duration: 4500, position: 'top-center' })
//         } finally {
//             setRowPending(null)
//         }
//     }

//     const handleRemoveMember = async (member) => {
//         const memberId = getMemberUserId(member)
//         if (!memberId) return

//         setRowPending({ userId: memberId, action: 'delete' })
//         try {
//             await api.delete(`/Projects/${projectId}/Members/${memberId}`)
//             toast.success('Member removed', { duration: 3000, position: 'top-center' })
//             await invalidateProject()
//         } catch (err) {
//             const message =
//                 err?.response?.data?.message || err?.message || 'Failed to remove member'
//             toast.error(message, { duration: 4500, position: 'top-center' })
//         } finally {
//             setRowPending(null)
//         }
//     }

//     const ownerIdStr = ownerId != null ? String(ownerId) : ''

//     return (
//         <div
//             className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
//             onClick={onClose}
//         >
//             <div
//                 className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl"
//                 onClick={(e) => e.stopPropagation()}
//             >
//                 <div className="flex items-start justify-between gap-4">
//                     <div>
//                         <h3 className="text-xl font-bold text-white">Membership &amp; permissions</h3>
//                         <p className="mt-1 text-sm text-secondary">
//                             Search users, add them in bulk, and manage roles when you own the project.
//                         </p>
//                     </div>
//                     <button
//                         type="button"
//                         onClick={onClose}
//                         className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-secondary transition-colors hover:border-brand/30 hover:text-white"
//                         aria-label="Close"
//                     >
//                         <IconX className="h-5 w-5" />
//                     </button>
//                 </div>

//                 <div className="mt-6 space-y-3">
//                     <UserSearchInput
//                         label="Add people"
//                         selectedUsers={selectedNewMembers}
//                         onSelectUser={handleSelectUser}
//                         onRemoveUser={handleRemoveSelectedUser}
//                         excludedIds={excludedIds}
//                         emptyHint="No pending invites — search and pick users above."
//                     />

//                     <div className="flex gap-3 pt-2">
//                         <button
//                             type="button"
//                             onClick={onClose}
//                             className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-secondary backdrop-blur-md transition-colors hover:border-white/15 hover:text-white"
//                         >
//                             Cancel
//                         </button>
//                         <button
//                             type="button"
//                             onClick={handleSaveNewMembers}
//                             disabled={saveLoading || !selectedNewMembers.length}
//                             className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
//                                 saveLoading || !selectedNewMembers.length
//                                     ? 'cursor-not-allowed bg-brand/40'
//                                     : 'bg-brand hover:bg-brand/90'
//                             }`}
//                         >
//                             {saveLoading ? 'Saving…' : 'Save'}
//                         </button>
//                     </div>
//                 </div>

//                 <div className="mt-8">
//                     <div className="flex items-center justify-between">
//                         <h4 className="text-sm font-bold uppercase tracking-widest text-secondary">
//                             Current members
//                         </h4>
//                         <span className="text-xs font-semibold tabular-nums text-secondary">
//                             {normalizedMembers.length}
//                         </span>
//                     </div>

//                     <div
//                         className="mt-3 h-64 overflow-y-auto rounded-xl border border-white/10 bg-white/5 pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent"
//                     >
//                         {normalizedMembers.length ? (
//                             <ul className="divide-y divide-white/10">
//                                 {normalizedMembers.map((m, idx) => {
//                                     const memberId = getMemberUserId(m)
//                                     const label = getMemberLabel(m)
//                                     const role = normalizeRole(m)
//                                     const isRowOwner = Boolean(
//                                         ownerIdStr && memberId && memberId === ownerIdStr
//                                     )
//                                     const busy =
//                                         rowPending?.userId === memberId &&
//                                         (rowPending?.action === 'role' || rowPending?.action === 'delete')
//                                     const showManage = isProjectOwner && !isRowOwner

//                                     return (
//                                         <li
//                                             key={memberId || getMemberLabel(m) + idx}
//                                             className="flex flex-wrap items-center gap-3 px-4 py-3"
//                                         >
//                                             <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-xs font-bold text-white">
//                                                 {m?.image ? (
//                                                     <img
//                                                         src={m.image}
//                                                         alt=""
//                                                         className="h-full w-full rounded-xl object-cover"
//                                                     />
//                                                 ) : (
//                                                     getInitials(label)
//                                                 )}
//                                             </div>
//                                             <div className="min-w-0 flex-1">
//                                                 <p className="truncate text-sm font-medium text-white">{label}</p>
//                                                 <div className="mt-1 flex flex-wrap items-center gap-2">
//                                                     <span
//                                                         className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${roleBadgeClass(
//                                                             isRowOwner ? 'Owner' : role
//                                                         )}`}
//                                                     >
//                                                         {isRowOwner ? 'Owner' : role}
//                                                     </span>
//                                                 </div>
//                                             </div>

//                                             {showManage ? (
//                                                 <div className="flex shrink-0 items-center gap-2">
//                                                     <div className="relative">
//                                                         <select
//                                                             value={role === 'Admin' ? 'Admin' : 'Member'}
//                                                             disabled={busy}
//                                                             onChange={(e) =>
//                                                                 handleRoleChange(m, e.target.value)
//                                                             }
//                                                             className="appearance-none rounded-lg border border-white/10 bg-slate-950 py-2 pl-3 pr-8 text-xs font-medium text-white outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
//                                                             aria-label={`Role for ${label}`}
//                                                         >
//                                                             <option value="Member">Member</option>
//                                                             <option value="Admin">Admin</option>
//                                                         </select>
//                                                         <IconChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
//                                                         {busy && rowPending?.action === 'role' ? (
//                                                             <span className="pointer-events-none absolute right-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-brand border-t-transparent" />
//                                                         ) : null}
//                                                     </div>
//                                                     <button
//                                                         type="button"
//                                                         disabled={busy}
//                                                         onClick={() => handleRemoveMember(m)}
//                                                         className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/10 text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
//                                                         title="Remove member"
//                                                         aria-label={`Remove ${label}`}
//                                                     >
//                                                         {busy && rowPending?.action === 'delete' ? (
//                                                             <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-transparent" />
//                                                         ) : (
//                                                             <IconTrash className="h-4 w-4" />
//                                                         )}
//                                                     </button>
//                                                 </div>
//                                             ) : null}
//                                         </li>
//                                     )
//                                 })}
//                             </ul>
//                         ) : (
//                             <div className="px-4 py-12 text-center">
//                                 <p className="text-sm text-secondary">No members yet.</p>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default AddMemberModal
