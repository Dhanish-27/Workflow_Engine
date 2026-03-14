import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper to check if user is logged in from localStorage
const getInitialAuthState = () => {
    try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            const user = JSON.parse(userStr);
            return {
                user,
                token,
                isAuthenticated: true,
                isLoading: false
            };
        }
    } catch (e) {
        console.error('Error reading auth from localStorage:', e);
    }
    return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
    };
};

const initialAuthState = getInitialAuthState();

export const useAuthStore = create(
    persist(
        (set, get) => ({
            ...initialAuthState,

            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setToken: (token) => set({ token }),

            login: (user, token) => {
                set({ user, token, isAuthenticated: true, isLoading: false });
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false, isLoading: false });
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            },

            setLoading: (isLoading) => set({ isLoading }),

            getUserRole: () => {
                const { user } = get();
                return user?.role || null;
            },

            // Role-based checks
            isAdmin: () => get().getUserRole() === 'admin',
            isManager: () => get().getUserRole() === 'manager',
            isEmployee: () => get().getUserRole() === 'employee',
            isFinance: () => get().getUserRole() === 'finance',
            isCEO: () => get().getUserRole() === 'ceo',

            // Combined role checks
            canManageWorkflows: () => get().isAdmin(),
            canManageUsers: () => get().isAdmin(),
            canManageSteps: () => get().isAdmin(),
            canManageRules: () => get().isAdmin(),
            canExecuteWorkflow: () => get().isEmployee() || get().isAdmin(),
            canApprove: () => get().isManager() || get().isFinance() || get().isCEO() || get().isAdmin(),
            canViewAllExecutions: () => get().isAdmin() || get().isManager(),
            canViewOwnExecutions: () => true,
            canCancelExecution: () => get().isAdmin(),
            canRetryExecution: () => get().isAdmin(),
            canViewApprovalTasks: () => get().isManager() || get().isFinance() || get().isCEO() || get().isAdmin(),

            // Get role display name
            getRoleDisplayName: () => {
                const role = get().getUserRole();
                const roleNames = {
                    admin: 'Administrator',
                    manager: 'Manager',
                    employee: 'Employee',
                    finance: 'Finance',
                    ceo: 'CEO'
                };
                return roleNames[role] || role;
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
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
