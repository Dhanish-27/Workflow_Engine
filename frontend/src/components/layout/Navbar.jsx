import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Menu,
    Bell,
    Moon,
    Sun,
    LogOut,
    User,
    Settings,
    Check,
    BellOff,
} from 'lucide-react';
import { useUIStore, useAuthStore } from '../../store';
import { cn } from '../../utils';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../services/notifications';

const Navbar = () => {
    const navigate = useNavigate();
    const { toggleSidebar, darkMode, toggleDarkMode } = useUIStore();
    const { user, logout } = useAuthStore();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCount, setIsLoadingCount] = useState(false);
    const notificationRef = useRef(null);

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            setIsLoadingCount(true);
            const data = await getUnreadCount();
            setUnreadCount(data.unread_count || 0);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        } finally {
            setIsLoadingCount(false);
        }
    };

    // Fetch recent notifications
    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const data = await getNotifications({ page_size: 5 });
            setNotifications(data.results || data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch and auto-refresh
    useEffect(() => {
        fetchUnreadCount();
        fetchNotifications();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle mark as read
    const handleMarkAsRead = async (notificationId) => {
        try {
            await markAsRead(notificationId);
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, is_read: true } : n
                )
            );
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Format time ago
    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    // Format badge count
    const formatBadgeCount = (count) => {
        if (count > 99) return '99+';
        return count > 0 ? count : '';
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const hasUnread = unreadCount > 0;

    return (
        <header className="sticky top-0 z-30 h-16 glass dark:glass-dark border-b border-gray-200/50 dark:border-dark-border/50 backdrop-blur-xl transition-all duration-300">
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 dark:text-dark-muted dark:hover:bg-dark-border/50 transition-all duration-200 hover-lift"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    <div className="hidden md:block">
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                            Workflow Automation
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleDarkMode}
                        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 dark:text-dark-muted dark:hover:bg-dark-border/50 transition-all duration-200 hover-lift"
                    >
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    <div className="relative" ref={notificationRef}>
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={cn(
                                'p-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-dark-border/50 relative transition-all duration-200 hover-lift',
                                showNotifications
                                    ? 'bg-gray-100/80 dark:bg-dark-border/50 text-gray-700 dark:text-dark-text'
                                    : 'text-gray-500 dark:text-dark-muted'
                            )}
                        >
                            <Bell className="w-5 h-5" />
                            {hasUnread && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-medium rounded-full px-1 animate-pulse-soft">
                                    {formatBadgeCount(unreadCount)}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowNotifications(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-80 glass dark:glass-dark rounded-xl shadow-xl border border-gray-200/50 dark:border-dark-border/50 z-50 overflow-hidden animate-scale-in backdrop-blur-xl">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100/50 dark:border-dark-border/50 bg-gray-50/50 dark:bg-dark-border/20">
                                        <h3 className="font-semibold text-gray-900 dark:text-dark-text">
                                            Notifications
                                        </h3>
                                        {hasUnread && (
                                            <button
                                                onClick={handleMarkAllAsRead}
                                                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors hover-lift"
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>

                                    {/* Notifications List */}
                                    <div className="max-h-80 overflow-y-auto">
                                        {isLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : notifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <BellOff className="w-10 h-10 text-gray-300 dark:text-dark-muted mb-2" />
                                                <p className="text-sm text-gray-500 dark:text-dark-muted">
                                                    No notifications yet
                                                </p>
                                            </div>
                                        ) : (
                                            notifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={cn(
                                                        'px-4 py-3 border-b border-gray-100/50 dark:border-dark-border/50 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-dark-border/30 transition-all duration-200',
                                                        !notification.is_read && 'bg-primary-50/50 dark:bg-primary-900/10'
                                                    )}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className={cn(
                                                                'text-sm font-medium text-gray-900 dark:text-dark-text truncate',
                                                                !notification.is_read && 'font-semibold'
                                                            )}>
                                                                {notification.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-dark-muted mt-1">
                                                                {formatTimeAgo(notification.created_at)}
                                                            </p>
                                                        </div>
                                                        {!notification.is_read && (
                                                            <button
                                                                onClick={() => handleMarkAsRead(notification.id)}
                                                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-border text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                                                title="Mark as read"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="px-4 py-3 border-t border-gray-100/50 dark:border-dark-border/50 bg-gray-50/50 dark:bg-dark-border/20">
                                        <button
                                            onClick={() => {
                                                setShowNotifications(false);
                                                navigate('/notifications');
                                            }}
                                            className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-all duration-200 hover-lift"
                                        >
                                            View All Notifications
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-dark-border/50 transition-all duration-200 hover-lift"
                        >
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center ring-2 ring-transparent hover:ring-primary-500/30 transition-all duration-200">
                                <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
                                    {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                </span>
                            </div>
                        </button>

                        {showUserMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowUserMenu(false)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-56 glass dark:glass-dark rounded-xl shadow-xl border border-gray-200/50 dark:border-dark-border/50 py-2 z-50 animate-scale-in backdrop-blur-xl overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-100/50 dark:border-dark-border/50 bg-gray-50/30 dark:bg-dark-border/20">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-dark-text">
                                            {user?.first_name ? `${user.first_name} ${user.last_name}` : 'User'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-dark-muted truncate">
                                            {user?.email}
                                        </p>
                                    </div>

                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                navigate('/profile');
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-dark-text hover:bg-gray-100/80 dark:hover:bg-dark-border/50 transition-all duration-200 hover-lift"
                                        >
                                            <User className="w-4 h-4" />
                                            <span>Profile</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                navigate('/settings');
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-dark-text hover:bg-gray-100/80 dark:hover:bg-dark-border/50 transition-all duration-200 hover-lift"
                                        >
                                            <Settings className="w-4 h-4" />
                                            <span>Settings</span>
                                        </button>
                                    </div>

                                    <div className="border-t border-gray-100/50 dark:border-dark-border/50 pt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/80 dark:hover:bg-red-900/20 transition-all duration-200 hover-lift"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
