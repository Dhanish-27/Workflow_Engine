import { cn } from '../../utils';

const LoadingSpinner = ({ size = 'md', className }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
    };

    return (
        <div className={cn('flex items-center justify-center', className)}>
            <svg
                className={cn('animate-spin text-primary-600', sizes[size])}
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
        </div>
    );
};

const LoadingOverlay = ({ isLoading, children }) => {
    return (
        <div className="relative">
            {children}
            {isLoading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-dark-bg/50 flex items-center justify-center z-50">
                    <LoadingSpinner size="lg" />
                </div>
            )}
        </div>
    );
};

const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={cn(
                'animate-pulse bg-gray-200 dark:bg-dark-border rounded',
                className
            )}
            {...props}
        />
    );
};

const CardSkeleton = () => (
    <div className="card p-6 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
    </div>
);

const TableRowSkeleton = ({ columns = 5 }) => (
    <tr>
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i} className="px-6 py-4">
                <Skeleton className="h-4" />
            </td>
        ))}
    </tr>
);

const FormSkeleton = ({ fields = 3 }) => (
    <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
            <div key={i}>
                <Skeleton className="h-4 w-1/4 mb-2" />
                <Skeleton className="h-10 w-full" />
            </div>
        ))}
    </div>
);

export { LoadingSpinner, LoadingOverlay, Skeleton, CardSkeleton, TableRowSkeleton, FormSkeleton };
export default LoadingSpinner;
