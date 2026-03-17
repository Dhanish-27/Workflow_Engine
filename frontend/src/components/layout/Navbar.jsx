import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Menu,
    Bell,
    Moon,
    Sun,
    LogOut,
    User,
    Settings,
    HelpCircle,
    Search,
    X,
    Workflow,
    Users,
    ListTodo,
    Play,
    Plus,
    ArrowRight,
    Clock,
    Check,
    ChevronRight,
    Command,
} from 'lucide-react';
import { useUIStore, useAuthStore } from '../../store';
import { cn } from '../../utils';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../../services/notifications';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Dropdown from '../ui/Dropdown';

// Mock search data (in real app, this would come from API)
const mockSearchResults = {
    workflows: [
        { id: 1, name: 'Employee Onboarding', status: 'active', description: 'Handle new employee processes' },
        { id: 2, name: 'Leave Approval', status: 'active', description: 'Manage leave requests' },
        { id: 3, name: 'Expense Report', status: 'draft', description: 'Process expense submissions' },
    ],
    users: [
        { id: 1, name: 'John Smith', email: 'john@example.com', role: 'Manager' },
        { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'Employee' },
    ],
    tasks: [
        { id: 1, title: 'Review onboarding request', status: 'pending', priority: 'high' },
        { id: 2, title: 'Approve expense report', status: 'pending', priority: 'medium' },
    ],
    executions: [
        { id: 1, workflow: 'Employee Onboarding', status: 'running', startedAt: '2024-01-15T10:00:00Z' },
        { id: 2, workflow: 'Leave Approval', status: 'completed', startedAt: '2024-01-15T09:30:00Z' },
    ],
};

const quickActions = [
    { id: 'create-workflow', label: 'Create Workflow', icon: Workflow, shortcut: 'W', path: '/workflows/new' },
    { id: 'new-task', label: 'New Task', icon: Plus, shortcut: 'T', path: '/tasks/new' },
    { id: 'run-execution', label: 'Run Execution', icon: Play, shortcut: 'E', path: '/executions/new' },
    { id: 'add-user', label: 'Add User', icon: Users, shortcut: 'U', path: '/users/new' },
];

// Command Palette Component
const CommandPalette = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [activeSection, setActiveSection] = useState('quick-actions'); // 'quick-actions' or 'search'
    const inputRef = useRef(null);

    // Flatten results for keyboard navigation
    const getAllResults = useCallback(() => {
        if (!query.trim()) {
            return quickActions.map((action, index) => ({
                type: 'quick-action',
                ...action,
                index,
            }));
        }

        const results = [];
        let index = 0;

        // Add workflows
        mockSearchResults.workflows
            .filter(w => w.name.toLowerCase().includes(query.toLowerCase()))
            .forEach(w => {
                results.push({ type: 'workflow', ...w, index: index++ });
            });

        // Add users
        mockSearchResults.users
            .filter(u => u.name.toLowerCase().includes(query.toLowerCase()))
            .forEach(u => {
                results.push({ type: 'user', ...u, index: index++ });
            });

        // Add tasks
        mockSearchResults.tasks
            .filter(t => t.title.toLowerCase().includes(query.toLowerCase()))
            .forEach(t => {
                results.push({ type: 'task', ...t, index: index++ });
            });

        // Add executions
        mockSearchResults.executions
            .filter(e => e.workflow.toLowerCase().includes(query.toLowerCase()))
            .forEach(e => {
                results.push({ type: 'execution', ...e, index: index++ });
            });

        return results;
    }, [query]);

    const allResults = getAllResults();

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery('');
            setSelectedIndex(0);
            setActiveSection('quick-actions');
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (allResults[selectedIndex]) {
                        handleSelect(allResults[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    onClose();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex, allResults, onClose]);

    const handleSelect = (item) => {
        if (item.type === 'quick-action') {
            navigate(item.path);
        } else if (item.type === 'workflow') {
            navigate(`/workflows/${item.id}`);
        } else if (item.type === 'user') {
            navigate(`/users/${item.id}`);
        } else if (item.type === 'task') {
            navigate(`/tasks/${item.id}`);
        } else if (item.type === 'execution') {
            navigate(`/executions/${item.id}`);
        }
        onClose();
    };

    if (!isOpen) return null;

    const getIconForType = (type) => {
        switch (type) {
            case 'workflow': return Workflow;
            case 'user': return Users;
            case 'task': return ListTodo;
            case 'execution': return Play;
            default: return Search;
        }
    };

    return (
        <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl animate-scale-in">
                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-gray-200/50 dark:border-dark-border overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center px-4 border-b border-gray-100 dark:border-dark-border">
                        <Search className="w-5 h-5 text-gray-400 dark:text-dark-muted" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search workflows, tasks, users..."
                            className="flex-1 px-3 py-4 bg-transparent text-gray-900 dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-muted focus:outline-none text-sm"
                        />
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border text-gray-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Results */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {!query.trim() ? (
                            <div className="p-3">
                                <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                                    Quick Actions
                                </p>
                                {quickActions.map((action, index) => {
                                    const Icon = action.icon;
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => handleSelect({ ...action, type: 'quick-action', index })}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150',
                                                selectedIndex === index
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                                    : 'text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border/50'
                                            )}
                                        >
                                            <div className={cn(
                                                'p-2 rounded-lg',
                                                selectedIndex === index
                                                    ? 'bg-primary-100 dark:bg-primary-900/40'
                                                    : 'bg-gray-100 dark:bg-dark-border'
                                            )}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className="flex-1 font-medium">{action.label}</span>
                                            <kbd className="px-2 py-0.5 text-xs font-medium text-gray-400 dark:text-dark-muted bg-gray-100 dark:bg-dark-border rounded">
                                                {action.shortcut}
                                            </kbd>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-3">
                                {allResults.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <Search className="w-10 h-10 text-gray-300 dark:text-dark-muted mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-dark-muted">No results found</p>
                                    </div>
                                ) : (
                                    <>
                                        {['workflow', 'user', 'task', 'execution'].map(section => {
                                            const sectionResults = allResults.filter(r => r.type === section);
                                            if (sectionResults.length === 0) return null;

                                            const sectionNames = {
                                                workflow: 'Workflows',
                                                user: 'Users',
                                                task: 'Tasks',
                                                execution: 'Executions',
                                            };

                                            return (
                                                <div key={section} className="mb-2">
                                                    <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                                                        {sectionNames[section]}
                                                    </p>
                                                    {sectionResults.map((item) => {
                                                        const Icon = getIconForType(item.type);
                                                        return (
                                                            <button
                                                                key={`${item.type}-${item.id || item.index}`}
                                                                onClick={() => handleSelect(item)}
                                                                className={cn(
                                                                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150',
                                                                    selectedIndex === item.index
                                                                        ? 'bg-primary-50 dark:bg-primary-900/20'
                                                                        : 'hover:bg-gray-50 dark:hover:bg-dark-border/50'
                                                                )}
                                                            >
                                                                <div className="p-2 rounded-lg bg-gray-100 dark:bg-dark-border">
                                                                    <Icon className="w-4 h-4 text-gray-500 dark:text-dark-muted" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium text-gray-900 dark:text-dark-text truncate">
                                                                        {item.name || item.title || item.workflow}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 dark:text-dark-muted truncate">
                                                                        {item.description || item.email || item.status}
                                                                    </p>
                                                                </div>
                                                                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-dark-muted" />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-border/20">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-dark-muted">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-dark-border rounded">↑↓</kbd>
                                    Navigate
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-dark-border rounded">↵</kbd>
                                    Select
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-dark-border rounded">Esc</kbd>
                                    Close
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Notification Item Component
const NotificationItem = ({ notification, onMarkAsRead, onNavigate }) => {
    return (
        <button
            onClick={() => {
                if (!notification.is_read) {
                    onMarkAsRead(notification.id);
                }
                onNavigate(notification);
            }}
            className={cn(
                'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-all duration-200 group',
                !notification.is_read && 'bg-primary-50/50 dark:bg-primary-900/10'
            )}
        >
            <div className={cn(
                'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                notification.is_read ? 'bg-transparent' : 'bg-primary-500'
            )} />
            <div className="flex-1 min-w-0">
                <p className={cn(
                    'text-sm font-medium text-gray-900 dark:text-dark-text group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors',
                    !notification.is_read && 'font-semibold'
                )}>
                    {notification.title}
                </p>
                {notification.message && (
                    <p className="text-xs text-gray-500 dark:text-dark-muted mt-1 line-clamp-2">
                        {notification.message}
                    </p>
                )}
                <p className="text-xs text-gray-400 dark:text-dark-muted mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {notification.created_at}
                </p>
            </div>
            {!notification.is_read && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notification.id);
                    }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-dark-border text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200"
                    title="Mark as read"
                >
                    <Check className="w-4 h-4" />
                </button>
            )}
        </button>
    );
};

// Main Navbar Component
const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toggleSidebar, darkMode, toggleDarkMode } = useUIStore();
    const { user, logout, getRoleDisplayName } = useAuthStore();

    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCount, setIsLoadingCount] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const notificationRef = useRef(null);

    // Get page title from location
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        if (path.startsWith('/workflows')) return 'Workflows';
        if (path.startsWith('/tasks')) return 'Tasks';
        if (path.startsWith('/executions')) return 'Executions';
        if (path.startsWith('/users')) return 'Users';
        if (path.startsWith('/steps')) return 'Steps';
        if (path.startsWith('/rules')) return 'Rules';
        if (path.startsWith('/approvals')) return 'Approvals';
        if (path.startsWith('/notifications')) return 'Notifications';
        if (path.startsWith('/profile')) return 'Profile';
        return 'Workflow Automation';
    };

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
            const data = await getNotifications({ page_size: 10 });
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

    // Global keyboard shortcut for command palette
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowCommandPalette(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
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

    // Group notifications by time
    const groupNotificationsByTime = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

        const groups = {
            today: [],
            yesterday: [],
            earlier: [],
        };

        notifications.forEach((notification) => {
            const notifDate = new Date(notification.created_at);
            if (notifDate >= today) {
                groups.today.push(notification);
            } else if (notifDate >= yesterday) {
                groups.yesterday.push(notification);
            } else {
                groups.earlier.push(notification);
            }
        });

        return groups;
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNotificationNavigate = (notification) => {
        setShowNotifications(false);
        // Navigate based on notification type
        if (notification.related_type === 'workflow') {
            navigate(`/workflows/${notification.related_id}`);
        } else if (notification.related_type === 'task') {
            navigate(`/tasks/${notification.related_id}`);
        } else if (notification.related_type === 'execution') {
            navigate(`/executions/${notification.related_id}`);
        } else {
            navigate('/notifications');
        }
    };

    const hasUnread = unreadCount > 0;
    const notificationGroups = groupNotificationsByTime();
    const userName = user?.first_name ? `${user.first_name} ${user.last_name}` : 'User';
    const userRole = getRoleDisplayName();

    return (
        <>
            <header className="sticky top-0 z-30 h-16 glass dark:glass-dark border-b border-gray-200/50 dark:border-dark-border/50 backdrop-blur-xl transition-all duration-300">
                <div className="flex items-center justify-between h-full px-4 lg:px-6">
                    {/* Left: Hamburger + Page Title */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 dark:text-dark-muted dark:hover:bg-dark-border/50 transition-all duration-200 hover-lift"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <div className="hidden md:block">
                            <h1 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                                {getPageTitle()}
                            </h1>
                        </div>
                    </div>

                    {/* Center: Search Trigger */}
                    <div className="hidden md:flex flex-1 max-w-md mx-4">
                        <button
                            onClick={() => setShowCommandPalette(true)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-dark-border/30 hover:bg-gray-100/80 dark:hover:bg-dark-border/50 transition-all duration-200 group"
                        >
                            <Search className="w-4 h-4 text-gray-400 dark:text-dark-muted" />
                            <span className="text-sm text-gray-400 dark:text-dark-muted flex-1 text-left">
                                Search workflows, tasks...
                            </span>
                            <kbd className="hidden lg:flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-400 dark:text-dark-muted bg-gray-100 dark:bg-dark-border rounded-lg group-hover:bg-white dark:group-hover:bg-dark-card transition-colors">
                                <Command className="w-3 h-3" />K
                            </kbd>
                        </button>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1">
                        {/* Mobile Search Button */}
                        <button
                            onClick={() => setShowCommandPalette(true)}
                            className="md:hidden p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 dark:text-dark-muted dark:hover:bg-dark-border/50 transition-all duration-200 hover-lift"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 dark:text-dark-muted dark:hover:bg-dark-border/50 transition-all duration-200 hover-lift"
                        >
                            {darkMode ? (
                                <Sun className="w-5 h-5" />
                            ) : (
                                <Moon className="w-5 h-5" />
                            )}
                        </button>

                        {/* Notifications */}
                        <div className="relative" ref={notificationRef}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={cn(
                                    'p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-dark-border/50 relative transition-all duration-200 hover-lift',
                                    showNotifications
                                        ? 'bg-gray-100/80 dark:bg-dark-border/50 text-gray-700 dark:text-dark-text'
                                        : 'text-gray-500 dark:text-dark-muted'
                                )}
                            >
                                <Bell className="w-5 h-5" />
                                {hasUnread && (
                                    <Badge
                                        variant="danger"
                                        size="sm"
                                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1"
                                    >
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Badge>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 top-full mt-2 w-96 glass dark:glass-dark rounded-2xl shadow-2xl border border-gray-200/50 dark:border-dark-border/50 z-50 overflow-hidden animate-scale-in origin-top-right backdrop-blur-xl">
                                    {/* Header */}
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/50 dark:border-dark-border/50 bg-gray-50/50 dark:bg-dark-border/20">
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
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {isLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        ) : notifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <Bell className="w-10 h-10 text-gray-300 dark:text-dark-muted mb-2" />
                                                <p className="text-sm text-gray-500 dark:text-dark-muted">
                                                    No notifications yet
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                {notificationGroups.today.length > 0 && (
                                                    <div className="px-4 py-2">
                                                        <p className="text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                                                            Today
                                                        </p>
                                                    </div>
                                                )}
                                                {notificationGroups.today.map((notification) => (
                                                    <NotificationItem
                                                        key={notification.id}
                                                        notification={notification}
                                                        onMarkAsRead={handleMarkAsRead}
                                                        onNavigate={handleNotificationNavigate}
                                                    />
                                                ))}

                                                {notificationGroups.yesterday.length > 0 && (
                                                    <div className="px-4 py-2">
                                                        <p className="text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                                                            Yesterday
                                                        </p>
                                                    </div>
                                                )}
                                                {notificationGroups.yesterday.map((notification) => (
                                                    <NotificationItem
                                                        key={notification.id}
                                                        notification={notification}
                                                        onMarkAsRead={handleMarkAsRead}
                                                        onNavigate={handleNotificationNavigate}
                                                    />
                                                ))}

                                                {notificationGroups.earlier.length > 0 && (
                                                    <div className="px-4 py-2">
                                                        <p className="text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                                                            Earlier
                                                        </p>
                                                    </div>
                                                )}
                                                {notificationGroups.earlier.map((notification) => (
                                                    <NotificationItem
                                                        key={notification.id}
                                                        notification={notification}
                                                        onMarkAsRead={handleMarkAsRead}
                                                        onNavigate={handleNotificationNavigate}
                                                    />
                                                ))}
                                            </>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="px-5 py-4 border-t border-gray-100/50 dark:border-dark-border/50 bg-gray-50/50 dark:bg-dark-border/20">
                                        <button
                                            onClick={() => {
                                                setShowNotifications(false);
                                                navigate('/notifications');
                                            }}
                                            className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-all duration-200 hover-lift flex items-center justify-center gap-2"
                                        >
                                            View All Notifications
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Dropdown */}
                        <Dropdown
                            align="right"
                            width="lg"
                            trigger={
                                <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100/80 dark:hover:bg-dark-border/50 transition-all duration-200 hover-lift">
                                    <Avatar
                                        name={userName}
                                        src={user?.avatar}
                                        size="sm"
                                        status="online"
                                    />
                                </button>
                            }
                        >
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-border">
                                <p className="text-sm font-semibold text-gray-900 dark:text-dark-text">
                                    {userName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-dark-muted truncate">
                                    {user?.email}
                                </p>
                                <Badge variant="primary" size="sm" className="mt-2">
                                    {userRole}
                                </Badge>
                            </div>

                            <Dropdown.Menu>
                                <Dropdown.MenuItem
                                    icon={<User className="w-4 h-4" />}
                                    onClick={() => navigate('/profile')}
                                >
                                    Profile
                                </Dropdown.MenuItem>
                                <Dropdown.MenuItem
                                    icon={<Settings className="w-4 h-4" />}
                                    onClick={() => navigate('/settings')}
                                >
                                    Settings
                                </Dropdown.MenuItem>
                                <Dropdown.MenuItem
                                    icon={<HelpCircle className="w-4 h-4" />}
                                    onClick={() => navigate('/help')}
                                >
                                    Help & Support
                                </Dropdown.MenuItem>
                            </Dropdown.Menu>

                            <Dropdown.Divider />

                            <Dropdown.Menu>
                                <Dropdown.MenuItem
                                    icon={<LogOut className="w-4 h-4" />}
                                    onClick={handleLogout}
                                    danger
                                >
                                    Logout
                                </Dropdown.MenuItem>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </div>
            </header>

            {/* Command Palette Modal */}
            <CommandPalette
                isOpen={showCommandPalette}
                onClose={() => setShowCommandPalette(false)}
            />
        </>
    );
};

export default Navbar;
