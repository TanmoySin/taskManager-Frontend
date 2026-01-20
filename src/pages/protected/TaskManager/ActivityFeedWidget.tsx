import { type FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { activityApi } from '../../../lib/api';

interface ActivityFeedWidgetProps {
    taskId: string;
}

const ActivityFeedWidget: FC<ActivityFeedWidgetProps> = ({ taskId }) => {
    const { data: activities, isLoading } = useQuery({
        queryKey: ['taskActivity', taskId],
        queryFn: async () => {
            const response = await activityApi.getTask(taskId);
            return response.data;
        },
    });

    const getTimeAgo = (date: string) => {
        const now = new Date();
        const activityDate = new Date(date);
        const diffMs = now.getTime() - activityDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return activityDate.toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {activities && activities.length > 0 ? (
                activities.map((activity: any) => (
                    <div key={activity._id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-blue-600">
                                {activity.userId?.name?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-900">{activity.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {getTimeAgo(activity.createdAt)}
                            </p>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-12 text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No activity yet</p>
                </div>
            )}
        </div>
    );
};

export default ActivityFeedWidget;
