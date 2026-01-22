import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import CreateProjectModal from '../../../components/modals/CreateProjectModal';
import {
    Plus,
    FolderKanban,
    Users,
    Calendar,
    Filter,
    Star,
    TrendingUp,
    AlertCircle,
    Search,
    X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../store/hooks';

export default function Projects() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAppSelector((state) => state.auth.user);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [archivedFilter, setArchivedFilter] = useState<boolean>(false);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [search, setSearch] = useState('');

    // ✅ Fetch projects with proper error handling
    const { data, isLoading, error } = useQuery({
        queryKey: ['projects', { statusFilter, search, archivedFilter }],
        queryFn: async () => {
            const params: any = {};
            if (statusFilter !== 'ALL') params.status = statusFilter;
            if (search.trim()) params.search = search.trim();
            if (archivedFilter) params.includeDeleted = 'true';

            const response = await api.get('/projects', { params });
            return response.data;
        },
    });

    // ✅ Restore project mutation
    const restoreProjectMutation = useMutation({
        mutationFn: (projectId: string) => api.post(`/projects/${projectId}/restore`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onError: (error: any) => {
            alert('Failed to restore: ' + (error.response?.data?.error || error.message));
        },
    });

    // ✅ Extract projects array properly
    const projects = Array.isArray(data) ? data : data?.projects || [];
    const filteredProjects = archivedFilter
        ? projects
        : projects.filter((p: any) => !p.isDeleted);
    const totalCount = filteredProjects.length;

    const getStatusBadgeVariant = (status: string) => {
        const variants: any = {
            ACTIVE: 'success',
            PLANNED: 'info',
            ON_HOLD: 'warning',
            COMPLETED: 'success',
            ARCHIVED: 'default',
        };
        return variants[status] || 'default';
    };

    const getPriorityColor = (priority: string) => {
        const colors: any = {
            Critical: 'text-red-600',
            High: 'text-orange-600',
            Medium: 'text-yellow-600',
            Low: 'text-green-600',
        };
        return colors[priority] || 'text-gray-500';
    };

    const getHealthColor = (health: string) => {
        const colors: any = {
            ON_TRACK: 'text-green-600',
            AT_RISK: 'text-yellow-600',
            DELAYED: 'text-red-600',
        };
        return colors[health] || 'text-gray-500';
    };

    const getHealthBadge = (health: string) => {
        const badges: any = {
            ON_TRACK: 'success',
            AT_RISK: 'warning',
            DELAYED: 'danger',
        };
        return badges[health] || 'default';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        {totalCount} project{totalCount === 1 ? '' : 's'}
                        {(search || statusFilter !== 'ALL' || archivedFilter) && ' (filtered)'}
                    </p>
                </div>
                {user && ['Administrator', 'Manager'].includes(user.role) && (
                    <Button variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Project
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card padding="md">
                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, key, or description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-10 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filters Row */}
                    <div className="flex items-center justify-between gap-4">
                        {/* Archived Toggle */}
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={archivedFilter}
                                onChange={(e) => setArchivedFilter(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Show Deleted</span>
                        </label>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="ALL">All Status</option>
                                <option value="PLANNED">Planned</option>
                                <option value="ACTIVE">Active</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="ARCHIVED">Archived</option>
                            </select>
                        </div>
                    </div>

                    {/* Active Filters Indicator */}
                    {(search || statusFilter !== 'ALL' || archivedFilter) && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                            <span className="text-xs text-gray-600">Active filters:</span>
                            {search && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs flex items-center gap-1">
                                    Search: "{search}"
                                    <button onClick={() => setSearch('')} className="hover:text-blue-900">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {statusFilter !== 'ALL' && (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs flex items-center gap-1">
                                    Status: {statusFilter}
                                    <button onClick={() => setStatusFilter('ALL')} className="hover:text-green-900">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            {archivedFilter && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs flex items-center gap-1">
                                    Showing deleted
                                    <button onClick={() => setArchivedFilter(false)} className="hover:text-red-900">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setStatusFilter('ALL');
                                    setArchivedFilter(false);
                                }}
                                className="ml-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Content */}
            {isLoading ? (
                <Card padding="lg">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">Loading projects...</p>
                    </div>
                </Card>
            ) : error ? (
                <Card padding="lg">
                    <div className="text-center py-12">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <p className="text-sm text-gray-600">Failed to load projects</p>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="mt-4"
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
                        >
                            Try Again
                        </Button>
                    </div>
                </Card>
            ) : filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredProjects.map((project: any) => (
                        <Card
                            key={project._id}
                            padding="md"
                            className="hover:shadow-lg transition-all cursor-pointer border border-gray-100 relative group"
                            onClick={() => navigate(`/projects/${project._id}`)}
                        >
                            {/* Project Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{
                                            backgroundColor: project.color || '#ECFDF3',
                                        }}
                                    >
                                        <FolderKanban className="w-6 h-6 text-green-700" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 font-mono mb-0.5">
                                            {project.projectKey || 'NO-KEY'}
                                        </p>
                                        <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                                            {project.name}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            {/* Status & Health Badges */}
                            <div className="flex items-center gap-2 mb-3">
                                {project.isDeleted ? (
                                    <>
                                        <Badge variant="danger" size="sm">
                                            DELETED
                                        </Badge>
                                        {user?.role === 'Administrator' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(`Restore project "${project.name}"?`)) {
                                                        restoreProjectMutation.mutate(project._id);
                                                    }
                                                }}
                                                disabled={restoreProjectMutation.isPending}
                                                className="text-xs text-green-600 hover:text-green-700 font-medium underline"
                                            >
                                                {restoreProjectMutation.isPending ? 'Restoring...' : 'Restore'}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Badge variant={getStatusBadgeVariant(project.status)} size="sm">
                                            {project.status}
                                        </Badge>
                                        {project.health && (
                                            <Badge variant={getHealthBadge(project.health)} size="sm">
                                                <TrendingUp className={`w-3 h-3 mr-1 ${getHealthColor(project.health)}`} />
                                                {project.health.replace('_', ' ')}
                                            </Badge>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
                                {project.description || 'No description provided'}
                            </p>

                            {/* Project Info */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span className="inline-flex items-center">
                                        <Users className="w-3.5 h-3.5 mr-1.5" />
                                        {project.members?.length || 0} members
                                    </span>
                                    {project.type && (
                                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                            {project.type}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <Star className={`w-3.5 h-3.5 ${getPriorityColor(project.priority)}`} />
                                        <span className={getPriorityColor(project.priority)}>
                                            {project.priority}
                                        </span>
                                    </div>
                                    {project.endDate && (
                                        <div className="flex items-center text-gray-500">
                                            <Calendar className="w-3.5 h-3.5 mr-1" />
                                            {new Date(project.endDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {project.health && (
                                <div className="flex items-center justify-between text-xs py-2">
                                    <span className="text-gray-500">Project Health</span>
                                    <span className={`font-medium ${getHealthColor(project.health)}`}>
                                        {project.health.replace('_', ' ')}
                                    </span>
                                </div>
                            )}

                            {/* Progress Bar */}
                            {typeof project.progress === 'number' && (
                                <div className="pt-3 border-t border-gray-100">
                                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                                        <span>Progress</span>
                                        <span className="font-medium">{project.progress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Task Stats */}
                            {(project.totalTasks > 0 || project.completedTasks > 0) && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>
                                            {project.completedTasks || 0}/{project.totalTasks || 0} tasks
                                        </span>
                                        {project.overdueTasks > 0 && (
                                            <span className="text-red-600 flex items-center">
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                {project.overdueTasks} overdue
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <Card padding="lg">
                    <div className="text-center py-16">
                        <FolderKanban className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            {search || statusFilter !== 'ALL' || archivedFilter
                                ? 'Try adjusting your filters'
                                : 'Get started by creating your first project'}
                        </p>
                        {user && ['Administrator', 'Manager'].includes(user.role) && (
                            <Button variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Project
                            </Button>
                        )}
                    </div>
                </Card>
            )}

            <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </div>
    );
}
