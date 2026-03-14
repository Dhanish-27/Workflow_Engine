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
    Profile,
    Users,
    Workflows,
    WorkflowConfigure,
    Steps,
    Rules,
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
            case 'admin':
                return '/dashboard';
            case 'manager':
                return '/approvals';
            case 'finance':
                return '/approvals';
            case 'ceo':
                return '/approvals';
            case 'employee':
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

                    {/* Profile - All authenticated users */}
                    <Route path="/profile" element={<Profile />} />

                    {/* Admin Routes - Full system control */}
                    <Route path="/users" element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <Users />
                        </PrivateRoute>
                    } />
                    <Route path="/workflows" element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <Workflows />
                        </PrivateRoute>
                    } />
                    <Route path="/workflows/:id/configure" element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <WorkflowConfigure />
                        </PrivateRoute>
                    } />
                    <Route path="/steps" element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <Steps />
                        </PrivateRoute>
                    } />
                    <Route path="/rules" element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <Rules />
                        </PrivateRoute>
                    } />
                    <Route path="/executions" element={
                        <PrivateRoute allowedRoles={['admin', 'manager', 'finance', 'ceo']}>
                            <Executions />
                        </PrivateRoute>
                    } />

                    {/* Approval Routes - Manager, Finance, CEO, Admin */}
                    <Route path="/approvals" element={
                        <PrivateRoute allowedRoles={['manager', 'finance', 'ceo', 'admin']}>
                            <Approvals />
                        </PrivateRoute>
                    } />

                    {/* Request Routes - All authenticated users can create requests */}
                    <Route path="/create-request" element={
                        <PrivateRoute allowedRoles={['employee', 'manager', 'admin', 'ceo', 'finance']}>
                            <CreateRequest />
                        </PrivateRoute>
                    } />
                    <Route path="/my-requests" element={
                        <PrivateRoute allowedRoles={['employee', 'manager', 'admin', 'ceo', 'finance']}>
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
