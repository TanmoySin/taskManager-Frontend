// src/pages/Workspaces.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import DropdownMenu from '../../components/ui/DropdownMenu';
import CreateWorkspaceModal from '../../components/modals/CreateWorkspaceModal';
import EditWorkspaceModal from '../../components/modals/EditWorkspaceModal';
import {
    Plus,
    Users,
    Building2,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
} from 'lucide-react';

export default function Workspaces() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editWorkspace, setEditWorkspace] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: workspaces, isLoading } = useQuery({
        queryKey: ['workspaces'],
        queryFn: async () => {
            const response = await api.get('/workspaces');
            return response.data;
        },
    });

    const deleteWorkspaceMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/workspaces/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        },
        onError: (error: any) => {
            alert(
                'Failed to delete workspace: ' +
                (error.response?.data?.error || error.message),
            );
        },
    });

    const filteredWorkspaces = workspaces?.filter((workspace: any) =>
        workspace.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const getWorkspaceMenuItems = (workspace: any) => [
        {
            label: 'View Details',
            icon: <Eye className="w-4 h-4" />,
            onClick: () => {
                navigate(`/workspaces/${workspace._id}`);
            },
        },
        {
            label: 'Edit Workspace',
            icon: <Edit className="w-4 h-4" />,
            onClick: () => {
                setEditWorkspace(workspace);
            },
        },
        {
            label: 'Delete Workspace',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => {
                if (
                    confirm(
                        `Delete workspace "${workspace.name}"? This action cannot be undone.`,
                    )
                ) {
                    deleteWorkspaceMutation.mutate(workspace._id);
                }
            },
            variant: 'danger' as const,
        },
    ];

    const handleCardClick = (workspaceId: string) => {
        navigate(`/workspaces/${workspaceId}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        {workspaces?.length || 0} workspaces
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Workspace
                </Button>
            </div>

            {/* Search */}
            {workspaces?.length > 0 && (
                <Card padding="md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search workspaces..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </Card>
            )}

            {/* Workspaces Grid */}
            {isLoading ? (
                <Card padding="lg">
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-3">
                            Loading workspaces...
                        </p>
                    </div>
                </Card>
            ) : filteredWorkspaces?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredWorkspaces.map((workspace: any) => (
                        <Card
                            key={workspace._id}
                            padding="md"
                            className="hover:shadow-lg transition-all"
                        >
                            <div className="flex items-start justify-between">
                                {/* Left side - Clickable workspace info */}
                                <div
                                    className="flex items-start space-x-3 flex-1 cursor-pointer min-w-0"
                                    onClick={() => handleCardClick(workspace._id)}
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Building2 className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                                            {workspace.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 flex items-center mb-2">
                                            <Users className="w-3 h-3 mr-1" />
                                            {workspace.members?.length || 0} members
                                        </p>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs text-gray-500 truncate">
                                                Owner:{' '}
                                                {workspace.ownerId?.name || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right side - Dropdown menu */}
                                <div className="flex-shrink-0 ml-2">
                                    <DropdownMenu
                                        trigger={
                                            <button
                                                type="button"
                                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4 text-gray-500" />
                                            </button>
                                        }
                                        items={getWorkspaceMenuItems(workspace)}
                                        align="right"
                                    />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card padding="lg">
                    <div className="text-center py-12">
                        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 mb-4">
                            {workspaces?.length === 0
                                ? 'No workspaces yet'
                                : 'No workspaces match your search'}
                        </p>
                        {workspaces?.length === 0 ? (
                            <Button
                                variant="primary"
                                size="md"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Workspace
                            </Button>
                        ) : (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSearchQuery('')}
                            >
                                Clear Search
                            </Button>
                        )}
                    </div>
                </Card>
            )}

            {/* Modals */}
            <CreateWorkspaceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            {editWorkspace && (
                <EditWorkspaceModal
                    isOpen={!!editWorkspace}
                    onClose={() => setEditWorkspace(null)}
                    workspace={editWorkspace}
                />
            )}
        </div>
    );
}
