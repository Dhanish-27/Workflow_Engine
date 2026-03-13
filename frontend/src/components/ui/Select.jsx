import { forwardRef } from 'react';
import { cn } from '../../utils';

const Select = forwardRef(({
    className,
    label,
    error,
    helperText,
    options = [],
    placeholder = 'Select an option',
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
            <select
                ref={ref}
                className={cn(
                    'w-full rounded-lg border bg-white px-3 py-2 text-sm appearance-none cursor-pointer',
                    'border-gray-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                    'dark:bg-dark-card dark:border-dark-border dark:text-dark-text',
                    error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                    className
                )}
                {...props}
            >
                <option value="" disabled>
                    {placeholder}
                </option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
            {helperText && !error && (
                <p className="mt-1.5 text-sm text-gray-500 dark:text-dark-muted">{helperText}</p>
            )}
        </div>
    );
});

Select.displayName = 'Select';

export default Select;
