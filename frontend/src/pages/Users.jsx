import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Edit2, Trash2, UserPlus, MoreVertical } from 'lucide-react';
import { usersAPI } from '../services/api';
import { Button, Card, Modal, Input, Select, DataTable, Badge, EmptyState } from '../components/ui';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await usersAPI.list();
            setUsers(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        setEditingUser(user);
        if (user) {
            setValue('first_name', user.first_name);
            setValue('last_name', user.last_name);
            setValue('email', user.email);
            setValue('role', user.role);
            setValue('department', user.department);
            setValue('phone', user.phone);
            setValue('is_active', user.is_active);
        } else {
            reset();
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingUser(null);
        reset();
    };

    const onSubmit = async (data) => {
        try {
            if (editingUser) {
                await usersAPI.update(editingUser.id, data);
            } else {
                await usersAPI.create(data);
            }
            fetchUsers();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving user:', error);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await usersAPI.delete(deleteConfirm.id);
            fetchUsers();
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            await usersAPI.update(user.id, { is_active: !user.is_active });
            fetchUsers();
        } catch (error) {
            console.error('Error updating user status:', error);
        }
    };

    const roleOptions = [
        { value: 'admin', label: 'Admin' },
        { value: 'ceo', label: 'CEO' },
        { value: 'finance', label: 'Finance' },
        { value: 'manager', label: 'Manager' },
        { value: 'employee', label: 'Employee' },
    ];

    const statusOptions = [
        { value: true, label: 'Active' },
        { value: false, label: 'Inactive' },
    ];

    const columns = [
        {
            accessorKey: 'id',
            header: 'ID',
            cell: ({ row }) => <span className="text-gray-500">#{row.original.id}</span>,
        },
        {
            accessorKey: 'first_name',
            header: 'Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-700 dark:text-primary-400">
                            {row.original.first_name?.charAt(0) || 'U'}
                        </span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-dark-text">
                        {row.original.first_name} {row.original.last_name}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'email',
            header: 'Email',
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => (
                <Badge variant={row.original.role === 'admin' ? 'info' : 'default'}>
                    {row.original.role}
                </Badge>
            ),
        },
        {
            accessorKey: 'department',
            header: 'Department',
        },
        {
            accessorKey: 'phone',
            header: 'Phone',
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(row.original);
                    }}
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full cursor-pointer ${row.original.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                >
                    {row.original.is_active ? 'Active' : 'Inactive'}
                </button>
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
                        User Management
                    </h1>
                    <p className="text-gray-500 dark:text-dark-muted mt-1">
                        Manage system users and their roles.
                    </p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                </Button>
            </div>

            <Card className="p-0">
                <DataTable
                    columns={columns}
                    data={users}
                    isLoading={isLoading}
                    onRowClick={(row) => handleOpenModal(row)}
                />
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title={editingUser ? 'Edit User' : 'Add New User'}
                size="md"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="First Name"
                        placeholder="Enter first name"
                        {...register('first_name', { required: 'First name is required' })}
                        error={errors.first_name?.message}
                    />

                    <Input
                        label="Last Name"
                        placeholder="Enter last name"
                        {...register('last_name', { required: 'Last name is required' })}
                        error={errors.last_name?.message}
                    />

                    <Input
                        label="Email"
                        type="email"
                        placeholder="Enter email address"
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
                        placeholder="Enter department"
                        {...register('department', { required: 'Department is required' })}
                        error={errors.department?.message}
                    />

                    <Input
                        label="Phone Number"
                        placeholder="Enter phone number"
                        {...register('phone')}
                        error={errors.phone?.message}
                    />

                    <Select
                        label="Role"
                        options={roleOptions}
                        {...register('role', { required: 'Role is required' })}
                        error={errors.role?.message}
                    />

                    <Input
                        label="Password"
                        type="password"
                        placeholder={editingUser ? "Leave blank to keep current password" : "Enter password"}
                        {...register('password', { 
                            required: !editingUser ? 'Password is required' : false,
                            minLength: { value: 8, message: 'Password must be at least 8 characters' }
                        })}
                        error={errors.password?.message}
                    />

                    {editingUser && (
                        <Select
                            label="Status"
                            options={statusOptions}
                            {...register('is_active')}
                        />
                    )}

                    <Modal.Footer>
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            {editingUser ? 'Update' : 'Create'}
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete User"
                size="sm"
            >
                <p className="text-gray-600 dark:text-dark-muted mb-6">
                    Are you sure you want to delete user <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
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

export default Users;
