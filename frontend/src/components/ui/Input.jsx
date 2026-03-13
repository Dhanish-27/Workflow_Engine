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
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                    {label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-400">{icon}</span>
                    </div>
                )}
                <input
                    type={type}
                    ref={ref}
                    className={cn(
                        'w-full rounded-lg border bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                        'border-gray-300 focus:border-primary-500 focus:ring-primary-500/20',
                        'dark:bg-dark-card dark:border-dark-border dark:text-dark-text dark:placeholder-dark-muted dark:focus:border-primary-400',
                        icon && 'pl-10',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                        className
                    )}
                    {...props}
                />
            </div>
            {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
            {helperText && !error && (
                <p className="mt-1.5 text-sm text-gray-500 dark:text-dark-muted">{helperText}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
