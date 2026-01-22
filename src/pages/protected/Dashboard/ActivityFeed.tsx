import { type FC } from 'react';
import { Activity } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { useActivityFeed } from '../../../hooks/useAnalytics';

interface ActivityFeedProps {
    workspaceId?: string;
    limit?: number;
}

const ActivityFeed: FC<ActivityFeedProps> = ({ workspaceId, limit = 15 }) => {
    const { data: activities, isLoading } = useActivityFeed(workspaceId, limit);

    const getActionIcon = (action: string) => {
        const icons: Record<string, any> = {
            CREATED: '➕',
            UPDATED: '✏️',
            DELETED: '🗑️',
            COMMENTED: '💬',
            ASSIGNED: '👤',
            STATUS_CHANGED: '🔄',
            COMPLETED: '✅',
        };
        return icons[action] || '📌';
    };

    const getActionColor = (action: string) => {
        const colors: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
            CREATED: 'success',
            UPDATED: 'info',
            DELETED: 'danger',
            COMMENTED: 'info',
            ASSIGNED: 'info',
            STATUS_CHANGED: 'warning',
            COMPLETED: 'success',
        };
        return colors[action] || 'default';
    };

    const formatTimeAgo = (date: string) => {
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
        return activityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (isLoading) {
        return (
            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                </div>
            </Card>
        );
    }

    if (!activities || activities.length === 0) {
        return (
            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        📋 Recent Activity
                    </h2>
                </div>
                <div className="p-8 text-center">
                    <p className="text-sm text-gray-500">No recent activity</p>
                </div>
            </Card>
        );
    }

    return (
        <Card padding="none">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    📋 Recent Activity
                </h2>
                <Badge variant="default" size="sm">
                    {activities.length}
                </Badge>
            </div>

            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {activities.map((activity: any) => (
                    <div
                        key={activity._id}
                        className="p-3 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                                {getActionIcon(activity.action)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <p className="text-sm text-gray-900 line-clamp-2">
                                        <span className="font-medium">{activity.userName || 'Someone'}</span>
                                        {' '}
                                        <span className="text-gray-600">{activity.description || 'performed an action'}</span>
                                    </p>
                                    <Badge variant={getActionColor(activity.action)} size="sm">
                                        {activity.action}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>{formatTimeAgo(activity.createdAt)}</span>
                                    {activity.entityType && (
                                        <>
                                            <span>•</span>
                                            <span className="capitalize">{activity.entityType.toLowerCase()}</span>
                                        </>
                                    )}
                                    {activity.projectName && (
                                        <>
                                            <span>•</span>
                                            <span className="truncate max-w-[150px]">{activity.projectName}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default ActivityFeed;
