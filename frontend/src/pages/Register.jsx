import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';
import { Button, Input, Card, Select } from '../components/ui';

const Register = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { register, handleSubmit, formState: { errors } } = useForm();

    const roleOptions = [
        { value: 'Employee', label: 'Employee' },
        { value: 'Manager', label: 'Manager' },
    ];

    const onSubmit = async (data) => {
        setIsLoading(true);
        setError('');

        try {
            await authAPI.register(data);
            navigate('/login', { state: { message: 'Registration successful! Please login.' } });
        } catch (err) {
            const errors = err.response?.data;
            if (errors) {
                const firstError = Object.values(errors)[0];
                setError(Array.isArray(firstError) ? firstError[0] : firstError);
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                        Create Account
                    </h1>
                    <p className="text-gray-500 dark:text-dark-muted mt-2">
                        Enter your details to get started
                    </p>
                </div>

                <Card className="p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <Input
                            label="First Name"
                            placeholder="Enter your first name"
                            {...register('first_name', { required: 'First name is required' })}
                            error={errors.first_name?.message}
                        />

                        <Input
                            label="Last Name"
                            placeholder="Enter your last name"
                            {...register('last_name', { required: 'Last name is required' })}
                            error={errors.last_name?.message}
                        />

                        <Input
                            label="Email"
                            type="email"
                            placeholder="Enter your email"
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: 'Invalid email address'
                                }
                            })}
                            error={errors.email?.message}
                        />

                        <Input
                            label="Department"
                            placeholder="Enter your department"
                            {...register('department', { required: 'Department is required' })}
                            error={errors.department?.message}
                        />

                        <Select
                            label="Role"
                            options={roleOptions}
                            {...register('role', { required: 'Role is required' })}
                            error={errors.role?.message}
                        />

                        <div className="relative">
                            <Input
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Create a password"
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: {
                                        value: 8,
                                        message: 'Password must be at least 8 characters'
                                    }
                                })}
                                error={errors.password?.message}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="Confirm your password"
                            {...register('confirmPassword', { required: 'Please confirm your password' })}
                            error={errors.confirmPassword?.message}
                        />

                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-dark-muted">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Register;
