import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import {
    Search,
    Filter,
    Plus,
    Calendar,
    User,
    MoreVertical,
    Timer,
} from "lucide-react";
import CreateTaskModal from "../../components/ui/CreateTaskModal";
import TaskDetailModal from "../../components/modals/TaskDetailModal";

export default function MyTasks() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: tasks, isLoading } = useQuery({
        queryKey: ["myTasks"],
        queryFn: async () => {
            const response = await api.get("/tasks/my-tasks");
            return response.data;
        },
    });

    // ✅ Check if user has a running timer
    const { data: runningTimer } = useQuery({
        queryKey: ["runningTimer"],
        queryFn: async () => {
            const response = await api.get("/time-tracking/timer/current");
            return response.data.runningTimer;
        },
        refetchInterval: 5000, // Poll every 5 seconds
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
            api.patch(`/tasks/${taskId}/status`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["myTasks"] });
            queryClient.invalidateQueries({ queryKey: ["projectTasks"] });
        },
    });

    // ✅ NEW: Start Timer Mutation
    const startTimerMutation = useMutation({
        mutationFn: (data: { taskId: string; description: string }) =>
            api.post("/time-tracking/timer/start", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["runningTimer"] });
        },
        onError: (error: any) => {
            alert(
                "Failed to start timer: " +
                (error.response?.data?.error || error.message)
            );
        },
    });

    const filteredTasks = tasks?.filter((task: any) => {
        const matchesSearch =
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.projectId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            statusFilter === "ALL" || task.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

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

    // ✅ Handle timer start
    const handleStartTimer = (task: any, e: React.MouseEvent) => {
        e.stopPropagation();

        if (runningTimer) {
            alert(
                `You already have a timer running for "${runningTimer.task?.title}". Stop it first.`
            );
            return;
        }

        startTimerMutation.mutate({
            taskId: task._id,
            description: `Working on ${task.title}`,
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        {filteredTasks?.length || 0} tasks assigned to you
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

            {/* Filters */}
            <Card padding="md">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search tasks or projects..."
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
                                    {status === "ALL" ? "All Status" : status.replace("_", " ")}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Task List */}
            <div className="space-y-3">
                {isLoading ? (
                    <Card padding="lg">
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-3">Loading tasks...</p>
                        </div>
                    </Card>
                ) : filteredTasks?.length ? (
                    filteredTasks.map((task: any) => (
                        <Card
                            key={task._id}
                            padding="md"
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setSelectedTaskId(task._id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-base font-semibold text-gray-900">
                                            {task.title}
                                        </h3>
                                        <Badge variant={getPriorityColor(task.priority)} size="sm">
                                            {task.priority}
                                        </Badge>
                                        <Badge variant={getStatusColor(task.status)} size="sm">
                                            {task.status.replace("_", " ")}
                                        </Badge>
                                        {/* ✅ Show indicator if timer is running for this task */}
                                        {runningTimer?.taskId === task._id && (
                                            <Badge variant="danger" size="sm">
                                                <div className="flex items-center space-x-1">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                    <span>Timer Running</span>
                                                </div>
                                            </Badge>
                                        )}
                                    </div>

                                    {task.description && (
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                            {task.description}
                                        </p>
                                    )}

                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <div className="flex items-center">
                                            <User className="w-3 h-3 mr-1" />
                                            {task.projectId?.name || "No project"}
                                        </div>
                                        {task.dueDate && (
                                            <div className="flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                Due: {new Date(task.dueDate).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div
                                    className="flex items-center space-x-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* ✅ NEW: Timer Button */}
                                    <button
                                        onClick={(e) => handleStartTimer(task, e)}
                                        disabled={
                                            runningTimer?.taskId === task._id ||
                                            startTimerMutation.isPending
                                        }
                                        className={`flex items-center space-x-1 px-2 py-1 text-xs rounded-lg border transition-colors
                                            ${runningTimer?.taskId === task._id
                                                ? "bg-red-50 border-red-200 text-red-600 cursor-not-allowed"
                                                : "bg-white border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                                            }`}
                                        title={
                                            runningTimer?.taskId === task._id
                                                ? "Timer running for this task"
                                                : "Start timer for this task"
                                        }
                                    >
                                        <Timer
                                            className={`w-3 h-3 ${runningTimer?.taskId === task._id
                                                ? "text-red-600"
                                                : "text-blue-600"
                                                }`}
                                        />
                                        <span className="hidden md:inline">
                                            {runningTimer?.taskId === task._id ? "Running" : "Start"}
                                        </span>
                                    </button>

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
                                    <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                        <MoreVertical className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <Card padding="lg">
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">No tasks found</p>
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
