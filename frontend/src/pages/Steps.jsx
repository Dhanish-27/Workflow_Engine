import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Edit2, Trash2, Plus, ListOrdered } from 'lucide-react';
import { stepsAPI, workflowsAPI, usersAPI } from '../services/api';
import { Button, Card, Modal, Input, DataTable, Badge, EmptyState, Select } from '../components/ui';
import { formatDate } from '../utils';

const Steps = () => {
    const navigate = useNavigate();
    const [steps, setSteps] = useState([]);
    const [workflows, setWorkflows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStep, setEditingStep] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [users, setUsers] = useState([]);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

    const stepType = watch('step_type');

    useEffect(() => {
        fetchSteps();
        fetchWorkflows();
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await usersAPI.list();
            setUsers(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchSteps = async () => {
        try {
            const response = await stepsAPI.list();
            const stepData = response.data.results || response.data;
            setSteps(Array.isArray(stepData) ? stepData : []);
        } catch (error) {
            console.error('Error fetching steps:', error);
            setSteps([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWorkflows = async () => {
        try {
            const response = await workflowsAPI.list();
            const workflowData = response.data.results || response.data;
            setWorkflows(Array.isArray(workflowData) ? workflowData : []);
        } catch (error) {
            console.error('Error fetching workflows:', error);
            setWorkflows([]);
        }
    };

    const handleOpenModal = (step = null) => {
        setEditingStep(step);
        if (step) {
            setValue('name', step.name);
            setValue('step_type', step.step_type);
            setValue('approval_type', step.approval_type || 'general');
            setValue('assigned_role', step.assigned_role || 'employee');
            setValue('assigned_to', step.assigned_to?.id || step.assigned_to || '');
            setValue('order', step.order);
            setValue('workflow', step.workflow);
        } else {
            reset({ name: '', step_type: 'task', approval_type: 'general', assigned_role: 'employee', assigned_to: '', order: 1, workflow: '' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingStep(null);
        reset();
    };

    const onSubmit = async (data) => {
        try {
            if (editingStep) {
                await stepsAPI.update(editingStep.id, data);
            } else {
                await stepsAPI.create(data);
            }
            fetchSteps();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving step:', error);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await stepsAPI.delete(deleteConfirm.id);
            fetchSteps();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting step:', error);
        }
    };

    const getWorkflowName = (workflowId) => {
        const workflow = workflows.find(w => w.id === workflowId);
        return workflow ? workflow.name : '-';
    };

    const columns = [
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => (
                <span className="font-medium text-gray-900 dark:text-dark-text">
                    {row.original.name}
                </span>
            ),
        },
        {
            accessorKey: 'workflow',
            header: 'Workflow',
            cell: ({ row }) => (
                <span className="text-gray-500 dark:text-dark-muted">
                    {getWorkflowName(row.original.workflow)}
                </span>
            ),
        },
        {
            accessorKey: 'step_type',
            header: 'Type',
            cell: ({ row }) => (
                <Badge variant={row.original.step_type === 'approval' ? 'warning' : 'default'}>
                    {row.original.step_type}
                </Badge>
            ),
        },
        {
            accessorKey: 'approval_type',
            header: 'Approval',
            cell: ({ row }) => (
                row.original.step_type === 'approval' ? (
                    <span className="text-gray-500 dark:text-dark-muted">
                        {row.original.approval_type || '-'}
                    </span>
                ) : row.original.step_type === 'task' ? (
                    <span className="text-gray-500 dark:text-dark-muted">
                        {row.original.assigned_role || '-'}
                    </span>
                ) : (
                    <span className="text-gray-400 dark:text-dark-muted">-</span>
                )
            ),
        },
        {
            accessorKey: 'order',
            header: 'Order',
            cell: ({ row }) => (
                <span className="text-gray-500 dark:text-dark-muted">{row.original.order}</span>
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Created',
            cell: ({ row }) => formatDate(row.original.created_at),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(row.original);
                        }}
                    >
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(row.original);
                        }}
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                        Steps Management
                    </h1>
                    <p className="text-gray-500 dark:text-dark-muted mt-1">
                        Create and manage workflow steps.
                    </p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Step
                </Button>
            </div>

            <Card className="p-0">
                {steps.length === 0 && !isLoading ? (
                    <EmptyState
                        icon={ListOrdered}
                        title="No steps yet"
                        description="Create your first step to get started."
                        action
                        onAction={() => handleOpenModal()}
                        actionLabel="Create Step"
                    />
                ) : (
                    <DataTable
                        columns={columns}
                        data={steps}
                        isLoading={isLoading}
                    />
                )}
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingStep ? 'Edit Step' : 'Create Step'}
                size="md"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Step Name"
                        placeholder="Enter step name"
                        {...register('name', { required: 'Name is required' })}
                        error={errors.name?.message}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                            Workflow
                        </label>
                        <select
                            {...register('workflow', { required: 'Workflow is required' })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-dark-card dark:border-dark-border dark:text-dark-text"
                        >
                            <option value="">Select a workflow</option>
                            {workflows.map(workflow => (
                                <option key={workflow.id} value={workflow.id}>
                                    {workflow.name}
                                </option>
                            ))}
                        </select>
                        {errors.workflow && (
                            <p className="mt-1 text-sm text-red-500">{errors.workflow.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                            Step Type
                        </label>
                        <select
                            {...register('step_type', { required: 'Step type is required' })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-dark-card dark:border-dark-border dark:text-dark-text"
                        >
                            <option value="task">Task</option>
                            <option value="approval">Approval</option>
                            <option value="notification">Notification</option>
                        </select>
                    </div>

                    {stepType === 'approval' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                                Approval Type
                            </label>
                            <select
                                {...register('approval_type')}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-dark-card dark:border-dark-border dark:text-dark-text"
                            >
                                <option value="general">General Approval</option>
                                <option value="manager_approval">Manager Approval</option>
                                <option value="finance_approval">Finance Approval</option>
                                <option value="ceo_approval">CEO Approval</option>
                            </select>
                        </div>
                    )}

                    {stepType === 'task' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                                    Assigned Role
                                </label>
                                <select
                                    {...register('assigned_role')}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-dark-card dark:border-dark-border dark:text-dark-text"
                                >
                                    <option value="employee">Employee</option>
                                    <option value="manager">Manager</option>
                                    <option value="finance">Finance</option>
                                    <option value="ceo">CEO</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                                    Assigned To User
                                </label>
                                <select
                                    {...register('assigned_to')}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-dark-card dark:border-dark-border dark:text-dark-text"
                                >
                                    <option value="">None (Role based)</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.username}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <Input
                        label="Order"
                        type="number"
                        placeholder="1"
                        {...register('order', { required: 'Order is required', valueAsNumber: true })}
                        error={errors.order?.message}
                    />

                    <Modal.Footer>
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingStep ? 'Update' : 'Create'}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Step"
                size="sm"
            >
                <p className="text-gray-600 dark:text-dark-muted mb-6">
                    Are you sure you want to delete step <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
                </p>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Steps;