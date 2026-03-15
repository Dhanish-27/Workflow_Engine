import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FileText, Send } from 'lucide-react';
import { workflowsAPI, workflowFieldsAPI, executionsAPI } from '../services/api';
import { Button, Card, Select, Input, Badge } from '../components/ui';

const CreateRequest = () => {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [fields, setFields] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFieldsLoading, setIsFieldsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm();

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            const response = await workflowsAPI.list({ is_active: true });
            const data = response.data;
            // Handle both paginated and non-paginated responses
            const workflowList = Array.isArray(data) ? data : (data.results || []);
            setWorkflows(workflowList);
        } catch (error) {
            console.error('Error fetching workflows:', error);
            setWorkflows([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWorkflowChange = async (workflowId) => {
        const workflow = workflows.find(w => w.id === workflowId);
        setSelectedWorkflow(workflow);
        setIsFieldsLoading(true);
        setFields([]);

        if (workflowId) {
            try {
                const response = await workflowFieldsAPI.list({ workflow: workflowId });
                setFields(response.data.results || response.data);
            } catch (error) {
                console.error('Error fetching fields:', error);
            } finally {
                setIsFieldsLoading(false);
            }
        }
    };

    const onSubmit = async (data) => {
        if (!selectedWorkflow) return;

        setIsSubmitting(true);
        try {
            const payload = {
                workflow: selectedWorkflow.id,
                data: data,
            };

            await executionsAPI.create(payload);
            navigate('/my-requests');
        } catch (error) {
            console.error('Error creating execution:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderField = (field) => {
        const { name, label, field_type, required, options } = field;

        switch (field_type) {
            case 'dropdown':
                return (
                    <Select
                        key={name}
                        label={label}
                        options={(options || []).map(opt => ({ value: opt, label: opt }))}
                        {...register(name, { required: required ? `${label} is required` : false })}
                        error={errors[name]?.message}
                        required={required}
                    />
                );
            case 'number':
                return (
                    <Input
                        key={name}
                        label={label}
                        type="number"
                        placeholder={`Enter ${label.toLowerCase()}`}
                        {...register(name, {
                            required: required ? `${label} is required` : false,
                            valueAsNumber: true,
                        })}
                        error={errors[name]?.message}
                        required={required}
                    />
                );
            case 'date':
                return (
                    <Input
                        key={name}
                        label={label}
                        type="date"
                        {...register(name, { required: required ? `${label} is required` : false })}
                        error={errors[name]?.message}
                        required={required}
                    />
                );
            case 'email':
                return (
                    <Input
                        key={name}
                        label={label}
                        type="email"
                        placeholder={`Enter ${label.toLowerCase()}`}
                        {...register(name, {
                            required: required ? `${label} is required` : false,
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address'
                            }
                        })}
                        error={errors[name]?.message}
                        required={required}
                    />
                );
            default:
                return (
                    <Input
                        key={name}
                        label={label}
                        type="text"
                        placeholder={`Enter ${label.toLowerCase()}`}
                        {...register(name, { required: required ? `${label} is required` : false })}
                        error={errors[name]?.message}
                        required={required}
                    />
                );
        }
    };

    const workflowOptions = workflows.map(w => ({
        value: w.id,
        label: w.name,
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                    Create Request
                </h1>
                <p className="text-gray-500 dark:text-dark-muted mt-1">
                    Submit a new workflow request.
                </p>
            </div>

            <Card>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Select
                        label="Select Workflow"
                        options={workflowOptions}
                        placeholder="Choose a workflow"
                        value={selectedWorkflow?.id || ''}
                        onChange={(e) => handleWorkflowChange(e.target.value)}
                        required
                    />

                    {selectedWorkflow && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 pb-4 border-b border-gray-200 dark:border-dark-border">
                                <Badge variant="info">v{selectedWorkflow.version}</Badge>
                                <span className="text-sm text-gray-500 dark:text-dark-muted">
                                    {selectedWorkflow.description}
                                </span>
                            </div>

                            {isFieldsLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i}>
                                            <div className="h-4 w-24 bg-gray-200 dark:bg-dark-border rounded mb-2 animate-pulse" />
                                            <div className="h-10 bg-gray-200 dark:bg-dark-border rounded animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            ) : fields.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {fields.map(field => renderField(field))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-dark-muted">
                                    No fields configured for this workflow.
                                </div>
                            )}
                        </div>
                    )}

                    {selectedWorkflow && fields.length > 0 && (
                        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-dark-border">
                            <Button type="submit" isLoading={isSubmitting}>
                                <Send className="w-4 h-4 mr-2" />
                                Submit Request
                            </Button>
                        </div>
                    )}
                </form>
            </Card>
        </div>
    );
};

export default CreateRequest;
