import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Bell, Check, CheckCheck, Trash2, Clock } from 'lucide-react';

export default function Notifications() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await api.get('/notifications');
            return response.data;
        },
    });

    // ✅ HANDLE BOTH RESPONSE FORMATS
    const notifications = Array.isArray(data)
        ? data
        : data?.notifications || [];

    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => api.patch('/notifications/mark-all-read'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const deleteNotificationMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/notifications/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

    const getNotificationIcon = (type: string) => {
        const icons: any = {
            TASK_ASSIGNED: '📋',
            TASK_UPDATED: '✏️',
            COMMENT_ADDED: '💬',
            MENTION: '@',
            DUE_DATE_REMINDER: '⏰',
            DEADLINE: '🚨', // ✅ ADD THIS
        };
        return icons[type] || '🔔';
    };

    const getTimeAgo = (date: string) => {
        const now = new Date();
        const notificationDate = new Date(date);
        const diffMs = now.getTime() - notificationDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return notificationDate.toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={() => markAllReadMutation.mutate()}
                        isLoading={markAllReadMutation.isPending}
                    >
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Mark All Read
                    </Button>
                )}
            </div>

            {/* Notifications List */}
            {isLoading ? (
                <Card padding="lg">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                </Card>
            ) : notifications && notifications.length > 0 ? (
                <div className="space-y-2">
                    {notifications.map((notification: any) => (
                        <Card
                            key={notification._id}
                            padding="md"
                            className={`transition-all ${notification.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>

                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <h3 className="text-sm font-semibold text-gray-900">
                                                {notification.title}
                                            </h3>
                                            {!notification.isRead && (
                                                <Badge variant="info" size="sm">New</Badge>
                                            )}
                                        </div>

                                        {notification.message && (
                                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                                        )}

                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                            <div className="flex items-center">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {getTimeAgo(notification.createdAt)}
                                            </div>
                                            {notification.taskId && (
                                                <a
                                                    href={`/tasks/${notification.taskId._id || notification.taskId}`}
                                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    View Task
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {!notification.isRead && (
                                        <button
                                            onClick={() => markAsReadMutation.mutate(notification._id)}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Mark as read"
                                        >
                                            <Check className="w-4 h-4 text-gray-600" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteNotificationMutation.mutate(notification._id)}
                                        className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card padding="lg">
                    <div className="text-center py-12">
                        <Bell className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No notifications yet</p>
                    </div>
                </Card>
            )}
        </div>
    );
}
