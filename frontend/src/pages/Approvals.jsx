import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle, XCircle, Eye, DollarSign, Award, RefreshCw, File } from 'lucide-react';
import { executionsAPI, approvalsAPI } from '../services/api';
import { Button, Card, Modal, DataTable, Badge, EmptyState, Input, Select } from '../components/ui';
import { formatDateTime } from '../utils';
import { useAuthStore } from '../store';

const Approvals = () => {
    const navigate = useNavigate();
    const { user, getRoleDisplayName } = useAuthStore();
    const [executions, setExecutions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedExecution, setSelectedExecution] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState(null);

    // Request Change state
    const [requestChangeType, setRequestChangeType] = useState(null);
    const [newFields, setNewFields] = useState([{ name: '', field_type: 'text' }]);
    const [editFields, setEditFields] = useState([]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const role = user?.role || 'employee';

    useEffect(() => {
        fetchPendingApprovals();
    }, []);

    const fetchPendingApprovals = async () => {
        try {
            // Use the new approval tasks endpoint
            const response = await approvalsAPI.list();
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
        if (type === 'request_change') {
            setRequestChangeType(null);
            setNewFields([{ name: '', field_type: 'text' }]);
            setEditFields([]);
            reset({ comment: '', description: '' });
        } else {
            reset({ comment: '' });
        }
        setShowActionModal(true);
    };

    const handleCloseAction = () => {
        setShowActionModal(false);
        setActionType(null);
        setRequestChangeType(null);
        setNewFields([{ name: '', field_type: 'text' }]);
        setEditFields([]);
        reset();
    };

    const addField = () => {
        setNewFields([...newFields, { name: '', field_type: 'text' }]);
    };

    const updateField = (index, key, value) => {
        const updated = [...newFields];
        updated[index][key] = value;
        setNewFields(updated);
    };

    const removeField = (index) => {
        setNewFields(newFields.filter((_, i) => i !== index));
    };

    const onSubmitAction = async (data) => {
        try {
            if (actionType === 'approve') {
                await executionsAPI.approve(selectedExecution.id, { ...data, action: 'approve' });
            } else if (actionType === 'request_change') {
                // Build form_fields based on request type
                let formFields = [];

                if (requestChangeType === 'add') {
                    // Filter out empty fields
                    const validFields = newFields.filter(f => f.name.trim() !== '');
                    formFields = validFields.map(f => ({
                        field_name: f.name,
                        field_type: f.field_type,
                        is_new_field: true,
                        is_required: true
                    }));
                } else if (requestChangeType === 'edit') {
                    // Build form_fields for editing existing fields
                    formFields = editFields.map(fieldName => ({
                        field_name: fieldName,
                        is_new_field: true,  // Mark as new field to allow editing
                        field_type: 'text',  // Allow editing as text
                        is_required: true,
                        label: fieldName,
                        description: `Please update the ${fieldName} value`
                    }));
                }

                await executionsAPI.approve(selectedExecution.id, {
                    action: 'request_change',
                    change_type: requestChangeType === 'add' ? 'add_data' : 'edit_data',
                    description: data.description || (requestChangeType === 'add' ? 'Please add the requested information' : 'Please edit the selected fields'),
                    form_fields: formFields
                });
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

    // Get the appropriate icon for the role
    const getRoleIcon = () => {
        switch (role) {
            case 'manager':
                return CheckCircle;
            case 'finance':
                return DollarSign;
            case 'ceo':
                return Award;
            case 'admin':
                return CheckCircle;
            default:
                return CheckCircle;
        }
    };

    // Get the appropriate title for the role
    const getTitle = () => {
        switch (role) {
            case 'manager':
                return 'Manager Approvals';
            case 'finance':
                return 'Finance Approvals';
            case 'ceo':
                return 'Final Approvals';
            case 'admin':
                return 'All Approvals';
            default:
                return 'Pending Approvals';
        }
    };

    // Get the appropriate description for the role
    const getDescription = () => {
        switch (role) {
            case 'manager':
                return 'Review and approve requests that require manager approval.';
            case 'finance':
                return 'Review and approve financial-related requests.';
            case 'ceo':
                return 'Final approval for high-priority or high-value requests.';
            case 'admin':
                return 'Review all pending workflow approvals.';
            default:
                return 'Review and approve workflow requests.';
        }
    };

    const columns = [
        {
            accessorKey: 'id',
            header: 'Request ID',
            cell: ({ row }) => <span className="text-gray-500">#{row.original.id?.slice(0, 8)}</span>,
        },
        {
            accessorKey: 'workflow_name',
            header: 'Workflow',
            cell: ({ row }) => (
                <span className="font-medium text-gray-900 dark:text-dark-text">
                    {row.original.workflow?.name || row.original.workflow_name || '-'}
                </span>
            ),
        },
        {
            accessorKey: 'triggered_by_name',
            header: 'Requester',
            cell: ({ row }) => row.original.triggered_by_name || row.original.triggered_by?.username || '-',
        },
        {
            accessorKey: 'pending_approval_from',
            header: 'Approval Level',
            cell: ({ row }) => {
                const approvalType = row.original.pending_approval_from;
                let badgeVariant = 'default';
                let label = 'General';

                if (approvalType === 'manager') {
                    badgeVariant = 'warning';
                    label = 'Manager';
                } else if (approvalType === 'finance') {
                    badgeVariant = 'info';
                    label = 'Finance';
                } else if (approvalType === 'ceo') {
                    badgeVariant = 'danger';
                    label = 'CEO';
                }

                return <Badge variant={badgeVariant}>{label}</Badge>;
            },
        },
        {
            accessorKey: 'started_at',
            header: 'Submitted Time',
            cell: ({ row }) => formatDateTime(row.original.started_at),
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

    const RoleIcon = getRoleIcon();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                    {getTitle()}
                </h1>
                <p className="text-gray-500 dark:text-dark-muted mt-1">
                    {getDescription()}
                </p>
            </div>

            <Card className="p-0">
                {executions.length === 0 && !isLoading ? (
                    <EmptyState
                        icon={RoleIcon}
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
                                    #{selectedExecution.id?.slice(0, 8)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-dark-muted">Workflow</p>
                                <p className="font-medium text-gray-900 dark:text-dark-text">
                                    {selectedExecution.workflow?.name || selectedExecution.workflow_name || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-dark-muted">Requester</p>
                                <p className="font-medium text-gray-900 dark:text-dark-text">
                                    {selectedExecution.triggered_by_name || selectedExecution.triggered_by?.username || '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-dark-muted">Status</p>
                                <Badge>{selectedExecution.status}</Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-dark-muted">Pending Approval From</p>
                                <Badge variant={selectedExecution.pending_approval_from === 'ceo' ? 'danger' : selectedExecution.pending_approval_from === 'finance' ? 'info' : 'warning'}>
                                    {selectedExecution.pending_approval_from || 'General'}
                                </Badge>
                            </div>
                            {selectedExecution.task_cycle_count > 0 && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-dark-muted">Task Cycles</p>
                                    <Badge variant={selectedExecution.task_cycle_count >= 5 ? 'danger' : 'info'}>
                                        {selectedExecution.task_cycle_count}/5 cycles used
                                    </Badge>
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-sm text-gray-500 dark:text-dark-muted mb-2">Request Data</p>
                            <div className="bg-gray-50 dark:bg-dark-border rounded-lg p-4">
                                <pre className="text-sm text-gray-900 dark:text-dark-text overflow-x-auto">
                                    {JSON.stringify(selectedExecution.data || {}, null, 2)}
                                </pre>
                            </div>
                        </div>

                        {selectedExecution.latest_task_data && Object.keys(selectedExecution.latest_task_data).length > 0 && (
                            <div>
                                <p className="text-sm text-gray-500 dark:text-dark-muted mb-2">
                                    Submitted Changes {selectedExecution.task_cycle_count > 0 && `(Cycle ${selectedExecution.task_cycle_count})`}
                                </p>
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 space-y-3">
                                    {Object.entries(selectedExecution.latest_task_data || {}).map(([key, value]) => {
                                        // Check if value looks like a file URL
                                        const isFileUrl = typeof value === 'string' && (
                                            value.includes('/media/') ||
                                            value.includes('/uploads/') ||
                                            value.includes('.pdf') ||
                                            value.includes('.doc') ||
                                            value.includes('.docx') ||
                                            value.includes('.jpg') ||
                                            value.includes('.jpeg') ||
                                            value.includes('.png') ||
                                            value.includes('.gif')
                                        );

                                        if (isFileUrl) {
                                            return (
                                                <div key={key} className="flex items-center justify-between p-3 bg-white dark:bg-dark-card rounded-lg border border-blue-200 dark:border-blue-700">
                                                    <div className="flex items-center gap-3">
                                                        <File className="w-8 h-8 text-blue-600" />
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-dark-text">{key}</p>
                                                            <p className="text-xs text-gray-500 dark:text-dark-muted truncate max-w-xs">{value}</p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={value}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        View
                                                    </a>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={key} className="flex justify-between items-start py-2 border-b border-blue-100 dark:border-blue-800 last:border-0">
                                                <span className="text-sm font-medium text-gray-600 dark:text-dark-muted">{key}</span>
                                                <span className="text-sm text-gray-900 dark:text-dark-text text-right max-w-[60%]">{String(value)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

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
                                variant="warning"
                                onClick={() => {
                                    setShowDetailModal(false);
                                    handleOpenAction(selectedExecution, 'request_change');
                                }}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Request Changes
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
                title={actionType === 'approve' ? 'Approve Request' : actionType === 'request_change' ? 'Request Changes' : 'Reject Request'}
                size="md"
            >
                <form onSubmit={handleSubmit(onSubmitAction)} className="space-y-4">
                    {actionType === 'request_change' ? (
                        <>
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">
                                    What changes are needed?
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setRequestChangeType('edit')}
                                        className={`p-4 border-2 rounded-lg text-left transition-all ${requestChangeType === 'edit'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-borderHover'
                                            }`}
                                    >
                                        <div className="font-medium text-gray-900 dark:text-dark-text">Edit Current Data</div>
                                        <div className="text-sm text-gray-500 dark:text-dark-muted">Request changes to existing fields</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRequestChangeType('add')}
                                        className={`p-4 border-2 rounded-lg text-left transition-all ${requestChangeType === 'add'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-borderHover'
                                            }`}
                                    >
                                        <div className="font-medium text-gray-900 dark:text-dark-text">Add New Data</div>
                                        <div className="text-sm text-gray-500 dark:text-dark-muted">Request additional information</div>
                                    </button>
                                </div>
                            </div>

                            {requestChangeType && (
                                <>
                                    <Input
                                        label="Description"
                                        placeholder="Describe what changes are needed..."
                                        {...register('description')}
                                    />

                                    {requestChangeType === 'add' && (
                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">
                                                Add Fields
                                            </label>
                                            {newFields.map((field, index) => (
                                                <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 dark:bg-dark-card rounded-lg">
                                                    <Input
                                                        placeholder="Field name"
                                                        value={field.name}
                                                        onChange={(e) => updateField(index, 'name', e.target.value)}
                                                        className="flex-1"
                                                    />
                                                    <Select
                                                        options={[
                                                            { value: 'text', label: 'Text' },
                                                            { value: 'number', label: 'Number' },
                                                            { value: 'file', label: 'File Upload' },
                                                            { value: 'date', label: 'Date' },
                                                            { value: 'email', label: 'Email' },
                                                            { value: 'textarea', label: 'Long Text' },
                                                        ]}
                                                        value={field.field_type}
                                                        onChange={(e) => updateField(index, 'field_type', e.target.value)}
                                                        className="w-32"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghostDanger"
                                                        size="icon-sm"
                                                        onClick={() => removeField(index)}
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={addField}
                                            >
                                                + Add Field
                                            </Button>
                                        </div>
                                    )}

                                    {requestChangeType === 'edit' && selectedExecution?.data && (
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">
                                                Select Fields to Edit
                                            </label>
                                            <div className="max-h-48 overflow-y-auto space-y-2 p-2 border border-gray-200 dark:border-dark-border rounded-lg">
                                                {Object.keys(selectedExecution.data).map((key) => (
                                                    <label key={key} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-dark-card rounded">
                                                        <input
                                                            type="checkbox"
                                                            checked={editFields.includes(key)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setEditFields([...editFields, key]);
                                                                } else {
                                                                    setEditFields(editFields.filter(f => f !== key));
                                                                }
                                                            }}
                                                            className="rounded border-gray-300"
                                                        />
                                                        <span className="text-sm text-gray-700 dark:text-dark-text">{key}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <Input
                            label="Comment"
                            placeholder="Add a comment (optional)"
                            {...register('comment')}
                        />
                    )}

                    <Modal.Footer>
                        <Button type="button" variant="secondary" onClick={handleCloseAction}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant={actionType === 'approve' ? 'primary' : actionType === 'request_change' ? 'warning' : 'danger'}
                        >
                            {actionType === 'approve' ? 'Approve' : actionType === 'request_change' ? 'Request Changes' : 'Reject'}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </div>
    );
};

export default Approvals;
