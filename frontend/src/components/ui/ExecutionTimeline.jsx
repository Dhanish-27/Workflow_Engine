import { useState } from 'react';
import { cn } from '../../utils';
import Avatar from './Avatar';
import Badge from './Badge';
import Progress from './Progress';

// Status icons
const StatusIcons = {
    running: (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    ),
    completed: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    ),
    failed: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    pending: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    skipped: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    ),
};

const statusConfig = {
    running: {
        color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/10',
        borderColor: 'border-blue-200 dark:border-blue-800',
    },
    completed: {
        color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/10',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    failed: {
        color: 'text-rose-500 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400',
        bgColor: 'bg-rose-50 dark:bg-rose-900/10',
        borderColor: 'border-rose-200 dark:border-rose-800',
    },
    pending: {
        color: 'text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500',
        bgColor: 'bg-surface-50 dark:bg-dark-border/20',
        borderColor: 'border-slate-200 dark:border-dark-border',
    },
    skipped: {
        color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-900/10',
        borderColor: 'border-amber-200 dark:border-amber-800',
    },
};

// Timeline item component
const TimelineItem = ({
    step,
    isLast,
    isExpanded,
    onToggle,
    showActor = true,
    showTimestamp = true,
}) => {
    const config = statusConfig[step.status] || statusConfig.pending;

    return (
        <div className={cn('relative', isLast ? '' : 'pb-6')}>
            {/* Timeline line */}
            {!isLast && (
                <div
                    className={cn(
                        'absolute left-5 top-12 bottom-0 w-0.5',
                        step.status === 'completed'
                            ? 'bg-emerald-200 dark:bg-emerald-800'
                            : step.status === 'running'
                                ? 'bg-blue-200 dark:bg-blue-800'
                                : 'bg-slate-200 dark:bg-slate-700'
                    )}
                />
            )}

            <div className="flex gap-4">
                {/* Status icon */}
                <div className="relative flex flex-col items-center">
                    <div
                        className={cn(
                            'relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                            config.color,
                            step.status === 'running' && 'animate-pulse ring-4 ring-blue-100 dark:ring-blue-900/30'
                        )}
                    >
                        {StatusIcons[step.status] || StatusIcons.pending}
                    </div>

                    {/* Progress indicator for running */}
                    {step.status === 'running' && step.progress !== undefined && (
                        <div className="absolute -bottom-1 -right-1">
                            <svg className="w-6 h-6 transform -rotate-90">
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    className="text-surface-200 dark:text-slate-700"
                                />
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeDasharray={`${(step.progress / 100) * 63} 63`}
                                    className="text-blue-500 transition-all duration-300"
                                />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div
                        className={cn(
                            'group rounded-xl border transition-all duration-200 cursor-pointer',
                            config.bgColor,
                            config.borderColor,
                            isExpanded ? 'shadow-md' : 'hover:shadow-sm'
                        )}
                        onClick={onToggle}
                    >
                        <div className="p-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-slate-900 dark:text-dark-text truncate">
                                            {step.name}
                                        </h4>
                                        <Badge
                                            variant={step.status === 'completed' ? 'success' : step.status === 'failed' ? 'danger' : step.status === 'running' ? 'info' : 'default'}
                                            size="sm"
                                        >
                                            {step.status}
                                        </Badge>
                                    </div>
                                    {step.description && (
                                        <p className="text-sm text-slate-500 dark:text-dark-muted line-clamp-2">
                                            {step.description}
                                        </p>
                                    )}
                                </div>

                                {/* Expand chevron */}
                                <svg
                                    className={cn(
                                        'w-5 h-5 text-slate-400 transition-transform duration-200 flex-shrink-0',
                                        isExpanded && 'rotate-180'
                                    )}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>

                            {/* Meta info */}
                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                                {step.duration && (
                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-dark-muted">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{step.duration}</span>
                                    </div>
                                )}

                                {showTimestamp && step.timestamp && (
                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-dark-muted">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span>{step.timestamp}</span>
                                    </div>
                                )}

                                {showActor && step.actor && (
                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-dark-muted">
                                        <Avatar
                                            name={step.actor}
                                            size="xs"
                                        />
                                        <span>{step.actor}</span>
                                    </div>
                                )}
                            </div>

                            {/* Progress bar for running steps */}
                            {step.status === 'running' && step.progress !== undefined && (
                                <div className="mt-3">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-slate-500 dark:text-dark-muted">Progress</span>
                                        <span className="font-medium text-slate-700 dark:text-dark-text">{step.progress}%</span>
                                    </div>
                                    <Progress
                                        value={step.progress}
                                        size="sm"
                                        variant="primary"
                                        animated
                                    />
                                </div>
                            )}
                        </div>

                        {/* Expanded details */}
                        {isExpanded && step.details && (
                            <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                                    {step.details.notes && (
                                        <div className="mb-3">
                                            <span className="text-xs font-medium text-slate-500 dark:text-dark-muted uppercase tracking-wider">Notes</span>
                                            <p className="mt-1 text-sm text-slate-700 dark:text-dark-text">
                                                {step.details.notes}
                                            </p>
                                        </div>
                                    )}

                                    {step.details.metadata && Object.keys(step.details.metadata).length > 0 && (
                                        <div>
                                            <span className="text-xs font-medium text-slate-500 dark:text-dark-muted uppercase tracking-wider">Details</span>
                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                {Object.entries(step.details.metadata).map(([key, value]) => (
                                                    <div key={key} className="text-sm">
                                                        <span className="text-slate-500 dark:text-dark-muted capitalize">{key}:</span>
                                                        <span className="ml-1 text-slate-700 dark:text-dark-text font-medium">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {step.error && (
                                        <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800">
                                            <div className="flex items-start gap-2">
                                                <svg className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div>
                                                    <p className="text-sm font-medium text-rose-700 dark:text-rose-400">Error</p>
                                                    <p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5">{step.error}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Group header component
const GroupHeader = ({ title, count, icon }) => (
    <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-slate-400 dark:text-dark-muted">{icon}</span>}
        <h3 className="text-sm font-semibold text-slate-700 dark:text-dark-text">{title}</h3>
        <Badge variant="default" size="sm">{count}</Badge>
    </div>
);

// Main ExecutionTimeline component
const ExecutionTimeline = ({
    steps = [],
    groupBy = null, // 'status', 'time', or null
    showActor = true,
    showTimestamp = true,
    showOverallProgress = true,
    className,
    ...props
}) => {
    const [expandedSteps, setExpandedSteps] = useState(new Set());

    const toggleExpand = (stepId) => {
        setExpandedSteps(prev => {
            const next = new Set(prev);
            if (next.has(stepId)) {
                next.delete(stepId);
            } else {
                next.add(stepId);
            }
            return next;
        });
    };

    const expandAll = () => {
        setExpandedSteps(new Set(steps.map(s => s.id)));
    };

    const collapseAll = () => {
        setExpandedSteps(new Set());
    };

    // Calculate overall progress
    const overallProgress = steps.length > 0
        ? Math.round((steps.filter(s => s.status === 'completed').length / steps.length) * 100)
        : 0;

    // Group steps if needed
    const groupedSteps = groupBy === 'status'
        ? steps.reduce((acc, step) => {
            const status = step.status || 'pending';
            if (!acc[status]) acc[status] = [];
            acc[status].push(step);
            return acc;
        }, {})
        : groupBy === 'time'
            ? steps.reduce((acc, step) => {
                const timeGroup = step.timestamp ? new Date(step.timestamp).toLocaleDateString() : 'Unknown';
                if (!acc[timeGroup]) acc[timeGroup] = [];
                acc[timeGroup].push(step);
                return acc;
            }, {})
            : null;

    if (steps.length === 0) {
        return (
            <div className={cn(
                'flex flex-col items-center justify-center p-8 text-center',
                className
            )}>
                <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-dark-border flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-slate-500 dark:text-dark-muted">No execution steps to display</p>
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)} {...props}>
            {/* Header */}
            {showOverallProgress && (
                <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-dark-border/30 rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Badge
                                variant={overallProgress === 100 ? 'success' : steps.some(s => s.status === 'failed') ? 'danger' : steps.some(s => s.status === 'running') ? 'info' : 'warning'}
                                dot
                            >
                                {overallProgress === 100
                                    ? 'Completed'
                                    : steps.some(s => s.status === 'failed')
                                        ? 'Failed'
                                        : steps.some(s => s.status === 'running')
                                            ? 'Running'
                                            : 'In Progress'}
                            </Badge>
                            <span className="text-sm text-slate-500 dark:text-dark-muted">
                                {steps.filter(s => s.status === 'completed').length} of {steps.length} steps
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={expandAll}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                        >
                            Expand All
                        </button>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <button
                            onClick={collapseAll}
                            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                        >
                            Collapse All
                        </button>
                    </div>
                </div>
            )}

            {/* Overall progress bar */}
            {showOverallProgress && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-dark-muted">Overall Progress</span>
                        <span className="font-semibold text-slate-900 dark:text-dark-text">{overallProgress}%</span>
                    </div>
                    <Progress
                        value={overallProgress}
                        size="sm"
                        variant={overallProgress === 100 ? 'success' : steps.some(s => s.status === 'failed') ? 'danger' : 'primary'}
                        animated={steps.some(s => s.status === 'running')}
                    />
                </div>
            )}

            {/* Timeline */}
            {groupedSteps ? (
                <div className="space-y-6">
                    {Object.entries(groupedSteps).map(([group, groupSteps]) => (
                        <div key={group}>
                            <GroupHeader
                                title={group.charAt(0).toUpperCase() + group.slice(1)}
                                count={groupSteps.length}
                            />
                            <div className="space-y-0">
                                {groupSteps.map((step, index) => (
                                    <TimelineItem
                                        key={step.id}
                                        step={step}
                                        isLast={index === groupSteps.length - 1}
                                        isExpanded={expandedSteps.has(step.id)}
                                        onToggle={() => toggleExpand(step.id)}
                                        showActor={showActor}
                                        showTimestamp={showTimestamp}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-0">
                    {steps.map((step, index) => (
                        <TimelineItem
                            key={step.id}
                            step={step}
                            isLast={index === steps.length - 1}
                            isExpanded={expandedSteps.has(step.id)}
                            onToggle={() => toggleExpand(step.id)}
                            showActor={showActor}
                            showTimestamp={showTimestamp}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExecutionTimeline;
