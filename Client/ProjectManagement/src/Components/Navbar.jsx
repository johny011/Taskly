import { useEffect, useMemo, useRef, useState } from 'react'
import useAuthStore from '../Store/useAuthStore'
import useNotificationStore from '../Store/useNotificationStore'
import { useNotifications } from './hooks/useNotifications'
import { Link, useSearchParams } from 'react-router-dom'
import ProfileDropdown from './ProfileDropdown'
import NotificationItem from './NotificationItem'

export default function Navbar() {
    const { user } = useAuthStore()
    const panelRef = useRef(null)
    const { isOpen, toggleOpen, close, getUnreadCount } = useNotificationStore()

    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.trim()) {
                setSearchParams({ search: searchTerm }); 
            } else {
                searchParams.delete("search");
                setSearchParams(searchParams); 
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, setSearchParams]);

    const notifications = useNotificationStore((state) => state.notifications)

    useNotifications()

    const getInitials = (name) => {
        if (!name) return '??'
        const parts = name.trim().split(' ')
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        }
        return parts[0][0].toUpperCase()
    }

    const unreadCount = useMemo(() => getUnreadCount(), [getUnreadCount, notifications])

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                close()
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)
        return () => document.removeEventListener('mousedown', handleOutsideClick)
    }, [close])

    const formatDate = (value) => {
        if (!value) return ''
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return ''
        return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
    }

    return (
        <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10 py-3 px-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">

                {/* Logo Section */}
                <Link to="/" className="flex items-center gap-3 group">
                    <div className="bg-brand/20 p-2 rounded-lg group-hover:bg-brand/30 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-list-icon lucide-layout-list"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><path d="M14 4h7"/><path d="M14 9h7"/><path d="M14 15h7"/><path d="M14 20h7"/></svg>
                    </div>
                    <span className="text-white text-xl font-bold tracking-tight hidden md:block">Project</span>
                </Link>

                {/* Search Bar - AMOLED Style */}
                <div className="flex-1 max-w-2xl relative group">
                    <input
                        onChange={(e) => setSearchTerm(e.target.value)}
                        type="text"
                        placeholder="Type to search..."
                        className="w-full bg-white/5 border border-white/10 h-11 rounded-xl px-4 pl-11 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-white/10 transition-all"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </div>
                </div>

                {/* Right Side Actions */}
                <ul className="flex items-center gap-5">
                    <li className="relative" ref={panelRef}>
                        <button
                            type="button"
                            onClick={toggleOpen}
                            className="relative text-slate-400 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all"
                            aria-label="Notifications"
                            aria-expanded={isOpen}
                            aria-haspopup="menu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                            </svg>
                            {unreadCount > 0 ? (
                                <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-brand/20">
                                    {unreadCount}
                                </span>
                            ) : null}
                        </button>

                        {isOpen ? (
                            <div className="absolute right-0 top-full mt-3 w-88 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/40 backdrop-blur-2xl">
                                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                                    <div>
                                        <p className="text-sm font-bold text-white">Notifications</p>
                                        <p className="text-xs text-secondary">Latest activity and project updates</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={close}
                                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-secondary transition-colors hover:text-white"
                                    >
                                        Close
                                    </button>
                                </div>

                                <div className="max-h-104 overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        <ul className="divide-y divide-white/5">
                                            {notifications.map((notification) => (
                                                <NotificationItem
                                                    key={notification.userNotificationId}
                                                    notification={notification}
                                                    onRead={useNotificationStore.getState().markAsRead}
                                                />
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="px-5 py-10 text-center">
                                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-secondary">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-medium text-white">No notifications yet</p>
                                            <p className="mt-1 text-xs text-secondary">You'll see project updates here.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </li>

                    {/* User Profile Avatar */}
                    <li className="border-l border-white/10 pl-5">
                        <ProfileDropdown user={user} getInitials={getInitials} />
                    </li>
                </ul>
            </div>
        </nav>
    );
}