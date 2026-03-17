import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, GitBranch, AlertTriangle, Layers, Loader2 } from 'lucide-react';
import { cn } from '../../utils';
import useWorkflowStore from '../../store/workflowStore';
import { workflowFieldsAPI } from '../../services/api';

// ── Exact same OPERATORS_BY_TYPE as Rules.jsx ──────────────────────────────
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

const DEFAULT_OPERATORS = OPERATORS_BY_TYPE.text;

const getOperators = (fieldType) =>
    OPERATORS_BY_TYPE[fieldType] || DEFAULT_OPERATORS;

const TYPE_LABELS = {
    text: 'Text', number: 'Number', dropdown: 'Dropdown',
    date: 'Date', boolean: 'Yes/No',
};

// ── Common input class ─────────────────────────────────────────────────────
const inputBase = cn(
    'w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700',
    'bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500',
    'transition-colors duration-150'
);

// ── ConditionRow — mirrors ConditionRow in Rules.jsx ──────────────────────
const ConditionRow = ({ condition, index, fields, conditionLogic, onChange, onRemove }) => {
    // fields here are real WorkflowField records: { id, name, label, field_type, options }
    // Use field name for consistency with Rules.jsx
    const fieldMeta = fields.find(f => f.name === condition.field);
    const fieldType = fieldMeta?.field_type || 'text';
    const operators = getOperators(fieldType);

    const handleFieldChange = (newFieldName) => {
        onChange(condition.id, { ...condition, field: newFieldName, operator: '', value: '' });
    };

    const renderValueInput = () => {
        if (!condition.field) {
            return (
                <div className="w-full px-2.5 py-2 text-sm text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                    Select a field first
                </div>
            );
        }
        if (!condition.operator) {
            return (
                <div className="w-full px-2.5 py-2 text-sm text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                    Select an operator
                </div>
            );
        }

        if (fieldType === 'dropdown') {
            const opts = Array.isArray(fieldMeta?.options) ? fieldMeta.options : [];
            return (
                <select
                    value={condition.value}
                    onChange={(e) => onChange(condition.id, { ...condition, value: e.target.value })}
                    className={inputBase}
                >
                    <option value="">Select a value…</option>
                    {opts.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );
        }

        if (fieldType === 'boolean') return null; // operator alone is sufficient

        if (fieldType === 'date') {
            return (
                <input type="date" value={condition.value}
                    onChange={(e) => onChange(condition.id, { ...condition, value: e.target.value })}
                    className={inputBase} />
            );
        }

        if (fieldType === 'number') {
            return (
                <input type="number" value={condition.value} placeholder="Enter value"
                    onChange={(e) => onChange(condition.id, { ...condition, value: e.target.value })}
                    className={inputBase} />
            );
        }

        return (
            <input type="text" value={condition.value} placeholder="Enter value"
                onChange={(e) => onChange(condition.id, { ...condition, value: e.target.value })}
                className={inputBase} />
        );
    };

    return (
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2.5">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {index === 0 ? 'IF' : conditionLogic}
                </span>
                <button onClick={() => onRemove(condition.id)}
                    className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Field selector — real WorkflowField records from backend */}
            <select value={condition.field}
                onChange={(e) => handleFieldChange(e.target.value)}
                className={inputBase}>
                <option value="">Select field…</option>
                {fields.map((field) => (
                    <option key={field.name} value={field.name}>
                        {field.label} ({TYPE_LABELS[field.field_type] || field.field_type})
                    </option>
                ))}
            </select>

            {/* Operator — filtered by field type */}
            <select value={condition.operator}
                onChange={(e) => onChange(condition.id, { ...condition, operator: e.target.value })}
                disabled={!condition.field}
                className={cn(inputBase, !condition.field && 'opacity-50 cursor-not-allowed')}>
                <option value="">Operator</option>
                {operators.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                ))}
            </select>

            {/* Value input — adapts to field type */}
            {renderValueInput()}
        </div>
    );
};

// ── Main ConditionBuilder panel ────────────────────────────────────────────
const ConditionBuilder = () => {
    const { selectedEdge, updateEdge, deleteEdge, clearSelection, workflowId } = useWorkflowStore();

    const [conditions, setConditions] = useState([]);
    const [conditionLogic, setConditionLogic] = useState('AND');
    const [edgeLabel, setEdgeLabel] = useState('Next');

    // Real WorkflowField records fetched from backend
    const [fields, setFields] = useState([]);
    const [isLoadingFields, setIsLoadingFields] = useState(false);

    // Fetch workflow fields from backend whenever workflowId changes
    useEffect(() => {
        if (!workflowId) {
            setFields([]);
            return;
        }
        const fetchFields = async () => {
            setIsLoadingFields(true);
            try {
                const res = await workflowFieldsAPI.list({ workflow: workflowId });
                const data = res.data.results || res.data;
                setFields(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to fetch workflow fields:', err);
                setFields([]);
            } finally {
                setIsLoadingFields(false);
            }
        };
        fetchFields();
    }, [workflowId]);

    // Sync from selected edge - load conditions when edge changes
    // Also re-sync when edge's conditions might have been updated externally
    useEffect(() => {
        if (selectedEdge) {
            // Get conditions from edge - handle both old format (data.conditions) and new format (conditions)
            const edgeConditions = selectedEdge.conditions || selectedEdge.data?.conditions || [];
            setConditions(edgeConditions);
            setConditionLogic(selectedEdge.conditionLogic || selectedEdge.data?.conditionLogic || 'AND');
            setEdgeLabel(selectedEdge.label || 'Next');
        }
    }, [selectedEdge]);

    const handleAddCondition = () => {
        const newCondition = { id: `cond_${Date.now()}`, field: '', operator: '', value: '' };
        const updated = [...conditions, newCondition];
        setConditions(updated);
        if (selectedEdge) {
            updateEdge(selectedEdge.id, {
                conditions: updated,
                label: conditions.length === 0 ? 'Condition' : edgeLabel,
            });
        }
    };

    const handleRemoveCondition = (id) => {
        const updated = conditions.filter(c => c.id !== id);
        setConditions(updated);
        if (selectedEdge) {
            updateEdge(selectedEdge.id, {
                conditions: updated,
                label: updated.length === 0 ? 'Next' : edgeLabel,
            });
        }
    };

    const handleConditionChange = (condId, updated) => {
        const newConditions = conditions.map(c => c.id === condId ? updated : c);
        setConditions(newConditions);
        if (selectedEdge) updateEdge(selectedEdge.id, { conditions: newConditions });
    };

    const handleLogicChange = (logic) => {
        setConditionLogic(logic);
        if (selectedEdge) updateEdge(selectedEdge.id, { conditionLogic: logic });
    };

    const handleLabelChange = (label) => {
        setEdgeLabel(label);
        if (selectedEdge) updateEdge(selectedEdge.id, { label });
    };

    const handleDelete = () => {
        if (selectedEdge) deleteEdge(selectedEdge.id);
    };

    if (!selectedEdge) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-40 flex flex-col border-l border-slate-200 dark:border-slate-800"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                            <GitBranch className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Edge Conditions</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Set routing conditions</p>
                        </div>
                    </div>
                    <button onClick={clearSelection}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* Connection label */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                            Connection Label
                        </label>
                        <input type="text" value={edgeLabel}
                            onChange={(e) => handleLabelChange(e.target.value)}
                            placeholder="e.g. Approved, Rejected, Next"
                            className={inputBase} />
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800" />

                    {/* Loading state */}
                    {isLoadingFields && (
                        <div className="flex items-center justify-center gap-2 py-4 text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Loading fields…</span>
                        </div>
                    )}

                    {/* No workflow saved yet */}
                    {!workflowId && !isLoadingFields && (
                        <div className="flex flex-col items-center gap-2 py-6 text-center">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Layers className="w-5 h-5 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Workflow not saved yet</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                Save the workflow first, then add workflow fields via the Workflow Fields page. Those fields will appear here as condition options.
                            </p>
                        </div>
                    )}

                    {/* Workflow saved but no fields defined */}
                    {workflowId && !isLoadingFields && fields.length === 0 && (
                        <div className="flex flex-col items-center gap-2 py-6 text-center">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Layers className="w-5 h-5 text-amber-500" />
                            </div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No workflow fields defined</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                Go to <strong>Workflow Fields</strong> and add fields (e.g. Amount, Category) for this workflow. They'll appear here as condition options.
                            </p>
                        </div>
                    )}

                    {/* Condition builder — only shown when backend fields exist */}
                    {workflowId && !isLoadingFields && fields.length > 0 && (
                        <>
                            {/* AND / OR toggle */}
                            {conditions.length > 1 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Match</span>
                                    <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        {['AND', 'OR'].map((logic) => (
                                            <button key={logic} onClick={() => handleLogicChange(logic)}
                                                className={cn(
                                                    'px-3 py-1 text-xs font-semibold transition-colors',
                                                    conditionLogic === logic
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                )}>
                                                {logic}
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">conditions</span>
                                </div>
                            )}

                            {/* No conditions yet hint */}
                            {conditions.length === 0 && (
                                <div className="p-3 rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 flex items-start gap-2.5">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">No conditions set</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                            This edge always fires. Add conditions to create branching logic.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Condition rows */}
                            <div className="space-y-3">
                                {conditions.map((condition, index) => (
                                    <ConditionRow
                                        key={condition.id}
                                        condition={condition}
                                        index={index}
                                        fields={fields}
                                        conditionLogic={conditionLogic}
                                        onChange={handleConditionChange}
                                        onRemove={handleRemoveCondition}
                                    />
                                ))}
                            </div>

                            {/* Add Condition button */}
                            <button onClick={handleAddCondition}
                                className={cn(
                                    'flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-dashed text-sm',
                                    'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400',
                                    'hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400',
                                    'transition-colors duration-150'
                                )}>
                                <Plus className="w-4 h-4" />
                                + Add Condition
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <button onClick={handleDelete}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                        Delete Connection
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ConditionBuilder;
