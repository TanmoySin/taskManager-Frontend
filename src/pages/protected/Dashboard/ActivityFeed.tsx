import { type FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Clock,
    CheckCircle,
    MessageSquare,
    UserPlus,
    Edit,
    Trash2,
    AlertCircle
} from 'lucide-react';
import { activityApi } from '../../../lib/api';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

interface ActivityFeedProps {
    projectId?: string;
    workspaceId?: string;
    limit?: number;
}

const ActivityFeed: FC<ActivityFeedProps> = ({ projectId, workspaceId, limit = 20 }) => {
    const { data, isLoading } = useQuery({
        queryKey: ['activity', { projectId, workspaceId, limit }],
        queryFn: async () => {
            if (projectId) {
                const response = await activityApi.getProject(projectId, limit);
                return response.data;
            }
            if (workspaceId) {
                const response = await activityApi.getWorkspace(workspaceId, limit);
                return response.data;
            }
            const response = await activityApi.getAll({ limit });
            return response.data.activities || response.data;
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const activities = Array.isArray(data) ? data : [];

    const getActionIcon = (action: string) => {
        const icons: Record<string, any> = {
            CREATED: CheckCircle,
            UPDATED: Edit,
            COMPLETED: CheckCircle,
            COMMENTED: MessageSquare,
            ASSIGNED: UserPlus,
            STATUS_CHANGED: AlertCircle,
            DELETED: Trash2,
        };
        return icons[action] || Clock;
    };

    const getActionColor = (action: string) => {
        const colors: Record<string, string> = {
            CREATED: 'text-green-600',
            UPDATED: 'text-blue-600',
            COMPLETED: 'text-green-600',
            COMMENTED: 'text-purple-600',
            ASSIGNED: 'text-orange-600',
            STATUS_CHANGED: 'text-yellow-600',
            DELETED: 'text-red-600',
        };
        return colors[action] || 'text-gray-600';
    };

    const getTimeAgo = (date: string) => {
        const now = new Date();
        const activityDate = new Date(date);
        const diffMs = now.getTime() - activityDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return activityDate.toLocaleDateString();
    };

    if (isLoading) {
        return (
            <Card padding="md">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
            </Card>
        );
    }

    return (
        <Card padding="none">
            <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Recent Activity
                </h3>
            </div>

            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {activities.length > 0 ? (
                    activities.map((activity: any) => {
                        const Icon = getActionIcon(activity.action);
                        const iconColor = getActionColor(activity.action);

                        return (
                            <div key={activity._id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start space-x-3">
                                    {/* Icon */}
                                    <div className={`${iconColor} mt-0.5`}>
                                        <Icon className="w-4 h-4" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900">{activity.message}</p>

                                        <div className="flex items-center space-x-3 mt-1">
                                            {/* User */}
                                            <span className="text-xs text-gray-500">
                                                {activity.userId?.name || 'Unknown'}
                                            </span>

                                            {/* Time */}
                                            <span className="text-xs text-gray-400">
                                                {getTimeAgo(activity.createdAt)}
                                            </span>

                                            {/* Badge for action type */}
                                            <Badge variant="default" size="sm">
                                                {activity.action.replace('_', ' ')}
                                            </Badge>
                                        </div>

                                        {/* Task/Project link */}
                                        {activity.taskId && (
                                            <a
                                                href={`/tasks/${activity.taskId._id || activity.taskId}`}
                                                className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block"
                                            >
                                                {activity.taskId.title || 'View task'}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No recent activity</p>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ActivityFeed;
