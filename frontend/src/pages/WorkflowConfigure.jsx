import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    ArrowLeft,
    Plus,
    Edit2,
    Trash2,
    GripVertical,
    ListOrdered,
    BookOpen,
} from 'lucide-react';
import { workflowsAPI, workflowFieldsAPI, stepsAPI, rulesAPI } from '../services/api';
import { Button, Card, Modal, Input, Select, DataTable, Badge, EmptyState } from '../components/ui';
import { cn } from '../utils';

const WorkflowConfigure = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [workflow, setWorkflow] = useState(null);
    const [activeTab, setActiveTab] = useState('fields');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchWorkflow();
        }
    }, [id]);

    const fetchWorkflow = async () => {
        try {
            const response = await workflowsAPI.get(id);
            setWorkflow(response.data);
        } catch (error) {
            console.error('Error fetching workflow:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: 'fields', label: 'Fields', icon: ListOrdered },
        { id: 'steps', label: 'Steps', icon: ListOrdered },
        { id: 'rules', label: 'Rules', icon: BookOpen },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/workflows')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                        {workflow?.name || 'Workflow Configuration'}
                    </h1>
                    <p className="text-gray-500 dark:text-dark-muted mt-1">
                        Configure workflow fields, steps, and rules.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-dark-border">
                <nav className="flex gap-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors',
                                activeTab === tab.id
                                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-dark-muted'
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'fields' && <WorkflowFields workflowId={id} />}
            {activeTab === 'steps' && <WorkflowSteps workflowId={id} />}
            {activeTab === 'rules' && <WorkflowRules workflowId={id} />}
        </div>
    );
};

// Workflow Fields Component
const WorkflowFields = ({ workflowId }) => {
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

    useEffect(() => {
        fetchFields();
    }, [workflowId]);

    const fetchFields = async () => {
        try {
            const response = await workflowFieldsAPI.list(workflowId);
            setFields(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching fields:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (field = null) => {
        setEditingField(field);
        if (field) {
            setValue('name', field.name);
            setValue('label', field.label);
            setValue('field_type', field.field_type);
            setValue('required', field.required);
            setValue('options', field.options?.join('\n') || '');
        } else {
            reset({ name: '', label: '', field_type: 'text', required: false, options: '' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingField(null);
        reset();
    };

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                workflow: workflowId,
                options: data.options ? data.options.split('\n').filter(o => o.trim()) : [],
            };

            if (editingField) {
                await workflowFieldsAPI.update(editingField.id, payload);
            } else {
                await workflowFieldsAPI.create(payload);
            }
            fetchFields();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving field:', error);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await workflowFieldsAPI.delete(deleteConfirm.id);
            fetchFields();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting field:', error);
        }
    };

    const fieldTypeOptions = [
        { value: 'text', label: 'Text' },
        { value: 'number', label: 'Number' },
        { value: 'dropdown', label: 'Dropdown' },
        { value: 'date', label: 'Date' },
        { value: 'email', label: 'Email' },
    ];

    const columns = [
        {
            accessorKey: 'label',
            header: 'Label',
        },
        {
            accessorKey: 'name',
            header: 'Field Name',
            cell: ({ row }) => (
                <code className="text-sm bg-gray-100 dark:bg-dark-border px-2 py-1 rounded">
                    {row.original.name}
                </code>
            ),
        },
        {
            accessorKey: 'field_type',
            header: 'Type',
            cell: ({ row }) => (
                <Badge variant="default">{row.original.field_type}</Badge>
            ),
        },
        {
            accessorKey: 'required',
            header: 'Required',
            cell: ({ row }) => (
                <Badge variant={row.original.required ? 'danger' : 'default'}>
                    {row.original.required ? 'Yes' : 'No'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(row.original)}
                    >
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(row.original)}
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                </Button>
            </div>

            <Card className="p-0">
                {fields.length === 0 && !isLoading ? (
                    <EmptyState
                        icon={ListOrdered}
                        title="No fields yet"
                        description="Add fields to define what data is needed for this workflow."
                        action
                        onAction={() => handleOpenModal()}
                        actionLabel="Add Field"
                    />
                ) : (
                    <DataTable
                        columns={columns}
                        data={fields}
                        isLoading={isLoading}
                        showSearch={false}
                    />
                )}
            </Card>

            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingField ? 'Edit Field' : 'Add Field'}
                size="md"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Label"
                        placeholder="e.g., Amount"
                        {...register('label', { required: 'Label is required' })}
                        error={errors.label?.message}
                    />

                    <Input
                        label="Field Name"
                        placeholder="e.g., amount"
                        {...register('name', { required: 'Field name is required' })}
                        error={errors.name?.message}
                        helperText="Use lowercase with underscores (e.g., first_name)"
                    />

                    <Select
                        label="Field Type"
                        options={fieldTypeOptions}
                        {...register('field_type', { required: 'Field type is required' })}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                            Options (one per line)
                        </label>
                        <textarea
                            {...register('options')}
                            placeholder="High&#10;Medium&#10;Low"
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-dark-card dark:border-dark-border"
                            disabled={false}
                        />
                        <p className="text-xs text-gray-500 mt-1">Required for dropdown type</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            {...register('required')}
                            id="required"
                            className="w-4 h-4 rounded border-gray-300 text-primary-600"
                        />
                        <label htmlFor="required" className="text-sm text-gray-700 dark:text-dark-text">
                            Required field
                        </label>
                    </div>

                    <Modal.Footer>
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingField ? 'Update' : 'Add'}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>

            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Field"
                size="sm"
            >
                <p className="text-gray-600 dark:text-dark-muted mb-6">
                    Are you sure you want to delete field <strong>{deleteConfirm?.label}</strong>?
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

// Workflow Steps Component
const WorkflowSteps = ({ workflowId }) => {
    const [steps, setSteps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStep, setEditingStep] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

    useEffect(() => {
        fetchSteps();
    }, [workflowId]);

    const fetchSteps = async () => {
        try {
            const response = await stepsAPI.list({ workflow: workflowId });
            setSteps(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching steps:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (step = null) => {
        setEditingStep(step);
        if (step) {
            setValue('name', step.name);
            setValue('step_type', step.step_type);
            setValue('execution_order', step.execution_order);
            setValue('description', step.description);
        } else {
            reset({ name: '', step_type: 'task', execution_order: steps.length + 1, description: '' });
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
            const payload = {
                ...data,
                workflow: workflowId,
                execution_order: parseInt(data.execution_order),
            };

            if (editingStep) {
                await stepsAPI.update(editingStep.id, payload);
            } else {
                await stepsAPI.create(payload);
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

    const stepTypeOptions = [
        { value: 'task', label: 'Task' },
        { value: 'approval', label: 'Approval' },
        { value: 'notification', label: 'Notification' },
    ];

    const columns = [
        {
            accessorKey: 'execution_order',
            header: 'Order',
            cell: ({ row }) => (
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
                        {row.original.execution_order}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'name',
            header: 'Step Name',
        },
        {
            accessorKey: 'step_type',
            header: 'Type',
            cell: ({ row }) => (
                <Badge
                    variant={
                        row.original.step_type === 'approval' ? 'warning' :
                            row.original.step_type === 'notification' ? 'info' : 'default'
                    }
                >
                    {row.original.step_type}
                </Badge>
            ),
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => row.original.description || '-',
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(row.original)}
                    >
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(row.original)}
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Step
                </Button>
            </div>

            <Card className="p-0">
                {steps.length === 0 && !isLoading ? (
                    <EmptyState
                        icon={ListOrdered}
                        title="No steps yet"
                        description="Add steps to define the workflow process."
                        action
                        onAction={() => handleOpenModal()}
                        actionLabel="Add Step"
                    />
                ) : (
                    <DataTable
                        columns={columns}
                        data={steps}
                        isLoading={isLoading}
                        showSearch={false}
                    />
                )}
            </Card>

            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingStep ? 'Edit Step' : 'Add Step'}
                size="md"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Step Name"
                        placeholder="e.g., Review Request"
                        {...register('name', { required: 'Step name is required' })}
                        error={errors.name?.message}
                    />

                    <Select
                        label="Step Type"
                        options={stepTypeOptions}
                        {...register('step_type', { required: 'Step type is required' })}
                    />

                    <Input
                        label="Execution Order"
                        type="number"
                        {...register('execution_order', { required: 'Order is required', valueAsNumber: true })}
                        error={errors.execution_order?.message}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                            Description
                        </label>
                        <textarea
                            {...register('description')}
                            placeholder="Enter step description"
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-dark-card dark:border-dark-border"
                        />
                    </div>

                    <Modal.Footer>
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingStep ? 'Update' : 'Add'}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>

            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Step"
                size="sm"
            >
                <p className="text-gray-600 dark:text-dark-muted mb-6">
                    Are you sure you want to delete step <strong>{deleteConfirm?.name}</strong>?
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

// Workflow Rules Component
const WorkflowRules = ({ workflowId }) => {
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

    useEffect(() => {
        fetchRules();
    }, [workflowId]);

    const fetchRules = async () => {
        try {
            const response = await rulesAPI.list({ workflow: workflowId });
            setRules(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching rules:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (rule = null) => {
        setEditingRule(rule);
        if (rule) {
            setValue('name', rule.name);
            setValue('condition', rule.condition);
            setValue('priority', rule.priority);
            setValue('next_step', rule.next_step);
            setValue('is_default', rule.is_default);
        } else {
            reset({ name: '', condition: '', priority: 1, next_step: '', is_default: false });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingRule(null);
        reset();
    };

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                workflow: workflowId,
                priority: parseInt(data.priority),
            };

            if (editingRule) {
                await rulesAPI.update(editingRule.id, payload);
            } else {
                await rulesAPI.create(payload);
            }
            fetchRules();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving rule:', error);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await rulesAPI.delete(deleteConfirm.id);
            fetchRules();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting rule:', error);
        }
    };

    const columns = [
        {
            accessorKey: 'name',
            header: 'Rule Name',
        },
        {
            accessorKey: 'condition',
            header: 'Condition',
            cell: ({ row }) => (
                <code className="text-sm bg-gray-100 dark:bg-dark-border px-2 py-1 rounded">
                    {row.original.condition}
                </code>
            ),
        },
        {
            accessorKey: 'priority',
            header: 'Priority',
            cell: ({ row }) => (
                <span className="text-gray-900 dark:text-dark-text">
                    {row.original.priority}
                </span>
            ),
        },
        {
            accessorKey: 'next_step',
            header: 'Next Step',
            cell: ({ row }) => row.original.next_step || '-',
        },
        {
            accessorKey: 'is_default',
            header: 'Default',
            cell: ({ row }) => (
                <Badge variant={row.original.is_default ? 'success' : 'default'}>
                    {row.original.is_default ? 'Yes' : 'No'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(row.original)}
                    >
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(row.original)}
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rule
                </Button>
            </div>

            <Card className="p-0">
                {rules.length === 0 && !isLoading ? (
                    <EmptyState
                        icon={BookOpen}
                        title="No rules yet"
                        description="Add rules to define workflow transitions."
                        action
                        onAction={() => handleOpenModal()}
                        actionLabel="Add Rule"
                    />
                ) : (
                    <DataTable
                        columns={columns}
                        data={rules}
                        isLoading={isLoading}
                        showSearch={false}
                    />
                )}
            </Card>

            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingRule ? 'Edit Rule' : 'Add Rule'}
                size="md"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Rule Name"
                        placeholder="e.g., High Amount Rule"
                        {...register('name', { required: 'Rule name is required' })}
                        error={errors.name?.message}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                            Condition Expression
                        </label>
                        <textarea
                            {...register('condition', { required: 'Condition is required' })}
                            placeholder="e.g., amount > 1000 AND department == 'Finance'"
                            rows={2}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-dark-card dark:border-dark-border"
                            error={errors.condition?.message}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Use field names from workflow fields (e.g., amount, country, priority)
                        </p>
                    </div>

                    <Input
                        label="Priority"
                        type="number"
                        {...register('priority', { required: 'Priority is required', valueAsNumber: true })}
                        error={errors.priority?.message}
                    />

                    <Input
                        label="Next Step"
                        placeholder="e.g., approval_step"
                        {...register('next_step', { required: 'Next step is required' })}
                        error={errors.next_step?.message}
                    />

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            {...register('is_default')}
                            id="is_default"
                            className="w-4 h-4 rounded border-gray-300 text-primary-600"
                        />
                        <label htmlFor="is_default" className="text-sm text-gray-700 dark:text-dark-text">
                            Default rule (used when no other rules match)
                        </label>
                    </div>

                    <Modal.Footer>
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingRule ? 'Update' : 'Add'}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>

            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Rule"
                size="sm"
            >
                <p className="text-gray-600 dark:text-dark-muted mb-6">
                    Are you sure you want to delete rule <strong>{deleteConfirm?.name}</strong>?
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

export default WorkflowConfigure;
