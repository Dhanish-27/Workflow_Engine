import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    GitBranch,
    PlayCircle,
    CheckCircle,
    XCircle,
    Clock,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { useAuthStore } from '../store';
import { Card } from '../components/ui';
import { executionsAPI, dashboardAPI } from '../services/api';
import { formatDateTime } from '../utils';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalWorkflows: 0,
        runningExecutions: 0,
        completedExecutions: 0,
        failedExecutions: 0,
    });
    const [chartData, setChartData] = useState([]);
    const [recentExecutions, setRecentExecutions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const role = user?.role;

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch dashboard stats
            const statsResponse = await dashboardAPI.stats();
            const statsData = statsResponse.data;

            // Fetch chart data
            const chartResponse = await dashboardAPI.chartData();
            const chartDataFromApi = chartResponse.data;

            // Fetch recent executions
            const recentResponse = await dashboardAPI.recentExecutions();
            const executions = recentResponse.data || [];

            setStats({
                totalUsers: statsData.total_users,
                totalWorkflows: statsData.total_workflows,
                runningExecutions: statsData.running_executions,
                completedExecutions: statsData.completed_executions,
                failedExecutions: statsData.failed_executions,
            });

            setChartData(chartDataFromApi);
            setRecentExecutions(executions);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Fallback: try to fetch executions directly
            try {
                const response = await executionsAPI.list({ page_size: 10 });
                const executions = response.data.results || response.data;

                const running = executions.filter(e => e.status === 'running' || e.status === 'in_progress').length;
                const completed = executions.filter(e => e.status === 'completed').length;
                const failed = executions.filter(e => e.status === 'failed').length;

                setStats(prev => ({
                    ...prev,
                    runningExecutions: running,
                    completedExecutions: completed,
                    failedExecutions: failed,
                }));
                setRecentExecutions(executions);
            } catch (execError) {
                console.error('Error fetching executions:', execError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            color: 'bg-blue-500',
            path: '/users'
        },
        {
            title: 'Total Workflows',
            value: stats.totalWorkflows,
            icon: GitBranch,
            color: 'bg-purple-500',
            path: '/workflows'
        },
        {
            title: 'Running',
            value: stats.runningExecutions,
            icon: Clock,
            color: 'bg-yellow-500',
            path: '/executions'
        },
        {
            title: 'Completed',
            value: stats.completedExecutions,
            icon: CheckCircle,
            color: 'bg-green-500',
            path: '/executions'
        },
        {
            title: 'Failed',
            value: stats.failedExecutions,
            icon: XCircle,
            color: 'bg-red-500',
            path: '/executions'
        },
    ];

    const pieData = [
        { name: 'Completed', value: stats.completedExecutions, color: '#10B981' },
        { name: 'Running', value: stats.runningExecutions, color: '#F59E0B' },
        { name: 'Failed', value: stats.failedExecutions, color: '#EF4444' },
    ];

    const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

    if (role === 'employee') {
        return <EmployeeDashboard />;
    }

    if (role === 'manager') {
        return <ManagerDashboard />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                    Dashboard
                </h1>
                <p className="text-gray-500 dark:text-dark-muted mt-1">
                    Welcome back! Here's an overview of your workflow system.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {statCards.map((stat) => (
                    <Card
                        key={stat.title}
                        className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(stat.path)}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-dark-muted">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                                    {stat.value}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Workflow Executions (Last 7 Days)">
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-dark-border" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#f8fafc'
                                    }}
                                />
                                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="failed" name="Failed" fill="#EF4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card title="Execution Status">
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Recent Executions */}
            <Card title="Recent Executions">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-dark-border">
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-dark-muted uppercase">
                                    ID
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-dark-muted uppercase">
                                    Workflow
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-dark-muted uppercase">
                                    Status
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-dark-muted uppercase">
                                    Triggered By
                                </th>
                                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-dark-muted uppercase">
                                    Started
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                            {recentExecutions.slice(0, 5).map((execution) => (
                                <tr
                                    key={execution.id}
                                    className="hover:bg-gray-50 dark:hover:bg-dark-border cursor-pointer"
                                    onClick={() => navigate(`/executions/${execution.id}`)}
                                >
                                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">
                                        #{execution.id}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-dark-text">
                                        {execution.workflow_name || execution.workflow || '-'}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${execution.status === 'completed'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : execution.status === 'failed'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                : execution.status === 'running' || execution.status === 'in_progress'
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    : execution.status === 'pending'
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                            }`}>
                                            {execution.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-dark-muted">
                                        {execution.triggered_by_name || execution.triggered_by || '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-500 dark:text-dark-muted">
                                        {formatDateTime(execution.started_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

// Employee Dashboard
const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [userStats, setUserStats] = useState({ pending: 0, completed: 0, in_progress: 0, failed: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUserStats();
    }, []);

    const fetchUserStats = async () => {
        try {
            const response = await dashboardAPI.userStats();
            setUserStats(response.data);
        } catch (error) {
            console.error('Error fetching user stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                    Welcome, {user?.name || 'User'}!
                </h1>
                <p className="text-gray-500 dark:text-dark-muted mt-1">
                    Manage your workflow requests and track progress.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card
                    className="p-6 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate('/create-request')}
                >
                    <div className="text-center">
                        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1">
                            Create Request
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-dark-muted">
                            Start a new workflow request
                        </p>
                    </div>
                </Card>

                <Card
                    className="p-6 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate('/my-requests')}
                >
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <GitBranch className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1">
                            My Requests
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-dark-muted">
                            View your submitted requests
                        </p>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1">
                            Quick Stats
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-dark-muted">
                            {userStats.pending} pending • {userStats.completed} completed
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// Manager Dashboard
const ManagerDashboard = () => {
    const navigate = useNavigate();
    const [managerStats, setManagerStats] = useState({ pending_approvals: 0, approved_this_week: 0, rejected_this_week: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchManagerStats();
    }, []);

    const fetchManagerStats = async () => {
        try {
            const response = await dashboardAPI.managerStats();
            setManagerStats(response.data);
        } catch (error) {
            console.error('Error fetching manager stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                    Manager Dashboard
                </h1>
                <p className="text-gray-500 dark:text-dark-muted mt-1">
                    Review and manage approval requests.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card
                    className="p-6 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate('/approvals')}
                >
                    <div className="text-center">
                        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1">
                            Pending Approvals
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-dark-muted">
                            {managerStats.pending_approvals} requests waiting
                        </p>
                    </div>
                </Card>

                <Card
                    className="p-6 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate('/executions')}
                >
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <PlayCircle className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1">
                            Execution History
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-dark-muted">
                            View all executions
                        </p>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1">
                            This Week
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-dark-muted">
                            {managerStats.approved_this_week} approved • {managerStats.rejected_this_week} rejected
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
