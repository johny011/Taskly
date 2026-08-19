import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useDebounce } from './hooks/useDebounce'
import { useUserSearch } from './hooks/useUserSearch'
import { useProjectMemberSearch } from './hooks/useProjectMemberSearch'
import UserImage from './UserImage'

const IconSearch = ({ className }) => (
	<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
	</svg>
)

const IconX = ({ className }) => (
	<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
	</svg>
)

const getUserId = (u) => String(u?.id ?? '')

const MemberSearchInput = ({
	selectedUsers = [],
	onSelectUser,
	onRemoveUser,
	excludedIds = [],
	projectId = null
}) => {
	const wrapRef = useRef(null)
	const [query, setQuery] = useState('')
	const [open, setOpen] = useState(false)

	const debounced = useDebounce(query, 300)
	const useProjectScopedSearch = Boolean(projectId)
	const globalSearch = useUserSearch(debounced, { enabled: !useProjectScopedSearch })
	const projectSearch = useProjectMemberSearch(projectId, debounced, { enabled: useProjectScopedSearch })
	const activeSearch = useProjectScopedSearch ? projectSearch : globalSearch
	const users = activeSearch.data || []
	const isLoading = activeSearch.isLoading
	const isError = activeSearch.isError

	const excludedSet = useMemo(
		() => new Set((Array.isArray(excludedIds) ? excludedIds : []).map((id) => String(id))),
		[excludedIds]
	)

	const selectedSet = useMemo(
		() => new Set((Array.isArray(selectedUsers) ? selectedUsers : []).map((u) => getUserId(u))),
		[selectedUsers]
	)

	const visibleUsers = useMemo(() => {
		return users.filter((u) => {
			const id = getUserId(u)
			if (!id) return false
			if (excludedSet.has(id)) return false
			if (selectedSet.has(id)) return false
			return true
		})
	}, [users, excludedSet, selectedSet])

	useEffect(() => {
		const closeOnOutside = (event) => {
			if (!wrapRef.current?.contains(event.target)) {
				setOpen(false)
			}
		}

		document.addEventListener('mousedown', closeOnOutside)
		return () => document.removeEventListener('mousedown', closeOnOutside)
	}, [])

	const pickUser = (user) => {
		const id = getUserId(user)
		if (!id || excludedSet.has(id) || selectedSet.has(id)) return

		onSelectUser(user)
		setQuery('')
		setOpen(false)
	}

	const showDropdown = open && String(query).trim().length > 1

	return (
		<div ref={wrapRef} className="space-y-3">
			<label className="block text-xs font-semibold uppercase tracking-wider text-secondary">
				Add members
			</label>

			<div className="relative">
				<IconSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
				<input
					type="search"
					value={query}
					onChange={(e) => {
						setQuery(e.target.value)
						setOpen(true)
					}}
					onFocus={() => setOpen(true)}
					placeholder="Search by name or email"
					className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-secondary outline-none backdrop-blur-md transition focus:border-brand/40 focus:ring-1 focus:ring-brand/20"
				/>

				{showDropdown ? (
					<div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/95 py-1 shadow-2xl backdrop-blur-md">
						{isLoading ? (
							<p className="px-3 py-2.5 text-sm text-secondary">Searching...</p>
						) : isError ? (
							<p className="px-3 py-2.5 text-sm text-rose-300">Search failed.</p>
						) : visibleUsers.length ? (
							visibleUsers.map((user) => (
								<button
									key={user.id}
									type="button"
									onClick={() => pickUser(user)}
									className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-white/10"
								>
									{/* {user?.imageUrl ? (
										<img
											src={user.imageUrl}
											alt=""
											className="h-8 w-8 rounded-full object-cover"
										/>
									) : (
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
											{(user?.fullName || user?.email || '?')[0]}
										</div>
									)} */}
									<UserImage user={user} />
									<span className="min-w-0 flex-1">
										<span className="block truncate text-sm font-medium text-white">
											{user?.fullName || 'Unknown user'}
										</span>
										<span className="block truncate text-xs text-white/60">
											{user?.email || 'No email'}
										</span>
									</span>
								</button>
							))
						) : (
							<p className="px-3 py-2.5 text-sm text-secondary">No users found.</p>
						)}
					</div>
				) : null}
			</div>

			{selectedUsers.length ? (
				<div className="flex flex-wrap gap-2">
					{selectedUsers.map((u) => (
						<span
							key={u.id}
							className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white"
						>
							<span className="max-w-45 truncate">{u?.fullName || u?.email}</span>
							<button
								type="button"
								onClick={() => onRemoveUser(String(u.id))}
								className="rounded-full p-0.5 text-white/70 transition hover:bg-white/15 hover:text-white"
								aria-label="Remove selected user"
							>
								<IconX className="h-3.5 w-3.5" />
							</button>
						</span>
					))}
				</div>
			) : (
				<p className="text-xs text-secondary">No selected users yet.</p>
			)}
		</div>
	)
}

export default MemberSearchInput
