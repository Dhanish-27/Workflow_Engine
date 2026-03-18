import { useState, useEffect, useMemo } from 'react';
import {
    CheckCircle,
    Clock,
    ExternalLink,
    Eye,
    Check,
    Plus,
    Trash2,
    Settings,
    FileText,
    ShieldCheck,
    HelpCircle,
    Upload,
    File,
    AlertCircle,
    CheckSquare,
    XCircle,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { executionsAPI, stepsAPI } from '../services/api';
import { Button, Card, DataTable, Badge, EmptyState, Modal, Input, Select } from '../components/ui';
import { formatDate, cn } from '../utils';
import { useForm, Controller, useFieldArray } from 'react-hook-form';

const Tasks = () => {
    const [pendingTasks, setPendingTasks] = useState([]);
    const [taskHistory, setTaskHistory] = useState([]);
    const [taskDefinitions, setTaskDefinitions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [uploadingFiles, setUploadingFiles] = useState({});
    const [uploadedFiles, setUploadedFiles] = useState({});

    const taskForm = useForm({
        defaultValues: {
            form_fields: []
        }
    });

    const templateForm = useForm({
        defaultValues: {
            name: '',
            description: '',
            task_type: 'generic',
            form_fields: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: templateForm.control,
        name: "form_fields"
    });

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const [pendingRes, historyRes, definitionsRes] = await Promise.all([
                executionsAPI.getMyTasks(),
                executionsAPI.getTaskHistory(),
                stepsAPI.getTaskDefinitions()
            ]);
            setPendingTasks(pendingRes.data.results || pendingRes.data);
            setTaskHistory(historyRes.data.results || historyRes.data);
            setTaskDefinitions(definitionsRes.data.results || definitionsRes.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Failed to load tasks');
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmit = async (data) => {
        if (!selectedTask) return;
        
        console.log('Submitting task:', selectedTask.id, 'with data:', data);
        console.log('Uploaded files:', uploadedFiles);

        // Validate document_upload task type
        if (selectedTask?.task_type === 'document_upload' && !uploadedFiles['uploaded_document']) {
            toast.error('Please upload a document before completing the task');
            return;
        }

        try {
            const submissionData = {
                data: {}
            };

            const formFields = selectedTask?.form_fields || selectedTask?.step?.form_fields || [];
            formFields.forEach((field, index) => {
                const fieldKey = `field_${index}`;
                // Add optional chaining to prevent crash if label is missing
                const fieldName = field.field_name || field.label?.toLowerCase()?.replace(/\s+/g, '_') || `field_${index}`;

                if (field.is_verify_field) {
                    submissionData.data[fieldName] = {
                        verified: data[fieldKey] || false,
                        original_value: selectedTask?.original_data?.[fieldName] || selectedTask?.execution?.data?.[fieldName]
                    };
                } else if (field.is_new_field || field.field_type === 'file_upload' || field.field_type === 'file') {
                    const fileUrl = uploadedFiles[fieldKey];
                    submissionData.data[fieldName] = fileUrl || data[fieldKey];
                } else {
                    submissionData.data[fieldName] = data[fieldKey];
                }
            });

            if (uploadedFiles['uploaded_document']) {
                submissionData.data.uploaded_document = uploadedFiles['uploaded_document'];
            } else if (data.uploaded_document) {
                submissionData.data.uploaded_document = data.uploaded_document;
            }
            if (data.is_verified !== undefined) {
                submissionData.data.is_verified = data.is_verified;
            }
            if (data.info_response) {
                submissionData.data.info_response = data.info_response;
            }

            console.log('Final submission data:', submissionData);

            await executionsAPI.completeTask(selectedTask.id, submissionData);
            toast.success('Task completed successfully');
            setShowCompleteModal(false);
            setSelectedTask(null);
            setUploadedFiles({});
            fetchTasks();
        } catch (error) {
            console.error('Error completing task:', error);
            toast.error(error.response?.data?.error || 'Failed to complete task');
        }
    };

    const handleFileUpload = async (file, fieldIndex) => {
        if (!file) return null;

        const fieldKey = `field_${fieldIndex}`;
        setUploadingFiles(prev => ({ ...prev, [fieldKey]: true }));

        try {
            const response = await stepsAPI.uploadFile(file);
            const fileUrl = response.data?.url || response.data?.file_url || URL.createObjectURL(file);
            setUploadedFiles(prev => ({ ...prev, [fieldKey]: fileUrl }));
            toast.success('File uploaded successfully');
            return fileUrl;
        } catch (error) {
            console.error('File upload error:', error);
            const fileUrl = URL.createObjectURL(file);
            setUploadedFiles(prev => ({ ...prev, [fieldKey]: fileUrl }));
            return fileUrl;
        } finally {
            setUploadingFiles(prev => ({ ...prev, [fieldKey]: false }));
        }
    };

    const columns = [
        {
            accessorKey: 'workflow_name',
            header: 'Workflow',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900 dark:text-dark-text">
                        {row.original.execution?.workflow_name || row.original.title || 'Standalone Task'}
                    </span>
                    {row.original.execution && (
                        <span className="text-xs text-gray-500 dark:text-dark-muted font-mono">
                            {row.original.execution.id.split('-')[0]}...
                        </span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'step_name',
            header: 'Step',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-muted">
                    {row.original.step ? (
                        <Badge variant="info">{row.original.step.name}</Badge>
                    ) : (
                        <span className="italic">Custom Task</span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'task_type',
            header: 'Task Type',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.original.task_type === 'document_upload' && <FileText className="w-4 h-4 text-blue-500" />}
                    {row.original.task_type === 'verify_data' && <ShieldCheck className="w-4 h-4 text-green-500" />}
                    {row.original.task_type === 'request_info' && <HelpCircle className="w-4 h-4 text-orange-500" />}
                    <span className="text-xs font-medium text-gray-600 dark:text-dark-muted capitalize">
                        {row.original.task_type?.replace('_', ' ') || 'Generic'}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant={row.original.status === 'pending' ? 'warning' : 'success'}>
                    {row.original.status_display}
                </Badge>
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Created On',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-gray-500 dark:text-dark-muted">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(row.original.created_at)}</span>
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.original.status === 'pending' && (
                        <Button
                            size="sm"
                            onClick={() => {
                                setSelectedTask(row.original);
                                setUploadedFiles({});
                                taskForm.reset({});
                                setShowCompleteModal(true);
                            }}
                        >
                            <Check className="w-4 h-4 mr-1" />
                            Complete
                        </Button>
                    )}
                    <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const templateColumns = [
        {
            accessorKey: 'name',
            header: 'Template Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.original.task_type === 'document_upload' && <FileText className="w-4 h-4 text-blue-500" />}
                    {row.original.task_type === 'verify_data' && <ShieldCheck className="w-4 h-4 text-green-500" />}
                    {row.original.task_type === 'request_info' && <HelpCircle className="w-4 h-4 text-orange-500" />}
                    {row.original.task_type === 'generic' && <Settings className="w-4 h-4 text-gray-400" />}
                    <span className="font-medium text-gray-900 dark:text-dark-text">{row.original.name}</span>
                </div>
            ),
        },
        {
            accessorKey: 'task_type',
            header: 'Type',
            cell: ({ row }) => (
                <Badge variant="secondary">
                    {row.original.task_type === 'document_upload' ? 'Upload Documents' :
                        row.original.task_type === 'verify_data' ? 'Verify Documents' :
                            row.original.task_type === 'request_info' ? 'Request Info' : 'Generic'}
                </Badge>
            ),
        },
        {
            accessorKey: 'created_at',
            header: 'Created On',
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
                        onClick={() => {
                            setEditingTemplate(row.original);
                            templateForm.reset({
                                name: row.original.name,
                                description: row.original.description,
                                task_type: row.original.task_type,
                                form_fields: row.original.form_fields
                            });
                            setShowTemplateModal(true);
                        }}
                    >
                        <Settings className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTemplate(row.original.id)}
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    const handleTemplateSubmit = async (data) => {
        try {
            if (editingTemplate) {
                await stepsAPI.updateTaskDefinition(editingTemplate.id, data);
                toast.success('Template updated successfully');
            } else {
                await stepsAPI.createTaskDefinition(data);
                toast.success('Template created successfully');
            }
            setShowTemplateModal(false);
            fetchTasks();
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Failed to save template');
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await stepsAPI.deleteTaskDefinition(id);
            toast.success('Template deleted successfully');
            fetchTasks();
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Failed to delete template');
        }
    };

    const renderFormField = (field, index) => {
        const fieldKey = `field_${index}`;
        const fieldName = field.field_name || field.label?.toLowerCase().replace(/\s+/g, '_') || `field_${index}`;
        const originalValue = selectedTask?.original_data?.[fieldName] || selectedTask?.execution?.data?.[fieldName];
        const isUploading = uploadingFiles[fieldKey];
        const uploadedFileUrl = uploadedFiles[fieldKey];

        if (field.is_verify_field) {
            return (
                <div key={index} className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800/30 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-800 dark:text-green-300">Verification Required</span>
                    </div>

                    {field.description && (
                        <p className="text-xs text-green-700 dark:text-green-400 mb-2">{field.description}</p>
                    )}

                    <div className="bg-white dark:bg-dark-card p-3 rounded border border-green-200 dark:border-green-700/30">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                            {field.label || fieldName}
                        </p>
                        <p className="text-sm text-gray-900 dark:text-dark-text font-medium">
                            {originalValue !== undefined ? String(originalValue) : 'No data available'}
                        </p>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer p-2 bg-green-100 dark:bg-green-900/20 rounded">
                        <input
                            type="checkbox"
                            {...taskForm.register(fieldKey, { required: field.is_required ? 'You must verify this field' : false })}
                            className="w-5 h-5 rounded border-green-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-green-800 dark:text-green-300">
                            I confirm this data is correct
                        </span>
                    </label>
                    {taskForm.formState.errors[fieldKey] && <p className="text-xs text-red-500">{taskForm.formState.errors[fieldKey].message}</p>}
                </div>
            );
        }

        if (field.is_new_field) {
            return (
                <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800/30 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Plus className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">New Information Required</span>
                    </div>

                    {field.description && (
                        <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">{field.description}</p>
                    )}

                    {renderFieldInput(field, index)}
                </div>
            );
        }

        return renderFieldInput(field, index);
    };

    const renderFieldInput = (field, index) => {
        const fieldKey = `field_${index}`;
        const isUploading = uploadingFiles[fieldKey];
        const uploadedFileUrl = uploadedFiles[fieldKey];

        switch (field.field_type) {
            case 'text':
            case 'number':
                return (
                    <Input
                        key={fieldKey}
                        type={field.field_type}
                        label={field.label}
                        required={field.is_required}
                        placeholder={field.description}
                        {...taskForm.register(fieldKey, { required: field.is_required ? 'This field is required' : false })}
                        error={taskForm.formState.errors[fieldKey] && 'This field is required'}
                    />
                );

            case 'textarea':
                return (
                    <div key={fieldKey} className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">
                            {field.label} {field.is_required && <span className="text-red-500">*</span>}
                        </label>
                        {field.description && (
                            <p className="text-xs text-gray-500 dark:text-dark-muted mb-1">{field.description}</p>
                        )}
                        <textarea
                            {...taskForm.register(fieldKey, { required: field.is_required ? 'This field is required' : false })}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-dark-card dark:border-dark-border min-h-[100px]"
                            placeholder={field.description}
                        />
                        {taskForm.formState.errors[fieldKey] && <p className="text-xs text-red-500">This field is required</p>}
                    </div>
                );

            case 'dropdown':
                return (
                    <Controller
                        key={fieldKey}
                        name={fieldKey}
                        control={taskForm.control}
                        rules={{ required: field.is_required }}
                        render={({ field: fieldProps }) => (
                            <Select
                                label={field.label}
                                required={field.is_required}
                                options={(field.options || []).map(o => ({ value: o, label: o }))}
                                value={fieldProps.value}
                                onChange={fieldProps.onChange}
                                error={taskForm.formState.errors[fieldKey] && 'This field is required'}
                            />
                        )}
                    />
                );

            case 'date':
                return (
                    <Input
                        key={fieldKey}
                        type="date"
                        label={field.label}
                        required={field.is_required}
                        {...taskForm.register(fieldKey, { required: field.is_required ? 'This field is required' : false })}
                        error={taskForm.formState.errors[fieldKey] && 'This field is required'}
                    />
                );

            case 'boolean':
                return (
                    <label key={fieldKey} className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 dark:bg-dark-border/30 rounded-lg border border-gray-200 dark:border-dark-border">
                        <input
                            type="checkbox"
                            {...taskForm.register(fieldKey)}
                            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-dark-text">{field.label}</span>
                    </label>
                );

            case 'file_upload':
            case 'file':
                return (
                    <div key={fieldKey} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">
                            {field.label} {field.is_required && <span className="text-red-500">*</span>}
                        </label>
                        {field.description && (
                            <p className="text-xs text-gray-500 dark:text-dark-muted mb-1">{field.description}</p>
                        )}

                        {uploadedFileUrl ? (
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800/30">
                                <File className="w-8 h-8 text-green-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-300">File uploaded</p>
                                    <p className="text-xs text-green-600 dark:text-green-400 truncate">{uploadedFileUrl}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setUploadedFiles(prev => ({ ...prev, [fieldKey]: null }))}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <input
                                    type="file"
                                    disabled={isUploading}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            handleFileUpload(file, index);
                                        }
                                    }}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
                                />
                                {isUploading && (
                                    <p className="text-xs text-blue-600 flex items-center gap-1">
                                        <Upload className="w-3 h-3 animate-pulse" /> Uploading...
                                    </p>
                                )}
                            </div>
                        )}
                        {field.is_required && !uploadedFileUrl && taskForm.formState.errors[fieldKey] && (
                            <p className="text-xs text-red-500">This field is required</p>
                        )}
                    </div>
                );

            default:
                return (
                    <Input
                        key={fieldKey}
                        label={field.label}
                        required={field.is_required}
                        {...taskForm.register(fieldKey, { required: field.is_required ? 'This field is required' : false })}
                        error={taskForm.formState.errors[fieldKey] && 'This field is required'}
                    />
                );
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Tasks</h1>
                    <p className="text-gray-500 dark:text-dark-muted mt-1">
                        View and manage your assigned workflow tasks.
                    </p>
                </div>
            </div>

            <div className="flex gap-4 border-b border-gray-200 dark:border-dark-border">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'pending'
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-gray-500 hover:text-gray-700 dark:text-dark-muted dark:hover:text-dark-text'
                        }`}
                >
                    Pending Tasks
                    {pendingTasks.length > 0 && (
                        <span className="ml-2 bg-primary-100 text-primary-700 py-0.5 px-2 rounded-full text-xs">
                            {pendingTasks.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'history'
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-gray-500 hover:text-gray-700 dark:text-dark-muted dark:hover:text-dark-text'
                        }`}
                >
                    Task History
                </button>
                <button
                    onClick={() => setActiveTab('templates')}
                    className={`pb-4 px-2 text-sm font-medium transition-colors relative ${activeTab === 'templates'
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-gray-500 hover:text-gray-700 dark:text-dark-muted dark:hover:text-dark-text'
                        }`}
                >
                    Task Templates
                </button>
            </div>

            {activeTab === 'templates' && (
                <div className="flex justify-end mb-4">
                    <Button onClick={() => {
                        setEditingTemplate(null);
                        templateForm.reset({
                            name: '',
                            description: '',
                            task_type: 'generic',
                            form_fields: []
                        });
                        setShowTemplateModal(true);
                    }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Template
                    </Button>
                </div>
            )}

            <Card className="p-0">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500 dark:text-dark-muted">
                        Loading tasks...
                    </div>
                ) : (() => {
                    const data = activeTab === 'pending' ? pendingTasks :
                                 activeTab === 'history' ? taskHistory :
                                 taskDefinitions;
                    
                    if (data.length === 0) {
                        return (
                            <EmptyState
                                icon={activeTab === 'templates' ? Settings : CheckCircle}
                                title={
                                    activeTab === 'pending' ? "No pending tasks" :
                                    activeTab === 'history' ? "No task history" :
                                    "No task templates"
                                }
                                description={
                                    activeTab === 'pending' ? "You're all caught up! No tasks require your attention." :
                                    activeTab === 'history' ? "You haven't completed any tasks yet." :
                                    "No task templates have been created yet."
                                }
                            />
                        );
                    }

                    return (
                        <DataTable
                            columns={activeTab === 'templates' ? templateColumns : columns}
                            data={data}
                        />
                    );
                })()}
            </Card>

            <Modal
                isOpen={showCompleteModal}
                onClose={() => {
                    setShowCompleteModal(false);
                    setUploadedFiles({});
                }}
                title={`Complete Task: ${selectedTask?.step?.name}`}
                size="lg"
            >
                <form onSubmit={taskForm.handleSubmit(onSubmit, (err) => console.log('Task Form Errors:', err))} className="space-y-4">
                    <div className="bg-gray-50 dark:bg-dark-border/30 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            {selectedTask?.task_type === 'document_upload' && <FileText className="w-5 h-5 text-blue-500" />}
                            {selectedTask?.task_type === 'verify_data' && <ShieldCheck className="w-5 h-5 text-green-500" />}
                            {selectedTask?.task_type === 'request_info' && <HelpCircle className="w-5 h-5 text-orange-500" />}
                            {(!selectedTask?.task_type || selectedTask?.task_type === 'generic') && <Settings className="w-5 h-5 text-gray-500" />}
                            <h4 className="font-bold text-gray-900 dark:text-dark-text italic">
                                {selectedTask?.step?.name || selectedTask?.title}
                            </h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-dark-muted">
                            {selectedTask?.step?.description || selectedTask?.description}
                        </p>
                    </div>

                    {/* Legacy task type handlers for backward compatibility */}
                    {selectedTask?.task_type === 'document_upload' && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20 space-y-3">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Document Upload Required</p>
                            {uploadedFiles['uploaded_document'] ? (
                                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800/30">
                                    <File className="w-8 h-8 text-green-600" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-green-800 dark:text-green-300">File uploaded</p>
                                        <p className="text-xs text-green-600 dark:text-green-400 truncate">{uploadedFiles['uploaded_document']}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setUploadedFiles(prev => ({ ...prev, ['uploaded_document']: null }))}
                                        className="text-gray-400 hover:text-red-500"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <input
                                        type="file"
                                        disabled={uploadingFiles['uploaded_document']}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const fieldKey = 'uploaded_document';
                                                setUploadingFiles(prev => ({ ...prev, [fieldKey]: true }));
                                                try {
                                                    const response = await stepsAPI.uploadFile(file);
                                                    const fileUrl = response.data?.url || response.data?.file_url || URL.createObjectURL(file);
                                                    setUploadedFiles(prev => ({ ...prev, [fieldKey]: fileUrl }));
                                                    toast.success('File uploaded successfully');
                                                } catch (error) {
                                                    console.error('File upload error:', error);
                                                    const fileUrl = URL.createObjectURL(file);
                                                    setUploadedFiles(prev => ({ ...prev, [fieldKey]: fileUrl }));
                                                } finally {
                                                    setUploadingFiles(prev => ({ ...prev, [fieldKey]: false }));
                                                }
                                            }
                                        }}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
                                    />
                                    {uploadingFiles['uploaded_document'] && (
                                        <p className="text-xs text-blue-600 flex items-center gap-1">
                                            <Upload className="w-3 h-3 animate-pulse" /> Uploading...
                                        </p>
                                    )}
                                </div>
                            )}
                            {taskForm.formState.errors.uploaded_document && <p className="text-xs text-red-500">{taskForm.formState.errors.uploaded_document.message}</p>}
                        </div>
                    )}

                    {selectedTask?.task_type === 'verify_data' && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/20 space-y-3">
                            <p className="text-sm font-medium text-green-800 dark:text-green-300">Data Verification</p>
                            <div className="bg-white dark:bg-dark-card p-3 rounded border border-green-200 dark:border-green-900/30 text-xs">
                                <p className="font-mono text-gray-500 mb-1 uppercase tracking-tight">Workflow Data:</p>
                                <pre className="whitespace-pre-wrap">{JSON.stringify(selectedTask?.execution?.data || {}, null, 2)}</pre>
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...taskForm.register('is_verified', { required: 'You must confirm verification' })}
                                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-dark-text">I have verified the above data/documents</span>
                            </label>
                            {taskForm.formState.errors.is_verified && <p className="text-xs text-red-500">{taskForm.formState.errors.is_verified.message}</p>}
                        </div>
                    )}

                    {selectedTask?.task_type === 'request_info' && (
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/20 space-y-3">
                            <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Information Request</p>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">Reason/Purpose</label>
                                <textarea
                                    {...taskForm.register('info_response', { required: 'Please provide the requested information' })}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-dark-card dark:border-dark-border min-h-[100px]"
                                    placeholder="Enter your response here..."
                                />
                                {taskForm.formState.errors.info_response && <p className="text-xs text-red-500">{taskForm.formState.errors.info_response.message}</p>}
                            </div>
                        </div>
                    )}

                    {/* Dynamic Form Fields */}
                    <div className="space-y-4">
                        {(selectedTask?.form_fields || selectedTask?.step?.form_fields || [])?.length > 0 ? (
                            <>
                                <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-dark-text mb-4">
                                        Form Fields
                                    </h4>
                                </div>
                                {(selectedTask?.form_fields || selectedTask?.step?.form_fields || []).map((field, index) => (
                                    <div key={index}>
                                        {renderFormField(field, index)}
                                    </div>
                                ))}
                            </>
                        ) : null}
                    </div>

                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            Confirm Completion
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>

            <Modal
                isOpen={showTemplateModal}
                onClose={() => setShowTemplateModal(false)}
                title={editingTemplate ? 'Edit Task Template' : 'Create Task Template'}
                size="lg"
            >
                <form onSubmit={templateForm.handleSubmit(handleTemplateSubmit, (err) => console.log('Template Form Errors:', err))} className="space-y-4">
                    <Input
                        label="Template Name"
                        placeholder="e.g., Upload ID Card"
                        {...templateForm.register('name', { required: 'Name is required' })}
                        error={templateForm.formState.errors.name?.message}
                    />
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-dark-text">Description</label>
                        <textarea
                            {...templateForm.register('description')}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-dark-card dark:border-dark-border min-h-[80px]"
                            placeholder="Briefly describe what this task involves..."
                        />
                    </div>
                    <Controller
                        name="task_type"
                        control={templateForm.control}
                        defaultValue="generic"
                        render={({ field }) => (
                            <Select
                                label="Task Type"
                                options={[
                                    { value: 'generic', label: 'Generic Task' },
                                    { value: 'document_upload', label: 'Uploading Documents' },
                                    { value: 'verify_data', label: 'Verifying the Documents' },
                                    { value: 'request_info', label: 'Requesting Information' },
                                ]}
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            {templateForm.watch('task_type') === 'document_upload' && 'Document Upload: Users will see a file upload button primarily.'}
                            {templateForm.watch('task_type') === 'verify_data' && 'Verification: Users will see workflow data and a "Verify" toggle.'}
                            {templateForm.watch('task_type') === 'request_info' && 'Information Request: Optimized for text/document input for reasons/purpose.'}
                            {templateForm.watch('task_type') === 'generic' && 'Generic: Standard form fields as configured below.'}
                        </p>
                    </div>

                    <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-bold text-gray-900 dark:text-dark-text">
                                Custom Form Fields
                            </label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({
                                    label: '',
                                    field_type: 'text',
                                    is_required: true,
                                    is_verify_field: false,
                                    is_new_field: false,
                                    options: [],
                                    description: ''
                                })}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Field
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 bg-gray-50 dark:bg-dark-border/30 rounded-lg border border-gray-200 dark:border-dark-border space-y-3 relative">
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="grid grid-cols-2 gap-3">
                                        <Input
                                            label="Field Label"
                                            placeholder="e.g. Amount"
                                            {...templateForm.register(`form_fields.${index}.label`, { required: 'Label is required' })}
                                        />
                                        <Controller
                                            name={`form_fields.${index}.field_type`}
                                            control={templateForm.control}
                                            defaultValue="text"
                                            render={({ field: selectField }) => (
                                                <Select
                                                    label="Field Type"
                                                    options={[
                                                        { value: 'text', label: 'Text' },
                                                        { value: 'number', label: 'Number' },
                                                        { value: 'dropdown', label: 'Dropdown' },
                                                        { value: 'date', label: 'Date' },
                                                        { value: 'boolean', label: 'Checkbox' },
                                                        { value: 'textarea', label: 'Textarea' },
                                                        { value: 'file_upload', label: 'File Upload' },
                                                    ]}
                                                    value={selectField.value}
                                                    onChange={selectField.onChange}
                                                />
                                            )}
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                {...templateForm.register(`form_fields.${index}.is_required`)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-dark-text">Required</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                {...templateForm.register(`form_fields.${index}.is_verify_field`)}
                                                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-dark-text">Verify Field</span>
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                {...templateForm.register(`form_fields.${index}.is_new_field`)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-dark-text">New Field</span>
                                        </label>
                                    </div>

                                    <Input
                                        label="Help Text"
                                        placeholder="Description or help text for this field"
                                        {...templateForm.register(`form_fields.${index}.description`)}
                                    />

                                    {templateForm.watch(`form_fields.${index}.field_type`) === 'dropdown' && (
                                        <Controller
                                            name={`form_fields.${index}.options`}
                                            control={templateForm.control}
                                            defaultValue={[]}
                                            render={({ field }) => (
                                                <Input
                                                    label="Options (comma separated)"
                                                    placeholder="High, Medium, Low"
                                                    value={Array.isArray(field.value) ? field.value.join(', ') : field.value}
                                                    onChange={(e) => field.onChange(e.target.value.split(',').map(o => o.trim()).filter(Boolean))}
                                                />
                                            )}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowTemplateModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingTemplate ? 'Update Template' : 'Create Template'}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </div>
    );
};

export default Tasks;
