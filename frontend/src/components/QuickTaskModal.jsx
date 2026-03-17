import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, X, Trash2 } from 'lucide-react';
import { Button, Modal, Input, Select } from '../components/ui';
import { executionsAPI, usersAPI } from '../services/api';

const TASK_TEMPLATES = [
    {
        name: 'Custom Task',
        title: '',
        description: '',
        fields: []
    },
    {
        name: 'Submit Request',
        title: 'Submit Request',
        description: 'Employee submits the initial workflow request with required details.',
        fields: [
            { label: 'Amount', field_type: 'number', required: true },
            { label: 'Department', field_type: 'text', required: true },
            { label: 'Priority', field_type: 'dropdown', required: true, options: 'High, Medium, Low' },
            { label: 'Description', field_type: 'textarea', required: false },
        ]
    },
    {
        name: 'Upload Supporting Documents',
        title: 'Upload Supporting Documents',
        description: 'Employee uploads supporting documents such as invoices, receipts, or proof required for the workflow.',
        fields: [
            { label: 'Document Upload', field_type: 'file', required: true },
            { label: 'Notes', field_type: 'textarea', required: false },
        ]
    },
    {
        name: 'Verify Documents',
        title: 'Verify Documents',
        description: 'Manager checks the uploaded documents and verifies that they are correct before the request proceeds to approval.',
        fields: [
            { label: 'Verification Notes', field_type: 'textarea', required: false },
            { label: 'Verified', field_type: 'boolean', required: true },
        ]
    }
];

const QuickTaskModal = ({ isOpen, onClose }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm({
        defaultValues: {
            title: '',
            description: '',
            assigned_to: '',
            form_fields: []
        }
    });

    const selectedTemplate = watch('template');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await usersAPI.list();
                setUsers(response.data.results || response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedTemplate) {
            const template = TASK_TEMPLATES.find(t => t.name === selectedTemplate);
            if (template) {
                setValue('title', template.title);
                setValue('description', template.description);
                setValue('form_fields', template.fields);
            }
        }
    }, [selectedTemplate, setValue]);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const payload = {
                title: data.title,
                description: data.description,
                assigned_to_id: data.assigned_to,
                form_fields: data.form_fields,
                status: 'pending'
            };
            await executionsAPI.createTask(payload);
            toast.success('Task created successfully');
            reset();
            onClose();
        } catch (error) {
            console.error('Error creating task:', error);
            toast.error('Failed to create task');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Task" size="lg">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <Controller
                        name="template"
                        control={control}
                        render={({ field }) => (
                            <Select
                                label="Task Template"
                                options={TASK_TEMPLATES.map(t => ({ value: t.name, label: t.name }))}
                                value={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                    <Controller
                        name="assigned_to"
                        control={control}
                        rules={{ required: 'Required' }}
                        render={({ field }) => (
                            <Select
                                label="Assign To User"
                                options={users.map(u => ({ value: u.id, label: u.username }))}
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.assigned_to?.message}
                            />
                        )}
                    />
                </div>

                <Input
                    label="Task Title"
                    {...register('title', { required: 'Title is required' })}
                    error={errors.title?.message}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                        Description
                    </label>
                    <textarea
                        {...register('description')}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                </div>

                <Modal.Footer>
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        Create Task
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
};

export default QuickTaskModal;
