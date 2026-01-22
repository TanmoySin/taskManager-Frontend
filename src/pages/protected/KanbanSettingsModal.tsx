import { type FC, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Settings, Save, RotateCcw, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

interface KanbanSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    config?: any;
}

const KanbanSettingsModal: FC<KanbanSettingsModalProps> = ({ isOpen, onClose, config }) => {
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        wipLimits: {
            BACKLOG: 0,
            TODO: 5,
            IN_PROGRESS: 3,
            BLOCKED: 2,
            REVIEW: 3,
            DONE: 0,
        },
        columnVisibility: {
            BACKLOG: true,
            TODO: true,
            IN_PROGRESS: true,
            BLOCKED: true,
            REVIEW: true,
            DONE: true,
        },
        defaultView: 'standard',
        autoRefresh: true,
        refreshInterval: 30,
    });

    // ✅ Load config when modal opens
    useEffect(() => {
        if (config) {
            setFormData({
                wipLimits: config.wipLimits || formData.wipLimits,
                columnVisibility: config.columnVisibility || formData.columnVisibility,
                defaultView: config.defaultView || 'standard',
                autoRefresh: config.autoRefresh ?? true,
                refreshInterval: config.refreshInterval || 30,
            });
        }
    }, [config]);

    // ✅ Update config mutation
    const updateConfigMutation = useMutation({
        mutationFn: (data: any) => api.patch('/kanban/config', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kanbanConfig'] });
            queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] });
            onClose();
        },
        onError: (error: any) => {
            alert('Failed to update settings: ' + (error.response?.data?.error || error.message));
        },
    });

    // ✅ Reset config mutation
    const resetConfigMutation = useMutation({
        mutationFn: () => api.post('/kanban/config/reset'),
        onSuccess: (data) => {
            setFormData({
                wipLimits: data.data.wipLimits,
                columnVisibility: data.data.columnVisibility,
                defaultView: data.data.defaultView,
                autoRefresh: data.data.autoRefresh,
                refreshInterval: data.data.refreshInterval,
            });
            queryClient.invalidateQueries({ queryKey: ['kanbanConfig'] });
            queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] });
        },
        onError: (error: any) => {
            alert('Failed to reset settings: ' + (error.response?.data?.error || error.message));
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateConfigMutation.mutate(formData);
    };

    const handleReset = () => {
        if (confirm('Reset all Kanban settings to defaults?')) {
            resetConfigMutation.mutate();
        }
    };

    const columns = [
        { id: 'BACKLOG', name: 'Backlog', description: 'Tasks not yet started' },
        { id: 'TODO', name: 'To Do', description: 'Ready to be worked on' },
        { id: 'IN_PROGRESS', name: 'In Progress', description: 'Currently being worked on' },
        { id: 'BLOCKED', name: 'Blocked', description: 'Tasks with blockers' },
        { id: 'REVIEW', name: 'Review', description: 'Awaiting review' },
        { id: 'DONE', name: 'Done', description: 'Completed tasks' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Kanban Board Settings" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Settings Icon */}
                <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Settings className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                {/* WIP Limits Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                                Work In Progress (WIP) Limits
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Set maximum number of tasks allowed in each column (0 = no limit)
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {columns.map((column) => (
                            <div
                                key={column.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex-1">
                                    <label className="text-sm font-medium text-gray-700">
                                        {column.name}
                                    </label>
                                    <p className="text-xs text-gray-500">{column.description}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={formData.wipLimits[column.id as keyof typeof formData.wipLimits]}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                wipLimits: {
                                                    ...formData.wipLimits,
                                                    [column.id]: Number(e.target.value),
                                                },
                                            })
                                        }
                                        className="w-20 text-center"
                                    />
                                    {formData.wipLimits[column.id as keyof typeof formData.wipLimits] > 0 ? (
                                        <Badge variant="info" size="sm">
                                            Enabled
                                        </Badge>
                                    ) : (
                                        <Badge variant="default" size="sm">
                                            No Limit
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-yellow-800">
                            WIP limits help maintain focus and prevent bottlenecks. You'll be warned when
                            moving tasks would exceed the limit.
                        </p>
                    </div>
                </div>

                {/* Column Visibility */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Column Visibility</h3>
                    <p className="text-xs text-gray-500 mb-3">Show or hide columns on the board</p>

                    <div className="grid grid-cols-2 gap-3">
                        {columns.map((column) => (
                            <label
                                key={column.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {formData.columnVisibility[
                                        column.id as keyof typeof formData.columnVisibility
                                    ] ? (
                                        <Eye className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <EyeOff className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className="text-sm font-medium text-gray-700">
                                        {column.name}
                                    </span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={
                                        formData.columnVisibility[
                                        column.id as keyof typeof formData.columnVisibility
                                        ]
                                    }
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            columnVisibility: {
                                                ...formData.columnVisibility,
                                                [column.id]: e.target.checked,
                                            },
                                        })
                                    }
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                            </label>
                        ))}
                    </div>
                </div>

                {/* Default View */}
                <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Default View Mode
                    </label>
                    <select
                        value={formData.defaultView}
                        onChange={(e) => setFormData({ ...formData, defaultView: e.target.value })}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="standard">Standard View</option>
                        <option value="swimlane-assignee">Swimlane by Assignee</option>
                        <option value="swimlane-priority">Swimlane by Priority</option>
                        <option value="swimlane-project">Swimlane by Project</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Choose how tasks are organized on the board
                    </p>
                </div>

                {/* Auto Refresh */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700 block">
                            Auto Refresh Board
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                            Automatically refresh board data every {formData.refreshInterval} seconds
                        </p>
                    </div>
                    <input
                        type="checkbox"
                        checked={formData.autoRefresh}
                        onChange={(e) => setFormData({ ...formData, autoRefresh: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {formData.autoRefresh && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Refresh Interval (seconds)
                        </label>
                        <Input
                            type="number"
                            min="10"
                            max="300"
                            value={formData.refreshInterval}
                            onChange={(e) =>
                                setFormData({ ...formData, refreshInterval: Number(e.target.value) })
                            }
                        />
                    </div>
                )}

                {/* Error Message */}
                {updateConfigMutation.isError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Failed to save settings. Please try again.
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleReset}
                        disabled={resetConfigMutation.isPending}
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset to Defaults
                    </Button>

                    <div className="flex space-x-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={updateConfigMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={updateConfigMutation.isPending}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Settings
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default KanbanSettingsModal;
