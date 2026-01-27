import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    DndContext,
    type DragEndEvent,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TaskDetailModal from '../../components/modals/TaskDetailModal';
import CreateTaskModal from '../../components/ui/CreateTaskModal';
import {
    Search,
    Plus,
    Calendar,
    Flag,
    FolderKanban,
    CheckSquare,
    Settings,
    AlertCircle,
    TrendingUp,
    Clock,
    X,
    Filter,
    Eye,
    EyeOff,
} from 'lucide-react';
import KanbanSettingsModal from './KanbanSettingsModal';
import { showToast } from '../../lib/toast';

interface TaskCardProps {
    task: any;
    onClick: () => void;
}

const VALID_STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE'];

// ✅ Task Card Component
function TaskCard({ task, onClick }: TaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
    };

    const getPriorityColor = (priority: string) => {
        const colors: any = {
            URGENT: 'danger',
            HIGH: 'warning',
            MEDIUM: 'info',
            LOW: 'default',
        };
        return colors[priority] || 'default';
    };

    const isOverdue =
        task.dueDate &&
        new Date(task.dueDate) < new Date() &&
        task.status !== 'DONE';

    const completedSubtasks = task.subtasks?.filter((s: any) => s.isCompleted).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3">
            <Card
                padding="sm"
                className="hover:shadow-lg transition-all cursor-grab active:cursor-grabbing border border-gray-200"
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
            >
                <div className="space-y-2">
                    {/* Title and Priority */}
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 flex-1 line-clamp-2">
                            {task.title}
                        </h4>
                        <Badge variant={getPriorityColor(task.priority)} size="sm">
                            <Flag className="w-3 h-3" />
                        </Badge>
                    </div>

                    {/* Description */}
                    {task.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
                    )}

                    {/* Project Name */}
                    {task.projectId && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <FolderKanban className="w-3 h-3" />
                            <span className="truncate">{task.projectId.name}</span>
                        </div>
                    )}

                    {/* Labels */}
                    {task.labels && task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {task.labels.slice(0, 3).map((label: string, idx: number) => (
                                <span
                                    key={idx}
                                    className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                                >
                                    {label}
                                </span>
                            ))}
                            {task.labels.length > 3 && (
                                <span className="text-xs text-gray-400">+{task.labels.length - 3}</span>
                            )}
                        </div>
                    )}

                    {/* Subtasks Progress */}
                    {totalSubtasks > 0 && (
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                    <CheckSquare className="w-3 h-3" />
                                    <span>
                                        {completedSubtasks}/{totalSubtasks}
                                    </span>
                                </div>
                                <span>{Math.round((completedSubtasks / totalSubtasks) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                                    style={{
                                        width: `${(completedSubtasks / totalSubtasks) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Footer: Assignee and Due Date */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                        {task.assigneeId ? (
                            <div className="flex items-center space-x-1.5">
                                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-blue-600">
                                        {task.assigneeId.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="truncate max-w-24 text-gray-600">
                                    {task.assigneeId.name}
                                </span>
                            </div>
                        ) : (
                            <span className="text-gray-400 italic">Unassigned</span>
                        )}

                        {task.dueDate && (
                            <div
                                className={`flex items-center space-x-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
                                    }`}
                            >
                                <Calendar className="w-3 h-3" />
                                <span>
                                    {new Date(task.dueDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}

// ✅ Droppable Column Component with WIP Limits
function DroppableColumn({
    id,
    children,
    title,
    color,
    count,
    wipLimit,
    isVisible,
    onToggleVisibility,
    metrics,
}: {
    id: string;
    children: React.ReactNode;
    title: string;
    color: string;
    count: number;
    wipLimit?: number;
    isVisible: boolean;
    onToggleVisibility: () => void;
    metrics?: any;
}) {
    const { setNodeRef, isOver } = useDroppable({ id });
    const isWipExceeded = wipLimit && count > wipLimit;

    if (!isVisible) {
        return (
            <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-4 min-h-[200px]">
                <EyeOff className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-3">{title}</p>
                <button
                    onClick={onToggleVisibility}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                    Show Column
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Column Header */}
            <div
                className={`${color} rounded-t-lg px-4 py-3 border-b-2 ${isOver ? 'border-blue-500' : isWipExceeded ? 'border-red-500' : 'border-gray-300'
                    } transition-colors`}
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                        <button
                            onClick={onToggleVisibility}
                            className="text-gray-400 hover:text-gray-600"
                            title="Hide column"
                        >
                            <Eye className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${isWipExceeded
                            ? 'bg-red-100 text-red-700'
                            : 'bg-white text-gray-600'
                            }`}
                    >
                        {count}
                        {wipLimit && ` / ${wipLimit}`}
                    </span>
                </div>

                {/* Column Metrics */}
                {metrics && (
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                        {metrics.totalHours > 0 && (
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {metrics.totalHours}h
                            </div>
                        )}
                        {metrics.overdueCount > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                                <AlertCircle className="w-3 h-3" />
                                {metrics.overdueCount}
                            </div>
                        )}
                    </div>
                )}

                {isWipExceeded && (
                    <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        WIP limit exceeded!
                    </div>
                )}
            </div>

            {/* Column Content */}
            <div
                ref={setNodeRef}
                className={`flex-1 rounded-b-lg p-3 transition-all ${isOver ? 'bg-blue-50 ring-2 ring-blue-400' : 'bg-gray-50'
                    }`}
                style={{ minHeight: '500px' }}
            >
                {children}
            </div>
        </div>
    );
}

export default function KanbanBoard() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [projectFilter, setProjectFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');
    const [assigneeFilter, setAssigneeFilter] = useState('ALL');
    const [showOverdueOnly, setShowOverdueOnly] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // ✅ Configure sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // ✅ Fetch Kanban config
    const { data: kanbanConfig } = useQuery({
        queryKey: ['kanbanConfig'],
        queryFn: async () => {
            const response = await api.get('/kanban/config');
            return response.data;
        },
    });

    // ✅ Column visibility state
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
        BACKLOG: true,
        TODO: true,
        IN_PROGRESS: true,
        BLOCKED: true,
        REVIEW: true,
        DONE: true,
    });

    // ✅ Fetch tasks using Kanban API
    const { data: kanbanData, isLoading } = useQuery({
        queryKey: [
            'kanbanBoard',
            { projectFilter, priorityFilter, assigneeFilter, showOverdueOnly },
        ],
        queryFn: async () => {
            const params: any = {};
            if (projectFilter !== 'ALL') params.projectId = projectFilter;
            if (priorityFilter !== 'ALL') params.filterPriority = priorityFilter;
            if (assigneeFilter !== 'ALL') params.filterAssignee = assigneeFilter;
            if (showOverdueOnly) params.filterOverdue = 'true';

            try {
                const response = await api.get('/kanban/board', { params });
                return response.data;
            } catch (error: any) {
                throw error;
            }
        },
        enabled: projectFilter !== 'ALL',
    });

    // ✅ Fetch projects
    const { data: projectsData } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await api.get('/projects');
            return response.data;
        },
    });

    const projects = Array.isArray(projectsData)
        ? projectsData
        : projectsData?.projects || [];

    // ✅ Fetch team members (for assignee filter)
    const { data: teamMembers = [] } = useQuery({
        queryKey: ['teamMembers'],
        queryFn: async () => {
            try {
                // Get all unique assignees from tasks
                const response = await api.get('/tasks/my-tasks');
                const tasks = response.data || [];

                // Extract unique assignees
                const assigneesMap = new Map();
                tasks.forEach((task: any) => {
                    if (task.assigneeId && task.assigneeId._id) {
                        assigneesMap.set(task.assigneeId._id, {
                            _id: task.assigneeId._id,
                            name: task.assigneeId.name,
                            email: task.assigneeId.email,
                        });
                    }
                });

                return Array.from(assigneesMap.values());
            } catch (error) {
                console.error('Failed to fetch team members:', error);
                return [];
            }
        },
    });

    // ✅ Update position mutation
    const updatePositionMutation = useMutation({
        mutationFn: ({
            taskId,
            newStatus,
            newPosition,
            oldStatus,
        }: {
            taskId: string;
            newStatus: string;
            newPosition: number;
            oldStatus: string;
        }) => {
            return api.patch(`/kanban/tasks/${taskId}/position`, {
                newStatus,
                newPosition,
                oldStatus,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] });
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to update task');
        },
    });

    // ✅ WIP Check mutation
    const wipCheckMutation = useMutation({
        mutationFn: (data: { columnId: string; currentCount: number }) =>
            api.post('/kanban/wip-check', data),
    });

    const columns = [
        { id: 'BACKLOG', title: 'Backlog', color: 'bg-gray-100' },
        { id: 'TODO', title: 'To Do', color: 'bg-blue-50' },
        { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-purple-50' },
        { id: 'BLOCKED', title: 'Blocked', color: 'bg-red-50' },
        { id: 'REVIEW', title: 'Review', color: 'bg-yellow-50' },
        { id: 'DONE', title: 'Done', color: 'bg-green-50' },
    ];

    // ✅ Get tasks from Kanban API response
    const board = kanbanData?.board || {};
    const tasks = Object.values(board).flat();
    const metrics = kanbanData?.columnMetrics || {};

    // const allTasks = tasks;
    const allTasks: any = Object.values(tasks).flat();

    // ✅ Get tasks by status
    const getTasksByStatus = (status: string) => {
        const statusTasks = board[status] || [];
        return statusTasks
            .filter((task: any) => {
                const matchesSearch =
                    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    task.description?.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesSearch;
            })
            .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
    };

    // ✅ Get column metrics
    const getColumnMetrics = (status: string) => {
        return kanbanData?.columnMetrics?.[status] || {};
    };

    // ✅ Calculate stats
    const totalTasks = allTasks.length;
    const completedTasks = (board.DONE || []).length;
    const inProgressTasks = (board.IN_PROGRESS || []).length;
    const blockedTasks = (board.BLOCKED || []).length;
    const overdueCount = Object.values(metrics).reduce((sum: number, col: any) => sum + (col.overdueCount || 0), 0);

    // ✅ Drag handlers with WIP check
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const taskId = active.id as string;
        const newStatus = over.id as string;

        if (!VALID_STATUSES.includes(newStatus)) return;

        const task = allTasks?.find((t: any) => t._id === taskId);
        if (!task) return;

        const oldStatus = task.status;
        const columnTasks = getTasksByStatus(newStatus);

        // ✅ Check WIP limit before moving
        const wipLimit = kanbanConfig?.wipLimits?.[newStatus];
        if (wipLimit && oldStatus !== newStatus && columnTasks.length >= wipLimit) {
            try {
                const result = await wipCheckMutation.mutateAsync({
                    columnId: newStatus,
                    currentCount: columnTasks.length + 1,
                });
                if (!result.data?.allowed) {
                    showToast.warning(
                        `WIP limit exceeded for ${newStatus}! Current: ${columnTasks.length}, Limit: ${wipLimit}`
                    );
                    return;
                }
            } catch (error: any) {
                showToast.error(error.response?.data?.error || 'Failed to check WIP limit');
                return;
            }
        }

        let newPosition: number;
        if (oldStatus !== newStatus) {
            newPosition = columnTasks.length;
        } else {
            const currentIndex = columnTasks.findIndex((t: any) => t._id === taskId);
            newPosition = currentIndex >= 0 ? currentIndex : columnTasks.length;
        }

        updatePositionMutation.mutate({ taskId, newStatus, newPosition, oldStatus });
    };

    const activeTask: any = allTasks?.find((task: any) => task._id === activeId);

    // ✅ Clear filters
    const clearFilters = () => {
        setSearchQuery('');
        setProjectFilter('ALL');
        setPriorityFilter('ALL');
        setAssigneeFilter('ALL');
        setShowOverdueOnly(false);
    };

    const hasActiveFilters =
        searchQuery ||
        projectFilter !== 'ALL' ||
        priorityFilter !== 'ALL' ||
        assigneeFilter !== 'ALL' ||
        showOverdueOnly;

    useEffect(() => {
        if (projects.length > 0 && projectFilter === 'ALL') {
            console.log('🎯 Auto-selecting first project:', projects[0]._id);
            setProjectFilter(projects[0]._id);
        }
    }, [projects, projectFilter]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        {totalTasks} tasks • {completedTasks} completed • {inProgressTasks} in progress
                        {blockedTasks > 0 && ` • ${blockedTasks} blocked`}
                        {overdueCount > 0 && (
                            <span className="text-red-600 font-medium"> • {overdueCount} overdue</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="md" onClick={() => setIsSettingsOpen(true)}>
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Button>
                    <Button variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Task
                    </Button>
                </div>
            </div>

            {/* Filters */}
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

                    {/* Filter Row */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <Filter className="w-4 h-4 text-gray-500" />

                        {/* Project Filter */}
                        <select
                            value={projectFilter}
                            onChange={(e) => setProjectFilter(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">All Projects</option>
                            {projects?.map((project: any) => (
                                <option key={project._id} value={project._id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>

                        {/* Assignee Filter */}
                        <select
                            value={assigneeFilter}
                            onChange={(e) => setAssigneeFilter(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">All Assignees</option>
                            {teamMembers?.map((member: any) => (
                                <option key={member._id} value={member._id}>
                                    {member.name}
                                </option>
                            ))}
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">All Priorities</option>
                            <option value="URGENT">Urgent</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>

                        {/* Overdue Toggle */}
                        <label className="flex items-center space-x-2 cursor-pointer px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={showOverdueOnly}
                                onChange={(e) => setShowOverdueOnly(e.target.checked)}
                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">Overdue only</span>
                        </label>

                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Kanban Board */}
            {isLoading ? (
                <Card padding="lg">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">Loading board...</p>
                    </div>
                </Card>
            ) : totalTasks === 0 ? (
                <Card padding="lg">
                    <div className="text-center py-16">
                        <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            {totalTasks === 0
                                ? 'Create your first task to get started'
                                : 'Try adjusting your filters'}
                        </p>
                        {totalTasks === 0 ? (
                            <Button variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Task
                            </Button>
                        ) : (
                            <Button variant="secondary" size="sm" onClick={clearFilters}>
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </Card>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        {columns.map((column) => {
                            const columnTasks = getTasksByStatus(column.id);
                            const columnMetrics = getColumnMetrics(column.id);
                            const wipLimit = kanbanConfig?.wipLimits?.[column.id];

                            return (
                                <DroppableColumn
                                    key={column.id}
                                    id={column.id}
                                    title={column.title}
                                    color={column.color}
                                    count={columnTasks.length}
                                    wipLimit={wipLimit}
                                    isVisible={columnVisibility[column.id]}
                                    onToggleVisibility={() =>
                                        setColumnVisibility((prev) => ({
                                            ...prev,
                                            [column.id]: !prev[column.id],
                                        }))
                                    }
                                    metrics={columnMetrics}
                                >
                                    <SortableContext
                                        items={columnTasks.map((t: any) => t._id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {columnTasks.length > 0 ? (
                                            columnTasks.map((task: any) => (
                                                <TaskCard
                                                    key={task._id}
                                                    task={task}
                                                    onClick={() => setSelectedTaskId(task._id)}
                                                />
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-400 text-sm">
                                                <p>Drop tasks here</p>
                                            </div>
                                        )}
                                    </SortableContext>
                                </DroppableColumn>
                            );
                        })}
                    </div>

                    {/* Drag Overlay */}
                    <DragOverlay>
                        {activeTask ? (
                            <div className="opacity-90 rotate-3 scale-105">
                                <Card padding="sm" className="shadow-2xl border-2 border-blue-400">
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-gray-900">
                                            {activeTask.title}
                                        </h4>
                                        {activeTask.projectId && (
                                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                                                <FolderKanban className="w-3 h-3" />
                                                <span>{activeTask.projectId.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Modals */}
            <CreateTaskModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

            {selectedTaskId && (
                <TaskDetailModal
                    isOpen={!!selectedTaskId}
                    onClose={() => setSelectedTaskId(null)}
                    taskId={selectedTaskId}
                />
            )}

            {isSettingsOpen && (
                <KanbanSettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    config={kanbanConfig}
                />
            )}
        </div>
    );
}
