import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Edit2, Trash2, Plus, BookOpen } from 'lucide-react';
import { rulesAPI, stepsAPI } from '../services/api';
import { Button, Card, Modal, Input, DataTable, Badge, EmptyState, Select } from '../components/ui';
import { formatDate } from '../utils';

const Rules = () => {
    const [rules, setRules] = useState([]);
    const [steps, setSteps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

    useEffect(() => {
        fetchRules();
        fetchSteps();
    }, []);

    const fetchRules = async () => {
        try {
            const response = await rulesAPI.list();
            const ruleData = response.data.results || response.data;
            setRules(Array.isArray(ruleData) ? ruleData : []);
        } catch (error) {
            console.error('Error fetching rules:', error);
            setRules([]);
        } finally {
            setIsLoading(false);
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
        }
    };

    const handleOpenModal = (rule = null) => {
        setEditingRule(rule);
        if (rule) {
            setValue('condition', rule.condition);
            setValue('step', rule.step);
            setValue('next_step', rule.next_step || '');
            setValue('priority', rule.priority);
        } else {
            reset({ condition: '', step: '', next_step: '', priority: 1 });
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
                next_step: data.next_step || null
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

    const getStepName = (stepId) => {
        const step = steps.find(s => s.id === stepId);
        return step ? step.name : '-';
    };

    const columns = [
        {
            accessorKey: 'condition',
            header: 'Condition',
            cell: ({ row }) => (
                <span className="font-medium text-gray-900 dark:text-dark-text">
                    {row.original.condition}
                </span>
            ),
        },
        {
            accessorKey: 'step',
            header: 'Step',
            cell: ({ row }) => (
                <span className="text-gray-500 dark:text-dark-muted">
                    {getStepName(row.original.step)}
                </span>
            ),
        },
        {
            accessorKey: 'next_step',
            header: 'Next Step',
            cell: ({ row }) => (
                <span className="text-gray-500 dark:text-dark-muted">
                    {row.original.next_step ? getStepName(row.original.next_step) : '-'}
                </span>
            ),
        },
        {
            accessorKey: 'priority',
            header: 'Priority',
            cell: ({ row }) => (
                <Badge variant="default">#{row.original.priority}</Badge>
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
                        Rules Management
                    </h1>
                    <p className="text-gray-500 dark:text-dark-muted mt-1">
                        Create and manage workflow rules.
                    </p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Rule
                </Button>
            </div>

            <Card className="p-0">
                {rules.length === 0 && !isLoading ? (
                    <EmptyState
                        icon={BookOpen}
                        title="No rules yet"
                        description="Create your first rule to get started."
                        action
                        onAction={() => handleOpenModal()}
                        actionLabel="Create Rule"
                    />
                ) : (
                    <DataTable
                        columns={columns}
                        data={rules}
                        isLoading={isLoading}
                    />
                )}
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingRule ? 'Edit Rule' : 'Create Rule'}
                size="md"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                            Step
                        </label>
                        <select
                            {...register('step', { required: 'Step is required' })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-dark-card dark:border-dark-border dark:text-dark-text"
                        >
                            <option value="">Select a step</option>
                            {steps.map(step => (
                                <option key={step.id} value={step.id}>
                                    {step.name}
                                </option>
                            ))}
                        </select>
                        {errors.step && (
                            <p className="mt-1 text-sm text-red-500">{errors.step.message}</p>
                        )}
                    </div>

                    <Input
                        label="Condition"
                        placeholder="Enter condition (e.g., amount > 1000)"
                        {...register('condition', { required: 'Condition is required' })}
                        error={errors.condition?.message}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                            Next Step (optional)
                        </label>
                        <select
                            {...register('next_step')}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-dark-card dark:border-dark-border dark:text-dark-text"
                        >
                            <option value="">End of workflow</option>
                            {steps.map(step => (
                                <option key={step.id} value={step.id}>
                                    {step.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Priority"
                        type="number"
                        placeholder="1"
                        {...register('priority', { required: 'Priority is required', valueAsNumber: true })}
                        error={errors.priority?.message}
                    />

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