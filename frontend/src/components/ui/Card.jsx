import { cn } from '../../utils';

const Card = ({
    children,
    className,
    title,
    subtitle,
    action,
    noPadding = false,
    hoverable = false,
    ...props
}) => {
    return (
        <div
            className={cn(
                'rounded-xl bg-white dark:bg-dark-card border border-gray-200/60 dark:border-dark-border/60 overflow-hidden transition-all duration-300',
                hoverable && 'hover:shadow-lg hover:-translate-y-0.5 hover:border-primary-500/30 dark:hover:border-primary-500/30 cursor-pointer',
                !hoverable && 'shadow-sm',
                className
            )}
            {...props}
        >
            {(title || action) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/50 dark:border-dark-border/50 bg-gray-50/30 dark:bg-dark-border/20">
                    <div>
                        {title && (
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-dark-muted">
                                {subtitle}
                            </p>
                        )}
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
    <div className={cn('px-6 py-4 border-b border-gray-100/50 dark:border-dark-border/50 bg-gray-50/30 dark:bg-dark-border/20', className)} {...props}>
        {children}
    </div>
);

const CardContent = ({ children, className, ...props }) => (
    <div className={cn('p-6', className)} {...props}>
        {children}
    </div>
);

const CardFooter = ({ children, className, ...props }) => (
    <div className={cn('px-6 py-4 border-t border-gray-100/50 dark:border-dark-border/50 bg-gray-50/30 dark:bg-dark-border/20', className)} {...props}>
        {children}
    </div>
);

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
