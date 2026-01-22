import { type FC, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Play, Square, Clock } from 'lucide-react';
import api from '../../lib/api';
import { useActiveTimer } from '../../hooks/useAnalytics';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface QuickTimerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const QuickTimerModal: FC<QuickTimerModalProps> = ({ isOpen, onClose }) => {
    const queryClient = useQueryClient();
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');
    const { data: activeTimer } = useActiveTimer();

    // Fetch user's active tasks
    const { data: myTasks } = useQuery({
        queryKey: ['myActiveTasks'],
        queryFn: async () => {
            const response = await api.get('/tasks/my-tasks?status=TODO,IN_PROGRESS');
            return response.data;
        },
        enabled: isOpen,
    });

    const activeTasks = Array.isArray(myTasks) ? myTasks : [];
    const hasActiveTimer = activeTimer?.isRunning || false;
    const activeTaskTitle = activeTimer?.taskId?.title || 'Unknown Task';
    const timerDuration = activeTimer?.duration || 0;

    const startTimerMutation = useMutation({
        mutationFn: (taskId: string) => api.post(`/time-tracking/tasks/${taskId}/timer/start`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
            queryClient.invalidateQueries({ queryKey: ['myTimeUtilization'] });
            onClose();
        },
    });

    const stopTimerMutation = useMutation({
        mutationFn: () => api.post('/time-tracking/timer/stop'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
            queryClient.invalidateQueries({ queryKey: ['myTimeUtilization'] });
            onClose();
        },
    });

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Quick Timer</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-4">
                        {hasActiveTimer ? (
                            /* Active Timer */
                            <div className="p-4 bg-orange-50 border-2 border-orange-300 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-semibold text-orange-700">
                                            TIMER RUNNING
                                        </span>
                                    </div>
                                    <Badge variant="warning" size="sm">
                                        Active
                                    </Badge>
                                </div>
                                <p className="font-medium text-gray-900 mb-2">{activeTaskTitle}</p>
                                <p className="text-3xl font-bold text-orange-600 mb-4">
                                    {formatDuration(timerDuration)}
                                </p>
                                <Button
                                    variant="danger"
                                    size="md"
                                    onClick={() => stopTimerMutation.mutate()}
                                    isLoading={stopTimerMutation.isPending}
                                    className="w-full"
                                >
                                    <Square className="w-4 h-4 mr-2" />
                                    Stop Timer
                                </Button>
                            </div>
                        ) : (
                            /* Start Timer */
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select a task to track time:
                                    </label>
                                    <select
                                        value={selectedTaskId}
                                        onChange={(e) => setSelectedTaskId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Choose a task...</option>
                                        {activeTasks.map((task: any) => (
                                            <option key={task._id} value={task._id}>
                                                {task.title} - {task.projectId?.name || 'No project'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={() => {
                                        if (selectedTaskId) {
                                            startTimerMutation.mutate(selectedTaskId);
                                        }
                                    }}
                                    isLoading={startTimerMutation.isPending}
                                    disabled={!selectedTaskId}
                                    className="w-full"
                                >
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Timer
                                </Button>

                                {activeTasks.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center">
                                        No active tasks available. Create a task first.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default QuickTimerModal;
