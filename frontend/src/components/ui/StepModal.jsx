import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, FileUp, CheckCircle2, Edit3 } from 'lucide-react';
import { cn } from '../../utils';
import useWorkflowStore from '../../store/workflowStore';

const stepTypes = [
    {
        id: 'task',
        label: 'Task',
        description: 'Execute a task or action',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
        color: 'blue',
        selectedClass: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
        iconClass: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    },
    {
        id: 'approval',
        label: 'Approval',
        description: 'Require approval from user',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        color: 'yellow',
        selectedClass: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
        iconClass: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400',
    },
    {
        id: 'notification',
        label: 'Notification',
        description: 'Send a notification',
        icon: (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
        ),
        color: 'purple',
        selectedClass: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
        iconClass: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    },
];

// Task templates for quick task creation
const taskTemplates = [
    {
        id: 'document_upload',
        label: 'Upload Document',
        description: 'Request file upload',
        icon: FileUp,
        color: 'emerald',
        selectedClass: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
        iconClass: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    },
    {
        id: 'verify_data',
        label: 'Verify Details',
        description: 'Verify existing data',
        icon: CheckCircle2,
        color: 'cyan',
        selectedClass: 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
        iconClass: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400',
    },
    {
        id: 'edit_data',
        label: 'Edit Data',
        description: 'Edit field data',
        icon: Edit3,
        color: 'orange',
        selectedClass: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
        iconClass: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
    },
];

const StepModal = () => {
    const { isStepModalOpen, closeStepModal, addNode } = useWorkflowStore();
    const [stepName, setStepName] = useState('');
    const [stepType, setStepType] = useState('task');
    const [description, setDescription] = useState('');
    const [assignedRole, setAssignedRole] = useState('employee');
    const [assignedTo, setAssignedTo] = useState('');
    const [approvalType, setApprovalType] = useState('general');
    const [selectedTemplate, setSelectedTemplate] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!stepName.trim()) return;

        // Determine if this is a template-based task (auto-assigned to request creator)
        const isTemplateTask = selectedTemplate !== '';

        // For template tasks, pass null for assignedRole and assignedTo to trigger backend auto-assignment
        addNode({
            label: stepName,
            stepType,
            description,
            assignedRole: isTemplateTask ? null : assignedRole,
            assignedTo: isTemplateTask ? null : assignedTo,
            approvalType,
            taskTemplate: selectedTemplate,
        });

        // Reset form
        setStepName('');
        setStepType('task');
        setDescription('');
        setAssignedRole('employee');
        setAssignedTo('');
        setApprovalType('general');
        setSelectedTemplate('');
    };

    const handleClose = () => {
        closeStepModal();
        setStepName('');
        setStepType('task');
        setDescription('');
        setAssignedRole('employee');
        setAssignedTo('');
        setApprovalType('general');
        setSelectedTemplate('');
    };

    // Handle template selection
    const handleTemplateSelect = (templateId) => {
        setSelectedTemplate(templateId);
        setStepType('task');

        // Auto-fill step name based on template
        const template = taskTemplates.find(t => t.id === templateId);
        if (template && !stepName) {
            setStepName(template.label);
        }
    };

    // Clear template selection when switching to non-task types
    const handleStepTypeChange = (newStepType) => {
        setStepType(newStepType);
        if (newStepType !== 'task') {
            setSelectedTemplate('');
        }
    };

    // Determine if assignment fields should be shown
    const showAssignmentFields = stepType === 'task' && !selectedTemplate;

    if (!isStepModalOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={handleClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-slate-700 shrink-0">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Add New Step
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Create a new workflow step
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                                {/* Left Column: Basic Info & Type */}
                                <div className="space-y-6">
                                    {/* Step Name Input */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Step Name
                                        </label>
                                        <input
                                            type="text"
                                            value={stepName}
                                            onChange={(e) => setStepName(e.target.value)}
                                            placeholder="Enter step name..."
                                            className={cn(
                                                'w-full px-4 py-3 rounded-xl border-2 border-surface-200 dark:border-slate-700',
                                                'bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
                                                'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                                                'focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20',
                                                'transition-all duration-200'
                                            )}
                                            autoFocus
                                        />
                                    </div>

                                    {/* Step Type Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                            Step Type
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {stepTypes.map((type) => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => handleStepTypeChange(type.id)}
                                                    className={cn(
                                                        'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                                                        stepType === type.id && !selectedTemplate
                                                            ? type.selectedClass
                                                            : 'border-surface-200 dark:border-slate-700 hover:border-surface-300 dark:hover:border-slate-600',
                                                        'hover:shadow-sm'
                                                    )}
                                                >
                                                    <div className={cn(
                                                        'w-10 h-10 rounded-xl flex items-center justify-center',
                                                        type.iconClass
                                                    )}>
                                                        {type.icon}
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                                        {type.label}
                                                    </span>
                                                    {stepType === type.id && !selectedTemplate && (
                                                        <div className={cn(
                                                            'w-1.5 h-1.5 rounded-full',
                                                            type.color === 'blue' && 'bg-blue-500',
                                                            type.color === 'yellow' && 'bg-yellow-500',
                                                            type.color === 'purple' && 'bg-purple-500',
                                                        )} />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Task Templates - Show only for task type */}
                                    {stepType === 'task' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                                Quick Templates <span className="text-slate-400 font-normal text-xs">(Auto-assigned)</span>
                                            </label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {taskTemplates.map((template) => (
                                                    <button
                                                        key={template.id}
                                                        type="button"
                                                        onClick={() => handleTemplateSelect(template.id)}
                                                        className={cn(
                                                            'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200',
                                                            selectedTemplate === template.id
                                                                ? template.selectedClass
                                                                : 'border-surface-200 dark:border-slate-700 hover:border-surface-300 dark:hover:border-slate-600',
                                                            'hover:shadow-sm'
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            'w-10 h-10 rounded-xl flex items-center justify-center',
                                                            template.iconClass
                                                        )}>
                                                            <template.icon className="w-5 h-5" />
                                                        </div>
                                                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                                            {template.label}
                                                        </span>
                                                        {selectedTemplate === template.id && (
                                                            <div className={cn(
                                                                'w-1.5 h-1.5 rounded-full',
                                                                template.color === 'emerald' && 'bg-emerald-500',
                                                                template.color === 'cyan' && 'bg-cyan-500',
                                                                template.color === 'orange' && 'bg-orange-500',
                                                            )} />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                            {selectedTemplate && (
                                                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                                                    ✓ This task will be auto-assigned to the creator
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Configuration & Assignment */}
                                <div className="space-y-6">
                                    {/* Assignment fields - Show for manual tasks */}
                                    {showAssignmentFields && (
                                        <div className="space-y-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                                            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Assignment</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                                                        Assigned Role
                                                    </label>
                                                    <select
                                                        value={assignedRole}
                                                        onChange={(e) => setAssignedRole(e.target.value)}
                                                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                                    >
                                                        <option value="employee">Employee</option>
                                                        <option value="manager">Manager</option>
                                                        <option value="finance">Finance</option>
                                                        <option value="ceo">CEO</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                                                        Assigned To User
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={assignedTo}
                                                        onChange={(e) => setAssignedTo(e.target.value)}
                                                        placeholder="Optional user…"
                                                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Approval-specific: Approval Type */}
                                    {stepType === 'approval' && (
                                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                                            <label className="block text-sm font-semibold text-amber-900 dark:text-amber-300 mb-2">
                                                Approval Type
                                            </label>
                                            <select
                                                value={approvalType}
                                                onChange={(e) => setApprovalType(e.target.value)}
                                                className="w-full px-3 py-2.5 rounded-lg border border-amber-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                                            >
                                                <option value="general">General Approval</option>
                                                <option value="manager_approval">Manager Approval</option>
                                                <option value="finance_approval">Finance Approval</option>
                                                <option value="ceo_approval">CEO Approval</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Description */}
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Description (Optional)
                                        </label>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Describe what this step does..."
                                            rows={stepType === 'notification' ? 8 : 4}
                                            className={cn(
                                                'w-full px-4 py-3 rounded-xl border-2 border-surface-200 dark:border-slate-700',
                                                'bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
                                                'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                                                'focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20',
                                                'transition-all duration-200 resize-none h-full min-h-[120px]'
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                            <button
                                type="button"
                                onClick={handleClose}
                                className={cn(
                                    'px-5 py-2.5 rounded-xl font-medium',
                                    'text-slate-700 dark:text-slate-300',
                                    'hover:bg-surface-100 dark:hover:bg-slate-800',
                                    'transition-colors duration-200'
                                )}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!stepName.trim()}
                                className={cn(
                                    'flex items-center gap-2 px-8 py-2.5 rounded-xl font-semibold',
                                    'bg-primary-600 hover:bg-primary-700 text-white',
                                    'disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25',
                                    'transition-all duration-200 active:scale-95'
                                )}
                            >
                                <Plus className="w-4 h-4" />
                                Add Step
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default StepModal;
