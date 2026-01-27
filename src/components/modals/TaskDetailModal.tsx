import { type FC, useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { showToast } from '../../lib/toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import ConfirmDialog from '../ui/ConfirmDialog';
import {
    Calendar,
    User,
    Paperclip,
    MessageSquare,
    CheckSquare,
    Plus,
    Send,
    Download,
    UserPlus,
    Trash2,
    FileText,
    Clock,
    AlertCircle,
    XCircle,
    Eye,
    Timer,
    Play,
    Square,
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { useTaskTimeEntries, useActiveTimer } from '../../hooks/useAnalytics';
import ActivityFeedWidget from '../../pages/protected/TaskManager/ActivityFeedWidget';
import DeadlineBadge from '../../pages/protected/TaskManager/DeadlineBadge';
import MentionInput from '../ui/MentionInput';

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskId: string;
}

const TaskDetailModal: FC<TaskDetailModalProps> = ({ isOpen, onClose, taskId }) => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const user = useAppSelector((state) => state.auth.user);
    const userRole = user?.role || 'Employee';
    const currentUserId = user?.id;

    const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'activity' | 'time'>('details');
    const [newComment, setNewComment] = useState('');
    const [newSubtask, setNewSubtask] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [showDependencyModal, setShowDependencyModal] = useState(false);
    const [showWatcherModal, setShowWatcherModal] = useState(false);
    const [selectedDependency, setSelectedDependency] = useState('');
    const [selectedWatcher, setSelectedWatcher] = useState('');

    // Confirm dialogs state
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

    // ✅ Fetch task details
    const { data: task, isLoading } = useQuery({
        queryKey: ['task', taskId],
        queryFn: async () => {
            const response = await api.get(`/tasks/${taskId}`);
            return response.data;
        },
        enabled: !!taskId && isOpen,
    });

    // ✅ Fetch project members
    const { data: projectMembers, isLoading: membersLoading } = useQuery({
        queryKey: ['projectMembers', task?.projectId?._id],
        queryFn: async () => {
            if (!task?.projectId?._id) return [];
            const response = await api.get(`/projects/${task.projectId._id}/members`);
            return response.data;
        },
        enabled: !!task?.projectId?._id && (isEditing || showWatcherModal),
    });

    // ✅ Fetch comments
    const { data: comments, isLoading: commentsLoading } = useQuery({
        queryKey: ['taskComments', taskId],
        queryFn: async () => {
            const response = await api.get('/comments', { params: { taskId } });
            return response.data;
        },
        enabled: !!taskId && isOpen,
    });

    // ✅ Fetch available tasks for dependencies
    const { data: availableTasks, isLoading: availableTasksLoading } = useQuery({
        queryKey: ['projectTasks', task?.projectId?._id, taskId],
        queryFn: async () => {
            if (!task?.projectId?._id) return [];
            try {
                const projectId = typeof task.projectId === 'object' ? task.projectId._id : task.projectId;
                const response = await api.get(`/tasks/project/${projectId}`);

                let allTasks: any[] = [];
                if (Array.isArray(response.data)) {
                    allTasks = response.data;
                } else if (response.data?.tasks) {
                    allTasks = response.data.tasks;
                }

                return allTasks.filter((t: any) => {
                    if (t._id === taskId) return false;
                    const isAlreadyDependency = task.dependencies?.some(
                        (dep: any) => (dep._id || dep) === t._id
                    );
                    return !isAlreadyDependency;
                });
            } catch (error) {
                console.error('Error fetching available tasks:', error);
                return [];
            }
        },
        enabled: showDependencyModal && !!task?.projectId,
    });

    // ✅ Fetch task time entries
    const { data: timeEntries } = useTaskTimeEntries(taskId, isOpen);

    // ✅ Check active timer
    const { data: activeTimer } = useActiveTimer();
    const hasActiveTimerForTask = activeTimer?.isRunning && activeTimer?.taskId?._id === taskId;

    // Edit form state
    const [editData, setEditData] = useState({
        title: '',
        description: '',
        priority: '',
        status: '',
        dueDate: '',
        startDate: '',
        assigneeId: '',
        estimatedHours: '',
        labels: '',
    });

    useEffect(() => {
        if (task) {
            setEditData({
                title: task.title || '',
                description: task.description || '',
                priority: task.priority || 'MEDIUM',
                status: task.status || 'TODO',
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
                assigneeId: task.assigneeId?._id || '',
                estimatedHours: task.estimatedHours?.toString() || '',
                labels: task.labels?.join(', ') || '',
            });
        }
    }, [task]);

    // Permission checks
    const canEditTask = (() => {
        if (!task || !currentUserId) return false;
        if (userRole === 'Administrator') return true;
        if (userRole === 'Manager') return true;

        const projectOwnerId = task.projectId?.ownerId?._id || task.projectId?.ownerId;
        if (projectOwnerId === currentUserId) return true;

        const taskCreatorId = task.createdBy?._id || task.createdBy;
        if (taskCreatorId === currentUserId) return true;

        const taskAssigneeId = task.assigneeId?._id || task.assigneeId;
        if (taskAssigneeId === currentUserId) return true;

        return false;
    })();

    const canDeleteComment = (comment: any) => {
        if (!comment || !currentUserId) return false;
        if (userRole === 'Administrator') return true;
        if (userRole === 'Manager') return true;
        const commentAuthorId = comment.authorId?._id || comment.authorId;
        return commentAuthorId === currentUserId;
    };

    const canDeleteAttachment = (uploadedById: string) => {
        if (userRole === 'Administrator') return true;
        if (userRole === 'Manager') return true;
        return uploadedById === currentUserId;
    };

    // ==================== MUTATIONS ====================

    // ✅ Update task mutation
    const updateTaskMutation = useMutation({
        mutationFn: (data: any) => api.patch(`/tasks/${taskId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            queryClient.invalidateQueries({ queryKey: ['myTasks'] });
            queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
            setIsEditing(false);
            showToast.success('Task updated successfully');
        },
        onError: (error: any) => {
            const errorMsg = error?.response?.data?.error || error.message || 'Failed to update task';
            const details = error?.response?.data?.details;
            showToast.error(details ? `${errorMsg}: ${details}` : errorMsg);
        },
    });

    // ✅ Add comment mutation
    const addCommentMutation = useMutation({
        mutationFn: (body: string) => api.post('/comments', { taskId, body, mentions: [] }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
            setNewComment('');
            showToast.success('Comment added');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to add comment');
        },
    });

    // ✅ Delete comment mutation
    const deleteCommentMutation = useMutation({
        mutationFn: (commentId: string) => api.delete(`/comments/${commentId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
            showToast.success('Comment deleted');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to delete comment');
        },
    });

    // ✅ Add subtask mutation
    const addSubtaskMutation = useMutation({
        mutationFn: (title: string) => api.post(`/tasks/${taskId}/subtasks`, { title }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            setNewSubtask('');
            showToast.success('Subtask added');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to add subtask');
        },
    });

    // ✅ Toggle subtask mutation
    const toggleSubtaskMutation = useMutation({
        mutationFn: (subtaskId: string) => api.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to toggle subtask');
        },
    });

    // ✅ Delete subtask mutation
    const deleteSubtaskMutation = useMutation({
        mutationFn: (subtaskId: string) => api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            showToast.success('Subtask deleted');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to delete subtask');
        },
    });

    // ✅ Upload attachment mutation
    const uploadAttachmentMutation = useMutation({
        mutationFn: (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            return api.post(`/tasks/${taskId}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            if (fileInputRef.current) fileInputRef.current.value = '';
            showToast.success('File uploaded successfully');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to upload file');
            if (fileInputRef.current) fileInputRef.current.value = '';
        },
    });

    // ✅ Delete attachment mutation
    const deleteAttachmentMutation = useMutation({
        mutationFn: (attachmentId: string) => api.delete(`/tasks/${taskId}/attachments/${attachmentId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            showToast.success('Attachment deleted');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to delete attachment');
        },
    });

    // ✅ Add dependency mutation
    const addDependencyMutation = useMutation({
        mutationFn: (blockedByTaskId: string) => api.post(`/tasks/${taskId}/dependencies`, { blockedByTaskId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            setShowDependencyModal(false);
            setSelectedDependency('');
            showToast.success('Dependency added');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to add dependency');
        },
    });

    // ✅ Remove dependency mutation
    const removeDependencyMutation = useMutation({
        mutationFn: (dependencyId: string) => api.delete(`/tasks/${taskId}/dependencies/${dependencyId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            showToast.success('Dependency removed');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to remove dependency');
        },
    });

    // ✅ NEW: Add watcher mutation
    const addWatcherMutation = useMutation({
        mutationFn: (userId: string) => api.post(`/tasks/${taskId}/watchers`, { userId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            setShowWatcherModal(false);
            setSelectedWatcher('');
            showToast.success('Watcher added');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to add watcher');
        },
    });

    // ✅ NEW: Remove watcher mutation
    const removeWatcherMutation = useMutation({
        mutationFn: (userId: string) => api.delete(`/tasks/${taskId}/watchers/${userId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            showToast.success('Watcher removed');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to remove watcher');
        },
    });

    // ✅ Start timer mutation
    const startTimerMutation = useMutation({
        mutationFn: () => api.post(`/time-tracking/tasks/${taskId}/timer/start`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
            queryClient.invalidateQueries({ queryKey: ['taskTimeEntries', taskId] });
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            showToast.success('Timer started');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to start timer');
        },
    });

    // ✅ Stop timer mutation
    const stopTimerMutation = useMutation({
        mutationFn: () => api.post('/time-tracking/timer/stop'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
            queryClient.invalidateQueries({ queryKey: ['taskTimeEntries', taskId] });
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            showToast.success('Timer stopped');
        },
        onError: (error: any) => {
            showToast.error(error.response?.data?.error || 'Failed to stop timer');
        },
    });

    // ==================== EVENT HANDLERS ====================

    const handleSaveEdit = () => {
        if (!editData.title.trim()) {
            showToast.error('Task title is required');
            return;
        }

        const payload: any = {
            title: editData.title,
            description: editData.description,
            priority: editData.priority,
            status: editData.status,
            dueDate: editData.dueDate || undefined,
            startDate: editData.startDate || undefined,
            assigneeId: editData.assigneeId || undefined,
            estimatedHours: editData.estimatedHours ? parseFloat(editData.estimatedHours) : undefined,
            labels: editData.labels
                ? editData.labels.split(',').map((l) => l.trim()).filter(Boolean)
                : [],
        };

        updateTaskMutation.mutate(payload);
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            addCommentMutation.mutate(newComment);
        }
    };

    const handleAddSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSubtask.trim()) {
            addSubtaskMutation.mutate(newSubtask);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                showToast.error('File size must be less than 10MB');
                e.target.value = '';
                return;
            }
            uploadAttachmentMutation.mutate(file);
        }
    };

    // ==================== HELPER FUNCTIONS ====================

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

    const formatDate = (date: string | Date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDateTime = (date: string | Date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    // ==================== DATA PROCESSING ====================

    const commentsArray = Array.isArray(comments) ? comments : comments?.comments || [];
    const availableTasksArray = Array.isArray(availableTasks) ? availableTasks : [];
    const projectMembersArray = Array.isArray(projectMembers) ? projectMembers : projectMembers?.members || [];
    const timeEntriesArray = Array.isArray(timeEntries) ? timeEntries : [];
    const totalTimeLogged = timeEntriesArray.reduce((acc, entry) => acc + (entry.duration || 0), 0);

    // ==================== LOADING STATE ====================

    if (isLoading) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="xl">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-sm text-gray-500">Loading task details...</p>
                    </div>
                </div>
            </Modal>
        );
    }

    // ==================== NOT FOUND STATE ====================

    if (!task) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Task Not Found" size="xl">
                <div className="text-center py-12">
                    <p className="text-gray-500">Task not found or you don't have permission to view it.</p>
                    <Button variant="secondary" className="mt-4" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </Modal>
        );
    }

    const canEdit = canEditTask;

    // ==================== RENDER ====================

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Task' : 'Task Details'} size="xl">
                <div className="grid grid-cols-3 gap-4">
                    {/* Main Content - Left 2 columns */}
                    <div className="col-span-2 space-y-4">
                        {/* Title & Description */}
                        <div>
                            {isEditing ? (
                                <Input
                                    value={editData.title}
                                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                    className="text-lg font-semibold mb-2"
                                    placeholder="Task title"
                                    disabled={updateTaskMutation.isPending}
                                />
                            ) : (
                                <div className="flex items-start justify-between mb-2">
                                    <h2 className="text-xl font-bold text-gray-900 flex-1">{task.title}</h2>
                                    <DeadlineBadge dueDate={task.dueDate} status={task.status} size="md" />
                                </div>
                            )}

                            {isEditing ? (
                                <textarea
                                    value={editData.description}
                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Add description..."
                                    disabled={updateTaskMutation.isPending}
                                />
                            ) : (
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                    {task.description || 'No description provided'}
                                </p>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="border-b border-gray-200">
                            <div className="flex space-x-4">
                                {[
                                    { key: 'details', label: 'Details', icon: CheckSquare },
                                    { key: 'comments', label: `Comments (${commentsArray.length})`, icon: MessageSquare },
                                    { key: 'activity', label: 'Activity', icon: Clock },
                                    { key: 'time', label: 'Time Tracking', icon: Timer },
                                ].map(({ key, label, icon: Icon }) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveTab(key as any)}
                                        className={`pb-2 text-sm font-medium flex items-center gap-2 ${activeTab === key
                                                ? 'border-b-2 border-blue-600 text-blue-600'
                                                : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'details' && (
                            <div className="space-y-4">
                                {/* Subtasks Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                                            <CheckSquare className="w-4 h-4 mr-2" />
                                            Subtasks
                                        </h3>
                                        {task.subtasks && task.subtasks.length > 0 && (
                                            <span className="text-xs text-gray-500">
                                                {task.subtasks.filter((s: any) => s.isCompleted).length} of {task.subtasks.length} completed
                                            </span>
                                        )}
                                    </div>

                                    {task.subtasks && task.subtasks.length > 0 && (
                                        <>
                                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                                    style={{
                                                        width: `${(task.subtasks.filter((s: any) => s.isCompleted).length / task.subtasks.length) * 100}%`,
                                                    }}
                                                />
                                            </div>

                                            <div className="space-y-1.5 mb-2">
                                                {task.subtasks.map((subtask: any) => (
                                                    <div
                                                        key={subtask._id}
                                                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={subtask.isCompleted}
                                                            onChange={() => toggleSubtaskMutation.mutate(subtask._id)}
                                                            disabled={toggleSubtaskMutation.isPending}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                        />
                                                        <span
                                                            className={`text-sm flex-1 ${subtask.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}
                                                        >
                                                            {subtask.title}
                                                        </span>
                                                        {canEdit && (
                                                            <button
                                                                onClick={() => {
                                                                    setConfirmDialog({
                                                                        isOpen: true,
                                                                        title: 'Delete Subtask',
                                                                        message: `Delete subtask "${subtask.title}"?`,
                                                                        onConfirm: () => deleteSubtaskMutation.mutate(subtask._id),
                                                                        variant: 'danger',
                                                                    });
                                                                }}
                                                                disabled={deleteSubtaskMutation.isPending}
                                                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Delete subtask"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {(!task.subtasks || task.subtasks.length === 0) && (
                                        <div className="text-center py-4 text-gray-400 bg-gray-50 rounded-lg">
                                            <CheckSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">No subtasks yet</p>
                                            <p className="text-xs text-gray-500 mt-1">Add subtasks to break down this task</p>
                                        </div>
                                    )}

                                    {/* Add Subtask Form */}
                                    <form onSubmit={handleAddSubtask} className="flex gap-2 mt-2">
                                        <Input
                                            type="text"
                                            placeholder="Add a new subtask..."
                                            value={newSubtask}
                                            onChange={(e) => setNewSubtask(e.target.value)}
                                            className="flex-1"
                                            disabled={addSubtaskMutation.isPending}
                                        />
                                        <Button
                                            type="submit"
                                            variant="secondary"
                                            size="sm"
                                            disabled={!newSubtask.trim() || addSubtaskMutation.isPending}
                                            isLoading={addSubtaskMutation.isPending}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </div>

                                {/* Attachments Section */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                                        <Paperclip className="w-4 h-4 mr-2" />
                                        Attachments {task.attachments?.length > 0 && `(${task.attachments.length})`}
                                    </h3>

                                    <div className="space-y-2 mb-2">
                                        {task?.attachments?.length > 0 ? (
                                            task.attachments.map((attachment: any) => (
                                                <div
                                                    key={attachment._id}
                                                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{attachment.filename}</p>
                                                            <p className="text-xs text-gray-500">{formatDateTime(attachment.uploadedAt)}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        <a
                                                            href={attachment.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Download"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                        {canDeleteAttachment(attachment.uploadedBy?._id || attachment.uploadedBy) && (
                                                            <button
                                                                onClick={() => {
                                                                    setConfirmDialog({
                                                                        isOpen: true,
                                                                        title: 'Delete Attachment',
                                                                        message: `Delete attachment "${attachment.filename}"?`,
                                                                        onConfirm: () => deleteAttachmentMutation.mutate(attachment._id),
                                                                        variant: 'danger',
                                                                    });
                                                                }}
                                                                disabled={deleteAttachmentMutation.isPending}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                title="Delete attachment"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-4 text-gray-400">
                                                <Paperclip className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                <p className="text-sm">No attachments yet</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Attachment */}
                                    <div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            id={`file-upload-${taskId}`}
                                            onChange={handleFileSelect}
                                            disabled={uploadAttachmentMutation.isPending}
                                            className="hidden"
                                            accept="*"
                                        />
                                        <label
                                            htmlFor={`file-upload-${taskId}`}
                                            className={`flex items-center justify-center w-full px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploadAttachmentMutation.isPending
                                                    ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                                                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                                }`}
                                        >
                                            {uploadAttachmentMutation.isPending ? (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                                    Uploading...
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Paperclip className="w-4 h-4 mr-2" />
                                                    Click to upload or drag and drop
                                                </div>
                                            )}
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1 text-center">Max file size: 10MB</p>
                                    </div>
                                </div>

                                {/* Dependencies Section */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                                        <AlertCircle className="w-4 h-4 mr-2" />
                                        Dependencies
                                        {task.dependencies && task.dependencies.length > 0 && (
                                            <Badge variant="warning" size="sm">
                                                {task.dependencies.length}
                                            </Badge>
                                        )}
                                    </h3>

                                    {task.dependencies && task.dependencies.length > 0 ? (
                                        <div className="space-y-2 mb-2">
                                            {task.dependencies.map((dep: any) => (
                                                <div
                                                    key={dep._id}
                                                    className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-lg"
                                                >
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{dep.title}</p>
                                                            <p className="text-xs text-gray-500">Blocked by this task</p>
                                                        </div>
                                                        <Badge variant={dep.status === 'DONE' ? 'success' : 'warning'} size="sm">
                                                            {dep.status?.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => {
                                                                setConfirmDialog({
                                                                    isOpen: true,
                                                                    title: 'Remove Dependency',
                                                                    message: `Remove dependency on "${dep.title}"?`,
                                                                    onConfirm: () => removeDependencyMutation.mutate(dep._id),
                                                                    variant: 'warning',
                                                                });
                                                            }}
                                                            disabled={removeDependencyMutation.isPending}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors ml-2"
                                                            title="Remove dependency"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-400 bg-gray-50 rounded-lg mb-2">
                                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">No dependencies</p>
                                            <p className="text-xs text-gray-500 mt-1">This task is not blocked by any other tasks</p>
                                        </div>
                                    )}

                                    {/* Add Dependency Button */}
                                    {canEdit && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => setShowDependencyModal(true)}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Blocking Task
                                        </Button>
                                    )}
                                </div>

                                {/* Watchers Section */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                                        <Eye className="w-4 h-4 mr-2" />
                                        Watchers {task.watchers?.length > 0 && `(${task.watchers.length})`}
                                    </h3>

                                    {task.watchers && task.watchers.length > 0 ? (
                                        <div className="space-y-2 mb-2">
                                            {task.watchers.map((watcher: any) => (
                                                <div key={watcher._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <span className="text-sm font-medium text-blue-600">
                                                                {watcher.name?.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{watcher.name}</p>
                                                            <p className="text-xs text-gray-500">{watcher.email}</p>
                                                        </div>
                                                    </div>
                                                    {canEdit && watcher._id !== currentUserId && (
                                                        <button
                                                            onClick={() => {
                                                                setConfirmDialog({
                                                                    isOpen: true,
                                                                    title: 'Remove Watcher',
                                                                    message: `Remove ${watcher.name} from watchers?`,
                                                                    onConfirm: () => removeWatcherMutation.mutate(watcher._id),
                                                                    variant: 'warning',
                                                                });
                                                            }}
                                                            disabled={removeWatcherMutation.isPending}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Remove watcher"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-400 bg-gray-50 rounded-lg mb-2">
                                            <Eye className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">No watchers</p>
                                        </div>
                                    )}

                                    {/* Add Watcher Button */}
                                    {canEdit && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => setShowWatcherModal(true)}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Watcher
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Comments Tab */}
                        {activeTab === 'comments' && (
                            <div className="space-y-3">
                                <div className="max-h-96 overflow-y-auto space-y-2">
                                    {commentsLoading ? (
                                        <div className="text-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                                            <p className="text-sm text-gray-500">Loading comments...</p>
                                        </div>
                                    ) : commentsArray.length > 0 ? (
                                        commentsArray.map((comment: any) => (
                                            <div key={comment._id} className="p-2 bg-gray-50 rounded-lg group">
                                                <div className="flex items-start justify-between mb-1">
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <span className="text-sm font-medium text-blue-600">
                                                                {comment.authorId?.name?.charAt(0).toUpperCase() || '?'}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {comment.authorId?.name || 'Unknown'}
                                                                </span>
                                                                <span className="text-xs text-gray-500">{formatDateTime(comment.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {canDeleteComment(comment) && (
                                                        <button
                                                            onClick={() => {
                                                                setConfirmDialog({
                                                                    isOpen: true,
                                                                    title: 'Delete Comment',
                                                                    message: 'Delete this comment?',
                                                                    onConfirm: () => deleteCommentMutation.mutate(comment._id),
                                                                    variant: 'danger',
                                                                });
                                                            }}
                                                            disabled={deleteCommentMutation.isPending}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Delete comment"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap ml-10">{comment.body}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-gray-400">
                                            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p className="text-sm">No comments yet</p>
                                            <p className="text-xs mt-1">Be the first to comment</p>
                                        </div>
                                    )}
                                </div>

                                {/* Add Comment Form */}
                                <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-gray-200">
                                    <MentionInput
                                        value={newComment}
                                        onChange={setNewComment}
                                        placeholder="Add a comment... Use @ to mention someone"
                                        projectId={task?.projectId?._id}
                                        disabled={addCommentMutation.isPending}
                                    />
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        disabled={!newComment.trim() || addCommentMutation.isPending}
                                        isLoading={addCommentMutation.isPending}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* Activity Tab */}
                        {activeTab === 'activity' && (
                            <div className="space-y-3">
                                <ActivityFeedWidget taskId={taskId} />
                            </div>
                        )}

                        {/* Time Tracking Tab */}
                        {activeTab === 'time' && (
                            <div className="space-y-3">
                                {/* Timer Control */}
                                <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900">Time Tracker</h4>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {hasActiveTimerForTask
                                                    ? `Running for ${formatDuration(activeTimer?.duration || 0)}`
                                                    : 'Start tracking time on this task'}
                                            </p>
                                        </div>
                                        {hasActiveTimerForTask ? (
                                            <Button
                                                variant="danger"
                                                size="md"
                                                onClick={() => stopTimerMutation.mutate()}
                                                isLoading={stopTimerMutation.isPending}
                                            >
                                                <Square className="w-4 h-4 mr-2" />
                                                Stop Timer
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="primary"
                                                size="md"
                                                onClick={() => startTimerMutation.mutate()}
                                                isLoading={startTimerMutation.isPending}
                                                disabled={!!activeTimer?.isRunning}
                                            >
                                                <Play className="w-4 h-4 mr-2" />
                                                Start Timer
                                            </Button>
                                        )}
                                    </div>
                                    {activeTimer?.isRunning && !hasActiveTimerForTask && (
                                        <p className="text-xs text-amber-600">
                                            Timer is running on another task. Stop it first to start a new one.
                                        </p>
                                    )}
                                </div>

                                {/* Time Statistics */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                        <p className="text-xs text-gray-600 mb-1">Total Time Spent</p>
                                        <p className="text-2xl font-bold text-blue-600">{formatDuration(totalTimeLogged)}</p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                        <p className="text-xs text-gray-600 mb-1">Estimated Time</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {task.estimatedHours ? `${task.estimatedHours}h` : 'Not set'}
                                        </p>
                                    </div>
                                </div>

                                {/* Time Entries List */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Time Logs</h4>
                                    {timeEntriesArray.length > 0 ? (
                                        <div className="space-y-1.5 max-h-64 overflow-y-auto">
                                            {timeEntriesArray.map((entry: any) => (
                                                <div
                                                    key={entry._id}
                                                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-gray-500" />
                                                            <p className="text-sm font-medium text-gray-900">{formatDuration(entry.duration)}</p>
                                                            {entry.isManual && (
                                                                <Badge variant="info" size="sm">
                                                                    Manual
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {formatDateTime(entry.startTime)}
                                                            {entry.endTime && ` - ${formatDateTime(entry.endTime)}`}
                                                        </p>
                                                        {entry.description && <p className="text-xs text-gray-600 mt-1">{entry.description}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg">
                                            <Timer className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p className="text-sm">No time logs yet</p>
                                            <p className="text-xs mt-1">Start the timer to track your time</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Right 1 column */}
                    <div className="space-y-3">
                        {isEditing ? (
                            /* Edit Form Fields */
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={editData.status}
                                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                        disabled={updateTaskMutation.isPending}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                    >
                                        <option value="TODO">To Do</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="REVIEW">Review</option>
                                        <option value="DONE">Done</option>
                                        <option value="BLOCKED">Blocked</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                                        Assign To
                                    </label>
                                    <select
                                        value={editData.assigneeId}
                                        onChange={(e) => setEditData({ ...editData, assigneeId: e.target.value })}
                                        disabled={membersLoading || updateTaskMutation.isPending}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                    >
                                        <option value="">Unassigned</option>
                                        {projectMembersArray.map((member: any) => (
                                            <option key={member._id} value={member._id}>
                                                {member.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Priority <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={editData.priority}
                                        onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                                        disabled={updateTaskMutation.isPending}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                                        Estimated Hours
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        placeholder="e.g., 8"
                                        value={editData.estimatedHours}
                                        onChange={(e) => setEditData({ ...editData, estimatedHours: e.target.value })}
                                        disabled={updateTaskMutation.isPending}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                        Start Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={editData.startDate}
                                        onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                                        disabled={updateTaskMutation.isPending}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                                        <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                        Due Date
                                    </label>
                                    <Input
                                        type="date"
                                        value={editData.dueDate}
                                        onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                                        disabled={updateTaskMutation.isPending}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Labels</label>
                                    <Input
                                        type="text"
                                        placeholder="e.g., frontend, urgent"
                                        value={editData.labels}
                                        onChange={(e) => setEditData({ ...editData, labels: e.target.value })}
                                        disabled={updateTaskMutation.isPending}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
                                </div>
                            </>
                        ) : (
                            /* View Mode - Task Info */
                            <>
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Status</label>
                                    <Badge variant={getStatusColor(task.status)} size="md">
                                        {task.status?.replace('_', ' ')}
                                    </Badge>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Priority</label>
                                    <Badge variant={getPriorityColor(task.priority)} size="md">
                                        {task.priority}
                                    </Badge>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 block mb-1.5 flex items-center">
                                        <User className="w-3 h-3 mr-1" />
                                        Assignee
                                    </label>
                                    {task.assigneeId ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-sm font-medium text-blue-600">
                                                    {task.assigneeId.name?.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{task.assigneeId.name}</p>
                                                <p className="text-xs text-gray-500">{task.assigneeId.email}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400 italic">Unassigned</span>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 block mb-1.5 flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Start Date
                                    </label>
                                    <span className="text-sm text-gray-700">{task.startDate ? formatDate(task.startDate) : 'Not set'}</span>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 block mb-1.5 flex items-center">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        Due Date
                                    </label>
                                    <span className="text-sm text-gray-700">{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</span>
                                </div>

                                {task.estimatedHours && (
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1.5 flex items-center">
                                            <Clock className="w-3 h-3 mr-1" />
                                            Estimated Hours
                                        </label>
                                        <span className="text-sm text-gray-700">{task.estimatedHours}h</span>
                                    </div>
                                )}

                                {task.labels && task.labels.length > 0 && (
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1.5">Labels</label>
                                        <div className="flex flex-wrap gap-1">
                                            {task.labels.map((label: string, index: number) => (
                                                <Badge key={index} variant="info" size="sm">
                                                    {label}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs text-gray-500 block mb-1.5">Project</label>
                                    <span className="text-sm font-medium text-gray-900">{task.projectId?.name || 'Unknown Project'}</span>
                                </div>

                                <div className="pt-2 border-t border-gray-200">
                                    <label className="text-xs text-gray-500 block mb-1">Created</label>
                                    <p className="text-xs text-gray-600">{formatDateTime(task.createdAt)}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">by {task.createdBy?.name || 'Unknown'}</p>
                                </div>

                                {task.updatedAt && task.updatedAt !== task.createdAt && (
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1">Last Updated</label>
                                        <p className="text-xs text-gray-600">{formatDateTime(task.updatedAt)}</p>
                                        {task.updatedBy && <p className="text-xs text-gray-500 mt-0.5">by {task.updatedBy.name}</p>}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-gray-200">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <Button
                                        variant="primary"
                                        className="w-full"
                                        onClick={handleSaveEdit}
                                        isLoading={updateTaskMutation.isPending}
                                        disabled={!editData.title.trim()}
                                    >
                                        Save Changes
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={() => {
                                            setIsEditing(false);
                                            if (task) {
                                                setEditData({
                                                    title: task.title || '',
                                                    description: task.description || '',
                                                    priority: task.priority || 'MEDIUM',
                                                    status: task.status || 'TODO',
                                                    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                                                    startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
                                                    assigneeId: task.assigneeId?._id || '',
                                                    estimatedHours: task.estimatedHours?.toString() || '',
                                                    labels: task.labels?.join(', ') || '',
                                                });
                                            }
                                        }}
                                        disabled={updateTaskMutation.isPending}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            ) : canEdit ? (
                                <Button variant="secondary" className="w-full" onClick={() => setIsEditing(true)}>
                                    Edit Task
                                </Button>
                            ) : (
                                <div className="text-center py-2">
                                    <p className="text-xs text-gray-500">You don't have permission to edit this task</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Add Dependency Modal */}
            {showDependencyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Add Blocking Task</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Select a task that must be completed before this task can be worked on.
                        </p>
                        <select
                            value={selectedDependency}
                            onChange={(e) => setSelectedDependency(e.target.value)}
                            disabled={availableTasksLoading}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                            <option value="">
                                {availableTasksLoading
                                    ? 'Loading tasks...'
                                    : availableTasksArray.length === 0
                                        ? 'No tasks available'
                                        : 'Select a task'}
                            </option>
                            {!availableTasksLoading &&
                                availableTasksArray.length > 0 &&
                                availableTasksArray.map((task: any) => (
                                    <option key={task._id} value={task._id}>
                                        {task.title} ({task.status})
                                    </option>
                                ))}
                        </select>
                        <div className="flex gap-2 mt-4">
                            <Button
                                variant="primary"
                                onClick={() => {
                                    if (selectedDependency) {
                                        addDependencyMutation.mutate(selectedDependency);
                                    }
                                }}
                                disabled={!selectedDependency || addDependencyMutation.isPending}
                                isLoading={addDependencyMutation.isPending}
                            >
                                Add Dependency
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowDependencyModal(false);
                                    setSelectedDependency('');
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Watcher Modal */}
            {showWatcherModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Add Watcher</h3>
                        <p className="text-sm text-gray-600 mb-4">Select a team member to watch this task and receive updates.</p>
                        <select
                            value={selectedWatcher}
                            onChange={(e) => setSelectedWatcher(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
                        >
                            <option value="">Select a member...</option>
                            {projectMembersArray
                                .filter((member: any) => !task.watchers?.some((w: any) => w._id === member._id))
                                .map((member: any) => (
                                    <option key={member._id} value={member._id}>
                                        {member.name} - {member.email}
                                    </option>
                                ))}
                        </select>
                        <div className="flex gap-2">
                            <Button
                                variant="primary"
                                onClick={() => {
                                    if (selectedWatcher) {
                                        addWatcherMutation.mutate(selectedWatcher);
                                    }
                                }}
                                disabled={!selectedWatcher || addWatcherMutation.isPending}
                                isLoading={addWatcherMutation.isPending}
                            >
                                Add Watcher
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowWatcherModal(false);
                                    setSelectedWatcher('');
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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
};

export default TaskDetailModal;
