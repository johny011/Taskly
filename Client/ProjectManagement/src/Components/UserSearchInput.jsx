import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDebounce } from './hooks/useDebounce'
import { useUserSearch } from './hooks/useUserSearch'
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

const UserSearchInput = ({
    onSelectUser,
    selectedUsers = [],
    onRemoveUser,
    excludedIds = [],
    label = 'Search users',
    placeholder = 'Search by name or email…',
    emptyHint = 'No users selected yet — search above.',
    className = ''
}) => {
    const wrapRef = useRef(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [open, setOpen] = useState(false)

    const debouncedQuery = useDebounce(searchQuery, 300)
    const { data: users = [], isLoading, isError } = useUserSearch(debouncedQuery)

    const excluded = useMemo(() => {
        return new Set((Array.isArray(excludedIds) ? excludedIds : []).map((id) => String(id)))
    }, [excludedIds])

    const selectedIds = useMemo(
        () => new Set(selectedUsers.map((u) => String(u.id)).filter(Boolean)),
        [selectedUsers]
    )

    const visible = useMemo(() => {
        return users.filter((u) => {
            const id = String(u.id)
            if (!id) return false
            if (excluded.has(id)) return false
            if (selectedIds.has(id)) return false
            return true
        })
    }, [users, excluded, selectedIds])

    useEffect(() => {
        const close = (e) => {
            if (!wrapRef.current?.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', close)
        return () => document.removeEventListener('mousedown', close)
    }, [])

    const pick = (user) => {
        const id = String(user.id)
        if (!id || excluded.has(id) || selectedIds.has(id)) return
        onSelectUser(user)
        setSearchQuery('')
        setOpen(false)
    }

    const showList = open && String(searchQuery).trim().length > 2

    return (
        <div className={`space-y-3 ${className}`} ref={wrapRef}>
            {label ? (
                <label className="block text-xs font-semibold uppercase tracking-wide text-secondary">
                    {label}
                </label>
            ) : null}

            <div className="relative">
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary" />
                <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    autoComplete="off"
                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-secondary outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/30"
                />

                {showList ? (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-slate-950 py-1 shadow-lg backdrop-blur-md">
                        {isLoading ? (
                            <div className="px-3 py-2.5 text-sm text-secondary">Searching…</div>
                        ) : isError ? (
                            <div className="px-3 py-2.5 text-sm text-red-400">Search failed.</div>
                        ) : visible.length ? (
                            visible.map((u) => (
                                <button
                                    key={u.id}
                                    type="button"
                                    onClick={() => pick(u)}
                                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-white/5"
                                >
                                    {/* {u.imageUrl ? (
                                        <img
                                            src={u.imageUrl}
                                            alt=""
                                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white">
                                            {(u.fullName || u.email || '?')[0]}
                                        </div>
                                    )} */}
                                    <UserImage user={u} />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-medium text-white">
                                            {u.fullName}
                                        </span>
                                        <span className="block truncate text-xs text-secondary">{u.email}</span>
                                    </span>
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-2.5 text-sm text-secondary">No users found</div>
                        )}
                    </div>
                ) : null}
            </div>

            {selectedUsers.length ? (
                <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((u) => (
                        <span
                            key={u.id}
                            className="inline-flex items-center gap-1.5 rounded-full bg-brand/20 px-3 py-1 text-sm text-brand"
                        >
                            <span className="truncate max-w-[200px]">{u.fullName || u.email}</span>
                            <button
                                type="button"
                                onClick={() => onRemoveUser(String(u.id))}
                                className="shrink-0 rounded-full p-0.5 hover:bg-brand/30"
                                aria-label="Remove"
                            >
                                <IconX className="h-3.5 w-3.5" />
                            </button>
                        </span>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-secondary">{emptyHint}</p>
            )}
        </div>
    )
}

export default UserSearchInput
