import { type FC, useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { FolderKanban, Calendar, Star, Users, DollarSign, Tag, Sparkles } from 'lucide-react';
import { showToast } from '../../lib/toast';

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
        status: 'PLANNED',
        startDate: '',
        endDate: '',
        budget: '',
        currency: 'INR',
        color: '#ECFDF3',
        tags: '' as string,
    });

    // ✅ Fetch workspaces
    const { data: workspaces, isLoading: workspacesLoading } = useQuery({
        queryKey: ['workspaces'],
        queryFn: async () => {
            const response = await api.get('/workspaces');
            return response.data;
        },
        enabled: isOpen,
    });

    // ✅ Fetch project templates
    const { data: templatesData, isLoading: templatesLoading } = useQuery({
        queryKey: ['project-templates'],
        queryFn: async () => {
            const response = await api.get('/projects/templates');
            return response.data;
        },
        enabled: isOpen,
    });

    const templates = templatesData?.templates || [];

    // ✅ Create project mutation
    const createProjectMutation = useMutation({
        mutationFn: (data: any) => api.post('/projects', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            onClose();
            resetForm();
        },
        onError: (error: any) => {
            const errorMsg = error.response?.data?.error || 'Failed to create project';
            showToast.warning(errorMsg);
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
            status: 'PLANNED',
            startDate: '',
            endDate: '',
            budget: '',
            currency: 'INR',
            color: '#ECFDF3',
            tags: '',
        });
    };

    // ✅ Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            showToast.warning('Project name is required');
            return;
        }

        if (!formData.workspaceId) {
            showToast.warning('Please select a workspace');
            return;
        }

        // Date validation
        if (formData.startDate && formData.endDate) {
            if (new Date(formData.startDate) > new Date(formData.endDate)) {
                showToast.warning('End date must be after start date');
                return;
            }
        }

        const payload: any = {
            name: formData.name.trim(),
            description: formData.description.trim(),
            workspaceId: formData.workspaceId,
            type: formData.type,
            priority: formData.priority,
            status: formData.status,
            color: formData.color,
        };

        // Optional fields
        if (formData.startDate) payload.startDate = formData.startDate;
        if (formData.endDate) payload.endDate = formData.endDate;
        if (formData.budget) payload.budget = Number(formData.budget);
        if (formData.currency) payload.currency = formData.currency;
        if (formData.template) payload.template = formData.template;

        // Parse tags
        if (formData.tags.trim()) {
            payload.tags = formData.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
        }

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
            type: template.type || prev.type,
            name: prev.name || template.name || '',
            description: prev.description || template.description || '',
            color: template.color || prev.color,
        }));
    };

    // Color presets
    const colorPresets = [
        { name: 'Green', value: '#ECFDF3' },
        { name: 'Blue', value: '#EFF6FF' },
        { name: 'Purple', value: '#F5F3FF' },
        { name: 'Pink', value: '#FDF2F8' },
        { name: 'Yellow', value: '#FEFCE8' },
        { name: 'Orange', value: '#FFF7ED' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Project" size="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Project Icon Preview */}
                <div className="flex items-center justify-center mb-2">
                    <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300"
                        style={{ backgroundColor: formData.color || '#ECFDF3' }}
                    >
                        <FolderKanban className="w-10 h-10 text-green-700" />
                    </div>
                </div>

                {/* Template Selector */}
                {templates.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Sparkles className="w-4 h-4 mr-1.5 text-purple-500" />
                            Project Template
                        </label>
                        <select
                            value={formData.template}
                            onChange={(e) => handleTemplateSelect(e.target.value)}
                            disabled={templatesLoading}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                            <option value="">✨ Start from scratch</option>
                            {templates.map((tpl: any) => (
                                <option key={tpl.id} value={tpl.id}>
                                    {tpl.name} - {tpl.description}
                                </option>
                            ))}
                        </select>
                        {formData.template && (
                            <p className="mt-1.5 text-xs text-blue-600">
                                Template applied! You can customize the details below.
                            </p>
                        )}
                    </div>
                )}

                {/* Project Name */}
                <Input
                    label="Project Name"
                    type="text"
                    placeholder="e.g., Website Redesign, Mobile App"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={createProjectMutation.isPending}
                />

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea
                        placeholder="Brief description of the project goals and objectives..."
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        disabled={createProjectMutation.isPending}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100"
                    />
                </div>

                {/* Workspace */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <Users className="w-4 h-4 mr-1.5" />
                        Workspace <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                        required
                        value={formData.workspaceId}
                        onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })}
                        disabled={workspacesLoading || createProjectMutation.isPending}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                        <option value="">Select workspace</option>
                        {workspaces?.map((workspace: any) => {
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
                        Projects are created within workspaces for team collaboration
                    </p>
                </div>

                {/* Type, Priority & Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Project Type
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            disabled={createProjectMutation.isPending}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
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

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Star className="w-3.5 h-3.5 mr-1.5" />
                            Priority
                        </label>
                        <select
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            disabled={createProjectMutation.isPending}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Initial Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            disabled={createProjectMutation.isPending}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                        >
                            <option value="PLANNED">Planned</option>
                            <option value="ACTIVE">Active</option>
                            <option value="ON_HOLD">On Hold</option>
                        </select>
                    </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            Start Date
                        </label>
                        <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            disabled={createProjectMutation.isPending}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Calendar className="w-3.5 h-3.5 mr-1.5" />
                            End Date
                        </label>
                        <Input
                            type="date"
                            value={formData.endDate}
                            min={formData.startDate || undefined}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            disabled={createProjectMutation.isPending}
                        />
                    </div>
                </div>

                {/* Budget & Tags */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <DollarSign className="w-3.5 h-3.5 mr-1.5" />
                            Budget (Optional)
                        </label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                min="0"
                                step="1000"
                                placeholder="e.g., 100000"
                                value={formData.budget}
                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                disabled={createProjectMutation.isPending}
                                className="flex-1"
                            />
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                disabled={createProjectMutation.isPending}
                                className="w-20 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                            >
                                <option value="INR">INR</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Tag className="w-3.5 h-3.5 mr-1.5" />
                            Tags (Optional)
                        </label>
                        <Input
                            type="text"
                            placeholder="e.g., client-A, Q1, urgent"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                            disabled={createProjectMutation.isPending}
                        />
                        <p className="mt-1 text-xs text-gray-400">
                            Comma separated (e.g., "client-A, Q1, urgent")
                        </p>
                    </div>
                </div>

                {/* Color Picker */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Color
                    </label>
                    <div className="flex items-center gap-3">
                        {colorPresets.map((preset) => (
                            <button
                                key={preset.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, color: preset.value })}
                                disabled={createProjectMutation.isPending}
                                className={`w-10 h-10 rounded-lg border-2 transition-all ${formData.color === preset.value
                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                style={{ backgroundColor: preset.value }}
                                title={preset.name}
                            />
                        ))}
                        <input
                            type="color"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            disabled={createProjectMutation.isPending}
                            className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer"
                            title="Custom color"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {createProjectMutation.isError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
                        <span className="mr-2">⚠️</span>
                        Failed to create project. Please check your inputs and try again.
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={createProjectMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={createProjectMutation.isPending}
                        disabled={!formData.name.trim() || !formData.workspaceId}
                    >
                        {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default CreateProjectModal;
