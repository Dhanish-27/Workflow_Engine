import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    GitBranch,
    ListOrdered,
    BookOpen,
    PlayCircle,
    ClipboardList,
    FileText,
    CheckSquare,
    X,
    DollarSign,
    Award,
    User,
    Bell,
} from 'lucide-react';
import { cn } from '../../utils';
import { useUIStore, useAuthStore } from '../../store';

const adminMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'My Profile' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/workflows', icon: GitBranch, label: 'Workflows' },
    { path: '/steps', icon: ListOrdered, label: 'Steps' },
    { path: '/rules', icon: BookOpen, label: 'Rules' },
    { path: '/executions', icon: PlayCircle, label: 'Executions' },
    { path: '/approvals', icon: CheckSquare, label: 'Approvals' },
    { path: '/create-request', icon: FileText, label: 'Create Request' },
    { path: '/my-requests', icon: ClipboardList, label: 'My Requests' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
];

const managerMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'My Profile' },
    { path: '/approvals', icon: CheckSquare, label: 'My Approvals' },
    { path: '/executions', icon: PlayCircle, label: 'Execution History' },
    { path: '/create-request', icon: FileText, label: 'Create Request' },
    { path: '/my-requests', icon: ClipboardList, label: 'My Requests' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
];

const financeMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'My Profile' },
    { path: '/approvals', icon: DollarSign, label: 'Finance Approvals' },
    { path: '/executions', icon: PlayCircle, label: 'Execution History' },
    { path: '/create-request', icon: FileText, label: 'Create Request' },
    { path: '/my-requests', icon: ClipboardList, label: 'My Requests' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
];

const ceoMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'My Profile' },
    { path: '/approvals', icon: Award, label: 'Final Approvals' },
    { path: '/executions', icon: PlayCircle, label: 'Execution History' },
    { path: '/create-request', icon: FileText, label: 'Create Request' },
    { path: '/my-requests', icon: ClipboardList, label: 'My Requests' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
];

const employeeMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'My Profile' },
    { path: '/create-request', icon: FileText, label: 'Create Request' },
    { path: '/my-requests', icon: ClipboardList, label: 'My Requests' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
];

const Sidebar = () => {
    const { sidebarOpen, toggleSidebar } = useUIStore();
    const { user, getRoleDisplayName } = useAuthStore();

    const role = user?.role || 'employee';

    // Get menu items based on role
    let menuItems;
    switch (role) {
        case 'admin':
            menuItems = adminMenuItems;
            break;
        case 'manager':
            menuItems = managerMenuItems;
            break;
        case 'finance':
            menuItems = financeMenuItems;
            break;
        case 'ceo':
            menuItems = ceoMenuItems;
            break;
        default:
            menuItems = employeeMenuItems;
    }

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-full w-64 glass dark:glass-dark border-r border-gray-200/50 dark:border-dark-border/50 transition-transform duration-300 ease-out lg:translate-x-0 backdrop-blur-xl',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200/50 dark:border-dark-border/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/30">
                            <GitBranch className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-dark-text">
                            Workflow
                        </span>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-lg lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 dark:hover:bg-dark-border/50 transition-all duration-200 hover-lift"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                                        : 'text-gray-700 dark:text-dark-muted hover:bg-gray-100/80 dark:hover:bg-dark-border/50 hover-lift'
                                )
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/50 dark:border-dark-border/50 bg-gray-50/30 dark:bg-dark-border/20">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-dark-border/50 transition-all duration-200 hover-lift">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                            <span className="text-xs font-medium text-white">
                                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                                {user?.name || user?.email || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-dark-muted truncate">
                                {getRoleDisplayName()}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
