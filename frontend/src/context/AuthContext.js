import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if user is authenticated on app load
        const initAuth = async () => {
            if (authService.isAuthenticated()) {
                try {
                    // Optionally fetch user data here if you have a user endpoint
                    // const userData = await authService.getCurrentUser();
                    // setUser(userData);
                    setUser({ authenticated: true });
                } catch (err) {
                    authService.logout();
                    setUser(null);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (username, password) => {
        try {
            setError(null);
            await authService.login(username, password);
            setUser({ authenticated: true });
            return true;
        } catch (err) {
            const message = err.response?.data?.detail || 'Login failed. Please check your credentials.';
            setError(message);
            return false;
        }
    };

    const register = async (userData) => {
        try {
            setError(null);
            await authService.register(userData);
            return true;
        } catch (err) {
            const errors = err.response?.data;
            let message = 'Registration failed.';

            if (errors) {
                // Format validation errors
                message = Object.entries(errors)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
            }

            setError(message);
            return false;
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const clearError = () => {
        setError(null);
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        isAuthenticated: !!user,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
