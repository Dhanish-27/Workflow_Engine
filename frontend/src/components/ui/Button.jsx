import { forwardRef, useState, useRef } from 'react';
import { cn } from '../../utils';

const Button = forwardRef(({
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    children,
    leftIcon,
    rightIcon,
    ripple = true,
    fullWidth = false,
    ...props
}, ref) => {
    const [ripples, setRipples] = useState([]);
    const buttonRef = useRef(ref);

    const variants = {
        // Gradient variants
        primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 hover:shadow-glow focus:ring-primary-500',
        secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white hover:from-secondary-600 hover:to-secondary-700 hover:shadow-glow focus:ring-secondary-500',

        // Solid variants
        danger: 'bg-gradient-to-r from-danger-500 to-danger-600 text-white hover:from-danger-600 hover:to-danger-700 focus:ring-danger-500',
        success: 'bg-gradient-to-r from-success-500 to-success-600 text-white hover:from-success-600 hover:to-success-700 focus:ring-success-500',
        warning: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 focus:ring-yellow-500',

        // Outline/light variants
        outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20 focus:ring-primary-500',
        outlineSecondary: 'border-2 border-secondary-500 text-secondary-600 hover:bg-secondary-50 dark:border-secondary-400 dark:text-secondary-400 dark:hover:bg-secondary-900/20 focus:ring-secondary-500',

        // Ghost variants
        ghost: 'bg-transparent hover:bg-surface-100 text-slate-700 dark:text-dark-text dark:hover:bg-dark-cardHover focus:ring-primary-500',
        ghostPrimary: 'bg-transparent hover:bg-primary-50 text-primary-600 dark:hover:bg-primary-900/20 dark:text-primary-400 focus:ring-primary-500',
        ghostDanger: 'bg-transparent hover:bg-danger-50 text-danger-600 dark:hover:bg-danger-900/20 dark:text-danger-400 focus:ring-danger-500',

        // Subtle variants
        subtle: 'bg-surface-100 text-slate-700 hover:bg-surface-200 dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-cardHover focus:ring-primary-500',
        subtlePrimary: 'bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50 focus:ring-primary-500',
    };

    const sizes = {
        xs: 'px-2.5 py-1.5 text-xs gap-1',
        sm: 'px-3 py-1.5 text-sm gap-1.5',
        md: 'px-4 py-2.5 text-sm gap-2',
        lg: 'px-5 py-3 text-base gap-2',
        xl: 'px-6 py-3.5 text-base gap-2.5',
        icon: 'p-2.5',
        'icon-sm': 'p-1.5',
        'icon-lg': 'p-3',
    };

    const handleRipple = (e) => {
        if (!ripple || isLoading || disabled) return;

        const button = buttonRef.current;
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newRipple = {
            id: Date.now(),
            x,
            y,
        };

        setRipples(prev => [...prev, newRipple]);

        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 600);
    };

    const Spinner = () => (
        <svg
            className="animate-spin h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );

    const IconLeft = () => leftIcon && (
        <span className="flex-shrink-0">{leftIcon}</span>
    );

    const IconRight = () => rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
    );

    return (
        <button
            ref={buttonRef}
            className={cn(
                'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                'dark:focus:ring-offset-dark-bg',
                'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
                'active:scale-[0.98] transform-gpu',
                fullWidth && 'w-full',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || isLoading}
            onClick={handleRipple}
            {...props}
        >
            {/* Ripple effects */}
            {ripples.map(ripple => (
                <span
                    key={ripple.id}
                    className="absolute rounded-full bg-white/30 pointer-events-none"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: '100px',
                        height: '100px',
                        transform: 'translate(-50%, -50%)',
                        animation: 'ripple 0.6s ease-out',
                    }}
                />
            ))}

            {/* Content */}
            <span className={cn(
                'flex items-center justify-center gap-2',
                isLoading && 'opacity-0'
            )}>
                <IconLeft />
                {!isLoading && children}
                {isLoading && <span className="absolute inset-0 flex items-center justify-center">
                    <Spinner />
                </span>}
                <IconRight />
            </span>
        </button>
    );
});

Button.displayName = 'Button';

// IconButton variant
const IconButton = forwardRef(({
    className,
    variant = 'ghost',
    size = 'icon',
    children,
    ...props
}, ref) => {
    return (
        <Button
            ref={ref}
            variant={variant}
            size={size}
            className={cn('rounded-xl', className)}
            {...props}
        >
            {children}
        </Button>
    );
});

IconButton.displayName = 'IconButton';

Button.Icon = IconButton;

export default Button;
