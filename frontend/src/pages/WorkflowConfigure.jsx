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
    ArrowUp,
    ArrowDown,
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

// Enhanced OPERATORS_BY_TYPE with all required operators
const OPERATORS_BY_TYPE = {
    text: [
        { value: 'equals', label: 'equals' },
        { value: 'not_equals', label: 'not equals' },
        { value: 'contains', label: 'contains' },
        { value: 'starts_with', label: 'starts with' },
        { value: 'ends_with', label: 'ends with' },
    ],
    number: [
        { value: 'eq', label: 'equals (==)' },
        { value: 'neq', label: 'not equals (!=)' },
        { value: 'gt', label: 'greater than (>)' },
        { value: 'gte', label: 'greater or equal (>=)' },
        { value: 'lt', label: 'less than (<)' },
        { value: 'lte', label: 'less or equal (<=)' },
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

// Format field type for display
const formatFieldType = (type) => {
    const labels = {
        text: 'Text',
        number: 'Number',
        dropdown: 'Dropdown',
        date: 'Date',
        boolean: 'Yes/No',
    };
    return labels[type] || type;
};

// Custom Node for React Flow
const StepNode = ({ data, selected }) => {
    const stepTypeColors = {
        task: 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-500',
        approval: 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/30 dark:border-yellow-500',
        notification: 'bg-purple-50 border-purple-500 dark:bg-purple-900/30 dark:border-purple-500',
    };

    const stepTypeLabels = {
        task: 'Task',
        approval: 'Approval',
        notification: 'Notification',
    };

    const stepTypeIcons = {
        task: '📋',
        approval: '✅',
        notification: '🔔',
    };

    return (
        <div className={cn(
            'px-4 py-3 rounded-lg border-2 shadow-lg min-w-[200px] transition-all duration-200',
            stepTypeColors[data.stepType] || 'bg-gray-50 border-gray-400',
            selected && 'ring-2 ring-primary-500 ring-offset-2 shadow-xl'
        )}>
            <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-3 !h-3" />

            {/* Step Order Badge */}
            {data.order !== undefined && (
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {data.order + 1}
                </div>
            )}

            <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{stepTypeIcons[data.stepType] || '📌'}</span>
                <div className="text-sm font-bold text-gray-900 dark:text-dark-text truncate">
                    {data.label}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Badge variant={data.stepType === 'task' ? 'info' : data.stepType === 'approval' ? 'warning' : 'default'}>
                    {stepTypeLabels[data.stepType] || data.stepType}
                </Badge>
                {data.approvalType && (
                    <span className="text-xs text-gray-500 dark:text-dark-muted">
                        ({data.approvalType.replace('_', ' ')})
                    </span>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-3 !h-3" />
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

    const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm();

    const selectedFieldType = watch('field_type');

    useEffect(() => {
        fetchFields();
    }, [workflowId]);

    const fetchFields = async () => {
        try {
            const response = await workflowFieldsAPI.list({ workflow: workflowId });
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
                        control={control}
                        defaultValue="text"
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

    const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm();

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
                        control={control}
                        defaultValue="task"
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
                            control={control}
                            defaultValue="general"
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
// ENHANCED RULE BUILDER COMPONENTS
// ============================================

// Enhanced Condition Builder with better UI
const ConditionRow = ({ condition, index, fields, onChange, onRemove, canRemove, showLogic }) => {
    const selectedField = fields.find(f => f.name === condition.field);
    const operators = selectedField ? (OPERATORS_BY_TYPE[selectedField.field_type] || OPERATORS_BY_TYPE.text) : OPERATORS_BY_TYPE.text;

    // Get value options for dropdown fields
    const valueOptions = selectedField?.field_type === 'dropdown'
        ? (selectedField.options || []).map(o => ({ value: o, label: o }))
        : [];

    const renderValueInput = () => {
        if (!condition.field) {
            return (
                <div className="flex-1 px-3 py-2 text-sm text-gray-400 bg-gray-100 dark:bg-dark-border rounded border border-dashed border-gray-300">
                    Select a field first
                </div>
            );
        }

        if (!condition.operator) {
            return (
                <div className="flex-1 px-3 py-2 text-sm text-gray-400 bg-gray-100 dark:bg-dark-border rounded border border-dashed border-gray-300">
                    Select an operator
                </div>
            );
        }

        // Dropdown field
        if (selectedField?.field_type === 'dropdown') {
            return (
                <select
                    value={condition.value || ''}
                    onChange={(e) => onChange(index, { ...condition, value: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                    <option value="">Select value</option>
                    {valueOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            );
        }

        // Boolean field
        if (selectedField?.field_type === 'boolean') {
            return (
                <select
                    value={condition.value || ''}
                    onChange={(e) => onChange(index, { ...condition, value: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                    <option value="">Select</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            );
        }

        // Date field
        if (selectedField?.field_type === 'date') {
            return (
                <input
                    type="date"
                    value={condition.value || ''}
                    onChange={(e) => onChange(index, { ...condition, value: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
            );
        }

        // Number field
        if (selectedField?.field_type === 'number') {
            return (
                <input
                    type="number"
                    value={condition.value || ''}
                    onChange={(e) => onChange(index, { ...condition, value: e.target.value })}
                    placeholder="Enter value"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
            );
        }

        // Text field
        return (
            <input
                type="text"
                value={condition.value || ''}
                onChange={(e) => onChange(index, { ...condition, value: e.target.value })}
                placeholder="Enter value"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
        );
    };

    return (
        <div className={cn(
            "flex items-center gap-2 p-3 bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border",
            !condition.field && "border-dashed"
        )}>
            {/* Logic selector (AND/OR) */}
            {showLogic && (
                <select
                    value={condition.logic || 'AND'}
                    onChange={(e) => onChange(index, { ...condition, logic: e.target.value })}
                    className="w-16 px-2 py-1.5 text-sm font-medium border border-gray-300 dark:border-dark-border rounded bg-gray-50 dark:bg-dark-border text-gray-700 dark:text-dark-text"
                >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                </select>
            )}
            {!showLogic && <span className="w-16 text-sm font-medium text-gray-600 dark:text-dark-muted">IF</span>}

            {/* Field selector */}
            <select
                value={condition.field || ''}
                onChange={(e) => onChange(index, { ...condition, field: e.target.value, operator: '', value: '' })}
                className="flex-1 min-w-[140px] px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
                <option value="">Select field</option>
                {fields.map((field) => (
                    <option key={field.id || field.name} value={field.name}>
                        {field.label} ({formatFieldType(field.field_type)})
                    </option>
                ))}
            </select>

            {/* Operator selector */}
            <select
                value={condition.operator || ''}
                onChange={(e) => onChange(index, { ...condition, operator: e.target.value })}
                className="w-40 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
                disabled={!condition.field}
            >
                <option value="">Operator</option>
                {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                        {op.label}
                    </option>
                ))}
            </select>

            {/* Value input */}
            {renderValueInput()}

            {/* Remove button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                disabled={!canRemove}
                className="flex-shrink-0"
            >
                <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
            </Button>
        </div>
    );
};

// Format conditions for display
const formatConditionsDisplay = (conditions, fields) => {
    if (!conditions || conditions.length === 0) return 'No conditions';

    try {
        const parsed = typeof conditions === 'string' ? JSON.parse(conditions) : conditions;
        if (!Array.isArray(parsed)) return String(conditions);

        return parsed.map((cond, idx) => {
            const field = fields.find(f => f.name === cond.field);
            const fieldLabel = field?.label || cond.field;
            const operatorLabel = cond.operator || '';
            const value = cond.value || '';

            if (idx === 0) {
                return `${fieldLabel} ${operatorLabel} "${value}"`;
            }
            return `${cond.logic || 'AND'} ${fieldLabel} ${operatorLabel} "${value}"`;
        }).join(' ');
    } catch (e) {
        return String(conditions);
    }
};

// ============================================
// RULES TAB (with Enhanced Rule Builder)
// ============================================

const WorkflowRulesTab = ({ workflowId }) => {
    const [steps, setSteps] = useState([]);
    const [fields, setFields] = useState([]);
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedStepId, setSelectedStepId] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);

    const { register, handleSubmit, reset, setValue, control, formState: { errors }, watch } = useForm();

    const watchIsDefault = watch('is_default', false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchData();
    }, [workflowId]);

    const fetchData = async () => {
        try {
            const [stepsRes, fieldsRes] = await Promise.all([
                stepsAPI.list({ workflow: workflowId }),
                workflowFieldsAPI.list({ workflow: workflowId }),
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
            const rulesData = response.data.results || response.data;
            // Sort by priority
            setRules([...rulesData].sort((a, b) => a.priority - b.priority));
        } catch (error) {
            console.error('Error fetching rules:', error);
        }
    };

    const validateRule = (data) => {
        const errors = [];

        // Check rule name - only required for non-default rules IF name is empty
        // Backend auto-generates names, so we might not need this on frontend
        // if (!data.name || data.name.trim() === '') {
        //    errors.push('Rule name is required');
        // }

        // Check default rule constraints
        if (data.is_default) {
            // Default rules should not have conditions
            const validConditions = data.conditions?.filter(c => c.field && c.operator);
            if (validConditions && validConditions.length > 0) {
                errors.push('Default rule cannot have conditions');
            }

            // Check if there's already a default rule
            const existingDefault = rules.find(r => r.is_default && r.id !== editingRule?.id);
            if (existingDefault) {
                errors.push('Only one default rule is allowed per step');
            }
        } else {
            // Non-default rules must have at least one valid condition
            const validConditions = data.conditions?.filter(c => c.field && c.operator);
            if (!validConditions || validConditions.length === 0) {
                errors.push('At least one condition is required for non-default rules');
            }
        }

        // Next step is optional - selecting "End Workflow" (empty string) will send null
        // if (!data.is_default && !data.next_step) {
        //     errors.push('Next step is required for non-default rules');
        // }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleOpenModal = (rule = null) => {
        setEditingRule(rule);
        setValidationErrors([]);

        if (rule) {
            // Parse existing condition
            let parsedConditions = [];
            try {
                const cond = typeof rule.condition === 'string' ? JSON.parse(rule.condition) : rule.condition;
                parsedConditions = Array.isArray(cond) ? cond : [];
            } catch (e) {
                parsedConditions = [];
            }

            setValue('conditions', parsedConditions.length > 0 ? parsedConditions : [{ field: '', operator: '', value: '', logic: 'AND' }]);
            setValue('name', rule.name);
            setValue('next_step', rule.next_step?.id || rule.next_step || '');
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
        setValidationErrors([]);
        reset();
    };

    const onSubmit = async (data) => {
        if (!validateRule(data)) {
            return;
        }

        try {
            // Filter out empty conditions
            const validConditions = data.is_default
                ? []
                : data.conditions.filter(c => c.field && c.operator);

            const payload = {
                name: data.name,
                // Store conditions as structured JSON
                condition: JSON.stringify({
                    conditions: validConditions,
                    logical_operator: validConditions.length > 1 ? validConditions[1]?.logic || 'AND' : 'AND'
                }),
                step: selectedStepId,
                next_step: data.is_default ? null : (data.next_step || null),
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
            setValidationErrors([error.response?.data?.detail || 'Error saving rule']);
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

    // Handle priority change (move up/down)
    const handlePriorityChange = async (rule, direction) => {
        const currentIndex = rules.findIndex(r => r.id === rule.id);
        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (newIndex < 0 || newIndex >= rules.length) return;

        const newRules = [...rules];
        [newRules[currentIndex], newRules[newIndex]] = [newRules[newIndex], newRules[currentIndex]];

        // Update priorities
        const updatedRules = newRules.map((r, idx) => ({
            ...r,
            priority: idx + 1
        }));

        setRules(updatedRules);

        // Persist to backend
        try {
            await rulesAPI.update(rule.id, { priority: direction === 'up' ? rule.priority - 1 : rule.priority + 1 });
            fetchRules(selectedStepId);
        } catch (error) {
            console.error('Error updating priority:', error);
            fetchRules(selectedStepId);
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
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => handlePriorityChange(row.original, 'up')}
                        disabled={row.original.priority === 1}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded disabled:opacity-30"
                    >
                        <ArrowUp className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">
                        {row.original.priority}
                    </span>
                    <button
                        onClick={() => handlePriorityChange(row.original, 'down')}
                        disabled={row.original.priority === rules.length}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded disabled:opacity-30"
                    >
                        <ArrowDown className="w-3 h-3" />
                    </button>
                </div>
            ),
        },
        {
            accessorKey: 'name',
            header: 'Rule Name',
            cell: ({ row }) => (
                <span className="font-medium text-gray-900 dark:text-dark-text">
                    {row.original.name}
                </span>
            ),
        },
        {
            accessorKey: 'condition',
            header: 'Conditions',
            cell: ({ row }) => {
                const conditionText = formatConditionsDisplay(row.original.condition, fields);
                return (
                    <div className="max-w-[250px]">
                        {row.original.is_default ? (
                            <span className="text-sm text-gray-500 dark:text-dark-muted italic">
                                Default rule (no conditions)
                            </span>
                        ) : (
                            <code className="text-xs bg-gray-100 dark:bg-dark-border px-2 py-1 rounded block truncate" title={conditionText}>
                                {conditionText}
                            </code>
                        )}
                    </div>
                );
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
                    <span className="text-gray-400">End Workflow</span>
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

            {/* Add/Edit Rule Modal with Enhanced Rule Builder */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingRule ? 'Edit Rule' : 'Add Rule'}
                size="xl"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Rule Name */}
                    <Input
                        label="Rule Name"
                        placeholder="e.g., High Amount Finance Approval"
                        {...register('name')}
                        error={errors.name?.message}
                        disabled={watchIsDefault}
                    />

                    {/* Default Rule Checkbox */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <input
                            type="checkbox"
                            {...register('is_default')}
                            id="is_default"
                            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                            <label htmlFor="is_default" className="text-sm font-medium text-gray-900 dark:text-dark-text">
                                Default Rule
                            </label>
                            <p className="text-xs text-gray-500 dark:text-dark-muted mt-0.5">
                                This rule executes when no other rules match. Default rules don't need conditions.
                            </p>
                        </div>
                    </div>

                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
                                {validationErrors.map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Condition Builder - Hidden for default rules */}
                    {!watchIsDefault && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                                Conditions
                            </label>
                            <p className="text-xs text-gray-500 dark:text-dark-muted mb-3">
                                Define when this rule should apply. Add multiple conditions and specify how they should be combined.
                            </p>
                            <ConditionBuilderWrapper
                                control={control}
                                fields={fields}
                                name="conditions"
                            />
                        </div>
                    )}

                    {/* Next Step - Hidden for default rules */}
                    {!watchIsDefault && (
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
                    )}

                    {/* Info for default rules */}
                    {watchIsDefault && (
                        <div className="p-4 bg-gray-50 dark:bg-dark-border rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-dark-muted">
                                <strong>Default Rule:</strong> This rule will be used when no other rules match.
                                It doesn't require conditions and will always route to the selected next step.
                            </p>
                        </div>
                    )}

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
                            <ConditionRow
                                key={index}
                                condition={condition}
                                index={index}
                                fields={fields}
                                onChange={updateCondition}
                                onRemove={removeCondition}
                                canRemove={conditions.length > 1}
                                showLogic={index > 0}
                            />
                        ))}
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={addCondition}
                            className="mt-3"
                        >
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
    const [error, setError] = useState(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 10 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (workflowId) {
            fetchData();
        }
    }, [workflowId]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [stepsRes, rulesRes] = await Promise.all([
                stepsAPI.list({ workflow: workflowId }),
                rulesAPI.list({ workflow: workflowId }),
            ]);

            const stepsData = stepsRes.data.results || stepsRes.data;
            const rulesData = rulesRes.data.results || rulesRes.data;

            // Sort steps by order
            const sortedSteps = stepsData.sort((a, b) => a.order - b.order);
            setSteps(sortedSteps);
            setRules(rulesData);

            // Build nodes and edges
            buildGraph(sortedSteps, rulesData);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load workflow data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const buildGraph = (stepsData, rulesData) => {
        // Ensure we have steps
        if (!stepsData || stepsData.length === 0) {
            setNodes([]);
            setEdges([]);
            return;
        }

        // Create nodes with better positioning
        const newNodes = stepsData.map((step, index) => ({
            id: String(step.id), // Ensure string UUID
            type: 'stepNode',
            position: {
                x: 250,
                y: index * 180 + 50 // More spacing between nodes
            },
            data: {
                label: step.name || 'Unnamed Step',
                stepType: step.step_type || 'task',
                approvalType: step.approval_type || null,
                order: step.order,
            },
        }));

        // Create edges from rules with proper UUID handling
        const newEdges = [];
        rulesData.forEach((rule) => {
            const sourceId = String(rule.step);
            const targetId = rule.next_step ? String(rule.next_step) : null;

            // Only create edge if both source and target exist
            if (sourceId && targetId) {
                // Check if both nodes exist in our nodes array
                const sourceNodeExists = stepsData.some(s => String(s.id) === sourceId);
                const targetNodeExists = stepsData.some(s => String(s.id) === targetId);

                if (sourceNodeExists && targetNodeExists) {
                    newEdges.push({
                        id: `e-${rule.id}`,
                        source: sourceId,
                        target: targetId,
                        label: rule.is_default ? 'Default' : (rule.name || 'Rule'),
                        type: 'smoothstep',
                        animated: rule.is_default,
                        style: rule.is_default
                            ? { stroke: '#10b981', strokeWidth: 2 }
                            : { stroke: '#6b7280', strokeWidth: 1.5 },
                        labelStyle: { fill: '#374151', fontWeight: 500 },
                        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.9 },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: rule.is_default ? '#10b981' : '#6b7280',
                        },
                    });
                }
            }
        });

        // Add default flow edges if no rules define the flow
        // This creates sequential connections between steps if no explicit rules exist
        if (newEdges.length === 0 && stepsData.length > 1) {
            for (let i = 0; i < stepsData.length - 1; i++) {
                newEdges.push({
                    id: `e-default-${stepsData[i].id}`,
                    source: String(stepsData[i].id),
                    target: String(stepsData[i + 1].id),
                    label: 'Next',
                    type: 'smoothstep',
                    style: { stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '5,5' },
                    labelStyle: { fill: '#6b7280', fontSize: 10 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#9ca3af',
                    },
                });
            }
        }

        setNodes(newNodes);
        setEdges(newEdges);
    };

    const onConnect = useCallback((params) => {
        setEdges((eds) => addEdge({
            ...params,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#6b7280' },
        }, eds));
    }, [setEdges]);

    const onNodeDragStop = useCallback(() => {
        // Could save position here if needed
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <Card>
                    <EmptyState
                        icon={AlertCircle}
                        title="Error loading workflow"
                        description={error}
                        action
                        onAction={fetchData}
                        actionLabel="Try Again"
                    />
                </Card>
            </div>
        );
    }

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
                    Visual representation of your workflow. Steps are nodes, rules are edges connecting them.
                </p>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={fetchData}>
                        <GitBranch className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-dark-muted mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>Task</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span>Approval</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span>Notification</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Default Rule</span>
                </div>
            </div>

            <Card className="h-[650px] overflow-hidden p-0" noPadding>
                <div className="h-full w-full">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        sensors={sensors}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                        attributionPosition="bottom-left"
                        minZoom={0.1}
                        maxZoom={2}
                        defaultEdgeOptions={{
                            type: 'smoothstep',
                            animated: false,
                            style: { stroke: '#6b7280', strokeWidth: 1.5 },
                        }}
                    >
                        <Background color="#e5e7eb" gap={20} size={1} />
                        <Controls
                            showInteractive={false}
                            style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                        />
                        <MiniMap
                            nodeStrokeWidth={3}
                            zoomable
                            pannable
                            style={{ background: '#f9fafb', borderRadius: '8px' }}
                        />
                    </ReactFlow>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 dark:text-dark-muted bg-gray-50 dark:bg-dark-card p-4 rounded-lg">
                <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 mt-0.5 text-gray-400" />
                    <span>Drag nodes to reposition them in the workflow</span>
                </div>
                <div className="flex items-start gap-2">
                    <GitBranch className="w-4 h-4 mt-0.5 text-gray-400" />
                    <span>Connect nodes by dragging from one handle to another</span>
                </div>
                <div className="flex items-start gap-2">
                    <ListOrdered className="w-4 h-4 mt-0.5 text-gray-400" />
                    <span>Steps display in order (1, 2, 3...) from top to bottom</span>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{steps.length}</div>
                    <div className="text-sm text-gray-500">Total Steps</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{rules.filter(r => r.is_default).length}</div>
                    <div className="text-sm text-gray-500">Default Rules</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{edges.length}</div>
                    <div className="text-sm text-gray-500">Connections</div>
                </Card>
            </div>
        </div>
    );
};

export default WorkflowConfigure;
