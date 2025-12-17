// components/time/TimerWidget.tsx (NEW FILE)
import { type FC, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Square, X } from 'lucide-react';
import Button from './ui/Button';

const TimerWidget: FC = () => {
    const queryClient = useQueryClient();
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Get running timer
    const { data: runningTimer } = useQuery({
        queryKey: ['runningTimer'],
        queryFn: async () => {
            const response = await api.get('/time-tracking/timer/current');
            return response.data.runningTimer;
        },
        refetchInterval: 5000, // Poll every 5 seconds
    });

    // Stop timer mutation
    const stopTimerMutation = useMutation({
        mutationFn: (data: { description?: string; isBillable: boolean }) =>
            api.post('/time-tracking/timer/stop', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['runningTimer'] });
            queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
            setElapsedSeconds(0);
        },
    });

    // Cancel timer mutation
    const cancelTimerMutation = useMutation({
        mutationFn: () => api.delete('/time-tracking/timer/cancel'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['runningTimer'] });
            setElapsedSeconds(0);
        },
    });

    // Update elapsed time
    useEffect(() => {
        if (!runningTimer) {
            setElapsedSeconds(0);
            return;
        }

        const startTime = new Date(runningTimer.startTime).getTime();
        const updateElapsed = () => {
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            setElapsedSeconds(elapsed);
        };

        updateElapsed();
        const interval = setInterval(updateElapsed, 1000);
        return () => clearInterval(interval);
    }, [runningTimer]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!runningTimer) return null;

    return (
        <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 z-50">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-gray-900">Timer Running</span>
                </div>
                <button
                    onClick={() => cancelTimerMutation.mutate()}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Cancel timer"
                >
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            <div className="mb-3">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                    {formatTime(elapsedSeconds)}
                </div>
                <div className="text-sm text-gray-600 line-clamp-1">
                    {runningTimer.task?.title || 'Unknown Task'}
                </div>
                <div className="text-xs text-gray-500">
                    {runningTimer.project?.name || 'Unknown Project'}
                </div>
            </div>

            <Button
                variant="danger"
                size="sm"
                className="w-full"
                onClick={() => stopTimerMutation.mutate({ isBillable: true })}
                isLoading={stopTimerMutation.isPending}
            >
                <Square className="w-3 h-3 mr-2" />
                Stop & Log Time
            </Button>
        </div>
    );
};

export default TimerWidget;
