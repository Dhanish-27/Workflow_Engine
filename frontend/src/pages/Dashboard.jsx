import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    GitBranch,
    PlayCircle,
    CheckCircle,
    XCircle,
    Clock,
    Zap,
    Plus,
    FileText,
    ListChecks,
    Eye,
    ArrowUpRight,
    ArrowRight,
    Bell,
    TrendingUp,
    Activity,
    Calendar,
    Award,
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
    Area,
    AreaChart,
} from 'recharts';
import { useAuthStore } from '../store';
import { Card, Button, Badge, Avatar, Skeleton, Progress } from '../components/ui';
import { executionsAPI, dashboardAPI, approvalsAPI } from '../services/api';
import { formatDateTime, formatRelativeTime } from '../utils';

// Animation keyframes for custom animations
const animationStyles = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-10px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    .animate-fade-in-up {
        animation: fadeInUp 0.5s ease-out forwards;
    }
    .animate-pulse-slow {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    .animate-slide-in {
        animation: slideIn 0.3s ease-out forwards;
    }
    .delay-100 { animation-delay: 0.1s; }
    .delay-200 { animation-delay: 0.2s; }
    .delay-300 { animation-delay: 0.3s; }
    .delay-400 { animation-delay: 0.4s; }
    .delay-500 { animation-delay: 0.5s; }
`;

// Custom Tooltip for Bar Chart
const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-900 dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg p-3 shadow-lg">
                <p className="text-gray-200 font-medium mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-gray-400">{entry.name}:</span>
                        <span className="text-white font-medium">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, path, onClick, delay = 0 }) => {
    const colorClasses = {
        indigo: { bg: 'bg-indigo-500', light: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' },
        violet: { bg: 'bg-violet-500', light: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400' },
        blue: { bg: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
        amber: { bg: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
        emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
        rose: { bg: 'bg-rose-500', light: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400' },
    };

    const colors = colorClasses[color] || colorClasses.indigo;
    const isPulsing = color === 'blue';

    return (
        <div
            className={`animate-fade-in-up opacity-0 delay-${delay * 100}`}
            style={{ animationDelay: `${delay * 0.1}s` }}
        >
            <Card
                className="p-5 cursor-pointer group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border border-gray-100 dark:border-dark-border"
                onClick={() => onClick && onClick(path)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${colors.light} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className={`w-6 h-6 ${colors.text} ${isPulsing ? 'animate-pulse-slow' : ''}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-dark-muted">{title}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-dark-text mt-1">
                                {value?.toLocaleString() || 0}
                            </p>
                        </div>
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 text-xs font-medium ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                            {trendValue}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

// Quick Action Button Component
const QuickAction = ({ icon: Icon, title, description, color, path, onClick, delay = 0 }) => {
    const colorClasses = {
        primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40',
        violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40',
    };

    return (
        <div
            className={`animate-fade-in-up opacity-0 delay-${delay * 100}`}
            style={{ animationDelay: `${delay * 0.1}s` }}
        >
            <Card
                className="p-4 cursor-pointer group hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-dark-border"
                onClick={() => onClick && onClick(path)}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-dark-text truncate">
                            {title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-dark-muted truncate">
                            {description}
                        </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
            </Card>
        </div>
    );
};

// Activity Item Component
const ActivityItem = ({ icon: Icon, title, description, timestamp, status, color, delay = 0 }) => {
    const statusColors = {
        completed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
        failed: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
        running: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
        approved: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
        rejected: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
    };

    return (
        <div
            className={`animate-slide-in opacity-0 flex items-start gap-3 py-3 px-2 hover:bg-gray-50 dark:hover:bg-dark-border rounded-lg transition-colors cursor-pointer`}
            style={{ animationDelay: `${delay * 0.05}s` }}
        >
            <div className={`w-8 h-8 rounded-full ${statusColors[status] || 'bg-gray-100 dark:bg-gray-800'} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                    {title}
                </p>
                <p className="text-xs text-gray-500 dark:text-dark-muted truncate">
                    {description}
                </p>
            </div>
            <span className="text-xs text-gray-400 dark:text-dark-muted whitespace-nowrap">
                {timestamp}
            </span>
        </div>
    );
};

// Main Dashboard Component
const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalWorkflows: 0,
        runningExecutions: 0,
        pendingExecutions: 0,
        completedExecutions: 0,
        failedExecutions: 0,
    });
    const [chartData, setChartData] = useState([]);
    const [recentExecutions, setRecentExecutions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('7');

    const role = user?.role;

    useEffect(() => {
        fetchDashboardData();
    }, [timeFilter]);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            // Fetch dashboard stats
            const statsResponse = await dashboardAPI.stats();
            const statsData = statsResponse.data;

            // Fetch chart data with time filter
            const chartResponse = await dashboardAPI.chartData();
            let chartDataFromApi = chartResponse.data;

            // Filter chart data based on time filter
            if (timeFilter === '7') {
                chartDataFromApi = chartDataFromApi.slice(-7);
            } else if (timeFilter === '30') {
                chartDataFromApi = chartDataFromApi.slice(-30);
            } else if (timeFilter === '90') {
                chartDataFromApi = chartDataFromApi.slice(-90);
            }

            // Fetch recent executions
            const recentResponse = await dashboardAPI.recentExecutions();
            const executions = recentResponse.data || [];

            setStats({
                totalUsers: statsData.total_users,
                totalWorkflows: statsData.total_workflows,
                runningExecutions: statsData.running_executions,
                pendingExecutions: statsData.pending_executions,
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
                const pending = executions.filter(e => e.status === 'pending').length;
                const completed = executions.filter(e => e.status === 'completed').length;
                const failed = executions.filter(e => e.status === 'failed').length;

                setStats(prev => ({
                    ...prev,
                    runningExecutions: running,
                    pendingExecutions: pending,
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

    // Generate pie data for donut chart
    const pieData = useMemo(() => [
        { name: 'Completed', value: stats.completedExecutions, color: '#10B981' },
        { name: 'Running', value: stats.runningExecutions, color: '#3B82F6' },
        { name: 'Pending', value: stats.pendingExecutions, color: '#F59E0B' },
        { name: 'Failed', value: stats.failedExecutions, color: '#EF4444' },
    ], [stats]);

    const totalExecutions = pieData.reduce((sum, item) => sum + item.value, 0);
    const completionRate = totalExecutions > 0
        ? ((stats.completedExecutions / totalExecutions) * 100).toFixed(1)
        : 0;

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Format current date
    const formatCurrentDate = () => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Get role badge color
    const getRoleBadge = () => {
        const roleColors = {
            admin: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400' },
            manager: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
            employee: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
        };
        const colors = roleColors[role] || roleColors.employee;
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                <Award className="w-3 h-3 mr-1" />
                {role?.charAt(0).toUpperCase() + role?.slice(1)}
            </span>
        );
    };

    // Build activity feed from recent executions
    const activityFeed = useMemo(() => {
        return recentExecutions.slice(0, 8).map(exec => ({
            id: exec.id,
            icon: exec.status === 'completed' ? CheckCircle : exec.status === 'failed' ? XCircle : exec.status === 'running' ? PlayCircle : Clock,
            title: exec.workflow_name || exec.workflow || `Execution #${exec.id}`,
            description: `Triggered by ${exec.triggered_by_name || exec.triggered_by || 'System'}`,
            timestamp: formatRelativeTime(exec.started_at),
            status: exec.status,
        }));
    }, [recentExecutions]);

    if (role === 'employee') {
        return <EmployeeDashboard />;
    }

    if (role === 'manager') {
        return <ManagerDashboard />;
    }

    return (
        <div className="space-y-6">
            <style>{animationStyles}</style>

            {/* Welcome Section */}
            <div className="animate-fade-in-up">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text">
                                {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
                            </h1>
                            {getRoleBadge()}
                        </div>
                        <p className="text-gray-500 dark:text-dark-muted flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatCurrentDate()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    color="indigo"
                    trend="up"
                    trendValue="+12 this week"
                    path="/users"
                    onClick={navigate}
                    delay={0}
                />
                <StatCard
                    title="Workflows"
                    value={stats.totalWorkflows}
                    icon={GitBranch}
                    color="violet"
                    trend="up"
                    trendValue="+5 this month"
                    path="/workflows"
                    onClick={navigate}
                    delay={1}
                />
                <StatCard
                    title="Running"
                    value={stats.runningExecutions}
                    icon={PlayCircle}
                    color="blue"
                    trend="up"
                    trendValue="Active now"
                    path="/executions"
                    onClick={navigate}
                    delay={2}
                />
                <StatCard
                    title="Pending"
                    value={stats.pendingExecutions}
                    icon={Clock}
                    color="amber"
                    path="/executions"
                    onClick={navigate}
                    delay={3}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Completed"
                    value={stats.completedExecutions}
                    icon={CheckCircle}
                    color="emerald"
                    trend="up"
                    trendValue="+23% this week"
                    path="/executions"
                    onClick={navigate}
                    delay={4}
                />
                <StatCard
                    title="Failed"
                    value={stats.failedExecutions}
                    icon={XCircle}
                    color="rose"
                    path="/executions"
                    onClick={navigate}
                    delay={5}
                />
            </div>

            {/* Quick Actions Section */}
            <div className="animate-fade-in-up opacity-0 delay-300">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                        Quick Actions
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <QuickAction
                        icon={Plus}
                        title="Create Workflow"
                        description="Start a new workflow"
                        color="primary"
                        path="/workflows/create"
                        onClick={navigate}
                        delay={0}
                    />
                    <QuickAction
                        icon={ListChecks}
                        title="Assign Task"
                        description="Assign a new task"
                        color="blue"
                        path="/tasks"
                        onClick={navigate}
                        delay={1}
                    />
                    <QuickAction
                        icon={FileText}
                        title="New Request"
                        description="Submit a request"
                        color="violet"
                        path="/create-request"
                        onClick={navigate}
                        delay={2}
                    />
                    <QuickAction
                        icon={Eye}
                        title="View Executions"
                        description="See all executions"
                        color="emerald"
                        path="/executions"
                        onClick={navigate}
                        delay={3}
                    />
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="animate-fade-in-up opacity-0 delay-400">
                    <Card
                        title="Workflow Executions"
                        className="h-full"
                        headerAction={
                            <div className="flex gap-1 bg-gray-100 dark:bg-dark-border rounded-lg p-1">
                                {['7', '30', '90'].map((days) => (
                                    <button
                                        key={days}
                                        onClick={() => setTimeFilter(days)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeFilter === days
                                            ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text shadow-sm'
                                            : 'text-gray-500 dark:text-dark-muted hover:text-gray-900 dark:hover:text-dark-text'
                                            }`}
                                    >
                                        {days}d
                                    </button>
                                ))}
                            </div>
                        }
                    >
                        {isLoading ? (
                            <div className="h-72 flex items-center justify-center">
                                <Skeleton variant="rectangular" width="100%" height={280} className="rounded-lg" />
                            </div>
                        ) : (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.2} />
                                            </linearGradient>
                                            <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.2} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-dark-border" vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 11, fill: '#9CA3AF' }}
                                            tickFormatter={(value) => {
                                                const date = new Date(value);
                                                return timeFilter === '7'
                                                    ? date.toLocaleDateString('en-US', { weekday: 'short' })
                                                    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                            }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: '#9CA3AF' }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomBarTooltip />} />
                                        <Bar
                                            dataKey="completed"
                                            name="Completed"
                                            fill="url(#completedGradient)"
                                            radius={[4, 4, 0, 0]}
                                            animationDuration={1000}
                                        />
                                        <Bar
                                            dataKey="failed"
                                            name="Failed"
                                            fill="url(#failedGradient)"
                                            radius={[4, 4, 0, 0]}
                                            animationDuration={1000}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Donut Chart */}
                <div className="animate-fade-in-up opacity-0 delay-500">
                    <Card title="Execution Status" className="h-full">
                        {isLoading ? (
                            <div className="h-72 flex items-center justify-center">
                                <Skeleton variant="rectangular" width={280} height={280} className="rounded-full" />
                            </div>
                        ) : (
                            <div className="h-72 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="value"
                                            animationDuration={800}
                                            animationBegin={200}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                    stroke="transparent"
                                                    style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))' }}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                                border: 'none',
                                                borderRadius: '8px',
                                                color: '#F3F4F6',
                                                padding: '8px 12px',
                                            }}
                                            itemStyle={{ color: '#F3F4F6' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Label */}
                                <div className="absolute flex flex-col items-center pointer-events-none">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-dark-text">
                                        {completionRate}%
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-dark-muted">
                                        Success Rate
                                    </span>
                                </div>
                            </div>
                        )}
                        {/* Legend */}
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {pieData.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-gray-600 dark:text-dark-muted">{item.name}</span>
                                    <span className="font-medium text-gray-900 dark:text-dark-text ml-auto">
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="animate-fade-in-up opacity-0 delay-500">
                <Card
                    title="Recent Activity"
                    className="h-full"
                    headerAction={
                        <button
                            onClick={() => navigate('/executions')}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                        >
                            View All
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    }
                >
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-3 py-3">
                                    <Skeleton variant="circular" width={32} height={32} />
                                    <div className="flex-1">
                                        <Skeleton variant="text" width="60%" />
                                        <Skeleton variant="text" width="40%" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-dark-border -mx-2 px-2">
                            {activityFeed.length > 0 ? (
                                activityFeed.map((activity, index) => (
                                    <ActivityItem
                                        key={activity.id}
                                        {...activity}
                                        delay={index}
                                    />
                                ))
                            ) : (
                                <div className="py-8 text-center text-gray-500 dark:text-dark-muted">
                                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No recent activity</p>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

// Employee Dashboard
const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [userStats, setUserStats] = useState({ pending: 0, completed: 0, in_progress: 0, failed: 0 });
    const [recentRequests, setRecentRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const [statsRes, requestsRes] = await Promise.all([
                dashboardAPI.userStats(),
                executionsAPI.list({ page_size: 5 })
            ]);
            setUserStats(statsRes.data);
            setRecentRequests(requestsRes.data.results || requestsRes.data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formatCurrentDate = () => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Calculate completion percentage
    const totalTasks = userStats.pending + userStats.completed + userStats.in_progress + userStats.failed;
    const completionPercentage = totalTasks > 0 ? Math.round((userStats.completed / totalTasks) * 100) : 0;

    return (
        <div className="space-y-6">
            <style>{animationStyles}</style>

            {/* Welcome Section */}
            <div className="animate-fade-in-up">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text">
                        {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
                    </h1>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        <Award className="w-3 h-3 mr-1" />
                        Employee
                    </span>
                </div>
                <p className="text-gray-500 dark:text-dark-muted flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatCurrentDate()}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Pending Tasks"
                    value={userStats.pending}
                    icon={Clock}
                    color="amber"
                    delay={0}
                />
                <StatCard
                    title="In Progress"
                    value={userStats.in_progress}
                    icon={PlayCircle}
                    color="blue"
                    delay={1}
                />
                <StatCard
                    title="Completed"
                    value={userStats.completed}
                    icon={CheckCircle}
                    color="emerald"
                    trend="up"
                    trendValue="Great work!"
                    delay={2}
                />
                <StatCard
                    title="Failed"
                    value={userStats.failed}
                    icon={XCircle}
                    color="rose"
                    delay={3}
                />
            </div>

            {/* Progress Overview */}
            <div className="animate-fade-in-up opacity-0 delay-200">
                <Card title="Your Progress" className="h-full">
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24">
                            <svg className="w-24 h-24 transform -rotate-90">
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className="text-gray-200 dark:text-dark-border"
                                />
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={`${completionPercentage * 2.51} 251`}
                                    strokeLinecap="round"
                                    className="text-emerald-500"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl font-bold text-gray-900 dark:text-dark-text">
                                    {completionPercentage}%
                                </span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-2">
                                Task Completion Rate
                            </h3>
                            <p className="text-gray-500 dark:text-dark-muted mb-4">
                                You've completed {userStats.completed} out of {totalTasks} tasks
                            </p>
                            <Progress
                                value={completionPercentage}
                                className="h-2"
                                color="emerald"
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="animate-fade-in-up opacity-0 delay-300">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <QuickAction
                        icon={Plus}
                        title="Create Request"
                        description="Start a new workflow request"
                        color="primary"
                        path="/create-request"
                        onClick={navigate}
                        delay={0}
                    />
                    <QuickAction
                        icon={FileText}
                        title="My Requests"
                        description="View your submitted requests"
                        color="blue"
                        path="/my-requests"
                        onClick={navigate}
                        delay={1}
                    />
                    <QuickAction
                        icon={Activity}
                        title="All Executions"
                        description="Track your executions"
                        color="violet"
                        path="/executions"
                        onClick={navigate}
                        delay={2}
                    />
                </div>
            </div>

            {/* Recent Requests */}
            <div className="animate-fade-in-up opacity-0 delay-400">
                <Card
                    title="Recent Requests"
                    headerAction={
                        <button
                            onClick={() => navigate('/my-requests')}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1"
                        >
                            View All
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    }
                >
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3 py-3">
                                    <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
                                    <div className="flex-1">
                                        <Skeleton variant="text" width="60%" />
                                        <Skeleton variant="text" width="40%" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recentRequests.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-dark-border -mx-2 px-2">
                            {recentRequests.map((request, index) => (
                                <div
                                    key={request.id}
                                    className="flex items-center gap-4 py-3 px-2 hover:bg-gray-50 dark:hover:bg-dark-border rounded-lg transition-colors cursor-pointer"
                                    onClick={() => navigate(`/executions/${request.id}`)}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${request.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                        request.status === 'failed' ? 'bg-rose-100 dark:bg-rose-900/30' :
                                            request.status === 'running' || request.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                                'bg-amber-100 dark:bg-amber-900/30'
                                        }`}>
                                        {request.status === 'completed' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> :
                                            request.status === 'failed' ? <XCircle className="w-5 h-5 text-rose-600" /> :
                                                request.status === 'running' || request.status === 'in_progress' ? <PlayCircle className="w-5 h-5 text-blue-600" /> :
                                                    <Clock className="w-5 h-5 text-amber-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                                            {request.workflow_name || request.workflow || `Request #${request.id}`}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-dark-muted">
                                            {formatRelativeTime(request.started_at)}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={
                                            request.status === 'completed' ? 'success' :
                                                request.status === 'failed' ? 'error' :
                                                    request.status === 'running' || request.status === 'in_progress' ? 'info' :
                                                        'warning'
                                        }
                                        size="sm"
                                    >
                                        {request.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500 dark:text-dark-muted">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No requests yet</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

// Manager Dashboard
const ManagerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [managerStats, setManagerStats] = useState({
        pending_approvals: 0,
        approved_this_week: 0,
        rejected_this_week: 0,
        total_executions: 0,
        active_users: 0
    });
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchManagerData();
    }, []);

    const fetchManagerData = async () => {
        try {
            const [statsRes, approvalsRes] = await Promise.all([
                dashboardAPI.managerStats(),
                approvalsAPI.list({ status: 'pending', page_size: 5 })
            ]);
            setManagerStats(statsRes.data);
            setPendingApprovals(approvalsRes.data.results || approvalsRes.data);
        } catch (error) {
            console.error('Error fetching manager data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formatCurrentDate = () => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Calculate approval rate
    const totalDecisions = managerStats.approved_this_week + managerStats.rejected_this_week;
    const approvalRate = totalDecisions > 0
        ? Math.round((managerStats.approved_this_week / totalDecisions) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <style>{animationStyles}</style>

            {/* Welcome Section */}
            <div className="animate-fade-in-up">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text">
                        {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
                    </h1>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        <Award className="w-3 h-3 mr-1" />
                        Manager
                    </span>
                </div>
                <p className="text-gray-500 dark:text-dark-muted flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatCurrentDate()}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Pending Approvals"
                    value={managerStats.pending_approvals}
                    icon={Clock}
                    color="amber"
                    trend={managerStats.pending_approvals > 0 ? 'up' : undefined}
                    trendValue={managerStats.pending_approvals > 0 ? 'Needs review' : 'All clear'}
                    path="/approvals"
                    onClick={navigate}
                    delay={0}
                />
                <StatCard
                    title="Approved (Week)"
                    value={managerStats.approved_this_week}
                    icon={CheckCircle}
                    color="emerald"
                    trend="up"
                    trendValue="This week"
                    delay={1}
                />
                <StatCard
                    title="Rejected (Week)"
                    value={managerStats.rejected_this_week}
                    icon={XCircle}
                    color="rose"
                    delay={2}
                />
                <StatCard
                    title="Approval Rate"
                    value={`${approvalRate}%`}
                    icon={TrendingUp}
                    color="blue"
                    trend={approvalRate >= 70 ? 'up' : 'down'}
                    trendValue={approvalRate >= 70 ? 'Great performance' : 'Review needed'}
                    delay={3}
                />
            </div>

            {/* Quick Actions */}
            <div className="animate-fade-in-up opacity-0 delay-200">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <QuickAction
                        icon={ListChecks}
                        title="Pending Approvals"
                        description={`${managerStats.pending_approvals} waiting`}
                        color="amber"
                        path="/approvals"
                        onClick={navigate}
                        delay={0}
                    />
                    <QuickAction
                        icon={Eye}
                        title="View Executions"
                        description="All workflow executions"
                        color="blue"
                        path="/executions"
                        onClick={navigate}
                        delay={1}
                    />
                    <QuickAction
                        icon={Users}
                        title="Manage Users"
                        description="Add or edit users"
                        color="violet"
                        path="/users"
                        onClick={navigate}
                        delay={2}
                    />
                    <QuickAction
                        icon={GitBranch}
                        title="Workflows"
                        description="Configure workflows"
                        color="emerald"
                        path="/workflows"
                        onClick={navigate}
                        delay={3}
                    />
                </div>
            </div>

            {/* Pending Approvals */}
            <div className="animate-fade-in-up opacity-0 delay-300">
                <Card
                    title="Pending Approvals"
                    headerAction={
                        <button
                            onClick={() => navigate('/approvals')}
                            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 flex items-center gap-1"
                        >
                            View All
                            <ArrowUpRight className="w-4 h-4" />
                        </button>
                    }
                >
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-3 py-3">
                                    <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
                                    <div className="flex-1">
                                        <Skeleton variant="text" width="60%" />
                                        <Skeleton variant="text" width="40%" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : pendingApprovals.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-dark-border -mx-2 px-2">
                            {pendingApprovals.map((approval, index) => (
                                <div
                                    key={approval.id}
                                    className="flex items-center gap-4 py-3 px-2 hover:bg-gray-50 dark:hover:bg-dark-border rounded-lg transition-colors cursor-pointer"
                                    onClick={() => navigate(`/executions/${approval.id}`)}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                                            {approval.workflow_name || `Execution #${approval.id}`}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-dark-muted">
                                            Requested by {approval.triggered_by_name || approval.triggered_by || 'Unknown'} • {formatRelativeTime(approval.started_at)}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="success"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle approve
                                            }}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle reject
                                            }}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500 dark:text-dark-muted">
                            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No pending approvals</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Stats Summary */}
            <div className="animate-fade-in-up opacity-0 delay-400">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card title="This Week Summary">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-dark-muted">Approved</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {managerStats.approved_this_week}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-dark-muted">Rejected</span>
                                <span className="font-semibold text-rose-600 dark:text-rose-400">
                                    {managerStats.rejected_this_week}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-100 dark:border-dark-border pt-4">
                                <span className="text-gray-600 dark:text-dark-muted">Approval Rate</span>
                                <span className="font-bold text-gray-900 dark:text-dark-text">
                                    {approvalRate}%
                                </span>
                            </div>
                        </div>
                    </Card>
                    <Card title="Quick Stats">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-dark-muted">Total Executions</span>
                                <span className="font-semibold text-gray-900 dark:text-dark-text">
                                    {managerStats.total_executions || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-dark-muted">Active Users</span>
                                <span className="font-semibold text-gray-900 dark:text-dark-text">
                                    {managerStats.active_users || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-100 dark:border-dark-border pt-4">
                                <span className="text-gray-600 dark:text-dark-muted">Pending Actions</span>
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                    {managerStats.pending_approvals}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
