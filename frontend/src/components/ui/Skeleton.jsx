import { cn } from '../../utils';

// Base Skeleton component
const Skeleton = ({
    className,
    variant = 'text',
    width,
    height,
    rounded = 'lg',
    animate = true,
    ...props
}) => {
    const variants = {
        text: 'h-4 w-full',
        title: 'h-6 w-3/4',
        caption: 'h-3 w-1/2',
        avatar: 'w-10 h-10 rounded-full',
        avatarSm: 'w-8 h-8 rounded-full',
        avatarLg: 'w-12 h-12 rounded-full',
        avatarXl: 'w-16 h-16 rounded-full',
        button: 'h-10 w-24 rounded-xl',
        input: 'h-10 w-full rounded-xl',
        card: 'h-48 w-full rounded-2xl',
        cardTitle: 'h-6 w-1/2 rounded-lg',
        cardText: 'h-4 w-3/4 rounded-lg',
        cardImage: 'h-40 w-full rounded-t-2xl',
        badge: 'h-6 w-16 rounded-full',
        image: 'h-48 w-full rounded-xl',
        thumbnail: 'h-20 w-20 rounded-xl',
        tableRow: 'h-12 w-full rounded-lg',
        tableCell: 'h-8 w-24 rounded-lg',
        divider: 'h-px w-full',
        circular: 'rounded-full',
    };

    const roundedClasses = {
        none: 'rounded-none',
        sm: 'rounded',
        md: 'rounded-lg',
        lg: 'rounded-xl',
        xl: 'rounded-2xl',
        full: 'rounded-full',
    };

    return (
        <div
            className={cn(
                'bg-surface-200 dark:bg-dark-border',
                animate && 'animate-skeleton',
                variants[variant],
                roundedClasses[rounded],
                className
            )}
            style={{
                width: width || undefined,
                height: height || undefined,
            }}
            {...props}
        />
    );
};

// Text Skeleton
const TextSkeleton = ({ lines = 3, className, ...props }) => {
    return (
        <div className={cn('space-y-2', className)} {...props}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    width={i === lines - 1 ? '75%' : '100%'}
                    rounded="md"
                />
            ))}
        </div>
    );
};

// Avatar Skeleton
const AvatarSkeleton = ({ size = 'md', className, ...props }) => {
    const sizes = {
        xs: 'w-6 h-6',
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    return (
        <Skeleton
            className={cn('rounded-full', sizes[size])}
            {...props}
        />
    );
};

// Card Skeleton
const CardSkeleton = ({
    showImage = true,
    showTitle = true,
    showText = true,
    textLines = 3,
    className,
    ...props
}) => {
    return (
        <div
            className={cn(
                'bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-dark-border overflow-hidden',
                className
            )}
            {...props}
        >
            {showImage && (
                <Skeleton variant="cardImage" rounded="none" />
            )}
            <div className="p-5 space-y-3">
                {showTitle && (
                    <Skeleton variant="cardTitle" />
                )}
                {showText && (
                    <TextSkeleton lines={textLines} />
                )}
            </div>
        </div>
    );
};

// Table Row Skeleton
const TableRowSkeleton = ({ columns = 5, className, ...props }) => {
    return (
        <div
            className={cn(
                'flex items-center gap-4 p-4 bg-white dark:bg-dark-card border-b border-surface-200 dark:border-dark-border',
                className
            )}
            {...props}
        >
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="tableCell"
                    width={i === 0 ? '15%' : '20%'}
                />
            ))}
        </div>
    );
};

// Table Skeleton
const TableSkeleton = ({
    rows = 5,
    columns = 5,
    showHeader = true,
    className,
    ...props
}) => {
    return (
        <div
            className={cn(
                'bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-dark-border overflow-hidden',
                className
            )}
            {...props}
        >
            {showHeader && (
                <div className="flex items-center gap-4 p-4 bg-surface-50 dark:bg-dark-border/30 border-b border-surface-200 dark:border-dark-border">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton
                            key={i}
                            variant="tableCell"
                            width={i === 0 ? '15%' : '20%'}
                            height="h-4"
                        />
                    ))}
                </div>
            )}
            {Array.from({ length: rows }).map((_, i) => (
                <TableRowSkeleton key={i} columns={columns} />
            ))}
        </div>
    );
};

// Form Skeleton
const FormSkeleton = ({ fields = 3, className, ...props }) => {
    return (
        <div
            className={cn('space-y-4', className)}
            {...props}
        >
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                    <Skeleton variant="text" width="25%" height="h-3" />
                    <Skeleton variant="input" />
                </div>
            ))}
        </div>
    );
};

// Profile Skeleton
const ProfileSkeleton = ({ className, ...props }) => {
    return (
        <div
            className={cn(
                'flex items-center gap-4 p-4 bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-dark-border',
                className
            )}
            {...props}
        >
            <Skeleton variant="avatar" size="lg" />
            <div className="flex-1 space-y-2">
                <Skeleton variant="title" />
                <Skeleton variant="caption" />
            </div>
        </div>
    );
};

// Stat Card Skeleton
const StatCardSkeleton = ({ className, ...props }) => {
    return (
        <div
            className={cn(
                'p-5 bg-white dark:bg-dark-card rounded-2xl border border-surface-200 dark:border-dark-border',
                className
            )}
            {...props}
        >
            <div className="flex items-center justify-between">
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="badge" />
            </div>
            <div className="mt-3">
                <Skeleton variant="title" width="60%" />
            </div>
            <div className="mt-2 flex items-center gap-2">
                <Skeleton variant="text" width="30%" />
            </div>
        </div>
    );
};

// List Skeleton
const ListSkeleton = ({ items = 3, avatar = true, className, ...props }) => {
    return (
        <div
            className={cn('space-y-3', className)}
            {...props}
        >
            {Array.from({ length: items }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-dark-border"
                >
                    {avatar && <Skeleton variant="avatar" size="sm" />}
                    <div className="flex-1 space-y-1.5">
                        <Skeleton variant="text" width="40%" />
                        <Skeleton variant="caption" width="60%" />
                    </div>
                </div>
            ))}
        </div>
    );
};

// Pulse animation wrapper
const Pulse = ({ children, className, ...props }) => (
    <div
        className={cn('animate-pulse-soft', className)}
        {...props}
    >
        {children}
    </div>
);

Skeleton.Pulse = Pulse;
Skeleton.Text = TextSkeleton;
Skeleton.Avatar = AvatarSkeleton;
Skeleton.Card = CardSkeleton;
Skeleton.Table = TableSkeleton;
Skeleton.TableRow = TableRowSkeleton;
Skeleton.Form = FormSkeleton;
Skeleton.Profile = ProfileSkeleton;
Skeleton.StatCard = StatCardSkeleton;
Skeleton.List = ListSkeleton;

export default Skeleton;
