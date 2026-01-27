import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import { showToast } from '../../../lib/toast';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import DropdownMenu from '../../../components/ui/DropdownMenu';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import EditProjectModal from '../../../components/modals/EditProjectModal';
import TaskDetailModal from '../../../components/modals/TaskDetailModal';
import CreateTaskModal from '../../../components/ui/CreateTaskModal';
import ProjectMembersModal from '../../../components/modals/ProjectMembersModal';
import {
    ArrowLeft,
    Plus,
    Search,
    Filter,
    Users,
    MoreVertical,
    Edit,
    Trash2,
    Archive,
    Settings,
    Copy,
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    Clock,
    Target,
    X,
    BarChart3,
    UserPlus,
    RefreshCw,
    Calendar,
} from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import DeadlineBadge from '../TaskManager/DeadlineBadge';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAppSelector((state) => state.auth.user);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        variant: 'danger',
    });

    // ✅ Fetch project details
    const { data: project, isLoading: projectLoading, error: projectError } = useQuery({
        queryKey: ['project', id],
        queryFn: async () => {
            const response = await api.get(`/projects/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    // ✅ Fetch project tasks
    const { data: tasksData, isLoading: tasksLoading } = useQuery({
        queryKey: ['projectTasks', id],
        queryFn: async () => {
            const response = await api.get(`/tasks/project/${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    // ✅ Fetch project statistics
    const { data: projectStats } = useQuery({
        queryKey: ['projectStats', id],
        queryFn: async () => {
            const response = await api.get(`/projects/${id}/stats`);
            return response.data;
        },
        enabled: !!id,
    });

    // ✅ Extract tasks array
    const tasks = Array.isArray(tasksData) ? tasksData : tasksData?.tasks || [];

    // ✅ Delete project mutation (UNCHANGED - Project API)
    const deleteProjectMutation = useMutation({
        mutationFn: () => api.delete(`/projects/${id}`),
        onSuccess: () => {
            navigate('/projects');
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showToast.success('Project deleted successfully');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to delete project');
        },
    });

    // ✅ Update project status mutation (UNCHANGED - Project API)
    const updateProjectStatusMutation = useMutation({
        mutationFn: (status: string) => api.patch(`/projects/${id}`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', id] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showToast.success('Project status updated');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to update status');
        },
    });

    // ✅ Restore project mutation (UNCHANGED - Project API)
    const restoreProjectMutation = useMutation({
        mutationFn: () => api.post(`/projects/${id}/restore`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', id] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            showToast.success('Project restored successfully');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to restore project');
        },
    });

    // ✅ MODIFIED: Delete task mutation (Task API - with Toast)
    const deleteTaskMutation = useMutation({
        mutationFn: (taskId: string) => api.delete(`/tasks/${taskId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projectTasks', id] });
            queryClient.invalidateQueries({ queryKey: ['project', id] });
            queryClient.invalidateQueries({ queryKey: ['projectStats', id] });
            showToast.success('Task deleted successfully');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to delete task');
        },
    });

    // ✅ MODIFIED: Duplicate task mutation (Task API - with Toast)
    const duplicateTaskMutation = useMutation({
        mutationFn: async (task: any) => {
            const response = await api.post('/tasks', {
                title: `${task.title} (Copy)`,
                description: task.description,
                projectId: task.projectId?._id || task.projectId || id,
                taskListId: task.taskListId?._id || task.taskListId,
                priority: task.priority,
                status: 'TODO',
                dueDate: task.dueDate,
                estimatedHours: task.estimatedHours,
                labels: task.labels,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projectTasks', id] });
            queryClient.invalidateQueries({ queryKey: ['project', id] });
            showToast.success('Task duplicated successfully');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to duplicate task');
        },
    });

    // ✅ MODIFIED: Update task status mutation (Task API - with Toast)
    const updateStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
            api.patch(`/tasks/${taskId}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projectTasks', id] });
            queryClient.invalidateQueries({ queryKey: ['project', id] });
            queryClient.invalidateQueries({ queryKey: ['projectStats', id] });
            showToast.success('Task status updated');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to update status');
        },
    });

    // ✅ Filtered tasks
    const filteredTasks = tasks?.filter((task: any) => {
        const matchesSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    // ✅ Calculate stats
    const getStatusStats = () => {
        if (!tasks) return { total: 0, todo: 0, inProgress: 0, review: 0, done: 0, blocked: 0 };
        return {
            total: tasks.length,
            todo: tasks.filter((t: any) => t.status === 'TODO').length,
            inProgress: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
            review: tasks.filter((t: any) => t.status === 'REVIEW').length,
            done: tasks.filter((t: any) => t.status === 'DONE').length,
            blocked: tasks.filter((t: any) => t.status === 'BLOCKED').length,
        };
    };

    const stats = getStatusStats();

    // Helper functions
    const getPriorityColor = (priority: string) => {
        const colors: any = {
            URGENT: 'danger',
            HIGH: 'warning',
            MEDIUM: 'info',
            LOW: 'default',
        };
        return colors[priority] || 'default';
    };

    const getStatusColor = (status: string) => {
        const colors: any = {
            DONE: 'success',
            IN_PROGRESS: 'info',
            REVIEW: 'warning',
            TODO: 'default',
            BLOCKED: 'danger',
        };
        return colors[status] || 'default';
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

    const canManage = project?.canManage ?? false;

    // ✅ MODIFIED: Project actions menu (with ConfirmDialog)
    const projectMenuItems = [
        canManage && {
            label: 'Edit Project',
            icon: <Edit className="w-4 h-4" />,
            onClick: () => setIsEditProjectModalOpen(true),
        },
        canManage && {
            label: 'Manage Members',
            icon: <UserPlus className="w-4 h-4" />,
            onClick: () => setIsMembersModalOpen(true),
        },
        canManage &&
        user?.role === 'Administrator' &&
        (project?.status === 'ARCHIVED'
            ? {
                label: 'Unarchive Project',
                icon: <RefreshCw className="w-4 h-4" />,
                onClick: () => {
                    setConfirmDialog({
                        isOpen: true,
                        title: 'Unarchive Project',
                        message: 'Unarchive this project?',
                        onConfirm: () => updateProjectStatusMutation.mutate('ACTIVE'),
                        variant: 'info',
                    });
                },
            }
            : {
                label: 'Archive Project',
                icon: <Archive className="w-4 h-4" />,
                onClick: () => {
                    setConfirmDialog({
                        isOpen: true,
                        title: 'Archive Project',
                        message: 'Archive this project? Tasks will be preserved.',
                        onConfirm: () => updateProjectStatusMutation.mutate('ARCHIVED'),
                        variant: 'warning',
                    });
                },
            }),
        user?.role === 'Administrator' && {
            label: 'Delete Project',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Delete Project',
                    message: 'Are you sure? This will permanently delete the project and all its tasks. This action cannot be undone.',
                    onConfirm: () => deleteProjectMutation.mutate(),
                    variant: 'danger',
                });
            },
            variant: 'danger' as const,
        },
    ].filter(Boolean) as any;

    // ✅ MODIFIED: Task actions menu (with ConfirmDialog)
    const getTaskMenuItems = (task: any) => [
        {
            label: 'View Details',
            icon: <Settings className="w-4 h-4" />,
            onClick: () => setSelectedTaskId(task._id),
        },
        {
            label: 'Duplicate Task',
            icon: <Copy className="w-4 h-4" />,
            onClick: () => {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Duplicate Task',
                    message: `Duplicate task "${task.title}"?`,
                    onConfirm: () => duplicateTaskMutation.mutate(task),
                    variant: 'info',
                });
            },
        },
        {
            label: 'Delete Task',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => {
                setConfirmDialog({
                    isOpen: true,
                    title: 'Delete Task',
                    message: `Delete task "${task.title}"?`,
                    onConfirm: () => deleteTaskMutation.mutate(task._id),
                    variant: 'danger',
                });
            },
            variant: 'danger' as const,
        },
    ];

    // Loading state
    if (projectLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Loading project...</p>
                </div>
            </div>
        );
    }

    // Error or not found state
    if (projectError || !project) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
                <p className="text-gray-600 mb-6">
                    This project doesn't exist or you don't have access to view it.
                </p>
                <Button variant="secondary" onClick={() => navigate('/projects')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Projects
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <button
                        onClick={() => navigate('/projects')}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Projects
                    </button>

                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: project.color || '#ECFDF3' }}
                                >
                                    <Target className="w-6 h-6 text-green-700" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-mono mb-1">{project.projectKey || 'NO-KEY'}</p>
                                    <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                                </div>
                            </div>

                            {/* Badges Row */}
                            <div className="flex items-center gap-2 mt-3">
                                {project.isDeleted ? (
                                    <>
                                        <Badge variant="danger" size="md">
                                            DELETED
                                        </Badge>
                                        {user?.role === 'Administrator' && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => {
                                                    setConfirmDialog({
                                                        isOpen: true,
                                                        title: 'Restore Project',
                                                        message: `Restore project "${project.name}"?`,
                                                        onConfirm: () => restoreProjectMutation.mutate(),
                                                        variant: 'info',
                                                    });
                                                }}
                                                isLoading={restoreProjectMutation.isPending}
                                            >
                                                <RefreshCw className="w-3 h-3 mr-1" />
                                                Restore
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <Badge variant={getStatusColor(project.status)} size="md">
                                            {project.status}
                                        </Badge>
                                        {project.health && (
                                            <Badge variant={getHealthBadge(project.health)} size="md">
                                                <TrendingUp className={`w-3 h-3 mr-1 ${getHealthColor(project.health)}`} />
                                                {project.health.replace('_', ' ')}
                                            </Badge>
                                        )}
                                        <Badge variant={getPriorityColor(project.priority)} size="md">
                                            {project.priority} Priority
                                        </Badge>
                                        {project.type && (
                                            <Badge variant="info" size="md">
                                                {project.type}
                                            </Badge>
                                        )}
                                    </>
                                )}
                            </div>

                            {project.description && (
                                <p className="text-sm text-gray-600 mt-3 max-w-3xl">{project.description}</p>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            {canManage && !project.isDeleted && (
                                <Button variant="primary" size="md" onClick={() => setIsCreateTaskModalOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Task
                                </Button>
                            )}
                            {projectMenuItems.length > 0 && (
                                <DropdownMenu
                                    items={projectMenuItems}
                                    align="right"
                                    trigger={
                                        <Button variant="secondary" size="md">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    }
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card padding="md" className="border border-blue-100 bg-blue-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-blue-600 font-medium mb-1">Total Tasks</p>
                                <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <BarChart3 className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </Card>

                    <Card padding="md" className="border border-green-100 bg-green-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-green-600 font-medium mb-1">Completed</p>
                                <p className="text-2xl font-bold text-green-700">{stats.done}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </Card>

                    <Card padding="md" className="border border-purple-100 bg-purple-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-purple-600 font-medium mb-1">In Progress</p>
                                <p className="text-2xl font-bold text-purple-700">{stats.inProgress}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </Card>

                    <Card padding="md" className="border border-gray-100 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-600 font-medium mb-1">To Do</p>
                                <p className="text-2xl font-bold text-gray-700">{stats.todo}</p>
                            </div>
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-gray-600" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Progress Bar */}
                {typeof project.progress === 'number' && (
                    <Card padding="md">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-900">Project Progress</h3>
                            <span className="text-sm font-medium text-gray-700">{project.progress}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                style={{ width: `${project.progress}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                            <span>
                                {stats.done} of {stats.total} tasks completed
                            </span>
                            {projectStats?.onTimeCompletionRate !== undefined && (
                                <span>{Math.round(projectStats.onTimeCompletionRate)}% on-time delivery</span>
                            )}
                        </div>
                    </Card>
                )}

                {(project.health || project.startDate || project.endDate) && (
                    <Card padding="md">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {project.health && (
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1.5">Project Health</label>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className={`w-4 h-4 ${getHealthColor(project.health)}`} />
                                        <span className={`text-sm font-semibold ${getHealthColor(project.health)}`}>
                                            {project.health.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {project.startDate && (
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1.5">Start Date</label>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-700">
                                            {new Date(project.startDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {project.endDate && (
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1.5">End Date</label>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-700">
                                            {new Date(project.endDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Filters & Search */}
                <Card padding="md">
                    <div className="space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-10"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-3">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="ALL">All Status</option>
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="REVIEW">Review</option>
                                <option value="DONE">Done</option>
                                <option value="BLOCKED">Blocked</option>
                            </select>

                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="ALL">All Priority</option>
                                <option value="URGENT">Urgent</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>

                            <span className="text-sm text-gray-500 ml-auto">{filteredTasks?.length || 0} tasks</span>
                        </div>

                        {/* Active Filters */}
                        {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                <span className="text-xs text-gray-600">Active filters:</span>
                                {searchQuery && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs flex items-center gap-1">
                                        Search: "{searchQuery}"
                                        <button onClick={() => setSearchQuery('')}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {statusFilter !== 'ALL' && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs flex items-center gap-1">
                                        Status: {statusFilter.replace('_', ' ')}
                                        <button onClick={() => setStatusFilter('ALL')}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {priorityFilter !== 'ALL' && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md text-xs flex items-center gap-1">
                                        Priority: {priorityFilter}
                                        <button onClick={() => setPriorityFilter('ALL')}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setStatusFilter('ALL');
                                        setPriorityFilter('ALL');
                                    }}
                                    className="ml-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Tasks List */}
                {tasksLoading ? (
                    <Card padding="lg">
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                            <p className="text-sm text-gray-500">Loading tasks...</p>
                        </div>
                    </Card>
                ) : filteredTasks && filteredTasks.length > 0 ? (
                    <div className="space-y-3">
                        {filteredTasks.map((task: any) => (
                            <Card
                                key={task._id}
                                padding="md"
                                className="hover:shadow-md transition-all cursor-pointer border border-gray-100 group"
                                onClick={() => setSelectedTaskId(task._id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-3">
                                            {/* Quick Status Selector */}
                                            <select
                                                value={task.status}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    updateStatusMutation.mutate({
                                                        taskId: task._id,
                                                        status: e.target.value,
                                                    });
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                disabled={updateStatusMutation.isPending}
                                                className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="TODO">To Do</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="REVIEW">Review</option>
                                                <option value="DONE">Done</option>
                                                <option value="BLOCKED">Blocked</option>
                                            </select>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">{task.title}</h3>
                                                {task.description && (
                                                    <p className="text-xs text-gray-600 line-clamp-1 mb-2">{task.description}</p>
                                                )}

                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <Badge variant={getPriorityColor(task.priority)} size="sm">
                                                        {task.priority}
                                                    </Badge>
                                                    <Badge variant={getStatusColor(task.status)} size="sm">
                                                        {task.status.replace('_', ' ')}
                                                    </Badge>
                                                    {task.assigneeId && (
                                                        <div className="flex items-center text-xs text-gray-600">
                                                            <Users className="w-3 h-3 mr-1" />
                                                            {task.assigneeId.name}
                                                        </div>
                                                    )}
                                                    {task.dueDate && <DeadlineBadge dueDate={task.dueDate} status={task.status} size="sm" />}
                                                    {task.labels && task.labels.length > 0 && (
                                                        <div className="flex gap-1">
                                                            {task.labels.slice(0, 2).map((label: string, idx: number) => (
                                                                <span key={idx} className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                                                    {label}
                                                                </span>
                                                            ))}
                                                            {task.labels.length > 2 && (
                                                                <span className="text-xs text-gray-400">+{task.labels.length - 2}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 ml-4">
                                        <DropdownMenu
                                            items={getTaskMenuItems(task)}
                                            align="right"
                                            trigger={
                                                <button
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            }
                                        />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card padding="lg">
                        <div className="text-center py-16">
                            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                                    ? 'Try adjusting your filters'
                                    : 'Get started by creating your first task'}
                            </p>
                            {canManage && !project.isDeleted && (
                                <Button variant="primary" size="md" onClick={() => setIsCreateTaskModalOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Task
                                </Button>
                            )}
                        </div>
                    </Card>
                )}

                {/* Modals */}
                <CreateTaskModal isOpen={isCreateTaskModalOpen} onClose={() => setIsCreateTaskModalOpen(false)} defaultProjectId={id!} />

                {isEditProjectModalOpen && (
                    <EditProjectModal isOpen={isEditProjectModalOpen} onClose={() => setIsEditProjectModalOpen(false)} project={project} />
                )}

                {selectedTaskId && <TaskDetailModal isOpen={!!selectedTaskId} onClose={() => setSelectedTaskId(null)} taskId={selectedTaskId} />}

                {isMembersModalOpen && <ProjectMembersModal isOpen={isMembersModalOpen} onClose={() => setIsMembersModalOpen(false)} projectId={id!} />}
            </div>

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                variant={confirmDialog.variant}
            />
        </>
    );
}
