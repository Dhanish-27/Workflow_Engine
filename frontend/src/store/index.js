import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,

            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setToken: (token) => set({ token }),

            login: (user, token) => {
                set({ user, token, isAuthenticated: true });
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            },

            setLoading: (isLoading) => set({ isLoading }),

            getUserRole: () => {
                const { user } = get();
                return user?.role || null;
            },

            isAdmin: () => get().getUserRole() === 'Admin',
            isManager: () => get().getUserRole() === 'Manager',
            isEmployee: () => get().getUserRole() === 'Employee',
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, user: state.user }),
        }
    )
);

// UI Store
export const useUIStore = create((set) => ({
    sidebarOpen: true,
    darkMode: false,
    notifications: [],

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    toggleDarkMode: () => set((state) => {
        const newDarkMode = !state.darkMode;
        if (newDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        return { darkMode: newDarkMode };
    }),

    setDarkMode: (darkMode) => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        set({ darkMode });
    },

    addNotification: (notification) => set((state) => ({
        notifications: [...state.notifications, { ...notification, id: Date.now() }],
    })),

    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
    })),

    clearNotifications: () => set({ notifications: [] }),
}));
