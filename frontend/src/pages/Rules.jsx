import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Edit2, Trash2, Plus, BookOpen, ArrowUp, ArrowDown, GripVertical, AlertCircle } from 'lucide-react';
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
import { rulesAPI, stepsAPI, workflowFieldsAPI, workflowsAPI } from '../services/api';
import { Button, Card, Modal, Input, DataTable, Badge, EmptyState, Select } from '../components/ui';
import { formatDate, cn } from '../utils';

// OPERATORS_BY_TYPE - same as in WorkflowConfigure
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

// Format conditions for display
const formatConditionsDisplay = (conditions, fields) => {
    if (!conditions || conditions === '') return 'No conditions';

    try {
        let parsed;
        if (typeof conditions === 'string') {
            parsed = JSON.parse(conditions);
        } else {
            parsed = conditions;
        }

        if (parsed && typeof parsed === 'object' && parsed.conditions) {
            const condList = parsed.conditions;
            if (!condList || condList.length === 0) return 'No conditions';

            return condList.map((cond, idx) => {
                const field = fields?.find(f => f.name === cond.field);
                const fieldLabel = field?.label || cond.field;
                const operatorLabel = cond.operator || '';
                const value = cond.value || '';

                if (idx === 0) {
                    return `${fieldLabel} ${operatorLabel} "${value}"`;
                }
                return `${cond.logic || 'AND'} ${fieldLabel} ${operatorLabel} "${value}"`;
            }).join(' ');
        }

        if (Array.isArray(parsed)) {
            return parsed.map((cond, idx) => {
                const field = fields?.find(f => f.name === cond.field);
                const fieldLabel = field?.label || cond.field;
                const operatorLabel = cond.operator || '';
                const value = cond.value || '';

                if (idx === 0) {
                    return `${fieldLabel} ${operatorLabel} "${value}"`;
                }
                return `${cond.logic || 'AND'} ${fieldLabel} ${operatorLabel} "${value}"`;
            }).join(' ');
        }

        return String(conditions);
    } catch (e) {
        return String(conditions);
    }
};

// Condition Row Component
const ConditionRow = ({ condition, index, fields, onChange, onRemove, canRemove, showLogic }) => {
    const selectedField = fields.find(f => f.name === condition.field);
    const operators = selectedField ? (OPERATORS_BY_TYPE[selectedField.field_type] || OPERATORS_BY_TYPE.text) : OPERATORS_BY_TYPE.text;

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

        if (selectedField?.field_type === 'dropdown') {
            return (
                <select
                    value={condition.value || ''}
                    onChange={(e) => onChange(index, { ...condition, value: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card"
                >
                    <option value="">Select value</option>
                    {valueOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            );
        }

        if (selectedField?.field_type === 'boolean') {
            return (
                <select
                    value={condition.value || ''}
                    onChange={(e) => onChange(index, { ...condition, value: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card"
                >
                    <option value="">Select</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select>
            );
        }

        if (selectedField?.field_type === 'date') {
            return (
                <input
                    type="date"
                    value={condition.value || ''}
                    onChange={(e) => onChange(index, { ...condition, value: e.target.value })}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card"
                />
            );
        }

        if (selectedField?.field_type === 'number') {
            return (
                <input
                    type="number"
                    value={condition.value || ''}
                    onChange={(e) => onChange(index, { ...condition, value: e.target.value })}
                    placeholder="Enter value"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card"
                />
            );
        }

        return (
            <input
                type="text"
                value={condition.value || ''}
                onChange={(e) => onChange(index, { ...condition, value: e.target.value })}
                placeholder="Enter value"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card"
            />
        );
    };

    return (
        <div className={`flex items-center gap-2 p-3 bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border ${!condition.field ? 'border-dashed' : ''}`}>
            {showLogic && (
                <select
                    value={condition.logic || 'AND'}
                    onChange={(e) => onChange(index, { ...condition, logic: e.target.value })}
                    className="w-16 px-2 py-1.5 text-sm font-medium border border-gray-300 dark:border-dark-border rounded bg-gray-50 dark:bg-dark-border"
                >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                </select>
            )}
            {!showLogic && <span className="w-16 text-sm font-medium text-gray-600 dark:text-dark-muted">IF</span>}

            <select
                value={condition.field || ''}
                onChange={(e) => onChange(index, { ...condition, field: e.target.value, operator: '', value: '' })}
                className="flex-1 min-w-[140px] px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card"
            >
                <option value="">Select field</option>
                {fields.map((field) => (
                    <option key={field.id || field.name} value={field.name}>
                        {field.label} ({formatFieldType(field.field_type)})
                    </option>
                ))}
            </select>

            <select
                value={condition.operator || ''}
                onChange={(e) => onChange(index, { ...condition, operator: e.target.value })}
                className="w-40 px-3 py-2 text-sm border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card disabled:opacity-50"
                disabled={!condition.field}
            >
                <option value="">Operator</option>
                {operators.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                ))}
            </select>

            {renderValueInput()}

            <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                disabled={!canRemove}
                className="flex-shrink-0"
            >
                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
            </Button>
        </div>
    );
};

// Condition Builder Wrapper
const ConditionBuilderWrapper = ({ control, fields, name, watchIsDefault }) => {
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

                if (watchIsDefault) {
                    return (
                        <div className="p-4 bg-gray-50 dark:bg-dark-border rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-dark-muted">
                                Default rules don't require conditions - they execute when no other rules match.
                            </p>
                        </div>
                    );
                }

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

// Sortable Rule Row Component
const SortableRuleRow = ({ rule, fields, steps, onEdit, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: rule.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.8 : 1,
    };

    const conditionText = formatConditionsDisplay(rule.condition, fields);
    const nextStep = steps.find(s => s.id === rule.next_step);

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className="hover:bg-gray-50 dark:hover:bg-dark-card transition-colors border-b border-gray-200 dark:border-dark-border"
        >
            <td className="px-4 py-3 w-10">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 dark:hover:bg-dark-border rounded text-gray-400"
                >
                    <GripVertical className="w-4 h-4" />
                </div>
            </td>
            <td className="px-4 py-3 w-16">
                <div className="flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-dark-border flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600 dark:text-dark-muted">
                            {rule.priority}
                        </span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 font-medium text-gray-900 dark:text-dark-text min-w-[150px]">
                {rule.name}
            </td>
            <td className="px-6 py-4">
                <div className="max-w-[300px]">
                    {rule.is_default ? (
                        <span className="text-sm text-gray-500 dark:text-dark-muted italic">
                            Default rule (no conditions)
                        </span>
                    ) : (
                        <code className="text-[11px] bg-gray-100 dark:bg-dark-border px-2 py-1 rounded block truncate" title={conditionText}>
                            {conditionText}
                        </code>
                    )}
                </div>
            </td>
            <td className="px-6 py-4">
                {nextStep ? (
                    <Badge variant="info">{nextStep.name}</Badge>
                ) : (
                    <span className="text-gray-400 text-sm italic">End Workflow</span>
                )}
            </td>
            <td className="px-6 py-4">
                <Badge variant={rule.is_default ? 'success' : 'default'}>
                    {rule.is_default ? 'Yes' : 'No'}
                </Badge>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(rule)}
                    >
                        <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(rule)}
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            </td>
        </tr>
    );
};

const Rules = () => {
    const [rules, setRules] = useState([]);
    const [steps, setSteps] = useState([]);
    const [workflows, setWorkflows] = useState([]);
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [validationErrors, setValidationErrors] = useState([]);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState('');

    const { register, handleSubmit, reset, setValue, control, watch, formState: { errors } } = useForm();

    const watchIsDefault = watch('is_default', false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedWorkflowId) {
            fetchFields(selectedWorkflowId);
            fetchRules();
        }
    }, [selectedWorkflowId]);

    const fetchData = async () => {
        try {
            const [stepsRes, workflowsRes] = await Promise.all([
                stepsAPI.list(),
                workflowsAPI.list()
            ]);

            const stepData = stepsRes.data.results || stepsRes.data;
            const workflowData = workflowsRes.data.results || workflowsRes.data;

            setSteps(Array.isArray(stepData) ? stepData : []);
            setWorkflows(Array.isArray(workflowData) ? workflowData : []);

            // Auto-select first workflow if available
            if (workflowData.length > 0) {
                setSelectedWorkflowId(workflowData[0].id);
            } else if (stepData.length > 0) {
                // Try to get workflow from steps
                const uniqueWorkflows = [...new Set(stepData.map(s => s.workflow).filter(w => w))];
                if (uniqueWorkflows.length > 0) {
                    setSelectedWorkflowId(uniqueWorkflows[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRules = async () => {
        if (!selectedWorkflowId) return;

        try {
            const response = await rulesAPI.list({ workflow: selectedWorkflowId });
            let ruleData = response.data.results || response.data;
            
            if (Array.isArray(ruleData)) {
                // Sort by step and then priority for a consistent view
                ruleData.sort((a, b) => {
                    if (a.step !== b.step) {
                        return String(a.step).localeCompare(String(b.step));
                    }
                    return a.priority - b.priority;
                });
                setRules(ruleData);
            } else {
                setRules([]);
            }
        } catch (error) {
            console.error('Error fetching rules:', error);
            setRules([]);
        }
    };

    const fetchFields = async (workflowId) => {
        if (!workflowId) return;

        try {
            const response = await workflowFieldsAPI.list({ workflow: workflowId });
            const fieldData = response.data.results || response.data;
            setFields(Array.isArray(fieldData) ? fieldData : []);
        } catch (error) {
            console.error('Error fetching fields:', error);
            setFields([]);
        }
    };

    const validateRule = (data) => {
        const errors = [];

        // if (!data.name || data.name.trim() === '') {
        //     errors.push('Rule name is required');
        // }
        
        if (data.is_default) {
            const validConditions = data.conditions?.filter(c => c.field && c.operator);
            if (validConditions && validConditions.length > 0) {
                errors.push('Default rule cannot have conditions');
            }

            const existingDefault = rules.find(r => r.is_default && r.id !== editingRule?.id);
            if (existingDefault) {
                errors.push('Only one default rule is allowed per step');
            }
        } else {
            const validConditions = data.conditions?.filter(c => c.field && c.operator);
            if (!validConditions || validConditions.length === 0) {
                errors.push('At least one condition is required for non-default rules');
            }

            // if (!data.next_step) {
            //     errors.push('Next step is required for non-default rules');
            // }
        }

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleOpenModal = (rule = null) => {
        setEditingRule(rule);
        setValidationErrors([]);

        if (rule) {
            let parsedConditions = [];
            try {
                const cond = typeof rule.condition === 'string' ? JSON.parse(rule.condition) : rule.condition;
                if (cond && cond.conditions) {
                    parsedConditions = cond.conditions;
                } else if (Array.isArray(cond)) {
                    parsedConditions = cond;
                }
            } catch (e) {
                parsedConditions = [];
            }

            // Get the workflow for this rule's step
            const step = steps.find(s => s.id === rule.step);
            if (step) {
                // Find workflow from step
                const stepWorkflowId = step.workflow;
                if (stepWorkflowId && stepWorkflowId !== selectedWorkflowId) {
                    setSelectedWorkflowId(stepWorkflowId);
                }
            }

            setValue('conditions', parsedConditions.length > 0 ? parsedConditions : [{ field: '', operator: '', value: '', logic: 'AND' }]);
            setValue('name', rule.name);
            setValue('step', rule.step);
            setValue('next_step', rule.next_step || '');
            setValue('is_default', rule.is_default);
            setValue('priority', rule.priority);
        } else {
            reset({
                name: '',
                step: '',
                conditions: [{ field: '', operator: '', value: '', logic: 'AND' }],
                next_step: '',
                is_default: false,
                priority: rules.length + 1
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
            const validConditions = data.is_default
                ? []
                : data.conditions.filter(c => c.field && c.operator);

            const payload = {
                name: data.name,
                condition: JSON.stringify({
                    conditions: validConditions,
                    logical_operator: validConditions.length > 1 ? validConditions[1]?.logic || 'AND' : 'AND'
                }),
                step: data.step,
                next_step: data.is_default ? null : (data.next_step || null),
                is_default: data.is_default,
                priority: editingRule?.priority || (rules.length + 1),
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
            setValidationErrors([error.response?.data?.detail || 'Error saving rule']);
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

    const handleDragEnd = async (event, stepId) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            // Find all rules for THIS step
            const stepRules = rules
                .filter(r => r.step === stepId)
                .sort((a, b) => a.priority - b.priority);

            const oldIndex = stepRules.findIndex((r) => r.id === active.id);
            const newIndex = stepRules.findIndex((r) => r.id === over.id);

            if (oldIndex === -1 || newIndex === -1) return;

            const reorderedStepRules = arrayMove(stepRules, oldIndex, newIndex);

            // Assign new priorities 1 to N for this step
            const updatedRulesPayload = reorderedStepRules.map((r, idx) => ({
                id: r.id,
                priority: idx + 1
            }));

            // Optimistically update UI state
            const updatedGlobalRules = rules.map(r => {
                const updatedRule = updatedRulesPayload.find(ur => ur.id === r.id);
                return updatedRule ? { ...r, priority: updatedRule.priority } : r;
            });

            // Sort rules for UI consistency
            updatedGlobalRules.sort((a, b) => {
                if (a.step !== b.step) {
                    return String(a.step).localeCompare(String(b.step));
                }
                return a.priority - b.priority;
            });
            
            setRules(updatedGlobalRules);

            try {
                await rulesAPI.reorder({ rules: updatedRulesPayload });
                fetchRules();
            } catch (error) {
                console.error('Error reordering rules:', error);
                fetchRules(); // Revert on error
            }
        }
    };

    // Get steps for the selected workflow
    const workflowSteps = useMemo(() => {
        if (!selectedWorkflowId) return [];
        return steps.filter(s => s.workflow === selectedWorkflowId || s.workflow?.id === selectedWorkflowId);
    }, [steps, selectedWorkflowId]);

    const availableNextSteps = useMemo(() => {
        const currentStepId = watch('step');
        return workflowSteps.filter(s => s.id !== currentStepId);
    }, [workflowSteps, watch('step')]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                        Rules Management
                    </h1>
                    <p className="text-gray-500 dark:text-dark-muted mt-1">
                        Create and manage workflow rules across all workflows.
                    </p>
                </div>
                <Button onClick={() => handleOpenModal()} disabled={steps.length === 0}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Rule
                </Button>
            </div>

            {/* Workflow Selector */}
            {workflows.length > 0 ? (
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
                        Workflow:
                    </label>
                    <select
                        value={selectedWorkflowId}
                        onChange={(e) => setSelectedWorkflowId(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card min-w-[200px]"
                    >
                        {workflows.map((wf) => (
                            <option key={wf.id} value={wf.id}>
                                {wf.name}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                        No workflows found. Please create a workflow and steps first.
                    </p>
                </div>
            )}

            <div className="space-y-8">
                {workflowSteps.map((step) => {
                    const stepRules = rules
                        .filter(r => r.step === step.id)
                        .sort((a, b) => a.priority - b.priority);

                    if (stepRules.length === 0) return null;

                    return (
                        <div key={step.id} className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                                        {step.name}
                                    </h3>
                                    <Badge variant="secondary">
                                        {stepRules.length} {stepRules.length === 1 ? 'Rule' : 'Rules'}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>Drag handle to reorder</span>
                                </div>
                            </div>

                            <Card className="p-0 overflow-hidden border-gray-200 dark:border-dark-border shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
                                            <tr>
                                                <th className="px-4 py-3 w-10"></th>
                                                <th className="px-4 py-3 w-16 text-center text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">Priority</th>
                                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">Rule Name</th>
                                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">Conditions</th>
                                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">Next Step</th>
                                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider">Default</th>
                                                <th className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-dark-muted uppercase tracking-wider w-24 text-right pr-10">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={(e) => handleDragEnd(e, step.id)}
                                            >
                                                <SortableContext
                                                    items={stepRules.map(r => r.id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {stepRules.map((rule) => (
                                                        <SortableRuleRow
                                                            key={rule.id}
                                                            rule={rule}
                                                            fields={fields}
                                                            steps={steps}
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
                        </div>
                    );
                })}

                {rules.length === 0 && !isLoading && (
                    <Card>
                        <EmptyState
                            icon={BookOpen}
                            title="No rules yet"
                            description="Create your first rule to get started."
                            action
                            onAction={() => handleOpenModal()}
                            actionLabel="Create Rule"
                        />
                    </Card>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingRule ? 'Edit Rule' : 'Create Rule'}
                size="xl"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Step Selector in Modal */}
                    <Controller
                        name="step"
                        control={control}
                        rules={{ required: 'Step is required' }}
                        render={({ field }) => (
                            <Select
                                label="Step"
                                options={[
                                    { value: '', label: 'Select a step' },
                                    ...workflowSteps.map(s => ({ value: s.id, label: s.name }))
                                ]}
                                value={field.value}
                                onChange={(e) => {
                                    field.onChange(e);
                                    setValue('next_step', '');
                                }}
                                error={errors.step?.message}
                            />
                        )}
                    />

                    <Input
                        label="Rule Name"
                        placeholder="e.g., High Amount Finance Approval"
                        {...register('name', { required: 'Rule name is required' })}
                        error={errors.name?.message}
                    />

                    {/* Default Rule Checkbox */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <input
                            type="checkbox"
                            {...register('is_default')}
                            id="is_default_modal"
                            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                            <label htmlFor="is_default_modal" className="text-sm font-medium text-gray-900 dark:text-dark-text">
                                Default Rule
                            </label>
                            <p className="text-xs text-gray-500 dark:text-dark-muted mt-0.5">
                                This rule executes when no other rules match.
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

                    {/* Condition Builder */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
                            Conditions
                        </label>
                        <ConditionBuilderWrapper
                            control={control}
                            fields={fields}
                            name="conditions"
                            watchIsDefault={watchIsDefault}
                        />
                    </div>

                    {/* Next Step */}
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

                    <Modal.Footer>
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingRule ? 'Update' : 'Create'}
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
                    Are you sure you want to delete this rule? This action cannot be undone.
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

export default Rules;
