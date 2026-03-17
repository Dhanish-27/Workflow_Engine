import { cn } from '../../utils';

const Progress = ({
    value = 0,
    max = 100,
    size = 'md',
    variant = 'primary',
    showLabel = false,
    labelPosition = 'right',
    striped = false,
    animated = false,
    rounded = true,
    className,
    ...props
}) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizes = {
        xs: 'h-1',
        sm: 'h-1.5',
        md: 'h-2',
        lg: 'h-3',
        xl: 'h-4',
    };

    const variants = {
        primary: 'bg-primary-500',
        secondary: 'bg-secondary-500',
        success: 'bg-success-500',
        warning: 'bg-warning-500',
        danger: 'bg-danger-500',
        info: 'bg-blue-500',
        indigo: 'bg-indigo-500',
        violet: 'bg-violet-500',
        emerald: 'bg-emerald-500',
        rose: 'bg-rose-500',
        gradient: 'bg-gradient-to-r from-primary-500 to-secondary-500',
    };

    const labelSizes = {
        xs: 'text-[10px]',
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg',
    };

    return (
        <div className={cn('w-full', className)} {...props}>
            <div className="flex items-center gap-2">
                {showLabel && labelPosition === 'left' && (
                    <span className={cn('font-medium text-slate-700 dark:text-dark-text', labelSizes[size])}>
                        {Math.round(percentage)}%
                    </span>
                )}
                <div
                    className={cn(
                        'flex-1 bg-surface-200 dark:bg-dark-border overflow-hidden',
                        rounded ? 'rounded-full' : 'rounded-lg',
                        sizes[size]
                    )}
                >
                    <div
                        className={cn(
                            'h-full transition-all duration-500 ease-out',
                            variants[variant],
                            rounded && 'rounded-full',
                            striped && 'progress-striped',
                            animated && 'animate-pulse'
                        )}
                        style={{ width: `${percentage}%` }}
                        role="progressbar"
                        aria-valuenow={value}
                        aria-valuemin={0}
                        aria-valuemax={max}
                    />
                </div>
                {showLabel && labelPosition === 'right' && (
                    <span className={cn('font-medium text-slate-700 dark:text-dark-text', labelSizes[size])}>
                        {Math.round(percentage)}%
                    </span>
                )}
            </div>
        </div>
    );
};

// Circular Progress
const CircularProgress = ({
    value = 0,
    max = 100,
    size = 120,
    strokeWidth = 8,
    variant = 'primary',
    showLabel = true,
    labelPosition = 'center',
    className,
    ...props
}) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    const variants = {
        primary: 'stroke-primary-500',
        secondary: 'stroke-secondary-500',
        success: 'stroke-success-500',
        warning: 'stroke-warning-500',
        danger: 'stroke-danger-500',
        info: 'stroke-blue-500',
        indigo: 'stroke-indigo-500',
        violet: 'stroke-violet-500',
    };

    return (
        <div
            className={cn('relative inline-flex items-center justify-center', className)}
            style={{ width: size, height: size }}
            {...props}
        >
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-surface-200 dark:text-dark-border"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={cn(variants[variant], 'transition-all duration-500 ease-out')}
                />
            </svg>
            {showLabel && (
                <div
                    className={cn(
                        'absolute flex flex-col items-center justify-center',
                        labelPosition === 'center' && 'inset-0'
                    )}
                >
                    <span className="text-2xl font-bold text-slate-900 dark:text-dark-text">
                        {Math.round(percentage)}%
                    </span>
                    {labelPosition === 'center' && (
                        <span className="text-xs text-slate-500 dark:text-dark-muted">
                            Complete
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

// Progress Stepper (for multi-step progress)
const ProgressStepper = ({
    steps = [],
    currentStep = 0,
    variant = 'primary',
    className,
    ...props
}) => {
    const variants = {
        primary: {
            active: 'bg-primary-500 border-primary-500',
            completed: 'bg-primary-500 border-primary-500',
            pending: 'bg-surface-200 dark:bg-dark-border border-surface-300 dark:border-dark-border',
            connector: 'bg-primary-500',
        },
        success: {
            active: 'bg-success-500 border-success-500',
            completed: 'bg-success-500 border-success-500',
            pending: 'bg-surface-200 dark:bg-dark-border border-surface-300 dark:border-dark-border',
            connector: 'bg-success-500',
        },
    };

    const colors = variants[variant] || variants.primary;

    return (
        <div
            className={cn('flex items-center w-full', className)}
            {...props}
        >
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;
                const isPending = index > currentStep;

                return (
                    <div key={index} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    'w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all duration-300',
                                    isCompleted && 'text-white',
                                    isActive && colors.active + ' text-white',
                                    isPending && colors.pending + ' text-slate-500 dark:text-dark-muted'
                                )}
                            >
                                {isCompleted ? (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    index + 1
                                )}
                            </div>
                            {step.label && (
                                <span className={cn(
                                    'mt-2 text-xs font-medium text-center',
                                    isActive ? 'text-primary-600 dark:text-primary-400' :
                                        isCompleted ? 'text-success-600 dark:text-success-400' :
                                            'text-slate-500 dark:text-dark-muted'
                                )}>
                                    {step.label}
                                </span>
                            )}
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    'flex-1 h-0.5 mx-2 transition-colors duration-300',
                                    isCompleted ? colors.connector : 'bg-surface-200 dark:bg-dark-border'
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// Progress Bar with multiple segments
const SegmentedProgress = ({
    segments = [],
    size = 'md',
    className,
    ...props
}) => {
    const sizes = {
        xs: 'h-1',
        sm: 'h-1.5',
        md: 'h-2',
        lg: 'h-3',
        xl: 'h-4',
    };

    return (
        <div
            className={cn(
                'flex w-full overflow-hidden rounded-lg',
                sizes[size],
                className
            )}
            {...props}
        >
            {segments.map((segment, index) => (
                <div
                    key={index}
                    className={cn('h-full transition-all duration-300', segment.color)}
                    style={{ width: `${segment.value}%` }}
                />
            ))}
        </div>
    );
};

Progress.Circular = CircularProgress;
Progress.Stepper = ProgressStepper;
Progress.Segmented = SegmentedProgress;

export default Progress;
