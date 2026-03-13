import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, PlayCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { executionsAPI } from '../services/api';
import { Button, Card, DataTable, Badge, EmptyState } from '../components/ui';
import { formatDateTime } from '../utils';

const Executions = () => {
    const navigate = useNavigate();
    const [executions, setExecutions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchExecutions();
    }, []);

    const fetchExecutions = async () => {
        try {
            const response = await executionsAPI.list();
            setExecutions(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching executions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'running':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const columns = [
        {
            accessorKey: 'id',
            header: 'ID',
            cell: ({ row }) => <span className="text-gray-500">#{row.original.id}</span>,
        },
        {
            accessorKey: 'workflow_name',
            header: 'Workflow',
            cell: ({ row }) => (
                <span className="font-medium text-gray-900 dark:text-dark-text">
                    {row.original.workflow_name || row.original.workflow || '-'}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {getStatusIcon(row.original.status)}
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${row.original.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : row.original.status === 'failed'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : row.original.status === 'running'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                        {row.original.status}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'current_step',
            header: 'Current Step',
            cell: ({ row }) => row.original.current_step || '-',
        },
        {
            accessorKey: 'triggered_by_name',
            header: 'Triggered By',
            cell: ({ row }) => row.original.triggered_by_name || row.original.triggered_by || '-',
        },
        {
            accessorKey: 'started_at',
            header: 'Start Time',
            cell: ({ row }) => formatDateTime(row.original.started_at),
        },
        {
            accessorKey: 'ended_at',
            header: 'End Time',
            cell: ({ row }) => row.original.ended_at ? formatDateTime(row.original.ended_at) : '-',
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/executions/${row.original.id}`)}
                >
                    <Eye className="w-4 h-4" />
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                    Execution History
                </h1>
                <p className="text-gray-500 dark:text-dark-muted mt-1">
                    Monitor workflow execution status and history.
                </p>
            </div>

            <Card className="p-0">
                {executions.length === 0 && !isLoading ? (
                    <EmptyState
                        icon={PlayCircle}
                        title="No executions yet"
                        description="Workflow executions will appear here once triggered."
                    />
                ) : (
                    <DataTable
                        columns={columns}
                        data={executions}
                        isLoading={isLoading}
                        onRowClick={(row) => navigate(`/executions/${row.id}`)}
                    />
                )}
            </Card>
        </div>
    );
};

export default Executions;
