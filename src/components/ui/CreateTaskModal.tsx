import { type FC, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import { Plus, Calendar, User } from 'lucide-react';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultProjectId?: string;
}

const CreateTaskModal: FC<CreateTaskModalProps> = ({
    isOpen,
    onClose,
    defaultProjectId,
}) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        projectId: defaultProjectId || '',
        priority: 'MEDIUM',
        assigneeId: '',
        status: 'TODO',
        startDate: '',
        dueDate: '',
        labels: '' as string,
    });

    useEffect(() => {
        if (defaultProjectId) {
            setFormData((prev) => ({ ...prev, projectId: defaultProjectId }));
        }
    }, [defaultProjectId]);

    const { data: projectsData, isLoading: projectsLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await api.get('/projects');
            return response.data;
        },
        enabled: isOpen,
    });

    const projects = Array.isArray(projectsData)
        ? projectsData
        : projectsData?.projects || [];

    console.log('📋 Projects data:', {
        projectsData,
        projects,
        isLoading: projectsLoading,
        projectsCount: projects?.length,
    });

    const { data: projectMembers, isLoading: membersLoading } = useQuery({
        queryKey: ['projectMembers', formData.projectId],
        queryFn: async () => {
            if (!formData.projectId) return [];
            const response = await api.get(`/projects/${formData.projectId}/members`);
            return response.data;
        },
        enabled: !!formData.projectId && isOpen,
    });

    const createTaskMutation = useMutation({
        mutationFn: (data: any) => api.post('/tasks', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
            queryClient.invalidateQueries({ queryKey: ['myTasks'] });
            onClose();
            resetForm();
        },
        onError: (error: any) => {
            console.error('Create task error:', error.response?.data || error.message);
            alert(
                'Failed to create task: ' +
                (error.response?.data?.error || error.message),
            );
        },
    });

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            projectId: defaultProjectId || '',
            priority: 'MEDIUM',
            assigneeId: '',
            status: 'TODO',
            startDate: '',
            dueDate: '',
            labels: '',
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            title: formData.title,
            description: formData.description,
            projectId: formData.projectId,
            priority: formData.priority,
            assigneeId: formData.assigneeId || undefined,
            status: formData.status,
            startDate: formData.startDate || undefined,
            dueDate: formData.dueDate || undefined,
            labels: formData.labels
                ? formData.labels
                    .split(',')
                    .map((l) => l.trim())
                    .filter(Boolean)
                : [],
        };

        createTaskMutation.mutate(payload);
    };

    const handleProjectChange = (projectId: string) => {
        setFormData((prev) => ({
            ...prev,
            projectId,
            assigneeId: '',
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Task" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Plus className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <Input
                    label="Task Title"
                    type="text"
                    placeholder="e.g., Design landing page, Fix login bug"
                    required
                    value={formData.title}
                    onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                    }
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description
                    </label>
                    <textarea
                        placeholder="What needs to be done?"
                        rows={3}
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                        }
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Project <span className="text-red-500">*</span>
                    </label>
                    <select
                        required
                        value={formData.projectId}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        disabled={!!defaultProjectId || projectsLoading}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                        <option value="">
                            {projectsLoading ? 'Loading projects...' : 'Select project'}
                        </option>
                        {!projectsLoading && projects && projects.length > 0 ? (
                            projects.map((project: any) => (
                                <option key={project._id} value={project._id}>
                                    {project.name}
                                </option>
                            ))
                        ) : !projectsLoading && projects.length === 0 ? (
                            <option value="" disabled>
                                No projects available. Create a project first.
                            </option>
                        ) : null}
                    </select>
                    {defaultProjectId && (
                        <p className="text-xs text-blue-600 mt-1">
                            ✓ Project pre-selected from current view
                        </p>
                    )}
                    {!defaultProjectId && projects.length === 0 && !projectsLoading && (
                        <p className="text-xs text-red-600 mt-1">
                            ⚠ You need to create a project before creating tasks
                        </p>
                    )}
                </div>


                {/* Assignee */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                        <User className="w-3.5 h-3.5 mr-1.5" />
                        Assign To
                    </label>
                    <select
                        value={formData.assigneeId}
                        onChange={(e) =>
                            setFormData({ ...formData, assigneeId: e.target.value })
                        }
                        disabled={!formData.projectId || membersLoading}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                        <option value="">
                            {!formData.projectId
                                ? 'Select project first'
                                : membersLoading
                                    ? 'Loading members...'
                                    : 'Assign to me (default)'}
                        </option>
                        {projectMembers?.map((member: any) => (
                            <option key={member._id} value={member._id}>
                                {member.name} ({member.email}) - {member.role}
                            </option>
                        ))}
                    </select>
                    {formData.projectId && projectMembers?.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                            No members in this project yet. Add members first.
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Priority
                        </label>
                        <select
                            value={formData.priority}
                            onChange={(e) =>
                                setFormData({ ...formData, priority: e.target.value })
                            }
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) =>
                                setFormData({ ...formData, status: e.target.value })
                            }
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="REVIEW">Review</option>
                            <option value="DONE">Done</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            Start Date
                        </label>
                        <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) =>
                                setFormData({ ...formData, startDate: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            Due Date
                        </label>
                        <Input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) =>
                                setFormData({ ...formData, dueDate: e.target.value })
                            }
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Labels
                    </label>
                    <Input
                        type="text"
                        placeholder="e.g., frontend, bug, urgent"
                        value={formData.labels}
                        onChange={(e) =>
                            setFormData({ ...formData, labels: e.target.value })
                        }
                    />
                </div>

                {createTaskMutation.isError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        Failed to create task. Please try again.
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={createTaskMutation.isPending}
                        disabled={!formData.projectId}
                    >
                        Create Task
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateTaskModal;
