import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useUIStore } from '../../store';
import { cn } from '../../utils';

// Pages that need full-screen canvas layouts (no padding)
const FULL_SCREEN_ROUTES = ['/workflow-builder'];

const MainLayout = () => {
    const { sidebarCollapsed } = useUIStore();
    const location = useLocation();
    const isFullScreen = FULL_SCREEN_ROUTES.some(r => location.pathname.startsWith(r));

    return (
        <div className={cn('bg-gray-50 dark:bg-dark-bg', isFullScreen ? 'h-screen overflow-hidden' : 'min-h-screen')}>
            <Sidebar />

            <div
                className={cn(
                    'transition-all duration-300 ease-out flex flex-col',
                    isFullScreen ? 'h-screen' : 'min-h-screen',
                    'lg:pl-72',
                    sidebarCollapsed && 'lg:pl-20'
                )}
            >
                <Navbar />

                {isFullScreen ? (
                    <div className="flex-1 overflow-hidden">
                        <Outlet />
                    </div>
                ) : (
                    <main className="p-4 lg:p-6">
                        <Outlet />
                    </main>
                )}
            </div>
        </div>
    );
};

export default MainLayout;
