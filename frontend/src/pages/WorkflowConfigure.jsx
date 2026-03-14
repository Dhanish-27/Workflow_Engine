import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
    ArrowLeft,
    Plus,
    Edit2,
    Trash2,
    GripVertical,
    ListOrdered,
    BookOpen,
    GitBranch,
    Save,
    X,
    AlertCircle,
    CheckCircle,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { workflowsAPI, workflowFieldsAPI, stepsAPI, rulesAPI } from '../services/api';
import { Button, Card, Modal, Input, Select, DataTable, Badge, EmptyState } from '../components/ui';
import { cn } from '../utils';

// ============================================
// CONSTANTS & UTILITIES
// ============================================

const FIELD_TYPES = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'date', label: 'Date' },
    { value: 'boolean', label: 'Boolean' },
];

const STEP_TYPES = [
    { value: 'task', label: 'Task' },
    { value: 'approval', label: 'Approval' },
    { value: 'notification', label: 'Notification' },
];

const APPROVAL_TYPES = [
    { value: 'general', label: 'General Approval' },
    { value: 'manager_approval', label: 'Manager Approval' },
    { value: 'finance_approval', label: 'Finance Approval' },
    { value: 'ceo_approval', label: 'CEO Approval' },
];

const ROLES = [
    { value: 'employee', label: 'Employee' },
    { value: 'manager', label: 'Manager' },
    { value: 'admin', label: 'Admin' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'HR' },
];

const OPERATORS_BY_TYPE = {
    text: [
        { value: 'equals', label: 'equals' },
        { value: 'not_equals', label: 'not equals' },
        { value: 'contains', label: 'contains' },
    ],
    number: [
        { value: 'eq', label: '==' },
        { value: 'neq', label: '!=' },
        { value: 'gt', label: '>' },
        { value: 'gte', label: '>=' },
        { value: 'lt', label: '<' },
        { value: 'lte', label: '<=' },
    ],
    dropdown: [
        { value: 'equals', label: 'equals' },
        { value: 'not_equals', label: 'not equals' },
    ],
    date: [
        { value: 'eq', label: 'on' },
        { value: 'before', label: 'before' },
        { value: 'after', label: 'after' },
    ],
    boolean: [
        { value: 'is_true', label: 'is true' },
        { value: 'is_false', label: 'is false' },
    ],
};

// Custom Node for React Flow
const StepNode = ({ data, selected }) => {
    const stepTypeColors = {
        task: 'bg-blue-100 border-blue-500 dark:bg-blue-900/30 dark:border-blue-600',
        approval: 'bg-yellow-100 border-yellow-500 dark:bg-yellow-900/30 dark:border-yellow-600',
        notification: 'bg-purple-100 border-purple-500 dark:bg-purple-900/30 dark:border-purple-600',
    };

    const stepTypeLabels = {
        task: 'Task',
        approval: 'Approval',
        notification: 'Notification',
    };

    return (
        <div className={cn(
            'px-4 py-3 rounded-lg border-2 shadow-md min-w-[180px]',
            stepTypeColors[data.stepType] || 'bg-gray-100 border-gray-400',
            selected && 'ring-2 ring-primary-500 ring-offset-2'
        )}>
            <Handle type="target" position={Position.Top} className="!bg-gray-400" />
            <div className="text-sm font-semibold text-gray-900 dark:text-dark-text">
                {data.label}
            </div>
            <div className="text-xs text-gray-600 dark:text-dark-muted mt-1">
                {stepTypeLabels[data.stepType] || data.stepType}
            </div>
            {data.approvalType && (
                <div className="text-xs text-gray-500 dark:text-dark-muted mt-1">
                    {data.approvalType}
                </div>
            )}
            <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
        </div>
    );
};

const nodeTypes = { stepNode: StepNode };

// ============================================
// MAIN COMPONENT
// ============================================

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
        { id: 'steps', label: 'Steps', icon: GripVertical },
        { id: 'rules', label: 'Rules', icon: BookOpen },
        { id: 'visual', label: 'Visual Builder', icon: GitBranch },
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
                <nav className="flex gap-4 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap',
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
            {activeTab === 'fields' && <WorkflowFieldsTab workflowId={id} />}
            {activeTab === 'steps' && <WorkflowStepsTab workflowId={id} />}
            {activeTab === 'rules' && <WorkflowRulesTab workflowId={id} />}
            {activeTab === 'visual' && <VisualBuilderTab workflowId={id} />}
        </div>
    );
};

// ============================================
// FIELDS TAB
// ============================================

const WorkflowFieldsTab = ({ workflowId }) => {
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

    const selectedFieldType = watch('field_type');

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

    const columns = [
        {
            accessorKey: 'label',
            header: 'Field Label',
        },
        {
            accessorKey: 'name',
            header: 'Field Name',
            cell: ({ row }) => (
                <code className="text-sm bg-gray-100 dark:bg-dark-border px-2 py-1 rounded font-mono">
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
                <Badge variant={row.original.required ? 'danger' : 'success'}>
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
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 dark:text-dark-muted">
                    Define dynamic input fields for this workflow.
                </p>
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

            {/* Add/Edit Field Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingField ? 'Edit Field' : 'Add Field'}
                size="md"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Field Label"
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

                    <Controller
                        name="field_type"
                        control={register('field_type').control}
                        render={({ field }) => (
                            <Select
                                label="Field Type"
                                options={FIELD_TYPES}
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />

                    {/* Show options textarea only for dropdown type */}
                    {selectedFieldType === 'dropdown' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                                Options (one per line)
                            </label>
                            <textarea
                                {...register('options')}
                                placeholder="High&#10;Medium&#10;Low"
                                rows={4}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-dark-card dark:border-dark-border"
                            />
                            <p className="text-xs text-gray-500 mt-1">Required for dropdown type</p>
                        </div>
                    )}

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

            {/* Delete Confirmation Modal */}
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

// ============================================
// STEPS TAB (with Drag & Drop)
// ============================================

const SortableStepRow = ({ step, onEdit, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: step.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.8 : 1,
    };

    const stepTypeColors = {
        task: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        approval: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        notification: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className="hover:bg-gray-50 dark:hover:bg-dark-card transition-colors"
        >
            <td className="px-4 py-3">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 dark:hover:bg-dark-border rounded"
                >
                    <GripVertical className="w-5 h-5 text-gray-400" />
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
                            {step.order}
                        </span>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 font-medium text-gray-900 dark:text-dark-text">
                {step.name}
            </td>
            <td className="px-4 py-3">
                <span className={cn('px-2 py-1 rounded-full text-xs font-medium', stepTypeColors[step.step_type])}>
                    {step.step_type}
                </span>
            </td>
            <td className="px-4 py-3 text-gray-600 dark:text-dark-muted">
                {step.assigned_to || step.approval_type || '-'}
            </td>
            <td className="px-4 py-3 text-gray-600 dark:text-dark-muted text-sm">
                {step.description || '-'}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(step)}>
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(step)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            </td>
        </tr>
    );
};

const WorkflowStepsTab = ({ workflowId }) => {
    const [steps, setSteps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStep, setEditingStep] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

    const selectedStepType = watch('step_type');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchSteps();
    }, [workflowId]);

    const fetchSteps = async () => {
        try {
            const response = await stepsAPI.list({ workflow: workflowId });
            const stepsData = response.data.results || response.data;
            // Sort by order
            const sorted = [...stepsData].sort((a, b) => a.order - b.order);
            setSteps(sorted);
        } catch (error) {
            console.error('Error fetching steps:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = steps.findIndex((s) => s.id === active.id);
            const newIndex = steps.findIndex((s) => s.id === over.id);

            const newSteps = arrayMove(steps, oldIndex, newIndex).map((step, index) => ({
                ...step,
                order: index + 1,
            }));

            setSteps(newSteps);

            // Persist the new order
            try {
                await stepsAPI.reorder(workflowId, {
                    steps: newSteps.map(s => ({ id: s.id, order: s.order })),
                });
            } catch (error) {
                console.error('Error reordering steps:', error);
                fetchSteps(); // Revert on error
            }
        }
    };

    const handleOpenModal = (step = null) => {
        setEditingStep(step);
        if (step) {
            setValue('name', step.name);
            setValue('step_type', step.step_type);
            setValue('approval_type', step.approval_type || 'general');
            setValue('description', step.description);
        } else {
            reset({ name: '', step_type: 'task', approval_type: 'general', description: '' });
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
                order: editingStep ? editingStep.order : steps.length + 1,
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-gray-600 dark:text-dark-muted">
                        Define workflow stages. Drag and drop to reorder steps.
                    </p>
                    {steps.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-amber-600 dark:text-amber-400">
                            <AlertCircle className="w-4 h-4" />
                            <span>Drag the handle icon to reorder steps</span>
                        </div>
                    )}
                </div>
                <Button onClick={() => handleOpenModal()} disabled={steps.length === 0}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Step
                </Button>
            </div>

            {steps.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={GripVertical}
                        title="No steps yet"
                        description="Add your first step to start building the workflow."
                        action
                        onAction={() => handleOpenModal()}
                        actionLabel="Add Step"
                    />
                </Card>
            ) : (
                <Card className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider w-12"></th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider w-16">Order</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">Step Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">Role/Approval</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={steps.map(s => s.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {steps.map((step) => (
                                            <SortableStepRow
                                                key={step.id}
                                                step={step}
                                                onEdit={handleOpenModal}
                                                onDelete={setDeleteConfirm}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Add/Edit Step Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingStep ? 'Edit Step' : 'Add Step'}
                size="md"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Step Name"
                        placeholder="e.g., Manager Approval"
                        {...register('name', { required: 'Step name is required' })}
                        error={errors.name?.message}
                    />

                    <Controller
                        name="step_type"
                        control={register('step_type').control}
                        render={({ field }) => (
                            <Select
                                label="Step Type"
                                options={STEP_TYPES}
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />

                    {/* Show approval type only for approval steps */}
                    {selectedStepType === 'approval' && (
                        <Controller
                            name="approval_type"
                            control={register('approval_type').control}
                            render={({ field }) => (
                                <Select
                                    label="Approval Type"
                                    options={APPROVAL_TYPES}
                                    value={field.value}
                                    onChange={field.onChange}
                                    helperText="Determines which role can approve this step"
                                />
                            )}
                        />
                    )}

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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Step"
                size="sm"
            >
                <p className="text-gray-600 dark:text-dark-muted mb-6">
                    Are you sure you want to delete step <strong>{deleteConfirm?.name}</strong>?
                    This will also delete all rules associated with this step.
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

// ============================================
// RULES TAB (with Rule Builder UI)
// ============================================

const ConditionBuilder = ({ condition, index, fields, onChange, onRemove }) => {
    const fieldOptions = useMemo(() =>
        fields.map(f => ({ value: f.name, label: f.label, type: f.field_type })),
        [fields]
    );

    const selectedField = fields.find(f => f.name === condition.field);
    const operators = selectedField ? (OPERATORS_BY_TYPE[selectedField.field_type] || OPERATORS_BY_TYPE.text) : OPERATORS_BY_TYPE.text;

    // Get value options for dropdown fields
    const valueOptions = selectedField?.field_type === 'dropdown'
        ? (selectedField.options || []).map(o => ({ value: o, label: o }))
        : [];

    return (
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-dark-card rounded-lg">
            {index > 0 && (
                <select
                    value={condition.logic || 'AND'}
                    onChange={(e) => onChange(index, { ...condition, logic: e.target.value })}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-dark-border rounded bg-white dark:bg-dark-card"
                >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                </select>
            )}
            {index === 0 && <span className="w-8 text-sm font-medium text-gray-600">IF</span>}

            <select
                value={condition.field || ''}
                onChange={(e) => onChange(index, { ...condition, field: e.target.value, operator: '', value: '' })}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded bg-white dark:bg-dark-card"
            >
                <option value="">Select field</option>
                {fieldOptions.map((field) => (
                    <option key={field.value} value={field.value}>
                        {field.label} ({field.type})
                    </option>
                ))}
            </select>

            <select
                value={condition.operator || ''}
                onChange={(e) => onChange(index, { ...condition, operator: e.target.value })}
                className="w-32 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded bg-white dark:bg-dark-card"
                disabled={!condition.field}
            >
                <option value="">Operator</option>
                {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                        {op.label}
                    </option>
                ))}
            </select>

            {/* Value input - type depends on field type */}
            {condition.field && selectedField?.field_type === 'dropdown' ? (
                <select
                    value={condition.value || ''}
                    onChange={(e) => onChange(index, { ...condition, value: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded bg-white dark:bg-dark-card"
                >
                    <option value="">Select value</option>
                    {valueOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ) : condition.field && selectedField?.field_type === 'boolean' ? (
                <select
                    value={condition.value || ''}
                    onChange={(e) => onChange(index, { ...condition, value: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded bg-white dark:bg-dark-card"
                >
                    <option value="">Select</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            ) : condition.field ? (
                <input
                    type={selectedField?.field_type === 'number' ? 'number' : 'text'}
                    value={condition.value || ''}
                    onChange={(e) => onChange(index, { ...condition, value: e.target.value })}
                    placeholder="Value"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded bg-white dark:bg-dark-card"
                    disabled={!condition.operator}
                />
            ) : (
                <div className="flex-1 px-3 py-2 text-sm text-gray-400 bg-gray-100 dark:bg-dark-border rounded">
                    Select a field first
                </div>
            )}

            <Button variant="ghost" size="icon" onClick={() => onRemove(index)}>
                <X className="w-4 h-4 text-red-500" />
            </Button>
        </div>
    );
};

const WorkflowRulesTab = ({ workflowId }) => {
    const [steps, setSteps] = useState([]);
    const [fields, setFields] = useState([]);
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStepId, setSelectedStepId] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm();

    useEffect(() => {
        fetchData();
    }, [workflowId]);

    const fetchData = async () => {
        try {
            const [stepsRes, fieldsRes] = await Promise.all([
                stepsAPI.list({ workflow: workflowId }),
                workflowFieldsAPI.list(workflowId),
            ]);

            const stepsData = stepsRes.data.results || stepsRes.data;
            const fieldsData = fieldsRes.data.results || fieldsRes.data;

            setSteps(stepsData.sort((a, b) => a.order - b.order));
            setFields(fieldsData);

            // Auto-select first step if available
            if (stepsData.length > 0) {
                setSelectedStepId(stepsData[0].id);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedStepId) {
            fetchRules(selectedStepId);
        }
    }, [selectedStepId]);

    const fetchRules = async (stepId) => {
        try {
            const response = await rulesAPI.list({ step: stepId });
            setRules(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching rules:', error);
        }
    };

    const handleOpenModal = (rule = null) => {
        setEditingRule(rule);

        if (rule) {
            // Parse existing condition
            let parsedConditions = [];
            try {
                const cond = typeof rule.condition === 'string' ? JSON.parse(rule.condition) : rule.condition;
                parsedConditions = Array.isArray(cond) ? cond : [cond];
            } catch (e) {
                parsedConditions = [{ field: '', operator: '', value: '', logic: 'AND' }];
            }

            setValue('conditions', parsedConditions);
            setValue('name', rule.name);
            setValue('next_step', rule.next_step?.id || '');
            setValue('is_default', rule.is_default);
        } else {
            reset({
                name: '',
                conditions: [{ field: '', operator: '', value: '', logic: 'AND' }],
                next_step: '',
                is_default: false
            });
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
            // Filter out empty conditions
            const validConditions = data.conditions.filter(c => c.field && c.operator);

            const payload = {
                name: data.name,
                condition: JSON.stringify(validConditions),
                step: selectedStepId,
                next_step: data.next_step || null,
                is_default: data.is_default,
                priority: editingRule?.priority || (rules.length + 1),
            };

            if (editingRule) {
                await rulesAPI.update(editingRule.id, payload);
            } else {
                await rulesAPI.create(payload);
            }
            fetchRules(selectedStepId);
            handleCloseModal();
        } catch (error) {
            console.error('Error saving rule:', error);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await rulesAPI.delete(deleteConfirm.id);
            fetchRules(selectedStepId);
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting rule:', error);
        }
    };

    // Get available next steps (all steps except current)
    const availableNextSteps = useMemo(() => {
        return steps.filter(s => s.id !== selectedStepId);
    }, [steps, selectedStepId]);

    // Get default rule
    const defaultRule = rules.find(r => r.is_default);

    const columns = [
        {
            accessorKey: 'priority',
            header: 'Priority',
            cell: ({ row }) => (
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-dark-text">
                        {row.original.priority}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'name',
            header: 'Rule Name',
        },
        {
            accessorKey: 'condition',
            header: 'Conditions',
            cell: ({ row }) => {
                try {
                    const cond = typeof row.original.condition === 'string'
                        ? JSON.parse(row.original.condition)
                        : row.original.condition;
                    const conditionText = Array.isArray(cond)
                        ? cond.map(c => `${c.field} ${c.operator} ${c.value}`).join(` ${cond[0]?.logic || 'AND'} `)
                        : 'No conditions';
                    return (
                        <code className="text-xs bg-gray-100 dark:bg-dark-border px-2 py-1 rounded block max-w-[200px] truncate">
                            {conditionText}
                        </code>
                    );
                } catch (e) {
                    return <span className="text-gray-400">-</span>;
                }
            },
        },
        {
            accessorKey: 'next_step',
            header: 'Next Step',
            cell: ({ row }) => {
                const nextStep = steps.find(s => s.id === row.original.next_step);
                return nextStep ? (
                    <Badge variant="info">{nextStep.name}</Badge>
                ) : (
                    <span className="text-gray-400">-</span>
                );
            },
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
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(row.original)}>
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(row.original)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    if (steps.length === 0) {
        return (
            <div className="space-y-6">
                <Card>
                    <EmptyState
                        icon={BookOpen}
                        title="No steps available"
                        description="You need to add steps before creating rules."
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Step Selector */}
            <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                    Rules for Step:
                </label>
                <select
                    value={selectedStepId}
                    onChange={(e) => setSelectedStepId(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card min-w-[200px]"
                >
                    {steps.map((step) => (
                        <option key={step.id} value={step.id}>
                            {step.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Validation Messages */}
            {selectedStepId && (
                <div className="space-y-2">
                    {!defaultRule && rules.length > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                            <AlertCircle className="w-4 h-4" />
                            <span>Warning: No default rule set. Add a default rule to handle cases where no conditions match.</span>
                        </div>
                    )}
                    {defaultRule && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span>Default rule is set: {defaultRule.name}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Rules Table */}
            <div className="flex justify-end">
                <Button onClick={() => handleOpenModal()} disabled={!selectedStepId}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rule
                </Button>
            </div>

            <Card className="p-0">
                {rules.length === 0 ? (
                    <EmptyState
                        icon={BookOpen}
                        title="No rules yet"
                        description="Add rules to define how the workflow transitions from this step."
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

            {/* Add/Edit Rule Modal with Rule Builder */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingRule ? 'Edit Rule' : 'Add Rule'}
                size="lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Rule Name"
                        placeholder="e.g., High Amount Approval"
                        {...register('name', { required: 'Rule name is required' })}
                        error={errors.name?.message}
                    />

                    {/* Condition Builder */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                            Conditions
                        </label>
                        <ConditionBuilderWrapper
                            control={control}
                            fields={fields}
                            name="conditions"
                        />
                    </div>

                    <Controller
                        name="next_step"
                        control={control}
                        render={({ field }) => (
                            <Select
                                label="Next Step"
                                options={[
                                    { value: '', label: 'End Workflow' },
                                    ...availableNextSteps.map(s => ({ value: s.id, label: s.name }))
                                ]}
                                value={field.value}
                                onChange={field.onChange}
                                helperText="Where to move next when this rule matches"
                            />
                        )}
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

            {/* Delete Confirmation Modal */}
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

// Wrapper for condition builder with react-hook-form
const ConditionBuilderWrapper = ({ control, fields, name }) => {
    return (
        <Controller
            name={name}
            control={control}
            defaultValue={[{ field: '', operator: '', value: '', logic: 'AND' }]}
            render={({ field: { value, onChange } }) => {
                const conditions = value || [{ field: '', operator: '', value: '', logic: 'AND' }];

                const addCondition = () => {
                    onChange([...conditions, { field: '', operator: '', value: '', logic: 'AND' }]);
                };

                const updateCondition = (index, updated) => {
                    const newConditions = [...conditions];
                    newConditions[index] = updated;
                    onChange(newConditions);
                };

                const removeCondition = (index) => {
                    if (conditions.length > 1) {
                        onChange(conditions.filter((_, i) => i !== index));
                    }
                };

                return (
                    <div className="space-y-2">
                        {conditions.map((condition, index) => (
                            <ConditionBuilder
                                key={index}
                                condition={condition}
                                index={index}
                                fields={fields}
                                onChange={updateCondition}
                                onRemove={removeCondition}
                            />
                        ))}
                        <Button type="button" variant="secondary" size="sm" onClick={addCondition}>
                            <Plus className="w-4 h-4 mr-1" />
                            Add Condition
                        </Button>
                    </div>
                );
            }}
        />
    );
};

// ============================================
// VISUAL BUILDER TAB (React Flow)
// ============================================

const VisualBuilderTab = ({ workflowId }) => {
    const [steps, setSteps] = useState([]);
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 10 },
        })
    );

    useEffect(() => {
        fetchData();
    }, [workflowId]);

    const fetchData = async () => {
        try {
            const [stepsRes, rulesRes] = await Promise.all([
                stepsAPI.list({ workflow: workflowId }),
                rulesAPI.list({ workflow: workflowId }),
            ]);

            const stepsData = stepsRes.data.results || stepsRes.data;
            const rulesData = rulesRes.data.results || rulesRes.data;

            setSteps(stepsData.sort((a, b) => a.order - b.order));
            setRules(rulesData);

            // Build nodes and edges
            buildGraph(stepsData, rulesData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const buildGraph = (stepsData, rulesData) => {
        // Create nodes
        const newNodes = stepsData.map((step, index) => ({
            id: step.id,
            type: 'stepNode',
            position: { x: 250, y: index * 150 + 50 },
            data: {
                label: step.name,
                stepType: step.step_type,
                approvalType: step.approval_type,
            },
        }));

        // Create edges from rules
        const newEdges = [];
        rulesData.forEach((rule) => {
            if (rule.next_step) {
                newEdges.push({
                    id: `e-${rule.id}`,
                    source: rule.step,
                    target: rule.next_step,
                    label: rule.is_default ? 'default' : rule.name,
                    type: 'smoothstep',
                    animated: rule.is_default,
                    style: rule.is_default ? { stroke: '#10b981' } : { stroke: '#6b7280' },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                    },
                });
            }
        });

        setNodes(newNodes);
        setEdges(newEdges);
    };

    const onConnect = useCallback((params) => {
        setEdges((eds) => addEdge({
            ...params,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
        }, eds));
    }, [setEdges]);

    if (steps.length === 0) {
        return (
            <div className="space-y-6">
                <Card>
                    <EmptyState
                        icon={GitBranch}
                        title="No workflow to visualize"
                        description="Add steps and rules first, then come back to the visual builder."
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-dark-muted">
                    Visual representation of your workflow. Steps are nodes, rules are edges.
                </p>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-xs text-gray-600 dark:text-dark-muted">Task</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-xs text-gray-600 dark:text-dark-muted">Approval</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-xs text-gray-600 dark:text-dark-muted">Notification</span>
                    </div>
                </div>
            </div>

            <Card className="h-[600px] overflow-hidden">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    sensors={sensors}
                    fitView
                    attributionPosition="bottom-left"
                >
                    <Background />
                    <Controls />
                    <MiniMap />
                </ReactFlow>
            </Card>

            <div className="text-sm text-gray-500 dark:text-dark-muted">
                <p>• Drag nodes to reposition them</p>
                <p>• Connect nodes by dragging from one handle to another</p>
                <p>• Click on edges to edit or delete connections</p>
            </div>
        </div>
    );
};

export default WorkflowConfigure;
