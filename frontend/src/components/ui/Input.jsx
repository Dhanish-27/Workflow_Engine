import { forwardRef } from 'react';
import { cn } from '../../utils';

const Input = forwardRef(({
    className,
    type = 'text',
    label,
    error,
    helperText,
    icon,
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5 transition-colors duration-200">
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400 group-focus-within:text-primary-500 transition-colors duration-200">{icon}</span>
                    </div>
                )}
                <input
                    type={type}
                    ref={ref}
                    className={cn(
                        'w-full rounded-lg border bg-white px-3 py-2.5 text-sm placeholder-gray-400 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
                        'border-gray-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20',
                        'dark:bg-dark-card dark:border-dark-border dark:text-dark-text dark:placeholder-dark-muted dark:focus:border-primary-400 dark:focus:ring-primary-400/20',
                        icon && 'pl-10',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:focus:border-red-400 dark:focus:ring-red-400/20',
                        className
                    )}
                    {...props}
                />
                {/* Animated focus indicator */}
                <div className="absolute inset-0 rounded-lg pointer-events-none transition-all duration-300 opacity-0 group-focus-within:opacity-100">
                    <div className="absolute inset-0 rounded-lg ring-2 ring-primary-500/30 animate-pulse-border" />
                </div>
            </div>
            {error && <p className="mt-1.5 text-sm text-red-500 transition-all duration-200">{error}</p>}
            {helperText && !error && (
                <p className="mt-1.5 text-sm text-gray-500 dark:text-dark-muted transition-colors duration-200">{helperText}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
