import { type FC, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { FolderKanban, Calendar, Star } from 'lucide-react';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateProjectModal: FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        workspaceId: '',
        type: 'Web Development',
        template: '',
        priority: 'Medium',
        startDate: '',
        endDate: '',
        budget: '',
        currency: 'INR',
        color: '#ECFDF3',
        tags: '' as string,
    });

    const { data: workspaces } = useQuery({
        queryKey: ['workspaces'],
        queryFn: async () => {
            const response = await api.get('/workspaces');
            return response.data;
        },
    });

    const { data: templatesData } = useQuery({
        queryKey: ['project-templates'],
        queryFn: async () => {
            const response = await api.get('/projects/templates');
            return response.data; // { templates }
        },
    });

    const templates = templatesData?.templates || [];

    const createProjectMutation = useMutation({
        mutationFn: (data: any) => api.post('/projects', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            onClose();
            resetForm();
        },
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            workspaceId: '',
            type: 'Web Development',
            template: '',
            priority: 'Medium',
            startDate: '',
            endDate: '',
            budget: '',
            currency: 'INR',
            color: '#ECFDF3',
            tags: '',
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            ...formData,
            budget: formData.budget ? Number(formData.budget) : undefined,
            tags: formData.tags
                ? formData.tags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                : [],
        };

        createProjectMutation.mutate(payload);
    };

    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find((t: any) => t.id === templateId);
        if (!template) {
            setFormData((prev) => ({ ...prev, template: '', type: 'Other' }));
            return;
        }
        setFormData((prev) => ({
            ...prev,
            template: template.id,
            type: template.type,
            name: prev.name || template.name,
            description: prev.description || template.description,
            color: template.color || prev.color,
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create Project" size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-center mb-4">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: formData.color || '#ECFDF3' }}
                    >
                        <FolderKanban className="w-8 h-8 text-green-700" />
                    </div>
                </div>

                {/* Template selector */}
                {templates.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Project Template
                        </label>
                        <select
                            value={formData.template}
                            onChange={(e) => handleTemplateSelect(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Start from scratch</option>
                            {templates.map((tpl: any) => (
                                <option key={tpl.id} value={tpl.id}>
                                    {tpl.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <Input
                    label="Project Name"
                    type="text"
                    placeholder="e.g., Website Redesign, Mobile App"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Description
                    </label>
                    <textarea
                        placeholder="Brief description of the project..."
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

                {/* Workspace */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Workspace <span className="text-red-500">*</span>
                    </label>
                    <select
                        required
                        value={formData.workspaceId}
                        onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Select workspace</option>
                        {workspaces?.map((workspace: any) => {
                            // ✅ Show workspace role if available
                            const roleInfo = workspace.userWorkspaceRole
                                ? ` (${workspace.userWorkspaceRole})`
                                : '';
                            return (
                                <option key={workspace._id} value={workspace._id}>
                                    {workspace.name}{roleInfo}
                                </option>
                            );
                        })}
                    </select>
                    <p className="mt-1.5 text-xs text-gray-500">
                        You can only create projects in workspaces where you're an Administrator or Manager
                    </p>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            Start Date
                        </label>
                        <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            End Date
                        </label>
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
                        <p className="mt-1 text-[11px] text-gray-400">
                            Comma separated, e.g. "clientA, Q1, urgent"
                        </p>
                    </div>
                </div>

                {createProjectMutation.isError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        Failed to create project. Please try again.
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" isLoading={createProjectMutation.isPending}>
                        Create Project
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateProjectModal;
