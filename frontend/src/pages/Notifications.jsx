import { useState, useEffect, useMemo } from 'react';
import { Bell, Check, CheckCheck, Clock, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Button, Badge, EmptyState, LoadingSpinner } from '../components/ui';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notifications';
import { formatRelativeTime, cn } from '../utils';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
    const [markingRead, setMarkingRead] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const response = await getNotifications();
            // Handle both paginated and non-paginated responses
            const data = response.data?.results || response.data || response;
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error('Failed to load notifications');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            setMarkingRead(notificationId);
            await markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === notificationId ? { ...notif, is_read: true } : notif
                )
            );
            toast.success('Notification marked as read');
        } catch (error) {
            console.error('Error marking notification as read:', error);
            toast.error('Failed to mark notification as read');
        } finally {
            setMarkingRead(null);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            setNotifications(prev =>
                prev.map(notif => ({ ...notif, is_read: true }))
            );
            toast.success('All notifications marked as read');
        } catch (error) {
            console.error('Error marking all as read:', error);
            toast.error('Failed to mark all notifications as read');
        }
    };

    const filteredNotifications = useMemo(() => {
        switch (filter) {
            case 'unread':
                return notifications.filter(n => !n.is_read);
            case 'read':
                return notifications.filter(n => n.is_read);
            default:
                return notifications;
        }
    }, [notifications, filter]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success':
            case 'approved':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning':
            case 'rejected':
                return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            case 'error':
            case 'failed':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getNotificationType = (notification) => {
        // Determine type based on notification data
        const title = notification.title?.toLowerCase() || '';
        const message = notification.message?.toLowerCase() || '';

        if (title.includes('approved') || message.includes('approved') || title.includes('success')) {
            return 'success';
        }
        if (title.includes('rejected') || message.includes('rejected') || title.includes('failed')) {
            return 'error';
        }
        if (title.includes('warning') || message.includes('warning')) {
            return 'warning';
        }
        return 'info';
    };

    const filterTabs = [
        { key: 'all', label: 'All', count: notifications.length },
        { key: 'unread', label: 'Unread', count: unreadCount },
        { key: 'read', label: 'Read', count: notifications.length - unreadCount },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                        Notifications
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-dark-muted mt-1">
                        Stay updated with your recent activity
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-2"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Mark all as read
                    </Button>
                )}
            </div>

            {/* Filter Tabs */}
            <Card className="p-0" noPadding>
                <div className="flex items-center gap-1 p-1 border-b border-gray-100 dark:border-dark-border overflow-x-auto">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={cn(
                                'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap',
                                filter === tab.key
                                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                                    : 'text-gray-600 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-dark-card-hover'
                            )}
                        >
                            {tab.label}
                            <span
                                className={cn(
                                    'ml-2 px-2 py-0.5 text-xs rounded-full',
                                    filter === tab.key
                                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300'
                                        : 'bg-gray-100 text-gray-600 dark:bg-dark-border dark:text-dark-muted'
                                )}
                            >
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                <div className="min-h-[400px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <EmptyState
                            icon={Bell}
                            title={filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
                            description={
                                filter === 'all'
                                    ? 'You will see notifications about your requests and approvals here.'
                                    : filter === 'unread'
                                        ? 'You have read all your notifications.'
                                        : 'You haven\'t read any notifications yet.'
                            }
                        />
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-dark-border">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        'flex items-start gap-4 p-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-dark-card-hover',
                                        !notification.is_read && 'bg-blue-50/50 dark:bg-primary-900/10'
                                    )}
                                >
                                    {/* Icon */}
                                    <div
                                        className={cn(
                                            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                                            !notification.is_read
                                                ? 'bg-primary-100 dark:bg-primary-900/30'
                                                : 'bg-gray-100 dark:bg-dark-border'
                                        )}
                                    >
                                        {getNotificationIcon(getNotificationType(notification))}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3
                                                    className={cn(
                                                        'font-medium truncate',
                                                        notification.is_read
                                                            ? 'text-gray-700 dark:text-dark-text'
                                                            : 'text-gray-900 dark:text-dark-text'
                                                    )}
                                                >
                                                    {notification.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-dark-muted mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-dark-muted">
                                                        <Clock className="w-3 h-3" />
                                                        {formatRelativeTime(notification.created_at)}
                                                    </span>
                                                    {!notification.is_read && (
                                                        <Badge variant="info" className="text-xs">
                                                            New
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {!notification.is_read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                disabled={markingRead === notification.id}
                                                className="text-gray-500 hover:text-primary-600 dark:text-dark-muted dark:hover:text-primary-400"
                                                title="Mark as read"
                                            >
                                                {markingRead === notification.id ? (
                                                    <LoadingSpinner size="sm" />
                                                ) : (
                                                    <Check className="w-4 h-4" />
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default Notifications;
