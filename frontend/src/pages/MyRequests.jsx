import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, CheckCircle, XCircle, Clock, PlayCircle } from 'lucide-react';
import { executionsAPI } from '../services/api';
import { Button, Card, DataTable, Badge, EmptyState, Modal } from '../components/ui';
import { formatDateTime } from '../utils';

const MyRequests = () => {
    const navigate = useNavigate();
    const [executions, setExecutions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedExecution, setSelectedExecution] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchMyExecutions();
    }, []);

    const fetchMyExecutions = async () => {
        try {
            const response = await executionsAPI.list();
            setExecutions(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching executions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewDetails = async (execution) => {
        try {
            const response = await executionsAPI.get(execution.id);
            setSelectedExecution(response.data);
            setShowDetailModal(true);
        } catch (error) {
            console.error('Error fetching execution details:', error);
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
            header: 'Request ID',
            cell: ({ row }) => <span className="text-gray-500">#{row.original.id}</span>,
        },
        {
            accessorKey: 'workflow_name',
            header: 'Workflow',
            cell: ({ row }) => (
                <span className="font-medium text-gray-900 dark:text-dark-text">
                    {row.original.workflow_name || '-'}
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
            accessorKey: 'created_at',
            header: 'Created Time',
            cell: ({ row }) => formatDateTime(row.original.created_at),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewDetails(row.original)}
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
                    My Requests
                </h1>
                <p className="text-gray-500 dark:text-dark-muted mt-1">
                    Track the status of your workflow requests.
                </p>
            </div>

            <Card className="p-0">
                {executions.length === 0 && !isLoading ? (
                    <EmptyState
                        icon={PlayCircle}
                        title="No requests yet"
                        description="Create your first workflow request to get started."
                        action
                        onAction={() => navigate('/create-request')}
                        actionLabel="Create Request"
                    />
                ) : (
                    <DataTable
                        columns={columns}
                        data={executions}
                        isLoading={isLoading}
                        onRowClick={(row) => handleViewDetails(row)}
                    />
                )}
            </Card>

            {/* Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title="Request Details"
                size="lg"
            >
                {selectedExecution && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-dark-muted">Request ID</p>
                                <p className="font-medium text-gray-900 dark:text-dark-text">
                                    #{selectedExecution.id}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-dark-muted">Workflow</p>
                                <p className="font-medium text-gray-900 dark:text-dark-text">
                                    {selectedExecution.workflow_name || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-dark-muted">Status</p>
                                <Badge status={selectedExecution.status}>
                                    {selectedExecution.status}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-dark-muted">Current Step</p>
                                <p className="font-medium text-gray-900 dark:text-dark-text">
                                    {selectedExecution.current_step || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-dark-muted">Submitted</p>
                                <p className="font-medium text-gray-900 dark:text-dark-text">
                                    {formatDateTime(selectedExecution.created_at)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-dark-muted">Completed</p>
                                <p className="font-medium text-gray-900 dark:text-dark-text">
                                    {selectedExecution.ended_at ? formatDateTime(selectedExecution.ended_at) : '-'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500 dark:text-dark-muted mb-2">Request Data</p>
                            <div className="bg-gray-50 dark:bg-dark-border rounded-lg p-4">
                                <pre className="text-sm text-gray-900 dark:text-dark-text overflow-x-auto">
                                    {JSON.stringify(selectedExecution.data || {}, null, 2)}
                                </pre>
                            </div>
                        </div>

                        {/* Timeline */}
                        {selectedExecution.timeline && selectedExecution.timeline.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 dark:text-dark-muted mb-3">Progress Timeline</p>
                                <div className="space-y-3">
                                    {selectedExecution.timeline.map((step, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className={`w-3 h-3 rounded-full mt-1.5 ${step.status === 'completed' ? 'bg-green-500' :
                                                    step.status === 'current' ? 'bg-yellow-500' :
                                                        'bg-gray-300 dark:bg-gray-600'
                                                }`} />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-dark-text">
                                                    {step.step_name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-dark-muted">
                                                    {step.completed_at ? formatDateTime(step.completed_at) : '-'}
                                                </p>
                                            </div>
                                            <Badge
                                                variant={
                                                    step.status === 'completed' ? 'success' :
                                                        step.status === 'current' ? 'warning' : 'default'
                                                }
                                            >
                                                {step.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MyRequests;
