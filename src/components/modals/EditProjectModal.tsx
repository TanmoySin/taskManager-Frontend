import { type FC, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Star } from 'lucide-react';

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
}

const EditProjectModal: FC<EditProjectModalProps> = ({ isOpen, onClose, project }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'ACTIVE',
        type: 'Web Development',
        priority: 'Medium',
        startDate: '',
        endDate: '',
        budget: '',
        currency: 'USD',
        tags: '',
    });

    useEffect(() => {
        if (project) {
            setFormData({
                name: project.name || '',
                description: project.description || '',
                status: project.status || 'ACTIVE',
                type: project.type || 'Web Development',
                priority: project.priority || 'Medium',
                startDate: project.startDate
                    ? new Date(project.startDate).toISOString().split('T')[0]
                    : '',
                endDate: project.endDate
                    ? new Date(project.endDate).toISOString().split('T')[0]
                    : '',
                budget: project.budget != null ? String(project.budget) : '',
                currency: project.currency || 'USD',
                tags: Array.isArray(project.tags) ? project.tags.join(', ') : '',
            });
        }
    }, [project]);

    const updateProjectMutation = useMutation({
        mutationFn: (data: any) => {
            if (!project?.canManage) {
                throw new Error("You don't have permission to edit this project");
            }
            return api.patch(`/projects/${project._id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', project._id] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            onClose();
        },
        onError: (error: any) => {
            alert('Failed to update: ' + (error.response?.data?.error || error.message));
        },
    });


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('Project name is required');
            return;
        }

        if (formData.startDate && formData.endDate) {
            if (new Date(formData.startDate) > new Date(formData.endDate)) {
                alert('End date must be after start date');
                return;
            }
        }

        const payload = {
            name: formData.name,
            description: formData.description,
            status: formData.status,
            type: formData.type,
            priority: formData.priority,
            startDate: formData.startDate || undefined,
            endDate: formData.endDate || undefined,
            budget: formData.budget ? Number(formData.budget) : undefined,
            currency: formData.currency,
            tags: formData.tags
                ? formData.tags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                : [],
        };

        updateProjectMutation.mutate(payload);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Project" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Project Name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                    <textarea
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                </div>

                {/* Type & Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Project Type
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="Web Development">Web Development</option>
                            <option value="Mobile App">Mobile App</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Design">Design</option>
                            <option value="Data Science">Data Science</option>
                            <option value="DevOps">DevOps</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                            <Star className="w-3.5 h-3.5 mr-1.5" />
                            Priority
                        </label>
                        <select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="PLANNED">Planned</option>
                        <option value="ACTIVE">Active</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                        <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                        <Input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        />
                    </div>
                </div>

                {/* Budget & Tags */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Budget
                        </label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                min="0"
                                placeholder="e.g., 10000"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                            />
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className="px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="USD">USD</option>
                                <option value="INR">INR</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Tags
                        </label>
                        <Input
                            type="text"
                            placeholder="e.g., clientA, Q1, urgent"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" isLoading={updateProjectMutation.isPending}>
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default EditProjectModal;
