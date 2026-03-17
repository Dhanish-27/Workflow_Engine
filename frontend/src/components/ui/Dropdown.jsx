import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils';

// Dropdown Menu Item
const MenuItem = ({
    children,
    onClick,
    disabled = false,
    icon,
    danger = false,
    className,
    ...props
}) => {
    return (
        <button
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors duration-150',
                'focus:outline-none focus:bg-surface-100 dark:focus:bg-dark-cardHover',
                disabled && 'opacity-50 cursor-not-allowed',
                danger
                    ? 'text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20'
                    : 'text-slate-700 dark:text-dark-text hover:bg-surface-100 dark:hover:bg-dark-cardHover',
                !danger && 'hover:bg-surface-100 dark:hover:bg-dark-cardHover',
                className
            )}
            {...props}
        >
            {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
            {children}
        </button>
    );
};

// Dropdown Menu Divider
const Divider = ({ className }) => (
    <div className={cn('my-1 h-px bg-surface-200 dark:bg-dark-border', className)} />
);

// Dropdown Menu Header
const Header = ({ children, className }) => (
    <div className={cn('px-3 py-2 text-xs font-semibold text-slate-500 dark:text-dark-muted uppercase tracking-wider', className)}>
        {children}
    </div>
);

// Main Dropdown Component
const Dropdown = ({
    trigger,
    children,
    align = 'left',
    width = 'auto',
    open = undefined,
    onOpenChange,
    className,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isControlled = open !== undefined;
    const isCurrentlyOpen = isControlled ? open : isOpen;

    const handleToggle = () => {
        if (isControlled) {
            onOpenChange?.(!isCurrentlyOpen);
        } else {
            setIsOpen(!isOpen);
        }
    };

    const handleClose = () => {
        if (isControlled) {
            onOpenChange?.(false);
        } else {
            setIsOpen(false);
        }
    };

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                handleClose();
            }
        };

        if (isCurrentlyOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isCurrentlyOpen]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };

        if (isCurrentlyOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isCurrentlyOpen]);

    const alignClasses = {
        left: 'left-0',
        right: 'right-0',
        center: 'left-1/2 -translate-x-1/2',
    };

    const widthClasses = {
        auto: 'w-auto',
        sm: 'w-40',
        md: 'w-48',
        lg: 'w-56',
        xl: 'w-64',
        full: 'w-full',
    };

    return (
        <div
            ref={dropdownRef}
            className={cn('relative inline-block', className)}
            {...props}
        >
            {/* Trigger */}
            <div onClick={handleToggle} className="cursor-pointer">
                {trigger}
            </div>

            {/* Menu */}
            {isCurrentlyOpen && (
                <div
                    className={cn(
                        'absolute z-50 mt-2 py-1 bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-dark-border shadow-soft-md',
                        'animate-scale-in origin-top-left',
                        alignClasses[align],
                        widthClasses[width]
                    )}
                    role="menu"
                >
                    {children}
                </div>
            )}
        </div>
    );
};

// Dropdown Menu (wrapper for menu items)
const Menu = ({ children, className, ...props }) => (
    <div className={cn('', className)} {...props}>
        {children}
    </div>
);

// Select-like Dropdown with label
const Select = ({
    label,
    value,
    placeholder = 'Select...',
    options = [],
    onChange,
    disabled = false,
    error,
    className,
    ...props
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState(options.find(o => o.value === value));
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        setSelectedOption(option);
        onChange?.(option.value);
        setIsOpen(false);
    };

    return (
        <div className={cn('relative', className)} ref={dropdownRef}>
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-dark-text mb-1.5">
                    {label}
                </label>
            )}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'w-full flex items-center justify-between px-4 py-2.5 text-sm text-left rounded-xl border transition-all duration-200',
                    'bg-white dark:bg-dark-card border-surface-300 dark:border-dark-border',
                    'text-slate-900 dark:text-dark-text',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500',
                    error && 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
                    disabled && 'opacity-50 cursor-not-allowed'
                )}
            >
                <span className={selectedOption ? '' : 'text-slate-400'}>
                    {selectedOption?.label || placeholder}
                </span>
                <svg
                    className={cn(
                        'w-5 h-5 text-slate-400 transition-transform duration-200',
                        isOpen && 'rotate-180'
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className={cn(
                        'absolute z-50 w-full mt-1 py-1 bg-white dark:bg-dark-card rounded-xl border border-surface-200 dark:border-dark-border shadow-soft-md',
                        'animate-scale-in origin-top'
                    )}
                >
                    {options.map((option) => (
                        <MenuItem
                            key={option.value}
                            onClick={() => handleSelect(option)}
                            className={cn(
                                selectedOption?.value === option.value &&
                                'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                            )}
                        >
                            {option.icon && <span className="w-4 h-4">{option.icon}</span>}
                            {option.label}
                        </MenuItem>
                    ))}
                </div>
            )}

            {error && (
                <p className="mt-1.5 text-sm text-danger-500">{error}</p>
            )}
        </div>
    );
};

Dropdown.Menu = Menu;
Dropdown.MenuItem = MenuItem;
Dropdown.Divider = Divider;
Dropdown.Header = Header;
Dropdown.Select = Select;

export default Dropdown;
