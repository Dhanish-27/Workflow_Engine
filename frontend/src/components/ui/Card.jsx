import { cn } from '../../utils';

const Card = ({
    children,
    className,
    title,
    subtitle,
    action,
    noPadding = false,
    hoverable = false,
    gradientBorder = false,
    icon,
    iconColor = 'primary',
    ...props
}) => {
    const iconColorClasses = {
        primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
        secondary: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400',
        success: 'bg-success-100 text-success-600 dark:bg-success-900/30 dark:text-success-400',
        warning: 'bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400',
        danger: 'bg-danger-100 text-danger-600 dark:bg-danger-900/30 dark:text-danger-400',
    };

    return (
        <div
            className={cn(
                'relative rounded-2xl bg-white dark:bg-dark-card border border-surface-200 dark:border-dark-border overflow-hidden transition-all duration-300',
                gradientBorder && 'gradient-border',
                hoverable && [
                    'hover:shadow-soft-md hover:-translate-y-1 hover:border-primary-300/50 dark:hover:border-primary-700/50 cursor-pointer',
                    'hover:shadow-glow/20',
                    'active:scale-[0.99]',
                    'before:absolute before:inset-0 before:rounded-2xl before:p-[1px]',
                    'before:bg-gradient-to-br before:from-primary-500/20 before:to-secondary-500/20 before:opacity-0',
                    'before:transition-opacity hover:before:opacity-100',
                ],
                !hoverable && 'shadow-soft',
                className
            )}
            {...props}
        >
            {(title || action || icon) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-dark-border/50 bg-surface-50/50 dark:bg-dark-border/20">
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className={cn(
                                'p-2 rounded-xl',
                                iconColorClasses[iconColor]
                            )}>
                                {icon}
                            </div>
                        )}
                        <div>
                            {title && (
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-dark-text">
                                    {title}
                                </h3>
                            )}
                            {subtitle && (
                                <p className="mt-0.5 text-sm text-slate-500 dark:text-dark-muted">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className={cn(
                !noPadding && 'p-6',
                className?.includes('h-') && 'h-full'
            )}>
                {children}
            </div>
        </div>
    );
};

const CardHeader = ({ children, className, ...props }) => (
    <div
        className={cn(
            'px-6 py-4 border-b border-surface-100 dark:border-dark-border/50 bg-surface-50/50 dark:bg-dark-border/20',
            className
        )}
        {...props}
    >
        {children}
    </div>
);

const CardContent = ({ children, className, ...props }) => (
    <div className={cn('p-6', className)} {...props}>
        {children}
    </div>
);

const CardFooter = ({ children, className, ...props }) => (
    <div
        className={cn(
            'px-6 py-4 border-t border-surface-100 dark:border-dark-border/50 bg-surface-50/50 dark:bg-dark-border/20',
            className
        )}
        {...props}
    >
        {children}
    </div>
);

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
