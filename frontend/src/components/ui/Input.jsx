import { forwardRef, useState } from 'react';
import { cn } from '../../utils';

const Input = forwardRef(({
    className,
    type = 'text',
    label,
    error,
    helperText,
    icon,
    rightIcon,
    size = 'md',
    variant = 'default',
    fullWidth = true,
    required,
    disabled,
    ...props
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-4 py-3 text-base',
    };

    const variants = {
        default: {
            base: 'border-surface-300 dark:border-dark-border',
            focus: 'focus:border-primary-500 focus:ring-primary-500/30',
            error: 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
        },
        filled: {
            base: 'border-transparent bg-surface-100 dark:bg-dark-cardHover dark:border-dark-border',
            focus: 'focus:border-primary-500 focus:ring-primary-500/30 bg-white dark:bg-dark-card',
            error: 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20 bg-white dark:bg-dark-card',
        },
        minimal: {
            base: 'border-transparent bg-transparent',
            focus: 'focus:border-primary-500 focus:ring-primary-500/30',
            error: 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
        },
    };

    const currentVariant = variants[variant];

    return (
        <div className={cn(fullWidth && 'w-full')}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-dark-text mb-1.5 transition-colors duration-200">
                    {label}
                    {required && <span className="text-danger-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative group">
                {/* Left Icon */}
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className={cn(
                            'transition-colors duration-200',
                            isFocused ? 'text-primary-500' : 'text-slate-400 dark:text-dark-muted'
                        )}>
                            {icon}
                        </span>
                    </div>
                )}

                <input
                    type={type}
                    ref={ref}
                    disabled={disabled}
                    required={required}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={cn(
                        'w-full rounded-xl border bg-white text-slate-900 dark:text-dark-text',
                        'placeholder:text-slate-400 dark:placeholder:text-dark-muted',
                        'transition-all duration-200',
                        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-50 dark:disabled:bg-dark-bg',
                        'focus:outline-none focus:ring-2',
                        sizes[size],
                        currentVariant.base,
                        error ? currentVariant.error : currentVariant.focus,
                        icon && 'pl-10',
                        rightIcon && 'pr-10',
                        className
                    )}
                    {...props}
                />

                {/* Right Icon / Clear button */}
                {rightIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className={cn(
                            'transition-colors duration-200',
                            isFocused ? 'text-primary-500' : 'text-slate-400 dark:text-dark-muted'
                        )}>
                            {rightIcon}
                        </span>
                    </div>
                )}

                {/* Animated focus ring */}
                <div className={cn(
                    'absolute inset-0 rounded-xl pointer-events-none transition-all duration-300',
                    isFocused && !error && 'ring-2 ring-primary-500/20'
                )}>
                    {isFocused && !error && (
                        <div className="absolute inset-0 rounded-xl animate-pulse-border" />
                    )}
                </div>
            </div>

            {/* Error message */}
            {error && (
                <p className="mt-1.5 text-sm text-danger-500 transition-all duration-200 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}

            {/* Helper text */}
            {helperText && !error && (
                <p className="mt-1.5 text-sm text-slate-500 dark:text-dark-muted transition-colors duration-200">
                    {helperText}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

// Textarea variant
const Textarea = forwardRef(({
    className,
    label,
    error,
    helperText,
    rows = 4,
    required,
    disabled,
    ...props
}, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-dark-text mb-1.5 transition-colors duration-200">
                    {label}
                    {required && <span className="text-danger-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative group">
                <textarea
                    ref={ref}
                    rows={rows}
                    disabled={disabled}
                    required={required}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={cn(
                        'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 dark:text-dark-text',
                        'placeholder:text-slate-400 dark:placeholder:text-dark-muted',
                        'transition-all duration-200 resize-none',
                        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-50 dark:disabled:bg-dark-bg',
                        'focus:outline-none focus:ring-2',
                        'border-surface-300 dark:border-dark-border',
                        error
                            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
                            : 'focus:border-primary-500 focus:ring-primary-500/30',
                        className
                    )}
                    {...props}
                />
                <div className={cn(
                    'absolute inset-0 rounded-xl pointer-events-none transition-all duration-300',
                    isFocused && !error && 'ring-2 ring-primary-500/20'
                )} />
            </div>
            {error && (
                <p className="mt-1.5 text-sm text-danger-500 transition-all duration-200 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p className="mt-1.5 text-sm text-slate-500 dark:text-dark-muted transition-colors duration-200">
                    {helperText}
                </p>
            )}
        </div>
    );
});

Textarea.displayName = 'Textarea';

Input.Textarea = Textarea;

export default Input;
