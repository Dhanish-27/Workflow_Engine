import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { executionsAPI } from '../services/api';
import { Button, Card, Modal, DataTable, Badge, EmptyState, Input } from '../components/ui';
import { formatDateTime } from '../utils';

const Approvals = () => {
    const navigate = useNavigate();
    const [executions, setExecutions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedExecution, setSelectedExecution] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        fetchPendingApprovals();
    }, []);

    const fetchPendingApprovals = async () => {
        try {
            const response = await executionsAPI.list({ status: 'pending_approval' });
            setExecutions(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching approvals:', error);
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

    const handleOpenAction = (execution, type) => {
        setSelectedExecution(execution);
        setActionType(type);
        reset({ comment: '' });
        setShowActionModal(true);
    };

    const handleCloseAction = () => {
        setShowActionModal(false);
        setActionType(null);
        reset();
    };

    const onSubmitAction = async (data) => {
        try {
            if (actionType === 'approve') {
                await executionsAPI.approve(selectedExecution.id, data);
            } else {
                await executionsAPI.reject(selectedExecution.id, data);
            }
            fetchPendingApprovals();
            handleCloseAction();
            setShowDetailModal(false);
        } catch (error) {
            console.error('Error processing approval:', error);
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
            accessorKey: 'triggered_by_name',
            header: 'Requester',
            cell: ({ row }) => row.original.triggered_by_name || '-',
        },
        {
            accessorKey: 'priority',
            header: 'Priority',
            cell: ({ row }) => (
                <Badge
                    variant={
                        row.original.priority === 'High' ? 'danger' :
                            row.original.priority === 'Medium' ? 'warning' : 'default'
                    }
                >
                    {row.original.priority || '-'}
                </Badge>
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Submitted Time',
            cell: ({ row }) => formatDateTime(row.original.created_at),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(row.original)}
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenAction(row.original, 'approve')}
                        className="text-green-600 hover:text-green-700"
                    >
                        <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenAction(row.original, 'reject')}
                        className="text-red-600 hover:text-red-700"
                    >
                        <XCircle className="w-4 h-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                    Pending Approvals
                </h1>
                <p className="text-gray-500 dark:text-dark-muted mt-1">
                    Review and approve workflow requests.
                </p>
            </div>

            <Card className="p-0">
                {executions.length === 0 && !isLoading ? (
                    <EmptyState
                        icon={CheckCircle}
                        title="No pending approvals"
                        description="All workflow requests have been processed."
                    />
                ) : (
                    <DataTable
                        columns={columns}
                        data={executions}
                        isLoading={isLoading}
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
                                <p className="text-sm text-gray-500 dark:text-dark-muted">Requester</p>
                                <p className="font-medium text-gray-900 dark:text-dark-text">
                                    {selectedExecution.triggered_by_name || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-dark-muted">Status</p>
                                <Badge>{selectedExecution.status}</Badge>
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

                        <div className="flex gap-3">
                            <Button
                                variant="danger"
                                onClick={() => {
                                    setShowDetailModal(false);
                                    handleOpenAction(selectedExecution, 'reject');
                                }}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowDetailModal(false);
                                    handleOpenAction(selectedExecution, 'approve');
                                }}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Action Modal */}
            <Modal
                isOpen={showActionModal}
                onClose={handleCloseAction}
                title={actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
                size="md"
            >
                <form onSubmit={handleSubmit(onSubmitAction)} className="space-y-4">
                    <Input
                        label="Comment"
                        placeholder="Add a comment (optional)"
                        {...register('comment')}
                    />

                    <Modal.Footer>
                        <Button type="button" variant="secondary" onClick={handleCloseAction}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant={actionType === 'approve' ? 'primary' : 'danger'}
                        >
                            {actionType === 'approve' ? 'Approve' : 'Reject'}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </div>
    );
};

export default Approvals;
