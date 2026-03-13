import { cn, getStatusColor } from '../../utils';

const variantStyles = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const Badge = ({
    children,
    variant = 'default',
    className,
    status,
    ...props
}) => {
    const getVariant = () => {
        if (status) return getStatusColor(status);
        return variant;
    };

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                variantStyles[getVariant()],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
};

export default Badge;
