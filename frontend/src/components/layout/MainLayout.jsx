import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useUIStore } from '../../store';
import { cn } from '../../utils';

const MainLayout = () => {
    const { sidebarCollapsed } = useUIStore();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
            <Sidebar />

            <div
                className={cn(
                    'transition-all duration-300 ease-out',
                    'lg:pl-72',  // Default expanded width
                    sidebarCollapsed && 'lg:pl-20'  // Collapsed width
                )}
            >
                <Navbar />

                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
