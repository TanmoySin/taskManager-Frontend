import { type FC, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Play, Square, TrendingUp } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { useMyTimeUtilization, useActiveTimer, useMyTimeLogs } from '../../../hooks/useAnalytics';
import api from '../../../lib/api';

const MyTimeWidget: FC = () => {
    const queryClient = useQueryClient();
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');

    const { data: timeData, isLoading: timeLoading } = useMyTimeUtilization();
    const { data: activeTimer, isLoading: timerLoading } = useActiveTimer();
    const { data: timeLogs } = useMyTimeLogs(5);

    const { data: myTasksResponse } = useQuery({
        queryKey: ['myActiveTasks'],
        queryFn: async () => {
            const response = await api.get('/tasks/my-tasks?status=TODO,IN_PROGRESS');
            return response.data;
        },
        staleTime: 30000,
    });

    const startTimerMutation = useMutation({
        mutationFn: (taskId: string) => api.post(`/time-tracking/tasks/${taskId}/timer/start`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
            queryClient.invalidateQueries({ queryKey: ['myTimeUtilization'] });
        },
    });

    const stopTimerMutation = useMutation({
        mutationFn: () => api.post(`/time-tracking/timer/stop`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeTimer'] });
            queryClient.invalidateQueries({ queryKey: ['myTimeUtilization'] });
        },
    });

    const activeTasks = Array.isArray(myTasksResponse?.tasks)
        ? myTasksResponse.tasks
        : Array.isArray(myTasksResponse)
            ? myTasksResponse
            : [];

    const todayHours = timeData?.todayHours || 0;
    const weekHours = timeData?.weekHours || 0;
    const utilization = timeData?.utilization || 0;
    const avgHoursPerDay = timeData?.averageHoursPerDay || 0;

    const hasActiveTimer = activeTimer?.isRunning || false;
    const activeTaskTitle = activeTimer?.taskId?.title || 'Unknown Task';
    const timerDuration = activeTimer?.duration || 0;

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    if (timeLoading || timerLoading) {
        return (
            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="p-4 space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card padding="none">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    ⏱️ My Time
                </h2>
            </div>

            <div className="p-4 space-y-3">
                {/* Active Timer */}
                {hasActiveTimer ? (
                    <div className="p-3 bg-orange-50 border-2 border-orange-300 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-semibold text-orange-700">TIMER RUNNING</span>
                            </div>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => stopTimerMutation.mutate()}
                                isLoading={stopTimerMutation.isPending}
                            >
                                <Square className="w-3 h-3 mr-1" />
                                Stop
                            </Button>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate mb-1">
                            {activeTaskTitle}
                        </p>
                        <p className="text-xl font-bold text-orange-600">
                            {formatDuration(timerDuration)}
                        </p>
                    </div>
                ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Start Timer</p>
                        <select
                            value={selectedTaskId}
                            onChange={(e) => setSelectedTaskId(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Select a task...</option>
                            {activeTasks.map((task: any) => (
                                <option key={task._id} value={task._id}>
                                    {task.title}
                                </option>
                            ))}
                        </select>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                                if (selectedTaskId) {
                                    startTimerMutation.mutate(selectedTaskId);
                                }
                            }}
                            isLoading={startTimerMutation.isPending}
                            disabled={!selectedTaskId}
                            disabledMessage="Please select a task first"
                            className="w-full"
                        >
                            <Play className="w-3 h-3 mr-1" />
                            Start Timer
                        </Button>
                    </div>
                )}

                {/* Time Stats */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600 mb-1">Today</p>
                        <p className="text-xl font-bold text-blue-600">
                            {todayHours.toFixed(1)}h
                        </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600 mb-1">This Week</p>
                        <p className="text-xl font-bold text-green-600">
                            {weekHours.toFixed(1)}h
                        </p>
                    </div>
                </div>

                {/* Utilization */}
                <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-medium text-gray-600">Utilization</span>
                        </div>
                        <Badge
                            variant={
                                utilization >= 80
                                    ? 'success'
                                    : utilization >= 50
                                        ? 'info'
                                        : 'default'
                            }
                            size="sm"
                        >
                            {utilization}%
                        </Badge>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${utilization >= 80
                                ? 'bg-green-500'
                                : utilization >= 50
                                    ? 'bg-blue-500'
                                    : 'bg-gray-400'
                                }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Average Hours */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Avg Hours/Day</span>
                    <span className="text-lg font-bold text-gray-900">
                        {avgHoursPerDay.toFixed(1)}h
                    </span>
                </div>

                {/* Recent Time Logs */}
                {timeLogs && timeLogs.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-2">Recent Logs</p>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                            {timeLogs.map((log: any) => (
                                <div
                                    key={log._id}
                                    className="p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-900 truncate">
                                                {log.taskId?.title || 'Unknown Task'}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {new Date(log.startTime).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <p className="text-xs font-bold text-blue-600">
                                                {(log.duration / 60).toFixed(1)}h
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default MyTimeWidget;
