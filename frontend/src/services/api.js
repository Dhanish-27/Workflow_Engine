import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API - Using email-based login
export const authAPI = {
    login: (credentials) => api.post('/accounts/login/', credentials),
    logout: () => api.post('/accounts/logout/'),
    register: (data) => api.post('/accounts/register/', data),
    me: () => api.get('/accounts/me/'),
    refreshToken: (refresh) => api.post('/api/token/refresh/', { refresh }),
};

// Users API
export const usersAPI = {
    list: (params) => api.get('/accounts/users/', { params }),
    get: (id) => api.get(`/accounts/users/${id}/`),
    create: (data) => api.post('/accounts/users/', data),
    update: (id, data) => api.patch(`/accounts/users/${id}/`, data),
    delete: (id) => api.delete(`/accounts/users/${id}/`),
    changePassword: (id, data) => api.post(`/accounts/users/${id}/change_password/`, data),
};

// Workflows API
export const workflowsAPI = {
    list: (params) => api.get('/workflows/workflows/', { params }),
    get: (id) => api.get(`/workflows/workflows/${id}/`),
    create: (data) => api.post('/workflows/workflows/', data),
    update: (id, data) => api.patch(`/workflows/workflows/${id}/`, data),
    delete: (id) => api.delete(`/workflows/workflows/${id}/`),
};

// Workflow Fields API
export const workflowFieldsAPI = {
    list: (params) => api.get('/workflows/workflow-fields/', { params }),
    get: (id) => api.get(`/workflows/workflow-fields/${id}/`),
    create: (data) => api.post('/workflows/workflow-fields/', data),
    update: (id, data) => api.patch(`/workflows/workflow-fields/${id}/`, data),
    delete: (id) => api.delete(`/workflows/workflow-fields/${id}/`),
    reorder: (id, data) => api.post(`/workflows/workflow-fields/${id}/reorder/`, data),
};

// Steps API
export const stepsAPI = {
    list: (params) => api.get('/steps/steps/', { params }),
    get: (id) => api.get(`/steps/steps/${id}/`),
    create: (data) => api.post('/steps/steps/', data),
    update: (id, data) => api.patch(`/steps/steps/${id}/`, data),
    delete: (id) => api.delete(`/steps/steps/${id}/`),
    reorder: (workflowId, data) => api.post(`/steps/steps/reorder/`, { workflow: workflowId, steps: data.steps }),

    // Task Definitions (Templates)
    getTaskDefinitions: (params) => api.get('/steps/definitions/', { params }),
    createTaskDefinition: (data) => api.post('/steps/definitions/', data),
    updateTaskDefinition: (id, data) => api.patch(`/steps/definitions/${id}/`, data),
    deleteTaskDefinition: (id) => api.delete(`/steps/definitions/${id}/`),

    // File Upload
    uploadFile: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/steps/definitions/upload/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

// Rules API
export const rulesAPI = {
    list: (params) => api.get('/rules/rules/', { params }),
    get: (id) => api.get(`/rules/rules/${id}/`),
    create: (data) => api.post('/rules/rules/', data),
    update: (id, data) => api.patch(`/rules/rules/${id}/`, data),
    delete: (id) => api.delete(`/rules/rules/${id}/`),
    reorder: (data) => api.post(`/rules/rules/reorder/`, data),
};

// Executions API
export const executionsAPI = {
    list: (params) => api.get('/executions/', { params }),
    get: (id) => api.get(`/executions/${id}/`),
    create: (data) => api.post('/executions/', data),
    approve: (id, data) => api.post(`/executions/${id}/approve/`, data),
    reject: (id, data) => api.post(`/executions/${id}/reject/`, data),
    cancel: (id) => api.post(`/executions/${id}/cancel/`),
    retry: (id) => api.post(`/executions/${id}/retry/`),
    getLogs: (id) => api.get(`/executions/${id}/logs/`),
    getTimeline: (id) => api.get(`/executions/${id}/timeline/`),
    getMyTasks: () => api.get('/executions/my-tasks/'),
    getTaskHistory: () => api.get('/executions/tasks/history/'),
    completeTask: (id, data) => api.post(`/executions/tasks/${id}/complete/`, data),
    createTask: (data) => api.post('/executions/my-tasks/', data),
};

// Approvals API - Role-based approval tasks
export const approvalsAPI = {
    list: (params) => api.get('/executions/approvals/', { params }),
    get: (id) => api.get(`/approvals/${id}/`),
    approve: (id, data) => api.post(`/executions/${id}/approve/`, data),
    reject: (id, data) => api.post(`/executions/${id}/reject/`, data),
};

// Dashboard API
export const dashboardAPI = {
    stats: () => api.get('/executions/dashboard/stats/'),
    chartData: () => api.get('/executions/dashboard/chart-data/'),
    recentExecutions: () => api.get('/executions/dashboard/recent/'),
    userStats: () => api.get('/executions/dashboard/user-stats/'),
    managerStats: () => api.get('/executions/dashboard/manager-stats/'),
};

// Notifications API
export const notificationsAPI = {
    list: (params) => api.get('/notifications/', { params }),
    markAsRead: (id) => api.post(`/notifications/${id}/read/`),
    markAllAsRead: () => api.post('/notifications/mark_all_read/'),
};

export default api;
