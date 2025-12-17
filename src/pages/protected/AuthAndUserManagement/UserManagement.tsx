import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Users, Mail, UserPlus, Edit2, Trash2, Shield, X } from 'lucide-react';
import type { RootState } from '../../../store/store';
import api from '../../../lib/api';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

interface User {
    _id: string;
    name: string;
    email: string;
    role: 'Administrator' | 'Manager' | 'Employee' | 'Client';
    isActive: boolean;
    isEmailVerified: boolean;
    invitationStatus: 'pending' | 'accepted' | 'expired';
    createdAt: string;
}

export default function UserManagement() {
    const currentUser = useSelector((state: RootState) => state.auth.user);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'Employee' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/auth/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/auth/invite', inviteData);
            setShowInviteModal(false);
            setInviteData({ name: '', email: '', role: 'Employee' });
            fetchUsers();
            alert('Invitation sent successfully!');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send invitation');
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        try {
            await api.put(`/auth/users/${selectedUser._id}`, {
                name: selectedUser.name,
                role: selectedUser.role,
                isActive: selectedUser.isActive,
            });
            setShowEditModal(false);
            setSelectedUser(null);
            fetchUsers();
            alert('User updated successfully!');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update user');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await api.delete(`/auth/users/${userId}`);
            fetchUsers();
            alert('User deleted successfully!');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete user');
        }
    };

    const getRoleBadgeColor = (role: string) => {
        const colors = {
            Administrator: 'bg-purple-100 text-purple-800',
            Manager: 'bg-blue-100 text-blue-800',
            Employee: 'bg-green-100 text-green-800',
            Client: 'bg-gray-100 text-gray-800',
        };
        return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const canManageUser = (user: User) => {
        if (currentUser?.role === 'Administrator') return true;
        if (currentUser?.role === 'Manager' && user.role !== 'Administrator') return true;
        return false;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading users...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                        <Users className="w-7 h-7 mr-3 text-blue-600" />
                        User Management
                    </h1>
                    <p className="text-gray-600 mt-1">Manage team members and permissions</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center"
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite User
                </Button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users && users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                {user.isActive ? (
                                                    <span className="text-xs text-green-600 font-medium">● Active</span>
                                                ) : (
                                                    <span className="text-xs text-red-600 font-medium">● Inactive</span>
                                                )}
                                                {user.invitationStatus === 'pending' && (
                                                    <span className="text-xs text-orange-600">Pending invite</span>
                                                )}
                                                {!user.isEmailVerified && user.invitationStatus === 'accepted' && (
                                                    <span className="text-xs text-yellow-600">Email not verified</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {canManageUser(user) && user._id !== currentUser?.id && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowEditModal(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="Edit user"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    {currentUser?.role === 'Administrator' && (
                                                        <button
                                                            onClick={() => handleDeleteUser(user._id)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Delete user"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : !isLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12">
                                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="text-gray-500">No users found</p>
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invite User Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Mail className="w-5 h-5 mr-2 text-blue-600" />
                                Invite User
                            </h3>
                            <button
                                onClick={() => {
                                    setShowInviteModal(false);
                                    setError('');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleInviteUser} className="space-y-4">
                            <Input
                                label="Full name"
                                value={inviteData.name}
                                onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                                required
                            />

                            <Input
                                type="email"
                                label="Email address"
                                value={inviteData.email}
                                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Role
                                </label>
                                <select
                                    value={inviteData.role}
                                    onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="Employee">Employee</option>
                                    <option value="Manager">Manager</option>
                                    {currentUser?.role === 'Administrator' && (
                                        <option value="Administrator">Administrator</option>
                                    )}
                                    <option value="Client">Client</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        setShowInviteModal(false);
                                        setError('');
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" className="flex-1">
                                    Send Invitation
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                                Edit User
                            </h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedUser(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <Input
                                label="Full name"
                                value={selectedUser.name}
                                onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                                required
                            />

                            <Input
                                type="email"
                                label="Email address"
                                value={selectedUser.email}
                                disabled
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Role
                                </label>
                                <select
                                    value={selectedUser.role}
                                    onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as any })}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={currentUser?.role !== 'Administrator' && selectedUser.role === 'Administrator'}
                                >
                                    <option value="Employee">Employee</option>
                                    <option value="Manager">Manager</option>
                                    {currentUser?.role === 'Administrator' && (
                                        <option value="Administrator">Administrator</option>
                                    )}
                                    <option value="Client">Client</option>
                                </select>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={selectedUser.isActive}
                                    onChange={(e) => setSelectedUser({ ...selectedUser, isActive: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                                    Active user
                                </label>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedUser(null);
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" className="flex-1">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
