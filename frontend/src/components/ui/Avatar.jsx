import { useState } from 'react';
import { cn } from '../../utils';

// Generate initials from name
const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Get color based on name (for consistent avatar colors)
const getColorFromName = (name) => {
    if (!name) return 0;
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        'bg-primary-500',
        'bg-secondary-500',
        'bg-success-500',
        'bg-warning-500',
        'bg-danger-500',
        'bg-indigo-500',
        'bg-violet-500',
        'bg-emerald-500',
        'bg-amber-500',
        'bg-rose-500',
    ];
    return colors[Math.abs(hash) % colors.length];
};

const Avatar = ({
    src,
    alt,
    name,
    size = 'md',
    status,
    rounded = true,
    className,
    onClick,
    ...props
}) => {
    const [imageError, setImageError] = useState(false);

    const sizes = {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
        '2xl': 'w-20 h-20 text-xl',
    };

    const statusSizes = {
        xs: 'w-1.5 h-1.5 border',
        sm: 'w-2 h-2 border',
        md: 'w-2.5 h-2.5 border-2',
        lg: 'w-3 h-3 border-2',
        xl: 'w-3.5 h-3.5 border-2',
        '2xl': 'w-4 h-4 border-2',
    };

    const statusColors = {
        online: 'bg-success-500',
        offline: 'bg-slate-400',
        busy: 'bg-danger-500',
        away: 'bg-warning-500',
        offline: 'bg-slate-400',
    };

    const showFallback = !src || imageError;

    return (
        <div
            className={cn(
                'relative inline-flex flex-shrink-0',
                rounded && 'rounded-full',
                !rounded && 'rounded-xl',
                sizes[size],
                onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
                className
            )}
            onClick={onClick}
            {...props}
        >
            {showFallback ? (
                <div
                    className={cn(
                        'w-full h-full flex items-center justify-center font-semibold text-white',
                        getColorFromName(name)
                    )}
                >
                    {getInitials(name || alt)}
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt || name}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                />
            )}

            {/* Status indicator */}
            {status && (
                <span
                    className={cn(
                        'absolute bottom-0 right-0 rounded-full',
                        statusSizes[size],
                        statusColors[status],
                        'ring-2 ring-white dark:ring-dark-bg'
                    )}
                />
            )}
        </div>
    );
};

// Avatar Group for stacking multiple avatars
const AvatarGroup = ({
    children,
    max = 4,
    size = 'md',
    className,
    ...props
}) => {
    const childArray = Array.isArray(children) ? children : [children];
    const visibleAvatars = childArray.slice(0, max);
    const remainingCount = childArray.length - max;

    const sizes = {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-lg',
        '2xl': 'w-20 h-20 text-xl',
    };

    const overlapSizes = {
        xs: '-ml-1',
        sm: '-ml-1.5',
        md: '-ml-2',
        lg: '-ml-2.5',
        xl: '-ml-3',
        '2xl': '-ml-4',
    };

    return (
        <div
            className={cn('flex items-center', className)}
            {...props}
        >
            {visibleAvatars.map((child, index) => (
                <div
                    key={index}
                    className={cn(
                        'relative ring-2 ring-white dark:ring-dark-bg',
                        index > 0 && overlapSizes[size]
                    )}
                    style={{ zIndex: visibleAvatars.length - index }}
                >
                    {child}
                </div>
            ))}
            {remainingCount > 0 && (
                <div
                    className={cn(
                        'relative flex items-center justify-center rounded-full bg-surface-200 dark:bg-dark-border text-slate-600 dark:text-dark-text font-medium ring-2 ring-white dark:ring-dark-bg',
                        sizes[size],
                        overlapSizes[size]
                    )}
                >
                    +{remainingCount}
                </div>
            )}
        </div>
    );
};

Avatar.Group = AvatarGroup;

export default Avatar;
