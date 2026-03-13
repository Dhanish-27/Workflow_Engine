import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore, useUIStore } from './store';
import { MainLayout } from './components/layout';
import PrivateRoute from './components/PrivateRoute';
import {
    Login,
    Register,
    Dashboard,
    Users,
    Workflows,
    WorkflowConfigure,
    Executions,
    Approvals,
    CreateRequest,
    MyRequests,
} from './pages';

function App() {
    const { isAuthenticated, user } = useAuthStore();
    const { darkMode } = useUIStore();

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    // Get the initial redirect path based on role
    const getDefaultPath = () => {
        if (!user) return '/login';
        switch (user.role) {
            case 'Admin':
                return '/dashboard';
            case 'Manager':
                return '/approvals';
            case 'Employee':
                return '/dashboard';
            default:
                return '/dashboard';
        }
    };

    return (
        <Router>
            <Toaster position="top-right" />
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes with MainLayout */}
                <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
                    {/* Dashboard - All roles */}
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* Admin Routes */}
                    <Route path="/users" element={
                        <PrivateRoute allowedRoles={['Admin']}>
                            <Users />
                        </PrivateRoute>
                    } />
                    <Route path="/workflows" element={
                        <PrivateRoute allowedRoles={['Admin']}>
                            <Workflows />
                        </PrivateRoute>
                    } />
                    <Route path="/workflows/:id/configure" element={
                        <PrivateRoute allowedRoles={['Admin']}>
                            <WorkflowConfigure />
                        </PrivateRoute>
                    } />
                    <Route path="/steps" element={
                        <PrivateRoute allowedRoles={['Admin']}>
                            <Workflows />
                        </PrivateRoute>
                    } />
                    <Route path="/rules" element={
                        <PrivateRoute allowedRoles={['Admin']}>
                            <Workflows />
                        </PrivateRoute>
                    } />
                    <Route path="/executions" element={
                        <PrivateRoute allowedRoles={['Admin', 'Manager']}>
                            <Executions />
                        </PrivateRoute>
                    } />

                    {/* Manager Routes */}
                    <Route path="/approvals" element={
                        <PrivateRoute allowedRoles={['Manager']}>
                            <Approvals />
                        </PrivateRoute>
                    } />

                    {/* Employee Routes */}
                    <Route path="/create-request" element={
                        <PrivateRoute allowedRoles={['Employee']}>
                            <CreateRequest />
                        </PrivateRoute>
                    } />
                    <Route path="/my-requests" element={
                        <PrivateRoute allowedRoles={['Employee']}>
                            <MyRequests />
                        </PrivateRoute>
                    } />
                </Route>

                {/* Default redirects */}
                <Route path="/" element={<Navigate to={getDefaultPath()} replace />} />
                <Route path="*" element={<Navigate to={getDefaultPath()} replace />} />
            </Routes>
        </Router>
    );
}

export default App;
