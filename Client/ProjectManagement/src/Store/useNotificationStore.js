import { create } from 'zustand'

const useNotificationStore = create((set, get) => ({
    notifications: [],
    isOpen: false,
    
    // ضبط الإشعارات القادمة من API الـ GET مباشرة
    setNotifications: (notifications) => set({ notifications }),
    
    // إضافة إشعار جديد (مثلاً القادم عبر SignalR / WebSockets)
    addNotification: (notification) =>
        set((state) => ({ notifications: [notification, ...state.notifications] })),

    toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    clearNotifications: () => set({ notifications: [] }),
    
    markAsRead: (notificationId) =>
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.userNotificationId === notificationId ? { ...n, isRead: true } : n
            )
        })),
        
    markAllAsRead: () =>
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true }))
        })),
        
    getUnreadCount: () => get().notifications.filter((n) => !n.isRead).length
}))

export default useNotificationStore