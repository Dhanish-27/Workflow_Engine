import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Menu,
    Bell,
    Moon,
    Sun,
    LogOut,
    User,
    Settings,
} from 'lucide-react';
import { useUIStore, useAuthStore } from '../../store';
import { cn } from '../../utils';

const Navbar = () => {
    const navigate = useNavigate();
    const { toggleSidebar, darkMode, toggleDarkMode } = useUIStore();
    const { user, logout } = useAuthStore();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
            <div className="flex items-center justify-between h-full px-4 lg:px-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-dark-muted dark:hover:bg-dark-border"
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
                        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-dark-muted dark:hover:bg-dark-border"
                    >
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-dark-muted dark:hover:bg-dark-border relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border"
                        >
                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
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
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border py-2 z-50">
                                    <div className="px-4 py-2 border-b border-gray-100 dark:border-dark-border">
                                        <p className="text-sm font-medium text-gray-900 dark:text-dark-text">
                                            {user?.first_name ? `${user.first_name} ${user.last_name}` : 'User'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-dark-muted">
                                            {user?.email}
                                        </p>
                                    </div>

                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                navigate('/profile');
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border"
                                        >
                                            <User className="w-4 h-4" />
                                            Profile
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                navigate('/settings');
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </button>
                                    </div>

                                    <div className="border-t border-gray-100 dark:border-dark-border pt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-dark-border"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
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
