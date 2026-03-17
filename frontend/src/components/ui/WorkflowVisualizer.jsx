import { useState, useMemo } from 'react';
import { cn } from '../../utils';
import Progress from './Progress';
import Badge from './Badge';
import Tooltip from './Tooltip';

// Step type icons
const StepIcons = {
    start: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    end: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
    ),
    action: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
    condition: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    approval: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    notification: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    ),
    subworkflow: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
    ),
};

// Status colors
const statusColors = {
    pending: {
        bg: 'bg-slate-100 dark:bg-slate-800',
        border: 'border-slate-300 dark:border-slate-600',
        text: 'text-slate-600 dark:text-slate-400',
        icon: 'text-slate-400',
    },
    running: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-400 dark:border-blue-600',
        text: 'text-blue-700 dark:text-blue-300',
        icon: 'text-blue-500',
    },
    completed: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        border: 'border-emerald-400 dark:border-emerald-600',
        text: 'text-emerald-700 dark:text-emerald-300',
        icon: 'text-emerald-500',
    },
    failed: {
        bg: 'bg-rose-100 dark:bg-rose-900/30',
        border: 'border-rose-400 dark:border-rose-600',
        text: 'text-rose-700 dark:text-rose-300',
        icon: 'text-rose-500',
    },
    skipped: {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        border: 'border-amber-400 dark:border-amber-600',
        text: 'text-amber-700 dark:text-amber-300',
        icon: 'text-amber-500',
    },
};

// Step node component
const StepNode = ({ step, onClick, isHorizontal, expandedStep, setExpandedStep }) => {
    const colors = statusColors[step.status] || statusColors.pending;
    const Icon = StepIcons[step.type] || StepIcons.action;
    const isExpanded = expandedStep === step.id;

    const handleClick = () => {
        setExpandedStep(isExpanded ? null : step.id);
        onClick?.(step);
    };

    return (
        <div className="flex flex-col items-center">
            <Tooltip content={step.description || `${step.name} - ${step.status}`}>
                <div
                    onClick={handleClick}
                    className={cn(
                        'relative cursor-pointer transition-all duration-300',
                        'hover:scale-105 active:scale-95',
                        isHorizontal ? 'w-48' : 'w-full'
                    )}
                >
                    {/* Node shape based on type */}
                    <div
                        className={cn(
                            'flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300',
                            colors.bg,
                            colors.border,
                            'hover:shadow-lg',
                            isExpanded && 'ring-2 ring-primary-400 dark:ring-primary-600'
                        )}
                    >
                        {/* Icon container */}
                        <div className={cn(
                            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                            'bg-white dark:bg-dark-bg shadow-sm',
                            colors.icon
                        )}>
                            {step.status === 'running' ? (
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : step.status === 'completed' ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            ) : step.status === 'failed' ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                Icon
                            )}
                        </div>

                        {/* Step info */}
                        <div className="flex-1 min-w-0">
                            <p className={cn(
                                'font-semibold text-sm truncate',
                                colors.text
                            )}>
                                {step.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-dark-muted truncate">
                                {step.label || step.type}
                            </p>
                        </div>

                        {/* Status indicator */}
                        {step.progress !== undefined && step.progress > 0 && step.progress < 100 && (
                            <div className="w-12">
                                <Progress
                                    value={step.progress}
                                    size="xs"
                                    variant="primary"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Tooltip>

            {/* Expanded details */}
            {isExpanded && step.details && (
                <div
                    className={cn(
                        'mt-2 p-4 bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-dark-border shadow-lg w-64 animate-in fade-in slide-in-from-top-2 duration-200',
                        isHorizontal && 'absolute left-0 top-full mt-2 z-10'
                    )}
                >
                    <div className="space-y-3">
                        {step.details.duration && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-dark-muted">Duration</span>
                                <span className="font-medium text-slate-900 dark:text-dark-text">{step.details.duration}</span>
                            </div>
                        )}
                        {step.details.actor && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-dark-muted">Actor</span>
                                <span className="font-medium text-slate-900 dark:text-dark-text">{step.details.actor}</span>
                            </div>
                        )}
                        {step.details.notes && (
                            <div className="text-sm">
                                <span className="text-slate-500 dark:text-dark-muted block mb-1">Notes</span>
                                <p className="text-slate-900 dark:text-dark-text">{step.details.notes}</p>
                            </div>
                        )}
                        {step.error && (
                            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                                <p className="text-xs text-rose-600 dark:text-rose-400">{step.error}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Connector line between nodes
const Connector = ({ status, isHorizontal, isLast }) => {
    const lineColor = {
        pending: 'bg-slate-300 dark:bg-slate-600',
        running: 'bg-blue-400',
        completed: 'bg-emerald-400',
        failed: 'bg-rose-400',
        skipped: 'bg-amber-400',
    };

    const statusColor = lineColor[status] || lineColor.pending;

    return (
        <div className={cn(
            'flex items-center',
            isHorizontal ? 'w-8 flex-shrink-0' : 'h-8 flex-shrink-0'
        )}>
            {/* Animated line for running */}
            {status === 'running' ? (
                <div className={cn(
                    'relative overflow-hidden',
                    isHorizontal ? 'w-8 h-0.5' : 'w-0.5 h-8'
                )}>
                    <div className={cn('absolute inset-0 bg-blue-400', isHorizontal ? 'animate-[shimmer_1s_infinite]' : 'animate-[shimmer-vertical_1s_infinite]')} />
                </div>
            ) : (
                <div className={cn(
                    isHorizontal ? 'w-8 h-0.5' : 'w-0.5 h-8',
                    statusColor
                )} />
            )}

            {/* Arrow */}
            {!isLast && (
                <div className={cn(
                    'flex items-center justify-center',
                    isHorizontal ? 'w-0 h-0 border-l-4 border-t-4 border-b-4 border-transparent' : 'w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent',
                    isHorizontal ? '-ml-1 border-l-4' : '-mt-1 border-t-4',
                    'border-l-surface-300 dark:border-l-slate-600',
                    'border-t-surface-300 dark:border-t-slate-600'
                )}>
                    <svg
                        className={cn(
                            'w-3 h-3 text-surface-300 dark:text-slate-600',
                            isHorizontal ? 'rotate-180' : 'rotate-90'
                        )}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
        </div>
    );
};

// Horizontal layout
const HorizontalFlow = ({ steps, onStepClick, expandedStep, setExpandedStep }) => {
    return (
        <div className="flex items-center overflow-x-auto pb-4 pt-2">
            {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-shrink-0">
                    <StepNode
                        step={step}
                        onClick={onStepClick}
                        isHorizontal
                        expandedStep={expandedStep}
                        setExpandedStep={setExpandedStep}
                    />
                    {index < steps.length - 1 && (
                        <Connector
                            status={step.status === 'completed' && steps[index + 1]?.status !== 'pending'
                                ? steps[index + 1].status
                                : step.status === 'running' ? 'running' : step.status}
                            isHorizontal
                        />
                    )}
                </div>
            ))}
        </div>
    );
};

// Vertical layout
const VerticalFlow = ({ steps, onStepClick, expandedStep, setExpandedStep }) => {
    return (
        <div className="space-y-0">
            {steps.map((step, index) => (
                <div key={step.id} className="flex items-start">
                    <div className="flex flex-col items-center">
                        <StepNode
                            step={step}
                            onClick={onStepClick}
                            isHorizontal={false}
                            expandedStep={expandedStep}
                            setExpandedStep={setExpandedStep}
                        />
                        {index < steps.length - 1 && (
                            <Connector
                                status={step.status === 'completed' && steps[index + 1]?.status !== 'pending'
                                    ? steps[index + 1].status
                                    : step.status === 'running' ? 'running' : step.status}
                                isHorizontal={false}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Main WorkflowVisualizer component
const WorkflowVisualizer = ({
    steps = [],
    layout = 'horizontal',
    showProgress = true,
    onStepClick,
    className,
    ...props
}) => {
    const [expandedStep, setExpandedStep] = useState(null);

    // Calculate overall progress
    const overallProgress = useMemo(() => {
        if (steps.length === 0) return 0;
        const completed = steps.filter(s => s.status === 'completed').length;
        return Math.round((completed / steps.length) * 100);
    }, [steps]);

    // Get current running step
    const runningStep = steps.find(s => s.status === 'running');

    // Get failed step
    const failedStep = steps.find(s => s.status === 'failed');

    if (steps.length === 0) {
        return (
            <div className={cn(
                'flex flex-col items-center justify-center p-8 text-center',
                className
            )}>
                <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-dark-border flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                    </svg>
                </div>
                <p className="text-slate-500 dark:text-dark-muted">No workflow steps to display</p>
            </div>
        );
    }

    return (
        <div className={cn('space-y-4', className)} {...props}>
            {/* Header with progress */}
            {showProgress && (
                <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-dark-border/30 rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Badge
                                variant={runningStep ? 'info' : failedStep ? 'danger' : overallProgress === 100 ? 'success' : 'warning'}
                                dot
                            >
                                {runningStep ? 'Running' : failedStep ? 'Failed' : overallProgress === 100 ? 'Completed' : 'In Progress'}
                            </Badge>
                        </div>
                        {runningStep && (
                            <span className="text-sm text-slate-500 dark:text-dark-muted">
                                Current: <span className="font-medium text-slate-700 dark:text-dark-text">{runningStep.name}</span>
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-700 dark:text-dark-text">
                            {overallProgress}%
                        </span>
                        <div className="w-32">
                            <Progress
                                value={overallProgress}
                                size="sm"
                                variant={failedStep ? 'danger' : overallProgress === 100 ? 'success' : 'primary'}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Workflow steps */}
            <div className="overflow-auto">
                {layout === 'horizontal' ? (
                    <HorizontalFlow
                        steps={steps}
                        onStepClick={onStepClick}
                        expandedStep={expandedStep}
                        setExpandedStep={setExpandedStep}
                    />
                ) : (
                    <VerticalFlow
                        steps={steps}
                        onStepClick={onStepClick}
                        expandedStep={expandedStep}
                        setExpandedStep={setExpandedStep}
                    />
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-surface-100 dark:border-dark-border">
                <span className="text-xs text-slate-500 dark:text-dark-muted">Legend:</span>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-xs text-slate-600 dark:text-dark-muted">Pending</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs text-slate-600 dark:text-dark-muted">Running</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs text-slate-600 dark:text-dark-muted">Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-xs text-slate-600 dark:text-dark-muted">Failed</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs text-slate-600 dark:text-dark-muted">Skipped</span>
                </div>
            </div>
        </div>
    );
};

export default WorkflowVisualizer;
