import { cn } from '../../utils';
import Button from './Button';

const EmptyState = ({
    icon: Icon,
    title,
    description,
    action,
    actionLabel = 'Create New',
    onAction,
    className,
}) => {
    return (
        <div className={cn(
            'flex flex-col items-center justify-center py-12 px-4 text-center',
            className
        )}>
            {Icon && (
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-gray-400" />
                </div>
            )}
            <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-1">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-gray-500 dark:text-dark-muted max-w-sm mb-4">
                    {description}
                </p>
            )}
            {action && (
                <Button onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
