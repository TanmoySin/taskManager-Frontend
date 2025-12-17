import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    DndContext,
    type DragEndEvent,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent
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
import { Search, Plus, Calendar, Flag, FolderKanban, CheckSquare } from 'lucide-react';
import CreateTaskModal from '../../components/ui/CreateTaskModal';

interface TaskCardProps {
    task: any;
    onClick: () => void;
}

const VALID_STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE'];

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
            LOW: 'default'
        };
        return colors[priority] || 'default';
    };

    const completedSubtasks = task.subtasks?.filter((s: any) => s.isCompleted).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="mb-3"
        >
            <Card
                padding="sm"
                className="hover:shadow-lg transition-all cursor-grab active:cursor-grabbing"
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
                        <p className="text-xs text-gray-600 line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    {/* Project Name */}
                    {task.projectId && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <FolderKanban className="w-3 h-3" />
                            <span className="truncate">{task.projectId.name}</span>
                        </div>
                    )}

                    {/* Subtasks Progress */}
                    {totalSubtasks > 0 && (
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                    <CheckSquare className="w-3 h-3" />
                                    <span>{completedSubtasks}/{totalSubtasks}</span>
                                </div>
                                <span>{Math.round((completedSubtasks / totalSubtasks) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                                    style={{
                                        width: `${(completedSubtasks / totalSubtasks) * 100}%`
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Footer: Assignee and Due Date */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                        {task.assigneeId ? (
                            <div className="flex items-center space-x-1.5">
                                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-blue-600">
                                        {task.assigneeId.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="truncate max-w-24">{task.assigneeId.name}</span>
                            </div>
                        ) : (
                            <span className="text-gray-400 italic">Unassigned</span>
                        )}

                        {task.dueDate && (
                            <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                    {new Date(task.dueDate).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
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

// ✅ Droppable Column Component
function DroppableColumn({
    id,
    children,
    title,
    color,
    count
}: {
    id: string;
    children: React.ReactNode;
    title: string;
    color: string;
    count: number;
}) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div className="flex flex-col h-full">
            {/* Column Header */}
            <div className={`${color} rounded-t-lg px-4 py-3 border-b-2 ${isOver ? 'border-blue-500' : 'border-gray-300'
                } transition-colors`}>
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                    <span className="text-xs font-medium text-gray-600 bg-white px-2.5 py-1 rounded-full">
                        {count}
                    </span>
                </div>
            </div>

            {/* Column Content */}
            <div
                ref={setNodeRef}
                className={`flex-1 bg-gray-50 rounded-b-lg p-3 transition-all ${isOver ? 'bg-blue-50 ring-2 ring-blue-400' : ''
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
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    // ✅ Configure sensors for better drag experience
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Fetch tasks (still using /tasks/my-tasks)
    const { data: tasks, isLoading } = useQuery({
        queryKey: ['myTasks'],
        queryFn: async () => {
            const response = await api.get('/tasks/my-tasks');
            return response.data;
        },
    });

    // Fetch projects
    const { data: projects } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await api.get('/projects');
            // if your /projects returns {projects, count}, adjust here
            return response.data.projects || response.data;
        },
    });

    // Update position/status mutation (Kanban API)
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
            queryClient.invalidateQueries({ queryKey: ['myTasks'] });
        },
        onError: (error: any) => {
            console.error('❌ Update position error:', error);
            alert('Failed to update task position');
        },
    });

    const columns = [
        { id: 'BACKLOG', title: 'Backlog', color: 'bg-gray-100' },
        { id: 'TODO', title: 'To Do', color: 'bg-blue-50' },
        { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-purple-50' },
        { id: 'BLOCKED', title: 'Blocked', color: 'bg-red-50' },
        { id: 'REVIEW', title: 'Review', color: 'bg-yellow-50' },
        { id: 'DONE', title: 'Done', color: 'bg-green-50' },
    ];

    // Filter tasks
    const filteredTasks = tasks?.filter((task: any) => {
        const matchesSearch =
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesProject =
            projectFilter === 'ALL' || task.projectId?._id === projectFilter || task.projectId === projectFilter;
        const matchesPriority =
            priorityFilter === 'ALL' || task.priority === priorityFilter;
        return matchesSearch && matchesProject && matchesPriority;
    }) || [];

    // Get tasks by status, ordered by position
    const getTasksByStatus = (status: string) => {
        return filteredTasks
            .filter((task: any) => task.status === status)
            .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
    };

    // Calculate stats
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter((t: any) => t.status === 'DONE').length;
    const inProgressTasks = filteredTasks.filter((t: any) => t.status === 'IN_PROGRESS').length;

    // Drag handlers
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const taskId = active.id as string;
        const newStatus = over.id as string;

        if (!VALID_STATUSES.includes(newStatus)) return;

        const task = tasks?.find((t: any) => t._id === taskId);
        if (!task) return;

        const oldStatus = task.status;

        // Destination column tasks after filters (and sorted)
        const columnTasks = getTasksByStatus(newStatus);

        // If moving to another status, put at end
        let newPosition: number;
        if (oldStatus !== newStatus) {
            newPosition = columnTasks.length;
        } else {
            // Same column reorder: fall back to current index if present,
            // otherwise place at end
            const currentIndex = columnTasks.findIndex((t: any) => t._id === taskId);
            newPosition = currentIndex >= 0 ? currentIndex : columnTasks.length;
        }

        updatePositionMutation.mutate({ taskId, newStatus, newPosition, oldStatus });
    };

    const activeTask = tasks?.find((task: any) => task._id === activeId);

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setProjectFilter('ALL');
        setPriorityFilter('ALL');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        {totalTasks} tasks • {completedTasks} completed • {inProgressTasks} in progress
                    </p>
                </div>
                <Button variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Task
                </Button>
            </div>

            {/* Filters */}
            <Card padding="md">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search tasks by title or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Project Filter */}
                    <select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="ALL">All Projects</option>
                        {projects?.map((project: any) => (
                            <option key={project._id} value={project._id}>
                                {project.name}
                            </option>
                        ))}
                    </select>

                    {/* Priority Filter */}
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="ALL">All Priorities</option>
                        <option value="URGENT">Urgent</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>

                    {/* Clear Filters */}
                    {(searchQuery || projectFilter !== 'ALL' || priorityFilter !== 'ALL') && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    )}
                </div>
            </Card>

            {/* Kanban Board */}
            {isLoading ? (
                <Card padding="lg">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-3">Loading tasks...</p>
                    </div>
                </Card>
            ) : filteredTasks.length === 0 ? (
                <Card padding="lg">
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            {tasks?.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
                        </p>
                        {tasks?.length === 0 ? (
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
                            return (
                                <DroppableColumn
                                    key={column.id}
                                    id={column.id}
                                    title={column.title}
                                    color={column.color}
                                    count={columnTasks.length}
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
                                <Card padding="sm" className="shadow-2xl">
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
            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

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
