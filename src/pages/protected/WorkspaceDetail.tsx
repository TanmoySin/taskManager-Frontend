import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppSelector } from '../../store/hooks';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import DropdownMenu from '../../components/ui/DropdownMenu';
import EditWorkspaceModal from '../../components/modals/EditWorkspaceModal';
import AddMemberModal from '../../components/modals/AddMemberModal';
import {
    ArrowLeft,
    FolderKanban,
    MoreVertical,
    Edit,
    Trash2,
    UserPlus,
    Building2,
} from 'lucide-react';

export default function WorkspaceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

    // 🔥 GLOBAL USER ROLE FROM REDUX
    const userRole = useAppSelector((state) => state.auth.user?.role);

    const updateMemberRoleMutation = useMutation({
        mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
            // 🔥 FIXED ENDPOINT per backend spec [file:1]
            api.patch(`/workspaces/${id}/members/${memberId}`, { role }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', id] });
        },
        onError: (error: any) => {
            alert(
                'Failed to update member role: ' +
                (error.response?.data?.error || error.message),
            );
        },
    });

    const { data: workspace, isLoading } = useQuery({
        queryKey: ['workspace', id],
        queryFn: async () => {
            const response = await api.get(`/workspaces/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    const { data: projects } = useQuery({
        queryKey: ['workspaceProjects', id],
        queryFn: async () => {
            const response = await api.get(`/workspaces/${id}/projects`);
            return response.data;
        },
        enabled: !!id,
    });

    const deleteWorkspaceMutation = useMutation({
        mutationFn: () => api.delete(`/workspaces/${id}`),
        onSuccess: () => {
            navigate('/workspaces');
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
        onError: (error: any) => {
            alert(
                'Failed to delete workspace: ' +
                (error.response?.data?.error || error.message),
            );
        },
    });

    const removeMemberMutation = useMutation({
        mutationFn: (memberId: string) =>
            api.delete(`/workspaces/${id}/members/${memberId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', id] });
        },
        onError: (error: any) => {
            alert(
                'Failed to remove member: ' +
                (error.response?.data?.error || error.message),
            );
        },
    });

    // 🔥 PERMISSION CHECKS FROM BACKEND SPEC [file:1]
    const isWorkspaceAdmin = workspace?.userWorkspaceRole === 'Administrator' || workspace?.isOwner;
    const isGlobalAdmin = userRole === 'Administrator';
    const canManageMembers = isWorkspaceAdmin || isGlobalAdmin;
    const canManageWorkspace = isWorkspaceAdmin || isGlobalAdmin;

    const workspaceMenuItems = [
        {
            label: 'Edit Workspace',
            icon: <Edit className="w-4 h-4" />,
            onClick: () => setIsEditModalOpen(true),
        },
        {
            label: 'Add Members',
            icon: <UserPlus className="w-4 h-4" />,
            onClick: () => setIsAddMemberModalOpen(true),
        },
        {
            label: 'Delete Workspace',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => {
                if (
                    confirm(
                        'Are you sure you want to delete this workspace? This action cannot be undone.',
                    )
                ) {
                    deleteWorkspaceMutation.mutate();
                }
            },
            variant: 'danger' as const,
        },
    ].filter(item => {
        // 🔥 HIDE MENU ITEMS BASED ON PERMISSIONS
        if (item.label === 'Edit Workspace' || item.label === 'Delete Workspace') {
            return canManageWorkspace;
        }
        if (item.label === 'Add Members') {
            return canManageMembers;
        }
        return true;
    });

    if (isLoading || !workspace) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header - NO CHANGES TO EXISTING UI */}
            <div>
                <button
                    onClick={() => navigate('/workspaces')}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Workspaces
                </button>

                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {workspace.name}
                                </h1>
                                {/* 🔥 USE ACTUAL BACKEND FIELD OR FALLBACK */}
                                <Badge variant="info" size="md">
                                    {workspace.plan || workspace.userWorkspaceRole || 'Standard'}
                                </Badge>
                            </div>
                            <p className="text-gray-600 text-sm">
                                Owner: {workspace.ownerId?.name}
                                {/* 🔥 SHOW YOUR ROLE IN THIS WORKSPACE */}
                                {workspace.userWorkspaceRole && (
                                    <span className="ml-4 text-sm text-gray-500">
                                        Your role: <span className="font-medium">{workspace.userWorkspaceRole}</span>
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    {/* 🔥 DROPDOWN ONLY FOR ADMINS */}
                    {workspaceMenuItems.length > 0 && (
                        <DropdownMenu
                            trigger={
                                <Button variant="ghost" size="md">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            }
                            items={workspaceMenuItems}
                        />
                    )}
                </div>
            </div>

            {/* Stats - NO CHANGES TO EXISTING UI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Team Members */}
                <Card padding="md">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Team Members
                        </h2>
                        {/* 🔥 ADD MEMBER BUTTON - ADMINS ONLY */}
                        {canManageMembers && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsAddMemberModalOpen(true)}
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add Member
                            </Button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {workspace.members?.map((member: any) => {
                            const isOwner = member.userId._id === workspace.ownerId._id;

                            return (
                                <div
                                    key={member.userId._id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3 flex-1">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-medium text-blue-600">
                                                {member.userId.name
                                                    ?.charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {member.userId.name}
                                                {isOwner && (
                                                    <span className="ml-2 text-xs text-blue-600 font-semibold">
                                                        (Owner)
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {member.userId.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {/* 🔥 ROLE SELECTOR - ADMINS ONLY, DISABLED FOR OWNER */}
                                        {!isOwner && canManageMembers && (
                                            <select
                                                value={member.role}
                                                onChange={(e) =>
                                                    updateMemberRoleMutation.mutate({
                                                        memberId: member.userId._id,
                                                        role: e.target.value,
                                                    })
                                                }
                                                disabled={updateMemberRoleMutation.isPending}
                                                className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="Administrator">Administrator</option>
                                                <option value="Manager">Manager</option>
                                                <option value="Employee">Employee</option>
                                                <option value="Client">Client</option>
                                            </select>
                                        )}

                                        {/* 🔥 SHOW ROLE AS BADGE FOR OWNERS/NON-ADMINS */}
                                        {(isOwner || !canManageMembers) && (
                                            <Badge variant="info" size="sm">
                                                {member.role}
                                            </Badge>
                                        )}

                                        {/* 🔥 REMOVE BUTTON - ADMINS ONLY, NOT FOR OWNER */}
                                        {!isOwner && canManageMembers && (
                                            <button
                                                onClick={() => {
                                                    if (
                                                        confirm(
                                                            `Remove ${member.userId.name} from workspace?`,
                                                        )
                                                    ) {
                                                        removeMemberMutation.mutate(
                                                            member.userId._id,
                                                        );
                                                    }
                                                }}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                disabled={removeMemberMutation.isPending}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Projects & Plan Cards - NO CHANGES */}
                <Card padding="md">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FolderKanban className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Projects</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {projects?.length || 0}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card padding="md">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Plan</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {workspace.plan}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* 🔥 REMOVED DUPLICATE MEMBERS SECTION */}

            {/* Projects - NO CHANGES */}
            <Card padding="md">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Projects
                    </h2>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate('/projects')}
                    >
                        View All Projects
                    </Button>
                </div>

                {projects?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {projects.map((project: any) => (
                            <div
                                key={project._id}
                                onClick={() =>
                                    navigate(`/projects/${project._id}`)
                                }
                                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                            {project.name}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            {project.members?.length || 0}{' '}
                                            members
                                        </p>
                                    </div>
                                    <Badge variant="info" size="sm">
                                        {project.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">
                            No projects in this workspace yet
                        </p>
                    </div>
                )}
            </Card>

            {isEditModalOpen && (
                <EditWorkspaceModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    workspace={workspace}
                />
            )}

            {isAddMemberModalOpen && (
                <AddMemberModal
                    isOpen={isAddMemberModalOpen}
                    onClose={() => setIsAddMemberModalOpen(false)}
                    workspaceId={id!}
                    currentMembers={workspace.members || []}
                />
            )}
        </div>
    );
}
