import React, { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import MemberSearchInput from './MemberSearchInput'
import useProjectMembers from './hooks/useProjectMembers'
import { useAddProjectMembers } from './hooks/useAddProjectMembers'
import { useUpdateProjectMemberRole } from './hooks/useUpdateProjectMemberRole'
import { useRemoveProjectMember } from './hooks/useRemoveProjectMember'
import UserImage from './UserImage'

const IconClose = ({ className }) => (
	<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
	</svg>
)

const IconTrash = ({ className }) => (
	<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
	</svg>
)

const IconArrowUp = ({ className }) => (
	<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
	</svg>
)

const IconArrowDown = ({ className }) => (
	<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
	</svg>
)

const getUserId = (user) => String(user?.id ?? user?.userId ?? '')
const getLabel = (user) => user?.fullName || user?.name || user?.email || 'Unknown user'
const getAvatar = (user) => user?.imageUrl || user?.image || ''
const getRole = (user) => String(user?.role || '').trim().toLowerCase()
const getInitials = (label) => {
	const value = String(label || '').trim()
	if (!value) return 'U'
	return value
		.split(/\s+/)
		.slice(0, 2)
		.map((x) => x[0])
		.join('')
		.toUpperCase()
}

const SectionHeader = ({ title, count }) => (
	<div className="mb-3 flex items-center justify-between">
		<h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">{title}</h4>
		<span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
			{count}
		</span>
	</div>
)

const MemberRow = ({
	user,
	role,
	onPromote,
	onDemote,
	onRemove,
	canPromote,
	canDemote,
	canRemove,
	pendingAction
}) => {
	const id = getUserId(user)
	const label = getLabel(user)
	const isBusy = Boolean(pendingAction?.id === id)

	return (
		<li className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-md">
			<div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-white">
				{/* {getAvatar(user) ? (
					<img src={getAvatar(user)} alt="" className="h-full w-full object-cover" />
				) : (
					getInitials(label)
				)} */}

				<UserImage user={user} />
			</div>

			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-semibold text-white">{label}</p>
				<p className="truncate text-xs text-white/65">{user?.email || role}</p>
			</div>

			{(canPromote || canDemote || canRemove) ? (
				<div className="flex shrink-0 items-center gap-2">
					{canPromote && role == "member" ? (
						<button
							type="button"
							disabled={isBusy}
							onClick={() => onPromote(user)}
							className="inline-flex items-center gap-1 rounded-lg border border-brand/30 bg-brand/15 px-2.5 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/25 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<IconArrowUp className="h-3.5 w-3.5" />
							Promote  
						</button>
					) : null}

					{canDemote && role =="manager" ? (
						<button
							type="button"
							disabled={isBusy}
							onClick={() => onDemote(user)}
							className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-secondary transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
						>
							<IconArrowDown className="h-3.5 w-3.5" />
							Demote
						</button>
					) : null}

					{canRemove ? (
						<button
							type="button"
							disabled={isBusy}
							onClick={() => onRemove(user)}
							className="inline-flex items-center gap-1 rounded-lg border border-rose-300/20 bg-rose-300/10 px-2.5 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-300/20 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<IconTrash className="h-3.5 w-3.5" />
							Remove
						</button>
					) : null}
				</div>
			) : null}
		</li>
	)
}

const ManageMemberModal = ({ projectId,role = "Member", onClose }) => {
	const [selectedUsers, setSelectedUsers] = useState([])
	const [pendingAction, setPendingAction] = useState(null)

	const {
		members = [],
		isPending,
		errorMessage
	} = useProjectMembers(projectId)

	const addMembersMutation = useAddProjectMembers(projectId)
	const updateRoleMutation = useUpdateProjectMemberRole(projectId, {
		onMutate: ({ userId }) => setPendingAction({ id: String(userId), action: 'role' }),
		
		onSettled: () => setPendingAction(null)
	})
	const removeMemberMutation = useRemoveProjectMember(projectId, {
		onMutate: ({ userId }) => setPendingAction({ id: String(userId), action: 'remove' }),
		onSettled: () => setPendingAction(null)
	})

	const canAddMembers = role  == "Owner" || role == "Manager"
	const canManageMembers = role == "Owner" || role == "Manager"
	const canManageManagers = role === "Owner"

	const owner = useMemo(() => {
		return members.filter((user) => getRole(user) === 'owner')
	}, [members])

	const managers = useMemo(() => {
		return members.filter((user) => getRole(user) === 'manager')
	}, [members])

	const regularMembers = useMemo(() => {
		return members.filter((user) => getRole(user) === 'member')
	}, [members])

	const allUsers = useMemo(() => {
		return members
	}, [members])

	const excludedIds = useMemo(() => {
		return allUsers.map((u) => getUserId(u)).filter(Boolean)
	}, [allUsers])

	const handleAddSelectedUsers = async () => {
		if (!selectedUsers.length) {
			toast.error('Select at least one user first', { position: 'top-center' })
			return
		}

		const userIds = selectedUsers.map((u) => getUserId(u)).filter(Boolean)
		addMembersMutation.mutate({ userIds, onSuccess: () => setSelectedUsers([]) })
	}

	const updateRole = (user, role, successMessage) => {
		const userId = getUserId(user)
		if (!userId) return
		updateRoleMutation.mutate({ userId, role, successMessage });

		
	}

	const removeUser = (user) => {
		const userId = getUserId(user)
		if (!userId) return
		removeMemberMutation.mutate({ userId })
	}

	const handleSelectUser = (user) => {
		const userId = getUserId(user)
		if (!userId) return

		setSelectedUsers((prev) => {
			if (prev.some((p) => getUserId(p) === userId)) return prev
			return [...prev, user]
		})
	}

	const handleRemoveSelectedUser = (userId) => {
		setSelectedUsers((prev) => prev.filter((u) => getUserId(u) !== String(userId)))
	}

	return (
		<div
			className="fixed inset-0 z-60  flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-md font-sans"
			onClick={onClose}
		>
			<div
				className="relative w-full max-w-2xl animate-modal-scale-in"
				onClick={(event) => event.stopPropagation()}
			>
				<div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-2xl md:p-6">
					<div className="flex items-start justify-between gap-3">
						<div>
							<h3 className="text-xl font-bold text-white tracking-tight">Manage project members</h3>
							<p className="mt-1 text-sm text-secondary">
								Owner and managers can manage members. Only owner can manage managers.
							</p>
						</div>

						<button
							type="button"
							onClick={onClose}
							className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-secondary transition-colors hover:border-brand/30 hover:text-white"
							aria-label="Close member management modal"
						>
							<IconClose className="h-5 w-5" />
						</button>
					</div>

					{canAddMembers ? (
						<div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
							<MemberSearchInput
								selectedUsers={selectedUsers}
								onSelectUser={handleSelectUser}
								onRemoveUser={handleRemoveSelectedUser}
								excludedIds={excludedIds}
							/>

							<div className="mt-4 flex justify-end">
								<button
									type="button"
									onClick={handleAddSelectedUsers}
									disabled={addMembersMutation.isPending || selectedUsers.length === 0}
									className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-brand/40"
								>
									{addMembersMutation.isPending ? 'Adding...' : 'Add selected members'}
								</button>
							</div>
						</div>
					) : null}

					<div className="mt-6 grid gap-4 grid-cols-1">
						{/* <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
							<SectionHeader title="Owner" count={owner.length} />
							{owner.length ? (
								<ul className="space-y-2">
									{owner.map((user) => (
										<MemberRow key={getUserId(user)} user={user} role="Owner" />
									))}
								</ul>
							) : (
								<p className="text-xs text-secondary">No owner returned.</p>
							)}
						</div>

						<div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
							<SectionHeader title="Managers" count={managers.length} />
							{managers.length ? (
								<ul className="space-y-2">
									{managers.map((user) => (
										<MemberRow
											key={getUserId(user)}
											user={user}
											role="Manager"
											pendingAction={pendingAction}
											canDemote={canManageManagers}
											canRemove={canManageManagers}
											onDemote={(u) => updateRole(u, 'Member', 'Manager demoted to member')}
											onRemove={removeUser}
										/>
									))}
								</ul>
							) : (
								<p className="text-xs text-secondary">No managers found.</p>
							)}
						</div>

						<div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
							<SectionHeader title="Members" count={regularMembers.length} />
							{regularMembers.length ? (
								<ul className="space-y-2">
									{regularMembers.map((user) => (
										<MemberRow
											key={getUserId(user)}
											user={user}
											role="Member"
											pendingAction={pendingAction}
											canPromote={canManageMembers}
											canRemove={canManageMembers}
											onPromote={(u) => updateRole(u, 'Manager', 'Member promoted to manager')}
											onRemove={removeUser}
										/>
									))}
								</ul>
							) : (
								<p className="text-xs text-secondary">No members found.</p>
							)}
						</div> */}
						<div className='rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md'>
							<SectionHeader title="Members" count={members.length} />
							{members.length ? (
								<ul className="space-y-2">
									{members.map((user) => {
										const roleLower = getRole(user)
										if (roleLower === 'owner') {
											return <MemberRow key={getUserId(user)} user={user} role="Owner" />
										}

										const canRemoveForUser = role == "Owner" ? roleLower !== 'owner' : (role == "Manager" && roleLower === 'member')
										return (
											<MemberRow
												key={getUserId(user)}
												user={user}
												role={roleLower}
												pendingAction={pendingAction}
												canPromote={role == "Owner"}
												canDemote={role == "Owner"}
												canRemove={canRemoveForUser}
												onPromote={(u) => updateRole(u, 'Manager', 'Member promoted to manager')}
												onDemote={(u) => updateRole(u, 'Member', 'Manager demoted to member')}
												onRemove={removeUser}
											/>
										)
									})}
								</ul>
							) : (
								<p className="text-xs text-secondary">No members found.</p>
							)}
						</div>
					</div>

					{isPending ? (
						<p className="mt-4 text-sm text-secondary">Loading members...</p>
					) : null}

					{errorMessage ? (
						<p className="mt-4 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
							{errorMessage}
						</p>
					) : null}

					{role == "Member" ? (
						<p className="mt-4 text-xs text-secondary">
							You are in read-only mode. You can view members but cannot make changes.
						</p>
					) : null}
				</div>
			</div>
		</div>
	)
}

export default ManageMemberModal
