import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils';

// Tab Panel
const TabPanel = ({
    children,
    value,
    activeValue,
    className,
    ...props
}) => {
    if (value !== activeValue) return null;

    return (
        <div
            className={cn('animate-fade-in', className)}
            {...props}
        >
            {children}
        </div>
    );
};

// Tab List (container for tabs)
const TabList = ({
    children,
    variant = 'underline',
    size = 'md',
    className,
    ...props
}) => {
    const variants = {
        underline: 'border-b border-surface-200 dark:border-dark-border space-x-6',
        pills: 'space-x-2 bg-surface-100 dark:bg-dark-cardHover p-1 rounded-xl',
        'pills-full': 'grid grid-cols-2 sm:grid-cols-4 gap-1 bg-surface-100 dark:bg-dark-cardHover p-1 rounded-xl',
        enclosed: 'border-b border-surface-200 dark:border-dark-border',
        'enclosed-pills': 'border border-surface-200 dark:border-dark-border rounded-xl p-1',
    };

    const sizes = {
        sm: 'text-sm',
        md: 'text-sm',
        lg: 'text-base',
    };

    return (
        <div
            className={cn(
                'flex items-center',
                variants[variant],
                className
            )}
            role="tablist"
            {...props}
        >
            {children}
        </div>
    );
};

// Tab Button
const TabButton = ({
    children,
    active = false,
    disabled = false,
    icon,
    variant = 'underline',
    size = 'md',
    className,
    onClick,
    ...props
}) => {
    const variants = {
        underline: {
            base: 'border-b-2 border-transparent py-3 px-1 transition-all duration-200',
            active: 'border-primary-500 text-primary-600 dark:text-primary-400',
            inactive: 'text-slate-500 dark:text-dark-muted hover:text-slate-700 dark:hover:text-dark-text hover:border-surface-300 dark:hover:border-dark-border',
        },
        pills: {
            base: 'px-4 py-2 rounded-lg transition-all duration-200 font-medium',
            active: 'bg-white dark:bg-dark-card text-primary-600 dark:text-primary-400 shadow-sm',
            inactive: 'text-slate-600 dark:text-dark-muted hover:text-slate-900 dark:hover:text-dark-text',
        },
        'pills-full': {
            base: 'px-4 py-2 rounded-lg transition-all duration-200 font-medium',
            active: 'bg-white dark:bg-dark-card text-primary-600 dark:text-primary-400 shadow-sm',
            inactive: 'text-slate-600 dark:text-dark-muted hover:text-slate-900 dark:hover:text-dark-text',
        },
        enclosed: {
            base: 'border-b-2 border-transparent -mb-px px-4 py-3 transition-all duration-200',
            active: 'border-primary-500 text-primary-600 dark:text-primary-400 bg-surface-50 dark:bg-dark-cardHover',
            inactive: 'text-slate-500 dark:text-dark-muted hover:text-slate-700 dark:hover:text-dark-text hover:bg-surface-50 dark:hover:bg-dark-cardHover',
        },
        'enclosed-pills': {
            base: 'px-4 py-2 rounded-lg transition-all duration-200 font-medium',
            active: 'bg-white dark:bg-dark-card text-primary-600 dark:text-primary-400 shadow-sm',
            inactive: 'text-slate-600 dark:text-dark-muted hover:text-slate-900 dark:hover:text-dark-text',
        },
    };

    const sizes = {
        sm: 'text-xs px-3 py-1.5',
        md: 'text-sm px-4 py-2',
        lg: 'text-base px-5 py-2.5',
    };

    return (
        <button
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                'flex items-center gap-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variants[variant].base,
                active ? variants[variant].active : variants[variant].inactive,
                sizes[size],
                className
            )}
            {...props}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </button>
    );
};

// Animated Tab Button (underline variant)
const AnimatedTabButton = ({
    children,
    active = false,
    disabled = false,
    icon,
    size = 'md',
    className,
    onClick,
    ...props
}) => {
    const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
    const buttonRef = useRef(null);

    useEffect(() => {
        if (active && buttonRef.current) {
            const { offsetWidth, offsetLeft } = buttonRef.current;
            setIndicatorStyle({ width: offsetWidth, left: offsetLeft });
        }
    }, [active]);

    const sizes = {
        sm: 'text-xs px-3 py-2',
        md: 'text-sm px-4 py-3',
        lg: 'text-base px-5 py-3.5',
    };

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                role="tab"
                aria-selected={active}
                disabled={disabled}
                onClick={onClick}
                className={cn(
                    'flex items-center gap-2 relative z-10 whitespace-nowrap transition-colors duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    active
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-slate-500 dark:text-dark-muted hover:text-slate-700 dark:hover:text-dark-text',
                    sizes[size],
                    className
                )}
                onFocus={() => {
                    if (buttonRef.current) {
                        const { offsetWidth, offsetLeft } = buttonRef.current;
                        setIndicatorStyle({ width: offsetWidth, left: offsetLeft });
                    }
                }}
                {...props}
            >
                {icon && <span className="flex-shrink-0">{icon}</span>}
                {children}
            </button>
            {active && (
                <div
                    className="absolute bottom-0 h-0.5 bg-primary-500 rounded-full tab-indicator"
                    style={{
                        width: indicatorStyle.width,
                        left: indicatorStyle.left,
                    }}
                />
            )}
        </div>
    );
};

// Main Tab Component
const Tabs = ({
    value,
    onChange,
    children,
    variant = 'underline',
    size = 'md',
    className,
    ...props
}) => {
    return (
        <div className={cn('w-full', className)} {...props}>
            {children}
        </div>
    );
};

// Tab Group (with state management)
const TabGroup = ({
    defaultValue = 0,
    children,
    onChange,
    className,
    ...props
}) => {
    const [activeTab, setActiveTab] = useState(defaultValue);

    const handleTabChange = (index) => {
        setActiveTab(index);
        onChange?.(index);
    };

    // Clone children and pass active state
    const childrenWithProps = Array.isArray(children)
        ? children.map((child, index) => {
            if (child && child.type === TabList) {
                return React.cloneElement(child, {
                    onChange: handleTabChange,
                    activeTab
                });
            }
            if (child && child.type === TabPanels) {
                return React.cloneElement(child, {
                    activeTab
                });
            }
            return child;
        })
        : children;

    return (
        <div className={cn(className)} {...props}>
            {childrenWithProps}
        </div>
    );
};

// Tab Panels Container
const TabPanels = ({
    children,
    activeTab = 0,
    className,
    ...props
}) => {
    return (
        <div className={cn(className)} {...props}>
            {Array.isArray(children)
                ? children.map((child, index) => (
                    child && React.cloneElement(child, {
                        key: index,
                        activeValue: activeTab,
                        value: index
                    })
                ))
                : children
            }
        </div>
    );
};

Tabs.List = TabList;
Tabs.Button = TabButton;
Tabs.AnimatedButton = AnimatedTabButton;
Tabs.Panel = TabPanel;
Tabs.Panels = TabPanels;
Tabs.Group = TabGroup;

export default Tabs;
