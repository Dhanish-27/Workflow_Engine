import { cn } from '../../utils';

// Role icon components
const AdminIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const ManagerIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const EmployeeIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const FinanceIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CeoIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

// Role configuration
const roleConfig = {
    admin: {
        variant: 'indigo',
        bgLight: 'bg-indigo-100 dark:bg-indigo-900/30',
        bgDark: 'bg-indigo-500',
        textLight: 'text-indigo-700 dark:text-indigo-300',
        textDark: 'text-white',
        borderLight: 'border-indigo-200 dark:border-indigo-800',
        borderDark: 'border-indigo-600',
        icon: AdminIcon,
        label: 'Admin',
    },
    manager: {
        variant: 'violet',
        bgLight: 'bg-violet-100 dark:bg-violet-900/30',
        bgDark: 'bg-violet-500',
        textLight: 'text-violet-700 dark:text-violet-300',
        textDark: 'text-white',
        borderLight: 'border-violet-200 dark:border-violet-800',
        borderDark: 'border-violet-600',
        icon: ManagerIcon,
        label: 'Manager',
    },
    employee: {
        variant: 'slate',
        bgLight: 'bg-slate-100 dark:bg-slate-800',
        bgDark: 'bg-slate-500',
        textLight: 'text-slate-700 dark:text-slate-300',
        textDark: 'text-white',
        borderLight: 'border-slate-200 dark:border-slate-700',
        borderDark: 'border-slate-600',
        icon: EmployeeIcon,
        label: 'Employee',
    },
    finance: {
        variant: 'emerald',
        bgLight: 'bg-emerald-100 dark:bg-emerald-900/30',
        bgDark: 'bg-emerald-500',
        textLight: 'text-emerald-700 dark:text-emerald-300',
        textDark: 'text-white',
        borderLight: 'border-emerald-200 dark:border-emerald-800',
        borderDark: 'border-emerald-600',
        icon: FinanceIcon,
        label: 'Finance',
    },
    ceo: {
        variant: 'amber',
        bgLight: 'bg-amber-100 dark:bg-amber-900/30',
        bgDark: 'bg-amber-500',
        textLight: 'text-amber-700 dark:text-amber-300',
        textDark: 'text-white',
        borderLight: 'border-amber-200 dark:border-amber-800',
        borderDark: 'border-amber-600',
        icon: CeoIcon,
        label: 'CEO',
    },
    owner: {
        variant: 'rose',
        bgLight: 'bg-rose-100 dark:bg-rose-900/30',
        bgDark: 'bg-rose-500',
        textLight: 'text-rose-700 dark:text-rose-300',
        textDark: 'text-white',
        borderLight: 'border-rose-200 dark:border-rose-800',
        borderDark: 'border-rose-600',
        icon: CeoIcon,
        label: 'Owner',
    },
    viewer: {
        variant: 'default',
        bgLight: 'bg-slate-100 dark:bg-slate-800',
        bgDark: 'bg-slate-400',
        textLight: 'text-slate-600 dark:text-slate-400',
        textDark: 'text-white',
        borderLight: 'border-slate-200 dark:border-slate-700',
        borderDark: 'border-slate-500',
        icon: UserIcon,
        label: 'Viewer',
    },
    default: {
        variant: 'default',
        bgLight: 'bg-slate-100 dark:bg-slate-800',
        bgDark: 'bg-slate-400',
        textLight: 'text-slate-600 dark:text-slate-400',
        textDark: 'text-white',
        borderLight: 'border-slate-200 dark:border-slate-700',
        borderDark: 'border-slate-500',
        icon: UserIcon,
        label: 'User',
    },
};

// Get role config by role name
const getRoleConfig = (role) => {
    const normalizedRole = role?.toLowerCase().trim();
    return roleConfig[normalizedRole] || roleConfig.default;
};

// Role Badge Component
const RoleBadge = ({
    role,
    size = 'md',
    showIcon = true,
    variant = 'filled', // 'filled', 'outline', 'soft'
    className,
    ...props
}) => {
    const config = getRoleConfig(role);
    const Icon = config.icon;

    const sizes = {
        xs: {
            container: 'px-1.5 py-0.5 text-[10px]',
            icon: 'w-2.5 h-2.5',
            gap: 'gap-1',
        },
        sm: {
            container: 'px-2 py-0.5 text-xs',
            icon: 'w-3 h-3',
            gap: 'gap-1',
        },
        md: {
            container: 'px-2.5 py-1 text-sm',
            icon: 'w-3.5 h-3.5',
            gap: 'gap-1.5',
        },
        lg: {
            container: 'px-3 py-1.5 text-base',
            icon: 'w-4 h-4',
            gap: 'gap-2',
        },
    };

    const sizeStyles = sizes[size] || sizes.md;

    // Variant styles
    const getVariantStyles = () => {
        if (variant === 'filled') {
            return {
                container: `${config.bgDark} ${config.textDark}`,
                icon: 'text-white/90',
            };
        }
        if (variant === 'outline') {
            return {
                container: `border ${config.borderLight} dark:border-${config.borderDark.replace('border-', '')} ${config.textLight}`,
                icon: '',
            };
        }
        // soft variant (default)
        return {
            container: `${config.bgLight} ${config.textLight}`,
            icon: '',
        };
    };

    const variantStyles = getVariantStyles();

    return (
        <span
            className={cn(
                'inline-flex items-center font-medium rounded-full',
                sizeStyles.container,
                variantStyles.container,
                className
            )}
            {...props}
        >
            {showIcon && <span className={cn(sizeStyles.icon, variantStyles.icon)}><Icon /></span>}
            {config.label || role}
        </span>
    );
};

// Role Badge with Avatar
const RoleBadgeWithAvatar = ({
    role,
    name,
    avatar,
    size = 'md',
    showIcon = true,
    variant = 'soft',
    className,
    ...props
}) => {
    const config = getRoleConfig(role);

    return (
        <div
            className={cn(
                'inline-flex items-center gap-2',
                className
            )}
            {...props}
        >
            <div className="relative">
                {avatar ? (
                    <img
                        src={avatar}
                        alt={name}
                        className={cn(
                            'rounded-full object-cover',
                            size === 'xs' && 'w-5 h-5',
                            size === 'sm' && 'w-6 h-6',
                            size === 'md' && 'w-8 h-8',
                            size === 'lg' && 'w-10 h-10',
                        )}
                    />
                ) : (
                    <div className={cn(
                        'rounded-full flex items-center justify-center font-semibold text-white',
                        config.bgDark,
                        size === 'xs' && 'w-5 h-5 text-[10px]',
                        size === 'sm' && 'w-6 h-6 text-xs',
                        size === 'md' && 'w-8 h-8 text-sm',
                        size === 'lg' && 'w-10 h-10 text-base',
                    )}>
                        {name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                )}
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-900 dark:text-dark-text">
                    {name}
                </span>
                <RoleBadge
                    role={role}
                    size={size === 'lg' ? 'sm' : 'xs'}
                    showIcon={showIcon}
                    variant={variant}
                />
            </div>
        </div>
    );
};

// Role Badge Group (for multiple roles)
const RoleBadgeGroup = ({
    roles = [],
    size = 'md',
    showIcon = true,
    variant = 'soft',
    max = 3,
    className,
    ...props
}) => {
    const displayRoles = roles.slice(0, max);
    const remaining = roles.length - max;

    return (
        <div
            className={cn(
                'flex flex-wrap gap-1.5',
                className
            )}
            {...props}
        >
            {displayRoles.map((role, index) => (
                <RoleBadge
                    key={index}
                    role={role}
                    size={size}
                    showIcon={showIcon}
                    variant={variant}
                />
            ))}
            {remaining > 0 && (
                <span className={cn(
                    'inline-flex items-center justify-center rounded-full bg-surface-200 dark:bg-dark-border text-slate-600 dark:text-dark-muted font-medium',
                    size === 'xs' && 'px-1.5 py-0.5 text-[10px]',
                    size === 'sm' && 'px-2 py-0.5 text-xs',
                    size === 'md' && 'px-2.5 py-1 text-sm',
                    size === 'lg' && 'px-3 py-1.5 text-base',
                )}>
                    +{remaining}
                </span>
            )}
        </div>
    );
};

// Role Select (for dropdowns)
const RoleSelect = ({
    value,
    onChange,
    size = 'md',
    className,
    ...props
}) => {
    const roles = Object.keys(roleConfig).filter(r => r !== 'default');

    return (
        <select
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
                'block w-full rounded-xl border border-surface-200 dark:border-dark-border bg-white dark:bg-dark-card px-3 py-2 text-slate-900 dark:text-dark-text',
                'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                'transition-colors duration-200',
                size === 'sm' && 'text-sm',
                size === 'md' && 'text-base',
                size === 'lg' && 'text-lg',
                className
            )}
            {...props}
        >
            {roles.map((role) => (
                <option key={role} value={role}>
                    {roleConfig[role]?.label || role}
                </option>
            ))}
        </select>
    );
};

// Export all components
export {
    RoleBadge,
    RoleBadgeWithAvatar,
    RoleBadgeGroup,
    RoleSelect,
    roleConfig,
};

export default RoleBadge;
