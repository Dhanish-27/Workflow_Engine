import { cn } from '../../utils';

const variantStyles = {
    // Default/Neutral
    default: 'bg-surface-100 text-slate-700 dark:bg-dark-card dark:text-dark-text',
    // Primary/Brand colors
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300',
    // Semantic colors
    success: 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300',
    warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
    danger: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    // Additional colors
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    // Outline variants
    'outline-default': 'border border-slate-300 text-slate-700 dark:border-dark-border dark:text-dark-text',
    'outline-primary': 'border border-primary-300 text-primary-700 dark:border-primary-700 dark:text-primary-300',
    'outline-secondary': 'border border-secondary-300 text-secondary-700 dark:border-secondary-700 dark:text-secondary-300',
    'outline-success': 'border border-success-300 text-success-700 dark:border-success-700 dark:text-success-300',
    'outline-warning': 'border border-warning-300 text-warning-700 dark:border-warning-700 dark:text-warning-300',
    'outline-danger': 'border border-danger-300 text-danger-700 dark:border-danger-700 dark:text-danger-300',
};

const dotColors = {
    default: 'bg-slate-500',
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    info: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    violet: 'bg-violet-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-500',
};

const Badge = ({
    children,
    variant = 'default',
    className,
    dot = false,
    dotPosition = 'left',
    size = 'md',
    status,
    ...props
}) => {
    // Handle legacy status prop
    const getVariant = () => {
        if (status) {
            const statusMap = {
                'success': 'success',
                'warning': 'warning',
                'error': 'danger',
                'info': 'info',
                'pending': 'warning',
                'active': 'success',
                'inactive': 'default',
            };
            return statusMap[status?.toLowerCase()] || 'default';
        }
        return variant;
    };

    const currentVariant = getVariant();
    const isOutline = variant.startsWith('outline-');

    const sizes = {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
    };

    const dotSizes = {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-2.5 h-2.5',
    };

    const Dot = () => (
        <span
            className={cn(
                'rounded-full',
                dotSizes[size],
                dotColors[currentVariant]
            )}
        />
    );

    return (
        <span
            className={cn(
                'inline-flex items-center font-medium rounded-full',
                sizes[size],
                variantStyles[currentVariant],
                isOutline && 'bg-transparent',
                className
            )}
            {...props}
        >
            {dot && dotPosition === 'left' && <span className="mr-1.5"><Dot /></span>}
            {children}
            {dot && dotPosition === 'right' && <span className="ml-1.5"><Dot /></span>}
        </span>
    );
};

// StatusBadge is a wrapper that maps status to variant
const StatusBadge = ({ status, children, ...props }) => {
    const getStatusVariant = (status) => {
        const statusMap = {
            'success': 'success',
            'completed': 'success',
            'approved': 'success',
            'active': 'success',
            'published': 'success',
            'warning': 'warning',
            'pending': 'warning',
            'in_progress': 'warning',
            'processing': 'warning',
            'error': 'danger',
            'failed': 'danger',
            'rejected': 'danger',
            'cancelled': 'danger',
            'info': 'info',
            'draft': 'default',
            'inactive': 'default',
            'archived': 'slate',
        };
        return statusMap[status?.toLowerCase()] || 'default';
    };

    return (
        <Badge
            variant={getStatusVariant(status)}
            dot
            {...props}
        >
            {children || status}
        </Badge>
    );
};

Badge.Status = StatusBadge;

export default Badge;
