import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import DropdownMenu from '../../../components/ui/DropdownMenu';
import EditProjectModal from '../../../components/modals/EditProjectModal';
import TaskDetailModal from '../../../components/modals/TaskDetailModal';
import {
    ArrowLeft,
    Plus,
    Search,
    Filter,
    Calendar,
    Users,
    MoreVertical,
    Edit,
    Trash2,
    Archive,
    Settings,
    Copy,
} from 'lucide-react';
import CreateTaskModal from '../../../components/ui/CreateTaskModal';
import ProjectMembersModal from '../../../components/modals/ProjectMembersModal';
import { useAppSelector } from '../../../store/hooks';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const user = useAppSelector((state) => state.auth.user);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
    const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    const { data: project, isLoading: projectLoading } = useQuery({
        queryKey: ['project', id],
        queryFn: async () => {
            const response = await api.get(`/projects/${id}`);
            return response.data;
        },
        enabled: !!id,
    });


    const { data: tasks, isLoading: tasksLoading } = useQuery({
        queryKey: ['projectTasks', id],
        queryFn: async () => {
            const response = await api.get(`/tasks?projectId=${id}`);
            return response.data;
        },
        enabled: !!id,
    });

    // Delete project mutation
    const deleteProjectMutation = useMutation({
        mutationFn: () => api.delete(`/projects/${id}`),
        onSuccess: () => {
            navigate('/projects');
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onError: (error: any) => {
            alert(
                'Failed to delete project: ' +
                (error.response?.data?.error || error.message),
            );
        },
    });

    const { data: projectStats } = useQuery({
        queryKey: ['projectStats', id],
        queryFn: async () => {
            const response = await api.get(`/projects/${id}/stats`);
            return response.data;
        },
        enabled: !!id,
    });

    // Archive/Unarchive mutation
    const updateProjectStatusMutation = useMutation({
        mutationFn: (status: string) => api.patch(`/projects/${id}`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', id] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onError: (error: any) => {
            alert(
                'Failed to update project status: ' +
                (error.response?.data?.error || error.message),
            );
        },
    });

    // Delete task mutation
    const deleteTaskMutation = useMutation({
        mutationFn: (taskId: string) => api.delete(`/tasks/${taskId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projectTasks', id] });
            queryClient.invalidateQueries({ queryKey: ['project', id] });
        },
        onError: (error: any) => {
            alert(
                'Failed to delete task: ' +
                (error.response?.data?.error || error.message),
            );
        },
    });

    // Duplicate task mutation
    const duplicateTaskMutation = useMutation({
        mutationFn: async (task: any) => {
            const response = await api.post('/tasks', {
                title: `${task.title} (Copy)`,
                description: task.description,
                projectId: task.projectId?._id || task.projectId,
                taskListId: task.taskListId?._id || task.taskListId,
                priority: task.priority,
                status: 'TODO',
                dueDate: task.dueDate,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projectTasks', id] });
            queryClient.invalidateQueries({ queryKey: ['project', id] });
        },
        onError: (error: any) => {
            alert(
                'Failed to duplicate task: ' +
                (error.response?.data?.error || error.message),
            );
        },
    });

    // Update task status mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
            api.patch(`/tasks/${taskId}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projectTasks', id] });
            queryClient.invalidateQueries({ queryKey: ['project', id] });
        },
        onError: (error: any) => {
            alert(
                'Failed to update task status: ' +
                (error.response?.data?.error || error.message),
            );
        },
    });

    const restoreProjectMutation = useMutation({
        mutationFn: () => api.post(`/projects/${id}/restore`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', id] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
        onError: (error: any) => {
            alert('Failed to restore: ' + (error.response?.data?.error || error.message));
        },
    });

    const filteredTasks = tasks?.filter((task: any) => {
        const matchesSearch = task.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === 'ALL' || task.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusOptions = ['ALL', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

    const getStatusStats = () => {
        if (!tasks)
            return { total: 0, todo: 0, inProgress: 0, done: 0 };
        return {
            total: tasks.length,
            todo: tasks.filter((t: any) => t.status === 'TODO').length,
            inProgress: tasks.filter(
                (t: any) => t.status === 'IN_PROGRESS',
            ).length,
            done: tasks.filter((t: any) => t.status === 'DONE').length,
        };
    };

    const stats = getStatusStats();

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
        };
        return colors[status] || 'default';
    };

    const canManage = project?.canManage ?? false;


    // ✅ Role-aware project actions
    const projectMenuItems = [
        // Edit: Available if canManage (backend controls this)
        canManage && {
            label: 'Edit Project',
            icon: <Edit className="w-4 h-4" />,
            onClick: () => setIsEditProjectModalOpen(true),
        },
        // Archive/Unarchive: Admin/Workspace Admin/Project Owner only
        canManage && user?.role === 'Administrator' &&
        (project?.status === 'ARCHIVED'
            ? {
                label: 'Unarchive Project',
                icon: <Archive className="w-4 h-4" />,
                onClick: () => {
                    if (confirm('Unarchive this project?')) {
                        updateProjectStatusMutation.mutate('ACTIVE');
                    }
                },
            }
            : {
                label: 'Archive Project',
                icon: <Archive className="w-4 h-4" />,
                onClick: () => {
                    if (confirm('Archive this project?')) {
                        updateProjectStatusMutation.mutate('ARCHIVED');
                    }
                },
            }),
        // Delete: Administrator only
        user?.role === 'Administrator' && {
            label: 'Delete Project',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => {
                if (
                    confirm(
                        'Are you sure you want to delete this project? This action cannot be undone.',
                    )
                ) {
                    deleteProjectMutation.mutate();
                }
            },
            variant: 'danger' as const,
        },
    ].filter(Boolean) as any;


    // Task dropdown menu generator
    const getTaskMenuItems = (task: any) => [
        {
            label: 'View Details',
            icon: <Settings className="w-4 h-4" />,
            onClick: () => {
                setSelectedTaskId(task._id);
            },
        },
        {
            label: 'Duplicate Task',
            icon: <Copy className="w-4 h-4" />,
            onClick: () => {
                duplicateTaskMutation.mutate(task);
            },
        },
        {
            label: 'Delete Task',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: () => {
                if (confirm('Delete this task?')) {
                    deleteTaskMutation.mutate(task._id);
                }
            },
            variant: 'danger' as const,
        },
    ];

    if (projectLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <p className="text-gray-600 mb-4">
                    Project not found or you do not have access.
                </p>
                <Button variant="secondary" onClick={() => navigate('/projects')}>
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Projects
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <button
                    onClick={() => navigate('/projects')}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Projects
                </button>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center space-x-3 mb-1">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {project.name}
                            </h1>
                            {project.projectKey && (
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-mono">
                                    {project.projectKey}
                                </span>
                            )}
                            <Badge variant="info" size="md">
                                {project.status}
                            </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">
                            {project.type} • Priority: {project.priority}
                        </p>
                        <p className="text-gray-600 text-sm">
                            {project.description || 'No description'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        {user && ['Administrator', 'Manager'].includes(user.role) && (
                            <Button
                                variant="secondary"
                                size="md"
                                onClick={() => setIsMembersModalOpen(true)}
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Manage Members
                            </Button>
                        )}
                        <Button
                            variant="primary"
                            size="md"
                            onClick={() => setIsCreateTaskModalOpen(true)}
                            disabled={!canManage}
                            disabledMessage={!canManage ? "You don't have permission to create tasks" : undefined}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Task
                        </Button>
                        {projectMenuItems.length > 0 && (
                            <DropdownMenu
                                trigger={
                                    <Button variant="ghost" size="md">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                }
                                items={projectMenuItems}
                            />
                        )}
                    </div>
                </div>
            </div>

            {project?.isDeleted && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-red-800">
                                This project has been deleted
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                                Deleted on {new Date(project.deletedAt).toLocaleDateString()}
                            </p>
                        </div>
                        {user?.role === 'Administrator' && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                    if (confirm(`Restore project "${project.name}"?`)) {
                                        restoreProjectMutation.mutate();
                                    }
                                }}
                                isLoading={restoreProjectMutation.isPending}
                            >
                                Restore Project
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Project Info / Stats */}
            <Card padding="md">
                <div className="grid grid-cols-5 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                            {projectStats?.totalTasks || stats.total}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Total Tasks</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">
                            {projectStats?.inProgressTasks || stats.inProgress}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">In Progress</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                            {projectStats?.completedTasks || stats.done}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Completed</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">
                            {projectStats?.overdueTasks || 0}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Overdue</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                            {projectStats?.progressPercentage || 0}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Progress</p>
                    </div>
                </div>

                <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4 text-gray-600">
                            <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1.5" />
                                {project.members?.length || 0} members
                            </div>
                            {project.startDate && (
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1.5" />
                                    {new Date(
                                        project.startDate,
                                    ).toLocaleDateString()}{' '}
                                    –{' '}
                                    {project.endDate
                                        ? new Date(
                                            project.endDate,
                                        ).toLocaleDateString()
                                        : 'Ongoing'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Task Filters */}
            <Card padding="md">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search tasks in this project..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {status === 'ALL'
                                        ? 'All Status'
                                        : status.replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Task List */}
            <div className="space-y-3">
                {tasksLoading ? (
                    <Card padding="lg">
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                    </Card>
                ) : filteredTasks?.length ? (
                    filteredTasks.map((task: any) => (
                        <Card
                            key={task._id}
                            padding="md"
                            className="hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                {/* Left side - opens detail modal */}
                                <div
                                    className="flex-1 cursor-pointer"
                                    onClick={() => setSelectedTaskId(task._id)}
                                >
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-base font-semibold text-gray-900">
                                            {task.title}
                                        </h3>
                                        <Badge
                                            variant={getPriorityColor(
                                                task.priority,
                                            )}
                                            size="sm"
                                        >
                                            {task.priority}
                                        </Badge>
                                        <Badge
                                            variant={getStatusColor(
                                                task.status,
                                            )}
                                            size="sm"
                                        >
                                            {task.status.replace('_', ' ')}
                                        </Badge>
                                    </div>

                                    {task.description && (
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                            {task.description}
                                        </p>
                                    )}

                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        {task.assigneeId && (
                                            <div className="flex items-center">
                                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-1.5">
                                                    <span className="text-xs font-medium text-blue-600">
                                                        {task.assigneeId.name
                                                            ?.charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                                {task.assigneeId.name}
                                            </div>
                                        )}
                                        {task.dueDate && (
                                            <div className="flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                Due:{' '}
                                                {new Date(
                                                    task.dueDate,
                                                ).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right side - actions */}
                                <div
                                    className="flex items-center space-x-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
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
                                        className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="TODO">To Do</option>
                                        <option value="IN_PROGRESS">
                                            In Progress
                                        </option>
                                        <option value="REVIEW">Review</option>
                                        <option value="DONE">Done</option>
                                    </select>

                                    <DropdownMenu
                                        trigger={
                                            <button
                                                type="button"
                                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4 text-gray-500" />
                                            </button>
                                        }
                                        items={getTaskMenuItems(task)}
                                    />
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <Card padding="lg">
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                No tasks in this project yet
                            </p>
                            <Button
                                variant="primary"
                                size="md"
                                onClick={() => setIsCreateTaskModalOpen(true)}
                                disabled={!canManage}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Task
                            </Button>
                        </div>
                    </Card>
                )}
            </div>

            {/* Modals */}
            <CreateTaskModal
                isOpen={isCreateTaskModalOpen}
                onClose={() => setIsCreateTaskModalOpen(false)}
                defaultProjectId={id}
            />

            {isMembersModalOpen && (
                <ProjectMembersModal
                    isOpen={isMembersModalOpen}
                    onClose={() => setIsMembersModalOpen(false)}
                    projectId={id!}
                />
            )}

            {isEditProjectModalOpen && (
                <EditProjectModal
                    isOpen={isEditProjectModalOpen}
                    onClose={() => setIsEditProjectModalOpen(false)}
                    projectId={id!}
                    initialData={project}
                />
            )}

            {selectedTaskId && (
                <TaskDetailModal
                    isOpen={!!selectedTaskId}
                    onClose={() => setSelectedTaskId(null)}
                    taskId={selectedTaskId}
                />
            )}
        </div>
    );
}
