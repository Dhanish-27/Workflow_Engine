import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { cn } from '../../utils';

// Step type configuration
const stepTypeConfig = {
    task: {
        color: 'blue',
        bgLight: 'bg-blue-50',
        bgDark: 'bg-blue-900/20',
        borderLight: 'border-blue-300',
        borderDark: 'border-blue-700',
        textLight: 'text-blue-700',
        textDark: 'text-blue-300',
        iconBgLight: 'bg-blue-100',
        iconBgDark: 'bg-blue-900/40',
        iconColor: 'text-blue-600 dark:text-blue-400',
    },
    approval: {
        color: 'yellow',
        bgLight: 'bg-yellow-50',
        bgDark: 'bg-yellow-900/20',
        borderLight: 'border-yellow-300',
        borderDark: 'border-yellow-700',
        textLight: 'text-yellow-700',
        textDark: 'text-yellow-300',
        iconBgLight: 'bg-yellow-100',
        iconBgDark: 'bg-yellow-900/40',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    notification: {
        color: 'purple',
        bgLight: 'bg-purple-50',
        bgDark: 'bg-purple-900/20',
        borderLight: 'border-purple-300',
        borderDark: 'border-purple-700',
        textLight: 'text-purple-700',
        textDark: 'text-purple-300',
        iconBgLight: 'bg-purple-100',
        iconBgDark: 'bg-purple-900/40',
        iconColor: 'text-purple-600 dark:text-purple-400',
    },
};

// Icons for each step type
const StepTypeIcon = ({ type, className }) => {
    const icons = {
        task: (
            <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
        approval: (
            <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        notification: (
            <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
    };
    return icons[type] || icons.task;
};

const WorkflowNode = ({ id, data, selected, isExecutionMode, executionState }) => {
    const [isHovered, setIsHovered] = useState(false);

    const config = stepTypeConfig[data.stepType] || stepTypeConfig.task;
    const isDark = document.documentElement.classList.contains('dark');

    // Determine styling based on execution state
    let isRunning = false;
    let isCompleted = false;

    // Use the actual node id (from props) for execution state
    const nodeId = id || data.id;

    if (executionState) {
        isRunning = executionState.currentNodeId === nodeId && executionState.isRunning;
        isCompleted = executionState.completedNodes?.includes(nodeId);
    }

    // Execution mode colors
    let statusBorder = '';
    let statusGlow = '';

    if (isExecutionMode) {
        if (isCompleted) {
            statusBorder = 'border-emerald-500';
            statusGlow = 'shadow-lg shadow-emerald-500/30';
        } else if (isRunning) {
            statusBorder = 'border-blue-500';
            statusGlow = 'shadow-lg shadow-blue-500/50 animate-pulse';
        }
    }

    return (
        <div
            className={cn(
                'relative transition-all duration-200',
                'hover:scale-105 hover:shadow-xl',
                selected && 'ring-2 ring-primary-500 ring-offset-2',
                isHovered && !selected && 'shadow-lg',
                statusGlow
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className={cn(
                    'w-3 h-3 !bg-surface-300 dark:!bg-slate-600',
                    'border-2 border-white dark:border-slate-800',
                    'hover:!bg-primary-500 hover:!scale-125',
                    'transition-all duration-150'
                )}
            />

            {/* Node Card */}
            <div
                className={cn(
                    'w-64 rounded-xl border-2 bg-white dark:bg-slate-900',
                    'transition-all duration-200 overflow-hidden',
                    selected
                        ? config.borderLight + (isDark ? ` ${config.borderDark}` : '')
                        : 'border-surface-200 dark:border-slate-700',
                    statusBorder,
                    'shadow-md'
                )}
            >
                {/* Header */}
                <div
                    className={cn(
                        'flex items-center gap-3 px-4 py-3',
                        config.bgLight,
                        isDark && config.bgDark
                    )}
                >
                    {/* Icon */}
                    <div
                        className={cn(
                            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                            config.iconBgLight,
                            isDark && config.iconBgDark,
                            config.iconColor
                        )}
                    >
                        <StepTypeIcon type={data.stepType} className="w-5 h-5" />
                    </div>

                    {/* Title & Type */}
                    <div className="flex-1 min-w-0">
                        <p className={cn(
                            'font-semibold text-sm truncate',
                            config.textLight,
                            isDark && config.textDark
                        )}>
                            {data.label}
                        </p>
                        <span className={cn(
                            'text-xs capitalize font-medium',
                            config.textLight + '/70',
                            isDark && config.textDark + '/70'
                        )}>
                            {data.stepType}
                        </span>
                    </div>

                    {/* Status Indicator (Execution Mode) */}
                    {isExecutionMode && (
                        <div className="flex-shrink-0">
                            {isRunning && (
                                <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
                            )}
                            {isCompleted && (
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            )}
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="px-4 py-3 bg-white dark:bg-slate-900">
                    {data.description ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {data.description}
                        </p>
                    ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                            No description
                        </p>
                    )}

                    {/* Meta info */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* Role badge for task steps */}
                        {data.stepType === 'task' && data.assignedRole && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 capitalize">
                                {data.assignedRole}
                            </span>
                        )}
                        {/* Approval type badge */}
                        {data.stepType === 'approval' && data.approvalType && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 capitalize">
                                {data.approvalType.replace(/_/g, ' ')}
                            </span>
                        )}
                        {data.assignedTo && (
                            <div className="flex items-center gap-1">
                                <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[80px]">
                                    {data.assignedTo}
                                </span>
                            </div>
                        )}
                        {data.deadline && (
                            <div className="flex items-center gap-1">
                                <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {data.deadline}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className={cn(
                    'w-3 h-3 !bg-surface-300 dark:!bg-slate-600',
                    'border-2 border-white dark:border-slate-800',
                    'hover:!bg-primary-500 hover:!scale-125',
                    'transition-all duration-150'
                )}
            />
        </div>
    );
};

// Wrapper component to connect with store
const WorkflowNodeWrapper = (props) => {
    const executionState = props.data?.executionState;
    return <WorkflowNode {...props} executionState={executionState} />;
};

export default memo(WorkflowNode);
export { WorkflowNode, stepTypeConfig };
