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
} from 'lucide-react';
import { cn } from '../../utils';
import { useUIStore, useAuthStore } from '../../store';

const adminMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/workflows', icon: GitBranch, label: 'Workflows' },
    { path: '/steps', icon: ListOrdered, label: 'Steps' },
    { path: '/rules', icon: BookOpen, label: 'Rules' },
    { path: '/executions', icon: PlayCircle, label: 'Executions' },
];

const managerMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/approvals', icon: CheckSquare, label: 'My Approvals' },
    { path: '/executions', icon: PlayCircle, label: 'Execution History' },
];

const employeeMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/create-request', icon: FileText, label: 'Create Request' },
    { path: '/my-requests', icon: ClipboardList, label: 'My Requests' },
];

const Sidebar = () => {
    const { sidebarOpen, toggleSidebar } = useUIStore();
    const { user } = useAuthStore();

    const role = user?.role || 'Employee';
    const menuItems = role === 'Admin'
        ? adminMenuItems
        : role === 'Manager'
            ? managerMenuItems
            : employeeMenuItems;

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
                    'fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border transition-transform duration-300 lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-dark-border">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <GitBranch className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-dark-text">
                            Workflow
                        </span>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="p-1 rounded-lg lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
                                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                                        : 'text-gray-700 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border'
                                )
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-dark-border">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-700 dark:text-primary-400">
                                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                                {user?.name || user?.email || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-dark-muted truncate">
                                {role}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
