import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Edit2, Trash2, Plus, Settings, GitBranch } from 'lucide-react';
import { workflowsAPI } from '../services/api';
import { Button, Card, Modal, Input, DataTable, Badge, EmptyState } from '../components/ui';
import { formatDate } from '../utils';

const Workflows = () => {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            const response = await workflowsAPI.list();
            setWorkflows(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching workflows:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (workflow = null) => {
        setEditingWorkflow(workflow);
        if (workflow) {
            setValue('name', workflow.name);
            setValue('description', workflow.description);
            setValue('version', workflow.version);
            setValue('is_active', workflow.is_active);
        } else {
            reset({ name: '', description: '', version: 1, is_active: true });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingWorkflow(null);
        reset();
    };

    const onSubmit = async (data) => {
        try {
            if (editingWorkflow) {
                await workflowsAPI.update(editingWorkflow.id, data);
            } else {
                await workflowsAPI.create(data);
            }
            fetchWorkflows();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving workflow:', error);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await workflowsAPI.delete(deleteConfirm.id);
            fetchWorkflows();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting workflow:', error);
        }
    };

    const handleConfigure = (workflow) => {
        navigate(`/workflows/${workflow.id}/configure`);
    };

    const columns = [
        {
            accessorKey: 'id',
            header: 'ID',
            cell: ({ row }) => <span className="text-gray-500">#{row.original.id}</span>,
        },
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <GitBranch className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-dark-text">
                        {row.original.name}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => (
                <span className="text-gray-500 dark:text-dark-muted">
                    {row.original.description || '-'}
                </span>
            ),
        },
        {
            accessorKey: 'version',
            header: 'Version',
            cell: ({ row }) => (
                <Badge variant="default">v{row.original.version}.0</Badge>
            ),
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.is_active ? 'success' : 'default'}>
                    {row.original.is_active ? 'Active' : 'Inactive'}
                </Badge>
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
                            handleConfigure(row.original);
                        }}
                        title="Configure"
                    >
                        <Settings className="w-4 h-4" />
                    </Button>
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
                        Workflow Management
                    </h1>
                    <p className="text-gray-500 dark:text-dark-muted mt-1">
                        Create and manage workflow templates.
                    </p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Workflow
                </Button>
            </div>

            <Card className="p-0">
                {workflows.length === 0 && !isLoading ? (
                    <EmptyState
                        icon={GitBranch}
                        title="No workflows yet"
                        description="Create your first workflow to get started."
                        action
                        onAction={() => handleOpenModal()}
                        actionLabel="Create Workflow"
                    />
                ) : (
                    <DataTable
                        columns={columns}
                        data={workflows}
                        isLoading={isLoading}
                        onRowClick={(row) => handleConfigure(row)}
                    />
                )}
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingWorkflow ? 'Edit Workflow' : 'Create Workflow'}
                size="md"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Workflow Name"
                        placeholder="Enter workflow name"
                        {...register('name', { required: 'Name is required' })}
                        error={errors.name?.message}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                            Description
                        </label>
                        <textarea
                            {...register('description')}
                            placeholder="Enter workflow description"
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-dark-card dark:border-dark-border dark:text-dark-text"
                        />
                    </div>

                    <Input
                        label="Version"
                        placeholder="1.0"
                        {...register('version')}
                    />

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            {...register('is_active')}
                            id="is_active"
                            className="w-4 h-4 rounded border-gray-300 text-primary-600"
                        />
                        <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-dark-text">
                            Active
                        </label>
                    </div>

                    <Modal.Footer>
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingWorkflow ? 'Update' : 'Create'}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Workflow"
                size="sm"
            >
                <p className="text-gray-600 dark:text-dark-muted mb-6">
                    Are you sure you want to delete workflow <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
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

export default Workflows;
