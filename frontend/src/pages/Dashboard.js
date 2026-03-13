import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Workflow Engine</h1>
                <div className="user-menu">
                    <span className="user-info">Welcome!</span>
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="dashboard-welcome">
                    <h2>Welcome to Workflow Engine</h2>
                    <p>You are successfully logged in.</p>
                </div>

                <div className="dashboard-cards">
                    <div className="dashboard-card">
                        <h3>Workflows</h3>
                        <p>Manage your workflows</p>
                    </div>
                    <div className="dashboard-card">
                        <h3>Executions</h3>
                        <p>View execution history</p>
                    </div>
                    <div className="dashboard-card">
                        <h3>Rules</h3>
                        <p>Configure workflow rules</p>
                    </div>
                    <div className="dashboard-card">
                        <h3>Steps</h3>
                        <p>Manage workflow steps</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
