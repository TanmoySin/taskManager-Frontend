// src/components/modals/AddMemberModal.tsx
import { type FC, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { UserPlus, Search } from 'lucide-react';
import { showToast } from '../../lib/toast';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    currentMembers: any[];
}

const AddMemberModal: FC<AddMemberModalProps> = ({
    isOpen,
    onClose,
    workspaceId,
    currentMembers,
}) => {
    const queryClient = useQueryClient();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] =
        useState<'Administrator' | 'Manager' | 'Employee' | 'Client'>('Employee');
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch all users
    const { data: allUsers, isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get('/auth/users');
            return response.data;
        },
        enabled: isOpen,
    });

    // Add member to workspace
    const addMemberMutation = useMutation({
        mutationFn: (data: { userId: string; role: string }) =>
            api.post(`/workspaces/${workspaceId}/members`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            resetForm();
            onClose();
        },
        onError: (error: any) => {
            showToast.warning(
                'Failed to add member: ' +
                (error.response?.data?.error || error.message),
            )
        },
    });

    const resetForm = () => {
        setSelectedUserId('');
        setSelectedRole('Employee');
        setSearchQuery('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) {
            showToast.warning('Please select a user');
            return;
        }
        addMemberMutation.mutate({ userId: selectedUserId, role: selectedRole });
    };

    // Filter out existing workspace members
    const currentMemberIds = currentMembers.map(
        (m: any) => m.userId._id || m.userId,
    );
    const availableUsers = allUsers?.filter(
        (user: any) => !currentMemberIds.includes(user._id),
    );

    // Search filter
    const filteredUsers = availableUsers?.filter(
        (user: any) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Workspace Member"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserPlus className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                {/* Search Users */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Search User
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Select User */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Select User *
                    </label>
                    {usersLoading ? (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                    ) : filteredUsers && filteredUsers.length > 0 ? (
                        <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-300 rounded-lg p-2">
                            {filteredUsers.map((user: any) => (
                                <label
                                    key={user._id}
                                    className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedUserId === user._id
                                        ? 'bg-blue-50 border border-blue-200'
                                        : 'hover:bg-gray-50 border border-transparent'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="userId"
                                        value={user._id}
                                        checked={selectedUserId === user._id}
                                        onChange={(e) =>
                                            setSelectedUserId(e.target.value)
                                        }
                                        className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="flex items-center space-x-2 flex-1">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-xs font-medium text-blue-600">
                                                {user.name
                                                    ?.charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-500 border border-gray-300 rounded-lg">
                            <UserPlus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">
                                {availableUsers?.length === 0
                                    ? 'All users are already members'
                                    : 'No users found'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Role */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Role *
                    </label>
                    <select
                        value={selectedRole}
                        onChange={(e) =>
                            setSelectedRole(
                                e.target.value as
                                | 'Administrator'
                                | 'Manager'
                                | 'Employee'
                                | 'Client',
                            )
                        }
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="Administrator">Administrator</option>
                        <option value="Manager">Manager</option>
                        <option value="Employee">Employee</option>
                        <option value="Client">Client</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Administrators manage workspace settings and members.
                        Managers oversee projects. Employees work on tasks. Clients
                        have limited access.
                    </p>
                </div>

                {addMemberMutation.isError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        Failed to add member. Please try again.
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={addMemberMutation.isPending}
                        disabled={!selectedUserId}
                    >
                        Add Member
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddMemberModal;
