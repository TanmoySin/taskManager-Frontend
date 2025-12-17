import { type FC, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { uploadApi } from '../../lib/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
    Calendar, User, Clock, Paperclip, MessageSquare,
    CheckSquare, Plus, Send, Upload, Download, UserPlus, Trash2
} from 'lucide-react';

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskId: string;
}

const TaskDetailModal: FC<TaskDetailModalProps> = ({ isOpen, onClose, taskId }) => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'time'>('details');
    const [newComment, setNewComment] = useState('');
    const [newSubtask, setNewSubtask] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [timeFormData, setTimeFormData] = useState({
        hours: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        billable: true,
    });

    // Fetch task details
    const { data: task, isLoading } = useQuery({
        queryKey: ['task', taskId],
        queryFn: async () => {
            const response = await api.get(`/tasks/${taskId}`);
            return response.data;
        },
        enabled: !!taskId && isOpen,
    });

    // ✅ Fetch time entries for this task
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

    // ✅ Fetch project members for assignee dropdown
    const { data: projectMembers, isLoading: membersLoading } = useQuery({
        queryKey: ['projectMembers', task?.projectId?._id],
        queryFn: async () => {
            if (!task?.projectId?._id) return [];
            const response = await api.get(`/projects/${task.projectId._id}/members`);
            return response.data;
        },
        enabled: !!task?.projectId?._id,
    });

    const [editData, setEditData] = useState({
        title: '',
        description: '',
        priority: '',
        status: '',
        dueDate: '',
        assigneeId: '',
    });

    // Update edit data when task loads
    useEffect(() => {
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
    }, [task]);

    // Update task mutation
    const updateTaskMutation = useMutation({
        mutationFn: (data: any) => {
            console.log('🔄 Updating task with:', data);
            return api.patch(`/tasks/${taskId}`, data);
        },
        onSuccess: (data) => {
            console.log('✅ Task updated successfully:', data);
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            queryClient.invalidateQueries({ queryKey: ['myTasks'] });
            queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
            setIsEditing(false);
        },
        onError: (error: any) => {
            console.error('❌ Update task error:', error.response?.data || error.message);
            alert('Failed to update task: ' + (error.response?.data?.error || error.message));
        },
    });

    // Add comment mutation
    const addCommentMutation = useMutation({
        mutationFn: (content: string) => api.post(`/tasks/${taskId}/comments`, { content }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            setNewComment('');
        },
    });

    // ✅ Delete comment mutation
    const deleteCommentMutation = useMutation({
        mutationFn: (commentIndex: number) =>
            api.delete(`/tasks/${taskId}/comments/${commentIndex}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        },
    });

    // ✅ Log time mutation
    const logTimeMutation = useMutation({
        mutationFn: (data: any) => api.post('/time-tracking/entries', { ...data, taskId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskTimeEntries', taskId] });
            queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
            setTimeFormData({
                hours: '',
                date: new Date().toISOString().split('T')[0],
                description: '',
                billable: true,
            });
        },
        onError: (error: any) => {
            alert('Failed to log time: ' + (error.response?.data?.error || error.message));
        },
    });

    // ✅ Delete time entry mutation
    const deleteTimeMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/time-tracking/entries/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskTimeEntries', taskId] });
            queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
        },
    });

    // Add subtask mutation
    const addSubtaskMutation = useMutation({
        mutationFn: (title: string) => api.post(`/tasks/${taskId}/subtasks`, { title }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            setNewSubtask('');
        },
    });

    // Toggle subtask mutation
    const toggleSubtaskMutation = useMutation({
        mutationFn: (subtaskIndex: number) =>
            api.patch(`/tasks/${taskId}/subtasks/${subtaskIndex}/toggle`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        },
    });

    // ✅ Delete subtask mutation
    const deleteSubtaskMutation = useMutation({
        mutationFn: (subtaskIndex: number) =>
            api.delete(`/tasks/${taskId}/subtasks/${subtaskIndex}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        },
    });

    // Upload attachment mutation
    const uploadAttachmentMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const response = await uploadApi.post(`/tasks/${taskId}/attachments`, formData);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            setSelectedFile(null);
        },
    });

    // ✅ Delete attachment mutation
    const deleteAttachmentMutation = useMutation({
        mutationFn: (attachmentIndex: number) =>
            api.delete(`/tasks/${taskId}/attachments/${attachmentIndex}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
        },
    });

    const handleSaveEdit = () => {
        console.log('💾 Saving task edits:', editData);
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

    const handleFileUpload = () => {
        if (selectedFile) {
            uploadAttachmentMutation.mutate(selectedFile);
        }
    };

    const handleLogTime = (e: React.FormEvent) => {
        e.preventDefault();
        if (timeFormData.hours && parseFloat(timeFormData.hours) > 0) {
            logTimeMutation.mutate({
                hours: parseFloat(timeFormData.hours),
                date: timeFormData.date,
                description: timeFormData.description,
                billable: timeFormData.billable,
            });
        }
    };

    const getPriorityColor = (priority: string) => {
        const colors: any = { URGENT: 'danger', HIGH: 'warning', MEDIUM: 'info', LOW: 'default' };
        return colors[priority] || 'default';
    };

    const getStatusColor = (status: string) => {
        const colors: any = { DONE: 'success', IN_PROGRESS: 'info', REVIEW: 'warning', TODO: 'default' };
        return colors[status] || 'default';
    };

    if (isLoading) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title="Task Details" size="xl">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Task' : 'Task Details'} size="xl">
            <div className="grid grid-cols-3 gap-6">
                {/* Left Column - Main Content */}
                <div className="col-span-2 space-y-6">
                    {/* Title & Description */}
                    <div>
                        {isEditing ? (
                            <Input
                                value={editData.title}
                                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                className="text-lg font-semibold mb-3"
                            />
                        ) : (
                            <h2 className="text-xl font-bold text-gray-900 mb-3">{task?.title}</h2>
                        )}

                        {isEditing ? (
                            <textarea
                                value={editData.description}
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                rows={4}
                                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Add description..."
                            />
                        ) : (
                            <p className="text-sm text-gray-600">{task?.description || 'No description'}</p>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <div className="flex space-x-6">
                            {['details', 'comments', 'time'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`pb-3 text-sm font-medium capitalize ${activeTab === tab
                                        ? 'border-b-2 border-blue-600 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'details' && (
                        <div className="space-y-4">
                            {/* Subtasks */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                    <CheckSquare className="w-4 h-4 mr-2" />
                                    Subtasks ({task?.subtasks?.filter((s: any) => s.isCompleted).length || 0}/{task?.subtasks?.length || 0})
                                </h3>

                                <div className="space-y-2 mb-3">
                                    {task?.subtasks?.map((subtask: any, index: number) => (
                                        <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg group">
                                            <input
                                                type="checkbox"
                                                checked={subtask.isCompleted}
                                                onChange={() => toggleSubtaskMutation.mutate(index)}
                                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <span className={`text-sm flex-1 ${subtask.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                                {subtask.title}
                                            </span>
                                            {/* ✅ Delete button - only in edit mode */}
                                            {isEditing && (
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Delete subtask "${subtask.title}"?`)) {
                                                            deleteSubtaskMutation.mutate(index);
                                                        }
                                                    }}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete subtask"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleAddSubtask} className="flex space-x-2">
                                    <Input
                                        type="text"
                                        placeholder="Add subtask..."
                                        value={newSubtask}
                                        onChange={(e) => setNewSubtask(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button type="submit" variant="secondary" size="sm">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>

                            {/* Attachments */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                    <Paperclip className="w-4 h-4 mr-2" />
                                    Attachments ({task?.attachments?.length || 0})
                                </h3>

                                <div className="space-y-2 mb-3">
                                    {task?.attachments?.map((attachment: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center space-x-3 flex-1">
                                                <Paperclip className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-700 truncate">{attachment.filename}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {/* Download button - always visible */}
                                                <a
                                                    href={attachment.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                                {/* ✅ Delete button - only in edit mode */}
                                                {isEditing && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Delete attachment "${attachment.filename}"?`)) {
                                                                deleteAttachmentMutation.mutate(index);
                                                            }
                                                        }}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete attachment"
                                                        disabled={deleteAttachmentMutation.isPending}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex space-x-2">
                                    <input
                                        type="file"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleFileUpload}
                                        disabled={!selectedFile}
                                        isLoading={uploadAttachmentMutation.isPending}
                                    >
                                        <Upload className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'comments' && (
                        <div className="space-y-4">
                            <div className="max-h-96 overflow-y-auto space-y-3">
                                {task?.comments?.length > 0 ? (
                                    task.comments.map((comment: any, index: number) => (
                                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-xs font-medium text-blue-600">
                                                            {comment.createdBy?.name?.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">{comment.createdBy?.name}</span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(comment.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                {/* ✅ Delete button - only in edit mode */}
                                                {isEditing && (
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Delete this comment?')) {
                                                                deleteCommentMutation.mutate(index);
                                                            }
                                                        }}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete comment"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700">{comment.content}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">No comments yet</p>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleAddComment} className="flex space-x-2">
                                <Input
                                    type="text"
                                    placeholder="Add a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" variant="primary" size="sm" isLoading={addCommentMutation.isPending}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'time' && (
                        <div className="space-y-4">
                            {/* Log Time Form */}
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Log Time</h4>
                                <form onSubmit={handleLogTime} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Hours *
                                            </label>
                                            <Input
                                                type="number"
                                                step="0.25"
                                                min="0.25"
                                                max="24"
                                                required
                                                placeholder="e.g., 2.5"
                                                value={timeFormData.hours}
                                                onChange={(e) => setTimeFormData({ ...timeFormData, hours: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Date *
                                            </label>
                                            <Input
                                                type="date"
                                                required
                                                value={timeFormData.date}
                                                onChange={(e) => setTimeFormData({ ...timeFormData, date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            rows={2}
                                            placeholder="What did you work on?"
                                            value={timeFormData.description}
                                            onChange={(e) => setTimeFormData({ ...timeFormData, description: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        />
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <label className="text-xs font-medium text-gray-700">Billable:</label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                checked={timeFormData.billable === true}
                                                onChange={() => setTimeFormData({ ...timeFormData, billable: true })}
                                                className="w-3 h-3 text-blue-600"
                                            />
                                            <span className="ml-1.5 text-xs">Yes</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                checked={timeFormData.billable === false}
                                                onChange={() => setTimeFormData({ ...timeFormData, billable: false })}
                                                className="w-3 h-3 text-blue-600"
                                            />
                                            <span className="ml-1.5 text-xs">No</span>
                                        </label>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        className="w-full"
                                        isLoading={logTimeMutation.isPending}
                                    >
                                        <Clock className="w-3 h-3 mr-2" />
                                        Log Time
                                    </Button>
                                </form>
                            </div>

                            {/* Time Entries List */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                    Time Entries ({timeEntries?.length || 0})
                                </h4>

                                {timeLoading ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                    </div>
                                ) : timeEntries && timeEntries.length > 0 ? (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {timeEntries.map((entry: any) => (
                                            <div key={entry._id} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <span className="text-sm font-semibold text-blue-600">
                                                                {entry.hours}h
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(entry.date).toLocaleDateString()}
                                                            </span>
                                                            {entry.billable && (
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
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                {entry.description}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Logged by {entry.userId?.name}
                                                        </p>
                                                    </div>
                                                    {entry.status !== 'APPROVED' && (
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Delete this time entry?')) {
                                                                    deleteTimeMutation.mutate(entry._id);
                                                                }
                                                            }}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
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
                                    <div className="text-center py-8 text-gray-500">
                                        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">No time entries yet</p>
                                        <p className="text-xs mt-1">Log your first entry above</p>
                                    </div>
                                )}
                            </div>

                            {/* Time Summary */}
                            {timeEntries && timeEntries.length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Summary</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-blue-600">
                                                {timeEntries.reduce((sum: number, e: any) => sum + e.hours, 0).toFixed(1)}h
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">Total Hours</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-green-600">
                                                {timeEntries.filter((e: any) => e.billable).reduce((sum: number, e: any) => sum + e.hours, 0).toFixed(1)}h
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">Billable</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-purple-600">
                                                {timeEntries.filter((e: any) => e.status === 'APPROVED').reduce((sum: number, e: any) => sum + e.hours, 0).toFixed(1)}h
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">Approved</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Right Column - Metadata */}
                <div className="space-y-4">
                    {isEditing ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                                <select
                                    value={editData.status}
                                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="TODO">To Do</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="REVIEW">Review</option>
                                    <option value="DONE">Done</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                                <select
                                    value={editData.priority}
                                    onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                    onChange={(e) => {
                                        console.log('👤 Assignee changed to:', e.target.value);
                                        setEditData({ ...editData, assigneeId: e.target.value });
                                    }}
                                    disabled={membersLoading}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                >
                                    <option value="">Unassigned</option>
                                    {projectMembers?.map((member: any) => (
                                        <option key={member._id} value={member._id}>
                                            {member.name} ({member.role})
                                        </option>
                                    ))}
                                </select>
                                {membersLoading && (
                                    <p className="text-xs text-gray-500 mt-1">Loading members...</p>
                                )}
                                {!membersLoading && projectMembers?.length === 0 && (
                                    <p className="text-xs text-gray-500 mt-1">No members in this project</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                                <Input
                                    type="date"
                                    value={editData.dueDate}
                                    onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Status</label>
                                <Badge variant={getStatusColor(task?.status)} size="md">
                                    {task?.status?.replace('_', ' ')}
                                </Badge>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Priority</label>
                                <Badge variant={getPriorityColor(task?.priority)} size="md">
                                    {task?.priority}
                                </Badge>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 block mb-1 flex items-center">
                                    <User className="w-3 h-3 mr-1" />
                                    Assignee
                                </label>
                                {task?.assigneeId ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-medium text-blue-600">
                                                {task.assigneeId.name?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-700">{task.assigneeId.name}</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-500 italic">Unassigned</span>
                                )}
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 block mb-1 flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Due Date
                                </label>
                                <span className="text-sm text-gray-700">
                                    {task?.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                </span>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Project</label>
                                <span className="text-sm text-gray-700">{task?.projectId?.name}</span>
                            </div>
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
                                >
                                    Save Changes
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={() => {
                                        setIsEditing(false);
                                        // Reset form to original values
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
                                >
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <Button variant="secondary" className="w-full" onClick={() => setIsEditing(true)}>
                                Edit Task
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default TaskDetailModal;
