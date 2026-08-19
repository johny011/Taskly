import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import useProfileDropdown from './hooks/useProfileDropdown'

function getFallbackInitials(user, getInitials) {
  if (typeof getInitials === 'function') {
    return getInitials(user?.fullName || user?.name || user?.email)
  }

  const displayName = user?.fullName || user?.name || user?.email || 'Guest User'
  const parts = displayName.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }
  return parts[0][0]?.toUpperCase() || 'GU'
}

export default function ProfileDropdown({ user, getInitials }) {
  const menuRef = useRef(null)
  const { isOpen, toggleOpen, close, handleLogout } = useProfileDropdown()
  const initials = getFallbackInitials(user, getInitials)
  const displayName = user?.fullName || user?.name || 'Guest User'
  const displayEmail = user?.email || ''

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        close()
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [close])

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition-all hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-brand/30"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-brand text-sm font-bold text-white shadow-lg shadow-brand/20">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div className="hidden min-w-0 flex-col sm:flex">
          <span className="truncate text-sm font-semibold text-white">{displayName}</span>
          {displayEmail ? <span className="truncate text-xs text-secondary">{displayEmail}</span> : null}
        </div>

        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-secondary transition-transform duration-200" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">{displayName}</p>
            {displayEmail ? <p className="truncate text-xs text-secondary">{displayEmail}</p> : null}
          </div>

          <div className="mt-2 space-y-1">
            <Link
              to="/edit-profile"
              onClick={close}
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-brand">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931ZM16.862 4.487 19.5 7.125" />
                </svg>
              </span>
              <span>Edit Profile</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3H6.75A2.25 2.25 0 0 0 4.5 5.25v13.5A2.25 2.25 0 0 0 6.75 21h6.75A2.25 2.25 0 0 0 15.75 18.75V15M9 12h12m0 0-3-3m3 3-3 3" />
                </svg>
              </span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}