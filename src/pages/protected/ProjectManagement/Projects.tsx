import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import CreateProjectModal from '../../../components/modals/CreateProjectModal';
import { Plus, FolderKanban, Users, Calendar, Filter, Star, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Projects() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [archivedFilter, setArchivedFilter] = useState<boolean>(false);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [search, setSearch] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['projects', { statusFilter, typeFilter, search, archivedFilter }],
        queryFn: async () => {
            const params: any = {};
            if (statusFilter !== 'ALL') params.status = statusFilter;
            if (typeFilter !== 'ALL') params.type = typeFilter;
            if (search.trim()) params.search = search.trim();
            params.archived = archivedFilter; // ✅ ADD THIS

            const response = await api.get('/projects', { params });
            return response.data;
        },
    });

    const restoreProjectMutation = useMutation({
        mutationFn: (projectId: string) => api.post(`/projects/${projectId}/restore`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onError: (error: any) => {
            alert('Failed to restore: ' + (error.response?.data?.error || error.message));
        },
    });


    const projects = data?.projects || [];
    const totalCount = data?.count || 0;

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'PLANNED':
                return 'info';
            case 'ON_HOLD':
                return 'warning';
            case 'COMPLETED':
                return 'success';
            case 'ARCHIVED':
                return 'default';
            default:
                return 'default';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Critical':
                return 'text-red-600';
            case 'High':
                return 'text-orange-600';
            case 'Medium':
                return 'text-yellow-600';
            case 'Low':
                return 'text-green-600';
            default:
                return 'text-gray-500';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        {totalCount} project{totalCount === 1 ? '' : 's'}
                    </p>
                </div>
                <Button variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                </Button>
            </div>

            {/* Filters */}
            <Card padding="md" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative w-full max-w-sm">
                        <input
                            type="text"
                            placeholder="Search by name, key, description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* ✅ ADD THIS: Archived Toggle */}
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={archivedFilter}
                            onChange={(e) => setArchivedFilter(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Show Archived</span>
                    </label>

                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PLANNED">Planned</option>
                            <option value="ACTIVE">Active</option>
                            <option value="ON_HOLD">On Hold</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="ARCHIVED">Archived</option>
                        </select>
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="ALL">All Types</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Mobile App">Mobile App</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Design">Design</option>
                        <option value="Data Science">Data Science</option>
                        <option value="DevOps">DevOps</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
            </Card>

            {/* Content */}
            {isLoading ? (
                <Card padding="lg">
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                </Card>
            ) : projects.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project: any) => (
                        <Card
                            key={project._id}
                            padding="md"
                            className="hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                            onClick={() => navigate(`/projects/${project._id}`)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{
                                            backgroundColor: project.color || '#ECFDF3',
                                        }}
                                    >
                                        <FolderKanban className="w-5 h-5 text-green-700" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-mono">
                                            {project.projectKey || 'NO-KEY'}
                                        </p>
                                        <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                                            {project.name}
                                        </h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={getStatusBadgeVariant(project.status)} size="sm">
                                        {project.status}
                                    </Badge>
                                    {/* ✅ ADD THIS: Restore button for archived projects */}
                                    {project.isArchived && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Restore project "${project.name}"?`)) {
                                                    restoreProjectMutation.mutate(project._id);
                                                }
                                            }}
                                            isLoading={restoreProjectMutation.isPending}
                                        >
                                            <Archive className="w-3 h-3 mr-1" />
                                            Restore
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {project.description || 'No description'}
                            </p>

                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                                <span className="inline-flex items-center">
                                    <Users className="w-3 h-3 mr-1" />
                                    {project.members?.length || 0} members
                                </span>
                                {project.type && (
                                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px]">
                                        {project.type}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Star className={`w-3 h-3 ${getPriorityColor(project.priority)}`} />
                                    <span className={getPriorityColor(project.priority)}>
                                        {project.priority}
                                    </span>
                                </div>
                                {project.endDate && (
                                    <div className="flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {new Date(project.endDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>

                            {/* Simple progress bar if progress or stats exist */}
                            {typeof project.progress === 'number' && (
                                <div className="mt-3">
                                    <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                                        <span>Progress</span>
                                        <span>{project.progress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-1.5 bg-blue-500 rounded-full"
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <Card padding="lg">
                    <div className="text-center py-12">
                        <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 mb-4">No projects yet</p>
                        <Button variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Project
                        </Button>
                    </div>
                </Card>
            )}

            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}
