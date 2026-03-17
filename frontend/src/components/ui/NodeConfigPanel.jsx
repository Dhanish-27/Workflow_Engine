import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, User, Calendar, FileText, Shield, Users } from 'lucide-react';
import { cn } from '../../utils';
import useWorkflowStore from '../../store/workflowStore';

const inputClass = cn(
    'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700',
    'bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500',
    'transition-colors duration-150'
);

const labelClass = 'block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5';

const stepTypeConfig = {
    task: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', label: '⚡ Task' },
    approval: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', label: '✅ Approval' },
    notification: { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', label: '🔔 Notification' },
};

const NodeConfigPanel = () => {
    const { selectedNode, updateNode, deleteNode, clearSelection } = useWorkflowStore();
    const [formData, setFormData] = useState({
        label: '',
        stepType: 'task',
        assignedTo: '',
        assignedRole: 'employee',
        approvalType: 'general',
        description: '',
        deadline: '',
    });

    useEffect(() => {
        if (selectedNode) {
            setFormData({
                label: selectedNode.data.label || '',
                stepType: selectedNode.data.stepType || 'task',
                assignedTo: selectedNode.data.assignedTo || '',
                assignedRole: selectedNode.data.assignedRole || 'employee',
                approvalType: selectedNode.data.approvalType || 'general',
                description: selectedNode.data.description || '',
                deadline: selectedNode.data.deadline || '',
            });
        }
    }, [selectedNode]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (selectedNode) {
            updateNode(selectedNode.id, { [field]: value });
        }
    };

    const handleDelete = () => {
        if (selectedNode) deleteNode(selectedNode.id);
    };

    if (!selectedNode) return null;

    const cfg = stepTypeConfig[formData.stepType] || stepTypeConfig.task;

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
                    <div>
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Configure Step</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Edit step properties</p>
                    </div>
                    <button
                        onClick={clearSelection}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Step Type Badge */}
                    <div className={cn('px-3 py-2 rounded-lg text-sm font-semibold', cfg.bg, cfg.color)}>
                        {cfg.label}
                    </div>

                    {/* Step Name */}
                    <div>
                        <label className={labelClass}>
                            <span className="inline-flex items-center gap-1"><FileText className="w-3 h-3" /> Step Name</span>
                        </label>
                        <input
                            type="text"
                            value={formData.label}
                            onChange={(e) => handleChange('label', e.target.value)}
                            className={inputClass}
                            placeholder="Step name…"
                        />
                    </div>

                    {/* ── TASK-specific fields ── */}
                    {formData.stepType === 'task' && (
                        <>
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Task Assignment</p>

                                {/* Assigned Role */}
                                <div className="mb-3">
                                    <label className={labelClass}>
                                        <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> Assigned Role</span>
                                    </label>
                                    <select
                                        value={formData.assignedRole}
                                        onChange={(e) => handleChange('assignedRole', e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="manager">Manager</option>
                                        <option value="finance">Finance</option>
                                        <option value="ceo">CEO</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                {/* Assigned To (specific user) */}
                                <div>
                                    <label className={labelClass}>
                                        <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> Assigned To User</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.assignedTo}
                                        onChange={(e) => handleChange('assignedTo', e.target.value)}
                                        placeholder="Leave blank for role-based"
                                        className={inputClass}
                                    />
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                        Overrides role assignment when set
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── APPROVAL-specific fields ── */}
                    {formData.stepType === 'approval' && (
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Approval Settings</p>
                            <div>
                                <label className={labelClass}>
                                    <span className="inline-flex items-center gap-1"><Shield className="w-3 h-3" /> Approval Type</span>
                                </label>
                                <select
                                    value={formData.approvalType}
                                    onChange={(e) => handleChange('approvalType', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="general">General Approval</option>
                                    <option value="manager_approval">Manager Approval</option>
                                    <option value="finance_approval">Finance Approval</option>
                                    <option value="ceo_approval">CEO Approval</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Deadline */}
                    <div>
                        <label className={labelClass}>
                            <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> Deadline</span>
                        </label>
                        <input
                            type="date"
                            value={formData.deadline}
                            onChange={(e) => handleChange('deadline', e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelClass}>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Describe this step…"
                            rows={3}
                            className={cn(inputClass, 'resize-none')}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                    <button
                        onClick={handleDelete}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Step
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default NodeConfigPanel;
