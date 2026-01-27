import { type FC, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { UserPlus, Trash2, Shield } from 'lucide-react';
import { showToast } from '../../lib/toast';

interface ProjectMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
}

const ProjectMembersModal: FC<ProjectMembersModalProps> = ({
    isOpen,
    onClose,
    projectId,
}) => {
    const queryClient = useQueryClient();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState('CONTRIBUTOR');

    // Fetch current project to get members
    const { data: project } = useQuery({
        queryKey: ['project', projectId],
        queryFn: async () => {
            const response = await api.get(`/projects/${projectId}`);
            return response.data;
        },
        enabled: !!projectId && isOpen,
    });

    const workspaceId = typeof project?.workspaceId === 'object'
        ? project?.workspaceId?._id
        : project?.workspaceId;

    const { data: workspaceMembers, isLoading: loadingWorkspace } = useQuery({
        queryKey: ['workspaceMembers', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return [];
            const response = await api.get(`/workspaces/${workspaceId}`);
            return response.data?.members || [];
        },
        enabled: !!workspaceId && isOpen,
    });

    // Add member mutation
    const addMemberMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: string }) =>
            api.post(`/projects/${projectId}/members`, { userId, role }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
            setSelectedUserId('');
            setSelectedRole('CONTRIBUTOR');
        },
        onError: (error: any) => {
            showToast.warning(
                'Failed to update workspace: ' +
                (error.response?.data?.error || error.message),
            );
        },
    });

    // Update member role mutation
    const updateMemberRoleMutation = useMutation({
        mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
            api.patch(`/projects/${projectId}/members/${memberId}`, { role }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        },
        onError: (error: any) => {
            showToast.warning('Failed to update role: ' + (error.response?.data?.error || error.message));
        },
    });

    // Remove member mutation
    const removeMemberMutation = useMutation({
        mutationFn: (userId: string) =>
            api.delete(`/projects/${projectId}/members/${userId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        },
        onError: (error: any) => {
            showToast.warning('Failed to remove member: ' + (error.response?.data?.error || error.message));
        },
    });

    const handleAddMember = () => {
        if (selectedUserId) {
            addMemberMutation.mutate({ userId: selectedUserId, role: selectedRole });
        }
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'PROJECT_ADMIN':
                return 'danger';
            case 'CONTRIBUTOR':
                return 'info';
            case 'VIEWER':
                return 'default';
            case 'CLIENT_VIEWER':
                return 'warning';
            default:
                return 'default';
        }
    };

    // Filter out users who are already members
    const nonMembers = workspaceMembers?.filter(
        (user: any) => {
            const userId = user.userId?._id || user._id;
            return !project?.members?.some((m: any) => {
                const memberId = m.userId?._id || m.userId;
                return memberId === userId;
            });
        }
    ) || [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Project Members" size="lg">
            <div className="space-y-6">
                {/* Add Member Section */}
                <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Member
                    </h3>
                    <div className="flex gap-3">
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loadingWorkspace}
                        >
                            <option value="">
                                {loadingWorkspace ? 'Loading...' : 'Select user...'}
                            </option>
                            {nonMembers.map((user: any) => {
                                const userId = user.userId?._id || user._id;
                                const userName = user.userId?.name || user.name;
                                const userEmail = user.userId?.email || user.email;
                                const userRole = user.role || user.workspaceRole;

                                return (
                                    <option key={userId} value={userId}>
                                        {userName} - {userEmail}
                                        {userRole && ` (${userRole})`}
                                    </option>
                                );
                            })}
                        </select>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="PROJECT_ADMIN">Admin</option>
                            <option value="CONTRIBUTOR">Contributor</option>
                            <option value="VIEWER">Viewer</option>
                            <option value="CLIENT_VIEWER">Client Viewer</option>
                        </select>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAddMember}
                            disabled={!selectedUserId}
                            isLoading={addMemberMutation.isPending}
                        >
                            Add
                        </Button>
                    </div>
                </div>

                {/* Current Members List */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Current Members ({project?.members?.length || 0})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {project?.members?.map((member: any) => (
                            <div
                                key={member.userId._id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center space-x-3 flex-1">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium text-blue-600">
                                            {member.userId.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            {member.userId.name}
                                        </p>
                                        <p className="text-xs text-gray-500">{member.userId.email}</p>
                                    </div>
                                    <Badge variant={getRoleBadgeVariant(member.role)} size="sm">
                                        {member.role.replace('_', ' ')}
                                    </Badge>
                                </div>

                                <div className="flex items-center space-x-2 ml-4">
                                    {member.userId._id !== project.ownerId._id && (
                                        <>
                                            <select
                                                value={member.role}
                                                onChange={(e) =>
                                                    updateMemberRoleMutation.mutate({
                                                        memberId: member.userId._id,
                                                        role: e.target.value,
                                                    })
                                                }
                                                className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                disabled={updateMemberRoleMutation.isPending}
                                            >
                                                <option value="PROJECT_ADMIN">Admin</option>
                                                <option value="CONTRIBUTOR">Contributor</option>
                                                <option value="VIEWER">Viewer</option>
                                                <option value="CLIENT_VIEWER">Client Viewer</option>
                                            </select>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Remove ${member.userId.name} from project?`)) {
                                                        removeMemberMutation.mutate(member.userId._id);
                                                    }
                                                }}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                disabled={removeMemberMutation.isPending}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                    {member.userId._id === project.ownerId._id && (
                                        <span className="text-xs text-gray-500 flex items-center">
                                            <Shield className="w-3 h-3 mr-1" />
                                            Owner
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ProjectMembersModal;
