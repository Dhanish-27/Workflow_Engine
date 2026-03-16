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

/**
 * Fetch all notifications for the current user
 * @param {Object} params - Query parameters (e.g., { page: 1, page_size: 20 })
 * @returns {Promise} - Promise resolving to notifications array
 */
export const getNotifications = async (params = {}) => {
    try {
        const response = await api.get('/notifications/', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

/**
 * Get the count of unread notifications for the current user
 * @returns {Promise} - Promise resolving to unread count
 */
export const getUnreadCount = async () => {
    try {
        const response = await api.get('/notifications/unread-count/');
        return response.data;
    } catch (error) {
        console.error('Error fetching unread count:', error);
        throw error;
    }
};

/**
 * Mark a single notification as read
 * @param {number|string} notificationId - The ID of the notification to mark as read
 * @returns {Promise} - Promise resolving to updated notification
 */
export const markAsRead = async (notificationId) => {
    try {
        const response = await api.patch(`/notifications/${notificationId}/read/`);
        return response.data;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

/**
 * Mark all notifications as read for the current user
 * @returns {Promise} - Promise resolving to success message
 */
export const markAllAsRead = async () => {
    try {
        const response = await api.post('/notifications/mark-all-read/');
        return response.data;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

export default {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};
