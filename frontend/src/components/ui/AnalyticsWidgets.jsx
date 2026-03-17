import { cn } from '../../utils';
import Progress from './Progress';
import Badge from './Badge';

// Trend icons
const TrendUpIcon = () => (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
);

const TrendDownIcon = () => (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
);

const NeutralIcon = () => (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
);

// Widget icons
const TimerIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const PercentIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
    </svg>
);

const WorkflowIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
);

const ChartIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const ActivityIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

// Icon mapping
const iconMap = {
    timer: TimerIcon,
    percent: PercentIcon,
    workflow: WorkflowIcon,
    chart: ChartIcon,
    users: UsersIcon,
    activity: ActivityIcon,
};

// Widget variants based on type
const widgetConfig = {
    'avg-completion-time': {
        icon: TimerIcon,
        iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        valueColor: 'text-slate-900 dark:text-dark-text',
    },
    'failure-rate': {
        icon: PercentIcon,
        iconBg: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
        valueColor: 'text-rose-600 dark:text-rose-400',
    },
    'success-rate': {
        icon: ChartIcon,
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        valueColor: 'text-emerald-600 dark:text-emerald-400',
    },
    'most-used-workflow': {
        icon: WorkflowIcon,
        iconBg: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
        valueColor: 'text-violet-600 dark:text-violet-400',
    },
    'throughput': {
        icon: ActivityIcon,
        iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        valueColor: 'text-amber-600 dark:text-amber-400',
    },
    'active-users': {
        icon: UsersIcon,
        iconBg: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
        valueColor: 'text-primary-600 dark:text-primary-400',
    },
};

// Single Widget Component
const AnalyticsWidget = ({
    type = 'default',
    icon,
    label,
    value,
    trend,
    trendValue,
    loading = false,
    size = 'md',
    className,
    ...props
}) => {
    const config = widgetConfig[type] || widgetConfig['default'];
    const IconComponent = icon || config.icon;
    const isSmall = size === 'sm';

    // Determine trend color
    const getTrendColor = () => {
        if (!trend) return 'text-slate-500 dark:text-dark-muted';
        if (trend === 'up') return 'text-emerald-500';
        if (trend === 'down') return 'text-rose-500';
        return 'text-slate-500 dark:text-dark-muted';
    };

    // Trend icon
    const TrendIcon = trend === 'up' ? TrendUpIcon : trend === 'down' ? TrendDownIcon : NeutralIcon;

    if (loading) {
        return (
            <div className={cn(
                'bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-dark-border p-4',
                'animate-pulse',
                className
            )}>
                <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-200 dark:bg-dark-border" />
                    <div className="w-12 h-4 rounded bg-surface-200 dark:bg-dark-border" />
                </div>
                <div className="w-20 h-8 rounded bg-surface-200 dark:bg-dark-border mb-2" />
                <div className="w-24 h-4 rounded bg-surface-200 dark:bg-dark-border" />
            </div>
        );
    }

    return (
        <div
            className={cn(
                'group relative bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-dark-border',
                'transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary-300/50 dark:hover:border-primary-700/50',
                'cursor-pointer overflow-hidden',
                isSmall ? 'p-3' : 'p-4',
                className
            )}
            {...props}
        >
            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative">
                {/* Icon and Trend */}
                <div className="flex items-start justify-between mb-3">
                    <div className={cn(
                        'rounded-xl flex items-center justify-center',
                        config.iconBg,
                        isSmall ? 'w-8 h-8' : 'w-10 h-10'
                    )}>
                        <IconComponent />
                    </div>

                    {trend && trendValue !== undefined && (
                        <div className={cn(
                            'flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium',
                            getTrendColor(),
                            trend === 'up' && 'bg-emerald-50 dark:bg-emerald-900/20',
                            trend === 'down' && 'bg-rose-50 dark:bg-rose-900/20',
                            !trend && 'bg-slate-100 dark:bg-slate-800'
                        )}>
                            <TrendIcon />
                            <span>{trendValue}</span>
                        </div>
                    )}
                </div>

                {/* Value */}
                <div className={cn(
                    'font-bold',
                    isSmall ? 'text-xl' : 'text-2xl',
                    config.valueColor
                )}>
                    {value}
                </div>

                {/* Label */}
                <div className={cn(
                    'text-slate-500 dark:text-dark-muted mt-1',
                    isSmall ? 'text-xs' : 'text-sm'
                )}>
                    {label}
                </div>
            </div>
        </div>
    );
};

// Stats Card with Progress
const StatsCardWithProgress = ({
    title,
    value,
    progress,
    progressLabel,
    icon,
    variant = 'primary',
    loading = false,
    className,
    ...props
}) => {
    const variantColors = {
        primary: 'bg-primary-500',
        success: 'bg-emerald-500',
        warning: 'bg-amber-500',
        danger: 'bg-rose-500',
        info: 'bg-blue-500',
    };

    const iconBgColors = {
        primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
        success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        danger: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
        info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    };

    if (loading) {
        return (
            <div className={cn(
                'bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-dark-border p-4',
                'animate-pulse',
                className
            )}>
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-200 dark:bg-dark-border" />
                    <div className="flex-1">
                        <div className="w-24 h-4 rounded bg-surface-200 dark:bg-dark-border mb-2" />
                        <div className="w-16 h-6 rounded bg-surface-200 dark:bg-dark-border" />
                    </div>
                </div>
                <div className="h-2 bg-surface-200 dark:bg-dark-border rounded-full" />
            </div>
        );
    }

    return (
        <div
            className={cn(
                'bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-dark-border p-4',
                'transition-all duration-300 hover:shadow-md',
                className
            )}
            {...props}
        >
            <div className="flex items-center gap-4 mb-4">
                {icon && (
                    <div className={cn(
                        'rounded-xl flex items-center justify-center w-10 h-10',
                        iconBgColors[variant]
                    )}>
                        {icon}
                    </div>
                )}
                <div>
                    <p className="text-sm text-slate-500 dark:text-dark-muted">{title}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-dark-text">{value}</p>
                </div>
            </div>

            {progress !== undefined && (
                <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500 dark:text-dark-muted">{progressLabel || 'Progress'}</span>
                        <span className="font-medium text-slate-700 dark:text-dark-text">{progress}%</span>
                    </div>
                    <Progress
                        value={progress}
                        size="sm"
                        variant={variant}
                    />
                </div>
            )}
        </div>
    );
};

// Donut Chart Widget
const DonutWidget = ({
    value,
    label,
    total,
    color = 'primary',
    loading = false,
    className,
    ...props
}) => {
    const colors = {
        primary: 'stroke-primary-500',
        success: 'stroke-emerald-500',
        warning: 'stroke-amber-500',
        danger: 'stroke-rose-500',
        info: 'stroke-blue-500',
    };

    const bgColors = {
        primary: 'text-primary-100 dark:text-primary-900/30',
        success: 'text-emerald-100 dark:text-emerald-900/30',
        warning: 'text-amber-100 dark:text-amber-900/30',
        danger: 'text-rose-100 dark:text-rose-900/30',
        info: 'text-blue-100 dark:text-blue-900/30',
    };

    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    if (loading) {
        return (
            <div className={cn(
                'bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-dark-border p-4',
                'animate-pulse',
                className
            )}>
                <div className="flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-surface-200 dark:bg-dark-border" />
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-dark-border p-4',
                'transition-all duration-300 hover:shadow-md',
                className
            )}
            {...props}
        >
            <div className="flex items-center justify-center">
                <div className="relative w-24 h-24">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-surface-200 dark:text-dark-border"
                        />
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            fill="none"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            className={cn(colors[color], 'transition-all duration-500 ease-out')}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-slate-900 dark:text-dark-text">{value}%</span>
                        <span className="text-xs text-slate-500 dark:text-dark-muted">{label}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mini Chart Widget (placeholder for sparklines)
const MiniChartWidget = ({
    value,
    label,
    data,
    trend,
    loading = false,
    className,
    ...props
}) => {
    const maxValue = Math.max(...(data || [0]));

    if (loading) {
        return (
            <div className={cn(
                'bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-dark-border p-4',
                'animate-pulse',
                className
            )}>
                <div className="flex justify-between items-end h-16 mb-2">
                    <div className="w-24 h-8 bg-surface-200 dark:bg-dark-border rounded" />
                </div>
                <div className="w-full h-2 bg-surface-200 dark:bg-dark-border rounded" />
            </div>
        );
    }

    return (
        <div
            className={cn(
                'bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-dark-border p-4',
                'transition-all duration-300 hover:shadow-md',
                className
            )}
            {...props}
        >
            <div className="flex items-center justify-between mb-2">
                <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-dark-text">{value}</p>
                    <p className="text-sm text-slate-500 dark:text-dark-muted">{label}</p>
                </div>
                {trend && (
                    <Badge variant={trend === 'up' ? 'success' : trend === 'down' ? 'danger' : 'default'} size="sm">
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {label}
                    </Badge>
                )}
            </div>

            {/* Simple bar chart */}
            {data && data.length > 0 && (
                <div className="flex items-end gap-0.5 h-12">
                    {data.map((val, idx) => (
                        <div
                            key={idx}
                            className="flex-1 bg-primary-200 dark:bg-primary-800 rounded-t transition-all duration-300 hover:bg-primary-300 dark:hover:bg-primary-700"
                            style={{ height: `${(val / maxValue) * 100}%` }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Analytics Grid Component
const AnalyticsGrid = ({
    widgets = [],
    columns = 3,
    className,
    ...props
}) => {
    const gridCols = {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        6: 'grid-cols-6',
    };

    return (
        <div
            className={cn(
                'grid gap-4',
                gridCols[columns] || 'grid-cols-3',
                'max-xl:grid-cols-2 max-md:grid-cols-1',
                className
            )}
            {...props}
        >
            {widgets.map((widget, index) => (
                <AnalyticsWidget key={index} {...widget} />
            ))}
        </div>
    );
};

// Export all components
export {
    AnalyticsWidget,
    StatsCardWithProgress,
    DonutWidget,
    MiniChartWidget,
    AnalyticsGrid,
};

export default AnalyticsWidget;
