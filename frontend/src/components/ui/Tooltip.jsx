import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils';

const Tooltip = ({
    children,
    content,
    placement = 'top',
    theme = 'dark',
    delay = 300,
    offset = 8,
    animation = true,
    className,
    arrow = true,
    ...props
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);
    let showTimeout = useRef(null);
    let hideTimeout = useRef(null);

    const getPlacementStyles = () => {
        const baseStyles = 'absolute z-50';
        const spacing = `${offset}px`;

        const placements = {
            top: {
                container: `${baseStyles} bottom-full left-1/2 -translate-x-1/2 mb-${offset}`,
                arrow: `${baseStyles} top-full left-1/2 -translate-x-1/2`,
            },
            'top-start': {
                container: `${baseStyles} bottom-full left-0 mb-${offset}`,
                arrow: `${baseStyles} top-full left-2`,
            },
            'top-end': {
                container: `${baseStyles} bottom-full right-0 mb-${offset}`,
                arrow: `${baseStyles} top-full right-2`,
            },
            bottom: {
                container: `${baseStyles} top-full left-1/2 -translate-x-1/2 mt-${offset}`,
                arrow: `${baseStyles} bottom-full left-1/2 -translate-x-1/2`,
            },
            'bottom-start': {
                container: `${baseStyles} top-full left-0 mt-${offset}`,
                arrow: `${baseStyles} bottom-full left-2`,
            },
            'bottom-end': {
                container: `${baseStyles} top-full right-0 mt-${offset}`,
                arrow: `${baseStyles} bottom-full right-2`,
            },
            left: {
                container: `${baseStyles} right-full top-1/2 -translate-y-1/2 mr-${offset}`,
                arrow: `${baseStyles} left-full top-1/2 -translate-y-1/2`,
            },
            'left-start': {
                container: `${baseStyles} right-full top-0 mr-${offset}`,
                arrow: `${baseStyles} left-full top-2`,
            },
            'left-end': {
                container: `${baseStyles} right-full bottom-0 mr-${offset}`,
                arrow: `${baseStyles} left-full bottom-2`,
            },
            right: {
                container: `${baseStyles} left-full top-1/2 -translate-y-1/2 ml-${offset}`,
                arrow: `${baseStyles} right-full top-1/2 -translate-y-1/2`,
            },
            'right-start': {
                container: `${baseStyles} left-full top-0 ml-${offset}`,
                arrow: `${baseStyles} right-full top-2`,
            },
            'right-end': {
                container: `${baseStyles} left-full bottom-0 ml-${offset}`,
                arrow: `${baseStyles} right-full bottom-2`,
            },
        };

        return placements[placement] || placements.top;
    };

    const handleMouseEnter = () => {
        clearTimeout(hideTimeout);
        showTimeout.current = setTimeout(() => {
            setIsVisible(true);
            updatePosition();
        }, delay);
    };

    const handleMouseLeave = () => {
        clearTimeout(showTimeout);
        hideTimeout.current = setTimeout(() => {
            setIsVisible(false);
        }, delay);
    };

    const updatePosition = () => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const trigger = triggerRef.current.getBoundingClientRect();
        const tooltip = tooltipRef.current.getBoundingClientRect();

        let x = 0;
        let y = 0;

        // Center by default
        x = trigger.width / 2 - tooltip.width / 2;
        y = -tooltip.height - offset;

        // Adjust based on placement
        switch (placement) {
            case 'top':
            case 'top-start':
            case 'top-end':
                y = -tooltip.height - offset;
                if (placement === 'top-start') x = 0;
                if (placement === 'top-end') x = trigger.width - tooltip.width;
                break;
            case 'bottom':
            case 'bottom-start':
            case 'bottom-end':
                y = trigger.height + offset;
                if (placement === 'bottom-start') x = 0;
                if (placement === 'bottom-end') x = trigger.width - tooltip.width;
                break;
            case 'left':
            case 'left-start':
            case 'left-end':
                x = -tooltip.width - offset;
                if (placement === 'left-start') y = 0;
                if (placement === 'left-end') y = trigger.height - tooltip.height;
                break;
            case 'right':
            case 'right-start':
            case 'right-end':
                x = trigger.width + offset;
                if (placement === 'right-start') y = 0;
                if (placement === 'right-end') y = trigger.height - tooltip.height;
                break;
        }

        setCoords({ x, y });
    };

    // Handle click to show tooltip (for mobile)
    const handleClick = () => {
        setIsVisible(!isVisible);
        if (!isVisible) {
            setTimeout(updatePosition, 0);
        }
    };

    useEffect(() => {
        if (isVisible) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
        }

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isVisible]);

    const placementStyles = getPlacementStyles();

    const themeStyles = {
        light: 'bg-white text-slate-900 border border-surface-200 shadow-soft',
        dark: 'bg-dark-bg text-dark-text border border-dark-border shadow-soft-md',
        primary: 'bg-primary-600 text-white',
        success: 'bg-success-600 text-white',
        warning: 'bg-warning-600 text-white',
        danger: 'bg-danger-600 text-white',
    };

    const arrowRotation = {
        top: 'rotate-45 -mt-1',
        'top-start': 'rotate-45 -mt-1',
        'top-end': 'rotate-45 -mt-1',
        bottom: '-rotate-135 -mb-1',
        'bottom-start': '-rotate-135 -mb-1',
        'bottom-end': '-rotate-135 -mb-1',
        left: '-rotate-135 -ml-1',
        'left-start': '-rotate-135 -ml-1',
        'left-end': '-rotate-135 -ml-1',
        right: 'rotate-45 -mr-1',
        'right-start': 'rotate-45 -mr-1',
        'right-end': 'rotate-45 -mr-1',
    };

    return (
        <div
            className={cn('relative inline-block', className)}
            ref={triggerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            {...props}
        >
            {children}

            {isVisible && content && (
                <div
                    ref={tooltipRef}
                    className={cn(
                        'px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap',
                        themeStyles[theme],
                        animation && 'animate-fade-in'
                    )}
                    style={{
                        transform: `translate(${coords.x}px, ${coords.y}px)`,
                    }}
                    role="tooltip"
                >
                    {content}
                    {arrow && (
                        <span
                            className={cn(
                                'absolute w-2 h-2',
                                theme === 'light' && 'bg-white border-l border-t border-surface-200',
                                theme === 'dark' && 'bg-dark-bg border-l border-t border-dark-border',
                                ['primary', 'success', 'warning', 'danger'].includes(theme) && 'bg-transparent',
                                arrowRotation[placement]
                            )}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

// Tooltip Group for multiple tooltips
const TooltipGroup = ({ children, className, ...props }) => (
    <div
        className={cn('flex gap-2', className)}
        {...props}
    >
        {children}
    </div>
);

Tooltip.Group = TooltipGroup;

export default Tooltip;
