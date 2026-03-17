import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    GitBranch,
    ListOrdered,
    BookOpen,
    PlayCircle,
    ClipboardCheck,
    CheckSquare,
    CheckCircle,
    FileText,
    Bell,
    User,
    Settings,
    ChevronLeft,
    ChevronRight,
    X,
    Plus,
} from 'lucide-react';
import { cn } from '../../utils';
import { useUIStore, useAuthStore } from '../../store';
import Avatar from '../ui/Avatar';
import Tooltip from '../ui/Tooltip';
import QuickTaskModal from '../QuickTaskModal';

// Menu groups configuration
const menuGroups = [
    {
        title: 'Core',
        items: [
            { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'manager', 'finance', 'ceo', 'employee'] },
            { label: 'Users', icon: Users, path: '/users', roles: ['admin'] },
            { label: 'Workflows', icon: GitBranch, path: '/workflows', roles: ['admin'] },
            { label: 'Steps', icon: ListOrdered, path: '/steps', roles: ['admin'] },
            { label: 'Rules', icon: BookOpen, path: '/rules', roles: ['admin'] },
        ]
    },
    {
        title: 'Management',
        items: [
            { label: 'Executions', icon: PlayCircle, path: '/executions', roles: ['admin', 'manager', 'finance', 'ceo', 'employee'] },
            { label: 'Approvals', icon: CheckSquare, path: '/approvals', roles: ['admin', 'manager', 'finance', 'ceo', 'employee'] },
            { label: 'Tasks', icon: CheckCircle, path: '/tasks', roles: ['admin', 'manager', 'finance', 'ceo', 'employee'] },
            { label: 'Requests', icon: FileText, path: '/my-requests', roles: ['admin', 'manager', 'finance', 'ceo', 'employee'] },
        ]
    },
    {
        title: 'Activity',
        items: [
            { label: 'Notifications', icon: Bell, path: '/notifications', roles: ['admin', 'manager', 'finance', 'ceo', 'employee'] },
            { label: 'Profile', icon: User, path: '/profile', roles: ['admin', 'manager', 'finance', 'ceo', 'employee'] },
        ]
    },
];

// Role-based menu items helper
const getMenuItemsForRole = (role) => {
    const filteredGroups = menuGroups.map(group => ({
        ...group,
        items: group.items.filter(item => item.roles.includes(role))
    })).filter(group => group.items.length > 0);

    return filteredGroups;
};

const Sidebar = () => {
    const { sidebarOpen, toggleSidebar, sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
    const { user, getRoleDisplayName } = useAuthStore();
    const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const location = useLocation();

    const role = user?.role || 'employee';
    const menuItems = getMenuItemsForRole(role);

    // Check for mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle close on mobile when clicking a link
    const handleNavClick = () => {
        if (isMobile) {
            toggleSidebar();
        }
    };

    // Sidebar width classes
    const sidebarWidth = sidebarCollapsed ? 'w-20' : 'w-72';
    const collapsedWidth = 'w-20';

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && isMobile && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-full transition-all duration-300 ease-out',
                    // Base styles
                    'bg-white dark:bg-dark-card border-r border-gray-200/80 dark:border-dark-border/50',
                    // Width and transform
                    isMobile
                        ? `${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-72`
                        : `${sidebarWidth} lg:translate-x-0`,
                    // Shadow
                    'shadow-xl dark:shadow-dark-bg/50',
                    // Rounded on mobile
                    isMobile && 'rounded-none'
                )}
            >
                {/* Header */}
                <div className={cn(
                    'flex items-center h-16 px-4 border-b border-gray-200/80 dark:border-dark-border/50',
                    sidebarCollapsed && !isMobile ? 'justify-center' : 'justify-between'
                )}>
                    {/* Logo */}
                    <div className={cn(
                        'flex items-center gap-3',
                        sidebarCollapsed && !isMobile ? 'justify-center w-full' : ''
                    )}>
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                            <GitBranch className="w-5 h-5 text-white" />
                        </div>
                        {(!sidebarCollapsed || isMobile) && (
                            <div className="flex flex-col">
                                <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-400 dark:to-primary-500 bg-clip-text text-transparent">
                                    Workflow
                                </span>
                                <span className="text-xs text-gray-500 dark:text-dark-muted -mt-0.5">
                                    Engine
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Mobile close button */}
                    {isMobile && (
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 dark:hover:bg-dark-border/50 transition-all duration-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className={cn(
                    'flex flex-col h-[calc(100vh-8rem)] overflow-y-auto py-4 px-3',
                    sidebarCollapsed && !isMobile ? 'px-2' : 'px-3'
                )}>
                    {menuItems.map((group, groupIndex) => (
                        <div key={group.title} className={cn(
                            groupIndex > 0 && 'mt-6'
                        )}>
                            {/* Section Header */}
                            {(!sidebarCollapsed || isMobile) && (
                                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-dark-muted uppercase tracking-wider">
                                    {group.title}
                                </h3>
                            )}

                            {/* Menu Items */}
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    const showTooltip = sidebarCollapsed && !isMobile;

                                    const linkContent = (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            onClick={handleNavClick}
                                            className={cn(
                                                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                                // Active state
                                                isActive
                                                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                                    : 'text-gray-600 dark:text-dark-muted hover:bg-gray-100/80 dark:hover:bg-dark-border/40 hover:text-gray-900 dark:hover:text-dark-text',
                                                // Collapsed state
                                                sidebarCollapsed && !isMobile && 'justify-center px-2'
                                            )}
                                        >
                                            {/* Active indicator */}
                                            {isActive && (
                                                <div className="absolute left-0 w-1 h-8 bg-primary-500 rounded-r-full" />
                                            )}

                                            {/* Icon */}
                                            <item.icon className={cn(
                                                'w-5 h-5 flex-shrink-0 transition-transform duration-200',
                                                isActive
                                                    ? 'text-primary-600 dark:text-primary-400'
                                                    : 'text-gray-400 dark:text-dark-muted group-hover:text-primary-500 dark:group-hover:text-primary-400 group-hover:scale-110',
                                                sidebarCollapsed && !isMobile && 'w-5 h-5'
                                            )} />

                                            {/* Label */}
                                            {(!sidebarCollapsed || isMobile) && (
                                                <>
                                                    <span className="flex-1 truncate">{item.label}</span>

                                                    {/* Quick add button for Tasks */}
                                                    {item.path === '/tasks' && user?.role === 'admin' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setIsQuickTaskOpen(true);
                                                            }}
                                                            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-primary-100 dark:hover:bg-primary-900/50 text-primary-600 dark:text-primary-400 transition-all duration-200"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </NavLink>
                                    );

                                    // Wrap with tooltip when collapsed
                                    if (showTooltip) {
                                        return (
                                            <Tooltip
                                                key={item.path}
                                                content={item.label}
                                                placement="right"
                                                theme="dark"
                                            >
                                                {linkContent}
                                            </Tooltip>
                                        );
                                    }

                                    return linkContent;
                                })}
                            </div>

                            {/* Section divider */}
                            {groupIndex < menuItems.length - 1 && (!sidebarCollapsed || isMobile) && (
                                <div className="mt-4 mx-3 border-t border-gray-200/60 dark:border-dark-border/40" />
                            )}
                        </div>
                    ))}
                </nav>

                {/* Footer with collapse toggle and user profile */}
                <div className={cn(
                    'absolute bottom-0 left-0 right-0 border-t border-gray-200/80 dark:border-dark-border/50',
                    'bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl'
                )}>
                    {/* Collapse toggle button (desktop only) */}
                    {!isMobile && (
                        <button
                            onClick={toggleSidebarCollapse}
                            className={cn(
                                'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-dark-text hover:bg-gray-100/80 dark:hover:bg-dark-border/40 transition-all duration-200',
                                sidebarCollapsed && 'justify-center'
                            )}
                        >
                            {sidebarCollapsed ? (
                                <ChevronRight className="w-5 h-5" />
                            ) : (
                                <>
                                    <ChevronLeft className="w-5 h-5" />
                                    <span>Collapse</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* User profile section */}
                    <div className={cn(
                        'px-3 py-3',
                        sidebarCollapsed && !isMobile ? 'px-2' : 'px-3'
                    )}>
                        <div className={cn(
                            'flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-dark-border/40 transition-all duration-200 cursor-pointer',
                            sidebarCollapsed && !isMobile && 'justify-center'
                        )}>
                            {/* Avatar */}
                            <Avatar
                                name={user?.name || user?.email}
                                size="sm"
                                className="ring-2 ring-primary-500/20 dark:ring-primary-400/20"
                            />

                            {/* User info */}
                            {(!sidebarCollapsed || isMobile) && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-dark-text truncate">
                                        {user?.name || user?.email || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-dark-muted truncate">
                                        {getRoleDisplayName()}
                                    </p>
                                </div>
                            )}

                            {/* Settings icon for collapsed state */}
                            {(!sidebarCollapsed || isMobile) && (
                                <button className="p-2 rounded-lg text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100/80 dark:hover:bg-dark-border/50 transition-all duration-200">
                                    <Settings className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Quick Task Modal */}
            <QuickTaskModal
                isOpen={isQuickTaskOpen}
                onClose={() => setIsQuickTaskOpen(false)}
            />
        </>
    );
};

export default Sidebar;
