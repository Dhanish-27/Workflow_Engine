import { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, Shield, Calendar } from 'lucide-react';
import { authAPI } from '../services/api';
import { Card } from '../components/ui';
import { formatDateTime } from '../utils';

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            const response = await authAPI.me();
            setUserData(response.data);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile data');
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleDisplayName = (role) => {
        const roleNames = {
            admin: 'Administrator',
            manager: 'Manager',
            finance: 'Finance',
            ceo: 'CEO',
            employee: 'Employee',
        };
        return roleNames[role] || role;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                    My Profile
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-dark-muted">
                    View your account information
                </p>
            </div>

            {/* Profile Card */}
            <Card className="max-w-4xl">
                <div className="p-6">
                    {/* Profile Header */}
                    <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-dark-border">
                        <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <span className="text-3xl font-bold text-primary-700 dark:text-primary-400">
                                {userData?.first_name?.charAt(0) || userData?.email?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text">
                                {userData?.first_name} {userData?.last_name}
                            </h2>
                            <p className="text-gray-500 dark:text-dark-muted">
                                {userData?.email}
                            </p>
                            <span className="inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                                {getRoleDisplayName(userData?.role)}
                            </span>
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="py-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-4">
                            Account Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* First Name */}
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-gray-100 dark:bg-dark-border rounded-lg">
                                    <User className="w-5 h-5 text-gray-500 dark:text-dark-muted" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-dark-muted">
                                        First Name
                                    </p>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-dark-text">
                                        {userData?.first_name || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Last Name */}
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-gray-100 dark:bg-dark-border rounded-lg">
                                    <User className="w-5 h-5 text-gray-500 dark:text-dark-muted" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-dark-muted">
                                        Last Name
                                    </p>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-dark-text">
                                        {userData?.last_name || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-gray-100 dark:bg-dark-border rounded-lg">
                                    <Mail className="w-5 h-5 text-gray-500 dark:text-dark-muted" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-dark-muted">
                                        Email Address
                                    </p>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-dark-text">
                                        {userData?.email || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-gray-100 dark:bg-dark-border rounded-lg">
                                    <Phone className="w-5 h-5 text-gray-500 dark:text-dark-muted" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-dark-muted">
                                        Phone Number
                                    </p>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-dark-text">
                                        {userData?.phone || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Department */}
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-gray-100 dark:bg-dark-border rounded-lg">
                                    <Building2 className="w-5 h-5 text-gray-500 dark:text-dark-muted" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-dark-muted">
                                        Department
                                    </p>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-dark-text">
                                        {userData?.department || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Role */}
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-gray-100 dark:bg-dark-border rounded-lg">
                                    <Shield className="w-5 h-5 text-gray-500 dark:text-dark-muted" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-dark-muted">
                                        Role
                                    </p>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-dark-text">
                                        {getRoleDisplayName(userData?.role)}
                                    </p>
                                </div>
                            </div>

                            {/* Account Status */}
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-gray-100 dark:bg-dark-border rounded-lg">
                                    <Shield className="w-5 h-5 text-gray-500 dark:text-dark-muted" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-dark-muted">
                                        Account Status
                                    </p>
                                    <p className="mt-1 text-sm">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userData?.is_active
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                            }`}>
                                            {userData?.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Created At */}
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-gray-100 dark:bg-dark-border rounded-lg">
                                    <Calendar className="w-5 h-5 text-gray-500 dark:text-dark-muted" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-dark-muted">
                                        Member Since
                                    </p>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-dark-text">
                                        {userData?.created_at ? formatDateTime(userData.created_at) : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notice */}
                    <div className="pt-6 border-t border-gray-200 dark:border-dark-border">
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                <strong>Note:</strong> To update your profile information, please contact your system administrator.
                            </p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Profile;
