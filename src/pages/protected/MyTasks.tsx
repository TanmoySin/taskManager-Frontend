import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import {
    Search,
    Plus,
    Calendar,
    User,
    ChevronDown,
    ChevronUp,
    Trash2,
} from "lucide-react";
import CreateTaskModal from "../../components/ui/CreateTaskModal";
import TaskDetailModal from "../../components/modals/TaskDetailModal";
import DeadlineBadge from "./TaskManager/DeadlineBadge";
import { useAppSelector } from "../../store/hooks";

export default function MyTasks() {
    const user = useAppSelector((state) => state.auth.user);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [priorityFilter, setPriorityFilter] = useState("ALL");
    const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [groupBy, setGroupBy] = useState<'none' | 'status' | 'priority' | 'project'>('none');
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const queryClient = useQueryClient();

    const { data: tasksResponse, isLoading } = useQuery({
        queryKey: ["myTasks"],
        queryFn: async () => {
            const response = await api.get("/tasks/my-tasks");
            console.log("🔍 Raw API Response:", response.data);
            return response.data;
        },
    });

    // ✅ Extract tasks from response object
    const tasks = tasksResponse?.tasks || [];
    const pagination = tasksResponse?.pagination;

    console.log("🔍 Current User ID:", user?.id); // ✅ ADD THIS
    console.log("🔍 Current User:", user);


    const updateStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
            api.patch(`/tasks/${taskId}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myTasks"] });
            queryClient.invalidateQueries({ queryKey: ["projectTasks"] });
        },
    });

    const deleteTaskMutation = useMutation({
        mutationFn: (taskId: string) => api.delete(`/tasks/${taskId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myTasks"] });
            alert("Task deleted successfully");
        },
    });


    const filteredTasks = tasks?.filter((task: any) => {
        const matchesSearch =
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.projectId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === "ALL" || task.status === statusFilter;
        const matchesPriority =
            priorityFilter === "ALL" || task.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort tasks
    const sortedTasks = [...(filteredTasks || [])].sort((a, b) => {
        let comparison = 0;

        if (sortBy === 'dueDate') {
            const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
            const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
            comparison = dateA - dateB;
        } else if (sortBy === 'priority') {
            const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
            comparison = (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
        } else if (sortBy === 'createdAt') {
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Group tasks
    const groupedTasks: Record<string, any[]> = {};
    if (groupBy === 'none') {
        groupedTasks['All Tasks'] = sortedTasks;
    } else if (groupBy === 'status') {
        sortedTasks.forEach((task) => {
            const key = task.status.replace('_', ' ');
            if (!groupedTasks[key]) groupedTasks[key] = [];
            groupedTasks[key].push(task);
        });
    } else if (groupBy === 'priority') {
        sortedTasks.forEach((task) => {
            const key = task.priority;
            if (!groupedTasks[key]) groupedTasks[key] = [];
            groupedTasks[key].push(task);
        });
    } else if (groupBy === 'project') {
        sortedTasks.forEach((task) => {
            const key = task.projectId?.name || 'No Project';
            if (!groupedTasks[key]) groupedTasks[key] = [];
            groupedTasks[key].push(task);
        });
    }

    const toggleTaskSelection = (taskId: string) => {
        setSelectedTasks((prev) =>
            prev.includes(taskId)
                ? prev.filter((id) => id !== taskId)
                : [...prev, taskId]
        );
    };

    const handleBulkStatusUpdate = (status: string) => {
        selectedTasks.forEach((taskId) => {
            updateStatusMutation.mutate({ taskId, status });
        });
        setSelectedTasks([]);
    };

    const statusOptions = ["ALL", "TODO", "IN_PROGRESS", "REVIEW", "DONE"];

    const getPriorityColor = (priority: string) => {
        const colors: any = {
            URGENT: "danger",
            HIGH: "warning",
            MEDIUM: "info",
            LOW: "default",
        };
        return colors[priority] || "default";
    };

    const getStatusColor = (status: string) => {
        const colors: any = {
            DONE: "success",
            IN_PROGRESS: "info",
            REVIEW: "warning",
            TODO: "default",
        };
        return colors[status] || "default";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Showing {sortedTasks?.length || 0} of {pagination?.totalCount || tasks?.length || 0} tasks
                        {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && ' (filtered)'}
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Task
                </Button>
            </div>

            {/* Enhanced Filters */}
            <Card padding="md">
                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search tasks or projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        )}
                    </div>


                    {/* Filters Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                {statusOptions.map((status) => (
                                    <option key={status} value={status}>
                                        {status === "ALL" ? "All Status" : status.replace("_", " ")}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ALL">All Priorities</option>
                                <option value="URGENT">Urgent</option>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                            </select>
                        </div>

                        {/* Sort By with Order Toggle */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Sort By</label>
                            <div className="flex gap-2">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="dueDate">Due Date</option>
                                    <option value="priority">Priority</option>
                                    <option value="createdAt">Created Date</option>
                                </select>
                                <button
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
                                >
                                    {sortOrder === 'asc' ? (
                                        <ChevronUp className="w-4 h-4" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>


                        {/* Group By */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Group By</label>
                            <select
                                value={groupBy}
                                onChange={(e) => setGroupBy(e.target.value as any)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="none">No Grouping</option>
                                <option value="status">Status</option>
                                <option value="priority">Priority</option>
                                <option value="project">Project</option>
                            </select>
                        </div>
                    </div>

                    {/* Bulk Actions (show when tasks selected) */}
                    {selectedTasks.length > 0 && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <span className="text-sm font-medium text-blue-700">
                                {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''} selected
                            </span>
                            <div className="flex items-center gap-2">
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleBulkStatusUpdate(e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                    className="px-3 py-1.5 text-xs border border-blue-300 rounded-lg bg-white"
                                >
                                    <option value="">Change Status</option>
                                    <option value="TODO">To Do</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="REVIEW">Review</option>
                                    <option value="DONE">Done</option>
                                </select>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setSelectedTasks([])}
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Active Filters Indicator */}
            {(searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || groupBy !== 'none') && (
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Active filters:</span>
                    {searchQuery && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md flex items-center gap-1">
                            Search: "{searchQuery}"
                            <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">✕</button>
                        </span>
                    )}
                    {statusFilter !== 'ALL' && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md flex items-center gap-1">
                            Status: {statusFilter.replace('_', ' ')}
                            <button onClick={() => setStatusFilter('ALL')} className="hover:text-green-900">✕</button>
                        </span>
                    )}
                    {priorityFilter !== 'ALL' && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md flex items-center gap-1">
                            Priority: {priorityFilter}
                            <button onClick={() => setPriorityFilter('ALL')} className="hover:text-orange-900">✕</button>
                        </span>
                    )}
                    {groupBy !== 'none' && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md flex items-center gap-1">
                            Grouped by: {groupBy}
                            <button onClick={() => setGroupBy('none')} className="hover:text-purple-900">✕</button>
                        </span>
                    )}
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('ALL');
                            setPriorityFilter('ALL');
                            setGroupBy('none');
                        }}
                        className="ml-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Clear all
                    </button>
                </div>
            )}


            {/* Task List with Grouping */}
            <div className="space-y-6">
                {isLoading ? (
                    <Card padding="lg">
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-3">Loading tasks...</p>
                        </div>
                    </Card>
                ) : Object.keys(groupedTasks).length > 0 && sortedTasks.length > 0 ? (
                    Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
                        <div key={groupName}>
                            {groupBy !== 'none' && (
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                        {groupName}
                                    </h3>
                                    <Badge variant="default" size="sm">
                                        {groupTasks.length}
                                    </Badge>
                                </div>
                            )}

                            <div className="space-y-3">
                                {groupTasks.map((task: any) => (
                                    <Card
                                        key={task._id}
                                        padding="md"
                                        className="hover:shadow-md transition-shadow cursor-pointer"
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Checkbox for Selection */}
                                            <input
                                                type="checkbox"
                                                checked={selectedTasks.includes(task._id)}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    toggleTaskSelection(task._id);
                                                }}
                                                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />

                                            {/* Task Content */}
                                            <div
                                                className="flex-1"
                                                onClick={() => setSelectedTaskId(task._id)}
                                            >
                                                <div className="flex items-center flex-wrap gap-2 mb-2">
                                                    <h3 className="text-base font-semibold text-gray-900">
                                                        {task.title}
                                                    </h3>
                                                    <Badge variant={getPriorityColor(task.priority)} size="sm">
                                                        {task.priority}
                                                    </Badge>
                                                    <Badge variant={getStatusColor(task.status)} size="sm">
                                                        {task.status.replace("_", " ")}
                                                    </Badge>
                                                    {task.dueDate && (
                                                        <DeadlineBadge
                                                            dueDate={task.dueDate}
                                                            status={task.status}
                                                            size="sm"
                                                            showIcon={true}
                                                        />
                                                    )}
                                                </div>

                                                {task.description && (
                                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                                    <div className="flex items-center">
                                                        <User className="w-3 h-3 mr-1" />
                                                        {task.projectId?.name || "No project"}
                                                    </div>
                                                    {task.dueDate && (
                                                        <div className="flex items-center">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            {new Date(task.dueDate).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                    {task.estimatedHours && (
                                                        <div className="flex items-center">
                                                            <span className="mr-1">⏱️</span>
                                                            {task.estimatedHours}h estimated
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div
                                                className="flex items-center gap-2 flex-shrink-0"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <select
                                                    value={task.status}
                                                    onChange={(e) =>
                                                        updateStatusMutation.mutate({
                                                            taskId: task._id,
                                                            status: e.target.value,
                                                        })
                                                    }
                                                    className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="TODO">To Do</option>
                                                    <option value="IN_PROGRESS">In Progress</option>
                                                    <option value="REVIEW">Review</option>
                                                    <option value="DONE">Done</option>
                                                </select>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Delete task "${task.title}"?`)) {
                                                            deleteTaskMutation.mutate(task._id);
                                                        }
                                                    }}
                                                    disabled={deleteTaskMutation.isPending}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Delete task"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <Card padding="lg">
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">No tasks found</p>
                            <p className="text-xs text-gray-500">
                                {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                                    ? 'Try adjusting your filters'
                                    : 'Create your first task to get started'}
                            </p>
                        </div>
                    </Card>
                )}
            </div>


            {/* Create Task Modal */}
            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            {/* Task Detail Modal */}
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
