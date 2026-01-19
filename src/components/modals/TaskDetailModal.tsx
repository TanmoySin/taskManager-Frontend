import { type FC, useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
    Calendar, User, Clock, Paperclip, MessageSquare,
    CheckSquare, Plus, Send, Download, UserPlus, Trash2, FileText
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';

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

    const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'time'>('details');
    const [newComment, setNewComment] = useState('');
    const [newSubtask, setNewSubtask] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [timeFormData, setTimeFormData] = useState({
        hours: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        isBillable: true,
    });

    const { data: task, isLoading } = useQuery({
        queryKey: ['task', taskId],
        queryFn: async () => {
            const response = await api.get(`/tasks/${taskId}`);
            return response.data;
        },
        enabled: !!taskId && isOpen,
    });

    const { data: timeEntries, isLoading: timeLoading } = useQuery({
        queryKey: ['taskTimeEntries', taskId],
        queryFn: async () => {
            const response = await api.get('/time-tracking/entries', {
                params: { taskId }
            });
            return response.data;
        },
        enabled: !!taskId && isOpen && activeTab === 'time',
    });

    const { data: projectMembers, isLoading: membersLoading } = useQuery({
        queryKey: ['projectMembers', task?.projectId?._id],
        queryFn: async () => {
            if (!task?.projectId?._id) return [];
            const response = await api.get(`/projects/${task.projectId._id}/members`);
            return response.data;
        },
        enabled: !!task?.projectId?._id && isEditing,
    });

    const { data: comments, isLoading: commentsLoading } = useQuery({
        queryKey: ['taskComments', taskId],
        queryFn: async () => {
            const response = await api.get('/comments', {
                params: { taskId }
            });
            return response.data;
        },
        enabled: !!taskId && isOpen,
    });

    const [editData, setEditData] = useState({
        title: '',
        description: '',
        priority: '',
        status: '',
        dueDate: '',
        assigneeId: '',
    });

    useEffect(() => {
        if (task) {
            setEditData({
                title: task.title || '',
                description: task.description || '',
                priority: task.priority || 'MEDIUM',
                status: task.status || 'TODO',
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                assigneeId: task.assigneeId?._id || '',
            });
        }
    }, [task]);

    const canEditTask = () => {
        if (!task || !currentUserId) {
            return false;
        }

        if (userRole === 'Administrator') {
            return true;
        }

        if (userRole === 'Manager') {
            return true;
        }

        const projectOwnerId = task.projectId?.ownerId?._id || task.projectId?.ownerId;
        if (projectOwnerId === currentUserId) {
            return true;
        }

        const taskCreatorId = task.createdBy?._id || task.createdBy;
        if (taskCreatorId === currentUserId) {
            return true;
        }

        const taskAssigneeId = task.assigneeId?._id || task.assigneeId;
        if (taskAssigneeId === currentUserId) {
            return true;
        }

        return false;
    };

    const canDeleteComment = (comment: any) => {
        if (!comment || !currentUserId) return false;

        // Admin can delete any comment
        if (userRole === 'Administrator') return true;

        // Manager can delete any comment in their projects
        if (userRole === 'Manager') return true;

        // Users can delete their own comments
        const commentAuthorId = comment.authorId?._id || comment.authorId;
        return commentAuthorId === currentUserId;
    };

    const canDeleteAttachment = (uploadedById: string) => {
        if (userRole === 'Administrator') return true;
        if (userRole === 'Manager') return true;
        return uploadedById === currentUserId;
    };

    const canDeleteTimeEntry = (entry: any) => {
        if (entry.status === 'APPROVED') return false;
        if (userRole === 'Administrator') return true;
        return entry.userId?._id === currentUserId || entry.userId === currentUserId;
    };

    const getFilteredMembers = () => {
        if (!projectMembers) return [];
        if (userRole === 'Administrator') return projectMembers;

        return projectMembers.filter((member: any) => {
            if (userRole === 'Manager') {
                return member.role !== 'Administrator';
            }
            return member.role === 'Employee' || member._id === currentUserId;
        });
    };

    const updateTaskMutation = useMutation({
        mutationFn: (data: any) => api.patch(`/tasks/${taskId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            queryClient.invalidateQueries({ queryKey: ['myTasks'] });
            queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setIsEditing(false);
        },
        onError: (error: any) => {
            const errorMsg = error.response?.data?.error || error.message || 'Failed to update task';
            alert(errorMsg);
        },
    });

    const addCommentMutation = useMutation({
        mutationFn: (body: string) => api.post('/comments', {
            taskId,
            body,
            mentions: []
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
            setNewComment('');
        },
        onError: (error: any) => {
            alert(error.response?.data?.error || 'Failed to add comment');
        },
    });

    const deleteCommentMutation = useMutation({
        mutationFn: (commentId: string) =>
            api.delete(`/comments/${commentId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskComments', taskId] });
        },
        onError: (error: any) => {
            alert(error.response?.data?.error || 'Failed to delete comment');
        },
    });


    const logTimeMutation = useMutation({
        mutationFn: (data: any) => api.post('/time-tracking/entries', { ...data, taskId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskTimeEntries', taskId] });
            queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
            setTimeFormData({
                hours: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                isBillable: true,
            });
        },
        onError: (error: any) => {
            alert(error.response?.data?.error || 'Failed to log time');
        },
    });

    const deleteTimeMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/time-tracking/entries/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskTimeEntries', taskId] });
            queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
        },
        onError: (error: any) => {
            alert(error.response?.data?.error || 'Failed to delete time entry');
        },
    });

    const addSubtaskMutation = useMutation({
        mutationFn: (title: string) => api.post(`/tasks/${taskId}/subtasks`, { title }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            setNewSubtask('');
        },
        onError: (error: any) => {
            alert(error.response?.data?.error || 'Failed to add subtask');
        },
    });

    const toggleSubtaskMutation = useMutation({
        mutationFn: (subtaskId: string) =>
            api.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        },
        onError: (error: any) => {
            alert(error.response?.data?.error || 'Failed to toggle subtask');
        },
    });

    const deleteSubtaskMutation = useMutation({
        mutationFn: (subtaskId: string) =>
            api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        },
        onError: (error: any) => {
            alert(error.response?.data?.error || 'Failed to delete subtask');
        },
    });

    const uploadAttachmentMutation = useMutation({
        mutationFn: (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            return api.post(`/tasks/${taskId}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
        onError: (error: any) => {
            alert(error.response?.data?.error || 'Failed to upload file');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        },
    });

    const deleteAttachmentMutation = useMutation({
        mutationFn: (attachmentId: string) =>
            api.delete(`/tasks/${taskId}/attachments/${attachmentId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        },
        onError: (error: any) => {
            alert(error.response?.data?.error || 'Failed to delete attachment');
        },
    });

    const handleSaveEdit = () => {
        if (!editData.title.trim()) {
            alert('Task title is required');
            return;
        }
        updateTaskMutation.mutate(editData);
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
                alert('File size must be less than 10MB');
                e.target.value = '';
                return;
            }
            uploadAttachmentMutation.mutate(file);
        }
    };

    const handleLogTime = (e: React.FormEvent) => {
        e.preventDefault();
        const hours = parseFloat(timeFormData.hours);

        if (!hours || hours <= 0) {
            alert('Please enter valid hours');
            return;
        }

        if (hours > 24) {
            alert('Hours cannot exceed 24');
            return;
        }

        logTimeMutation.mutate({
            hours,
            date: timeFormData.date,
            description: timeFormData.description,
            isBillable: timeFormData.isBillable,
        });
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

    const getStatusColor = (status: string) => {
        const colors: any = {
            DONE: 'success',
            IN_PROGRESS: 'info',
            REVIEW: 'warning',
            TODO: 'default'
        };
        return colors[status] || 'default';
    };

    const formatDate = (date: string | Date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (date: string | Date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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

    if (!task) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Task Not Found" size="xl">
                <div className="text-center py-12">
                    <p className="text-gray-500">Task not found or you don't have permission to view it.</p>
                    <Button variant="secondary" className="mt-4" onClick={onClose}>Close</Button>
                </div>
            </Modal>
        );
    }

    const canEdit = canEditTask();
    const filteredMembers = getFilteredMembers();

    console.log("filteredMembers", filteredMembers);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Task' : "Task Details"} size="xl">
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <div>
                        {isEditing ? (
                            <Input
                                value={editData.title}
                                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                className="text-lg font-semibold mb-3"
                                placeholder="Task title"
                                disabled={updateTaskMutation.isPending}
                            />
                        ) : (
                            <h2 className="text-xl font-bold text-gray-900 mb-3">{task.title}</h2>
                        )}

                        {isEditing ? (
                            <textarea
                                value={editData.description}
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                rows={4}
                                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Add description..."
                                disabled={updateTaskMutation.isPending}
                            />
                        ) : (
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                {task.description || 'No description provided'}
                            </p>
                        )}
                    </div>

                    <div className="border-b border-gray-200">
                        <div className="flex space-x-6">
                            {[
                                { key: 'details', label: 'Details', icon: CheckSquare },
                                { key: 'comments', label: `Comments (${comments?.length || 0})`, icon: MessageSquare },
                                { key: 'time', label: `Time (${timeEntries?.length || 0})`, icon: Clock }
                            ].map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveTab(key as any)}
                                    className={`pb-3 text-sm font-medium flex items-center space-x-2 ${activeTab === key
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

                    {activeTab === 'details' && (
                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center justify-between mb-3">
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
                                    <div className="mb-3">
                                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                style={{
                                                    width: `${(task.subtasks.filter((s: any) => s.isCompleted).length / task.subtasks.length) * 100}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 mb-3">
                                    {task?.subtasks?.length > 0 ? (
                                        task.subtasks.map((subtask: any) => (
                                            <div key={subtask._id} className="flex items-center space-x-3 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                                                <input
                                                    type="checkbox"
                                                    checked={subtask.isCompleted}
                                                    onChange={() => toggleSubtaskMutation.mutate(subtask._id)}
                                                    disabled={toggleSubtaskMutation.isPending}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                />
                                                <span className={`text-sm flex-1 ${subtask.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                                    {subtask.title}
                                                </span>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Delete subtask "${subtask.title}"?`)) {
                                                                deleteSubtaskMutation.mutate(subtask._id);
                                                            }
                                                        }}
                                                        disabled={deleteSubtaskMutation.isPending}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Delete subtask"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg">
                                            <CheckSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">No subtasks yet</p>
                                            <p className="text-xs text-gray-500 mt-1">Add subtasks to break down this task</p>
                                        </div>
                                    )}
                                </div>


                                <form onSubmit={handleAddSubtask} className="flex space-x-2">
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

                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                    <Paperclip className="w-4 h-4 mr-2" />
                                    Attachments ({task.attachments?.length || 0})
                                </h3>

                                <div className="space-y-2 mb-3">
                                    {task?.attachments?.length > 0 ? (
                                        task.attachments.map((attachment: any) => (
                                            <div key={attachment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                    <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {attachment.filename}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatDateTime(attachment.uploadedAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 flex-shrink-0">
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
                                                                if (confirm(`Delete "${attachment.filename}"?`)) {
                                                                    deleteAttachmentMutation.mutate(attachment._id);
                                                                }
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
                                        <div className="text-center py-6 text-gray-400">
                                            <Paperclip className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">No attachments yet</p>
                                        </div>
                                    )}
                                </div>


                                <div className="relative">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        onChange={handleFileSelect}
                                        disabled={uploadAttachmentMutation.isPending}
                                        className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:cursor-pointer disabled:opacity-50"
                                    />
                                    {uploadAttachmentMutation.isPending && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-sm text-blue-600">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                            Uploading...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'comments' && (
                        <div className="space-y-4">
                            <div className="max-h-96 overflow-y-auto space-y-3">
                                {commentsLoading ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                                        <p className="text-sm text-gray-500">Loading comments...</p>
                                    </div>
                                ) : comments && comments.length > 0 ? (
                                    comments.map((comment: any) => (
                                        <div key={comment._id} className="p-3 bg-gray-50 rounded-lg group">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center space-x-2 flex-1">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-sm font-medium text-blue-600">
                                                            {comment.authorId?.name?.charAt(0).toUpperCase() || '?'}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {comment.authorId?.name || 'Unknown'}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {formatDateTime(comment.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {canDeleteComment(comment) && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Delete this comment?')) {
                                                                deleteCommentMutation.mutate(comment._id);
                                                            }
                                                        }}
                                                        disabled={deleteCommentMutation.isPending}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Delete comment"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap ml-10">
                                                {comment.body}
                                            </p>
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

                            <form onSubmit={handleAddComment} className="flex space-x-2 pt-3 border-t border-gray-200">
                                <Input
                                    type="text"
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="flex-1"
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


                    {activeTab === 'time' && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Log Time
                                </h4>
                                <form onSubmit={handleLogTime} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Hours <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="number"
                                                step="0.25"
                                                min="0.25"
                                                max="24"
                                                required
                                                placeholder="2.5"
                                                value={timeFormData.hours}
                                                onChange={(e) => setTimeFormData({ ...timeFormData, hours: e.target.value })}
                                                disabled={logTimeMutation.isPending}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Date <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="date"
                                                required
                                                max={new Date().toISOString().split('T')[0]}
                                                value={timeFormData.date}
                                                onChange={(e) => setTimeFormData({ ...timeFormData, date: e.target.value })}
                                                disabled={logTimeMutation.isPending}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            rows={2}
                                            placeholder="What did you work on?"
                                            value={timeFormData.description}
                                            onChange={(e) => setTimeFormData({ ...timeFormData, description: e.target.value })}
                                            disabled={logTimeMutation.isPending}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100"
                                        />
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <label className="text-xs font-medium text-gray-700">Billable:</label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={timeFormData.isBillable === true}
                                                onChange={() => setTimeFormData({ ...timeFormData, isBillable: true })}
                                                disabled={logTimeMutation.isPending}
                                                className="w-3.5 h-3.5 text-blue-600"
                                            />
                                            <span className="ml-2 text-sm">Yes</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={timeFormData.isBillable === false}
                                                onChange={() => setTimeFormData({ ...timeFormData, isBillable: false })}
                                                disabled={logTimeMutation.isPending}
                                                className="w-3.5 h-3.5 text-blue-600"
                                            />
                                            <span className="ml-2 text-sm">No</span>
                                        </label>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        className="w-full"
                                        isLoading={logTimeMutation.isPending}
                                    >
                                        <Clock className="w-3.5 h-3.5 mr-2" />
                                        Log Time Entry
                                    </Button>
                                </form>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                    Time Entries
                                </h4>

                                {timeLoading ? (
                                    <div className="text-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                                        <p className="text-sm text-gray-500">Loading time entries...</p>
                                    </div>
                                ) : timeEntries && timeEntries.length > 0 ? (
                                    <div className="space-y-2 max-h-80 overflow-y-auto">
                                        {timeEntries.map((entry: any) => (
                                            <div key={entry._id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center flex-wrap gap-2 mb-1">
                                                            <span className="text-sm font-bold text-blue-600">
                                                                {entry.hours}h
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {formatDate(entry.date)}
                                                            </span>
                                                            {entry.isBillable && (
                                                                <Badge variant="success" size="sm">Billable</Badge>
                                                            )}
                                                            <Badge
                                                                variant={
                                                                    entry.status === 'APPROVED' ? 'success' :
                                                                        entry.status === 'REJECTED' ? 'danger' : 'default'
                                                                }
                                                                size="sm"
                                                            >
                                                                {entry.status}
                                                            </Badge>
                                                        </div>
                                                        {entry.description && (
                                                            <p className="text-xs text-gray-600 mb-1">{entry.description}</p>
                                                        )}
                                                        <p className="text-xs text-gray-500">
                                                            Logged by {entry.userId?.name || 'Unknown'}
                                                        </p>
                                                    </div>
                                                    {canDeleteTimeEntry(entry) && (
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Delete this time entry?')) {
                                                                    deleteTimeMutation.mutate(entry._id);
                                                                }
                                                            }}
                                                            disabled={deleteTimeMutation.isPending}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors ml-2"
                                                            title="Delete time entry"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-400">
                                        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">No time entries yet</p>
                                        <p className="text-xs mt-1">Log your first entry above</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {isEditing ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={editData.status}
                                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                    disabled={updateTaskMutation.isPending}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                >
                                    <option value="TODO">To Do</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="REVIEW">Review</option>
                                    <option value="DONE">Done</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Priority <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={editData.priority}
                                    onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                                    disabled={updateTaskMutation.isPending}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                                    Assign To
                                </label>
                                <select
                                    value={editData.assigneeId}
                                    onChange={(e) => setEditData({ ...editData, assigneeId: e.target.value })}
                                    disabled={membersLoading || updateTaskMutation.isPending}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                >
                                    <option value="">Unassigned</option>
                                    {filteredMembers.map((member: any) => (
                                        <option key={member._id} value={member._id}>
                                            {member.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {userRole === 'Employee' ? 'You can only assign to yourself or other employees' :
                                        userRole === 'Manager' ? 'Managers cannot assign to administrators' :
                                            'You can assign to anyone'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
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
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1.5">Status</label>
                                <Badge variant={getStatusColor(task.status)} size="md">
                                    {task.status?.replace('_', ' ')}
                                </Badge>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 block mb-1.5">Priority</label>
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
                                    <div className="flex items-center space-x-2">
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
                                    Due Date
                                </label>
                                <span className="text-sm text-gray-700">
                                    {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                                </span>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 block mb-1.5">Project</label>
                                <span className="text-sm font-medium text-gray-900">
                                    {task.projectId?.name || 'Unknown Project'}
                                </span>
                            </div>

                            <div className="pt-2 border-t border-gray-200">
                                <label className="text-xs text-gray-500 block mb-1">Created</label>
                                <p className="text-xs text-gray-600">
                                    {formatDateTime(task.createdAt)}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    by {task.createdBy?.name || 'Unknown'}
                                </p>
                            </div>

                            {task.updatedAt && task.updatedAt !== task.createdAt && (
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Last Updated</label>
                                    <p className="text-xs text-gray-600">
                                        {formatDateTime(task.updatedAt)}
                                    </p>
                                    {task.updatedBy && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            by {task.updatedBy.name}
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    <div className="pt-4 border-t border-gray-200">
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
                                                title: task.title,
                                                description: task.description || '',
                                                priority: task.priority,
                                                status: task.status,
                                                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                                                assigneeId: task.assigneeId?._id || '',
                                            });
                                        }
                                    }}
                                    disabled={updateTaskMutation.isPending}
                                >
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            canEdit ? (
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => setIsEditing(true)}
                                >
                                    Edit Task
                                </Button>
                            ) : (
                                <div className="text-center py-2">
                                    <p className="text-xs text-gray-500">You don't have permission to edit this task</p>
                                </div>
                            )
                        )}
                    </div>

                </div>
            </div>
        </Modal>
    );
};

export default TaskDetailModal;
