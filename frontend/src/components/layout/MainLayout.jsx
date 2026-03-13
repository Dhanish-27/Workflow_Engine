import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
            <Sidebar />

            <div className="lg:pl-64">
                <Navbar />

                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
