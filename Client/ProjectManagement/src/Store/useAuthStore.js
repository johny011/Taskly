import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set,get) => ({
            token: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,
            setAuth: (token, refreshToken, user) =>
                set({ token, refreshToken, user, isAuthenticated: true }),
            updateUser: (updates) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : state.user,
                })),
            logout: () =>
                set({ token: null, refreshToken: null, user: null, isAuthenticated: false }),
        }),
        {
            name: 'auth-storage', // key for localStorage
        }
    )
);

export default useAuthStore;