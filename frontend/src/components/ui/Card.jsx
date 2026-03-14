import { cn } from '../../utils';

const Card = ({
    children,
    className,
    title,
    subtitle,
    action,
    noPadding = false,
    ...props
}) => {
    return (
        <div
            className={cn(
                'rounded-xl bg-white shadow-sm border border-gray-100 dark:bg-dark-card dark:border-dark-border overflow-hidden',
                className
            )}
            {...props}
        >
            {(title || action) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-dark-border">
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
    <div className={cn('px-6 py-4 border-b border-gray-100 dark:border-dark-border', className)} {...props}>
        {children}
    </div>
);

const CardContent = ({ children, className, ...props }) => (
    <div className={cn('p-6', className)} {...props}>
        {children}
    </div>
);

const CardFooter = ({ children, className, ...props }) => (
    <div className={cn('px-6 py-4 border-t border-gray-100 dark:border-dark-border', className)} {...props}>
        {children}
    </div>
);

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
