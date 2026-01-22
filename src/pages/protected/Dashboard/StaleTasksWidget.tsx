import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { useStaleTasks } from '../../../hooks/useAnalytics';

interface StaleTasksWidgetProps {
    workspaceId?: string;
}

const StaleTasksWidget: FC<StaleTasksWidgetProps> = ({ workspaceId }) => {
    const { data, isLoading } = useStaleTasks(workspaceId);

    if (isLoading) {
        return (
            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="p-4">
                    <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </Card>
        );
    }

    if (!data) {
        return null;
    }

    const sevenDaysTasks = data.stale7Days || [];
    const fourteenDaysTasks = data.stale14Days || [];
    const thirtyDaysTasks = data.stale30Days || [];

    const totalStale = sevenDaysTasks.length + fourteenDaysTasks.length + thirtyDaysTasks.length;

    if (totalStale === 0) {
        return (
            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        🕸️ Stale Tasks
                    </h2>
                </div>
                <div className="p-4 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-50 rounded-full mb-2">
                        <span className="text-2xl">✅</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">No stale tasks!</p>
                    <p className="text-xs text-gray-500 mt-1">All tasks are being actively worked on.</p>
                </div>
            </Card>
        );
    }

    const categories = [
        {
            days: '7+ days',
            tasks: sevenDaysTasks,
            count: sevenDaysTasks.length,
            color: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
            textColor: 'text-yellow-700',
            badge: 'warning' as const,
        },
        {
            days: '14+ days',
            tasks: fourteenDaysTasks,
            count: fourteenDaysTasks.length,
            color: 'bg-orange-50',
            borderColor: 'border-orange-200',
            textColor: 'text-orange-700',
            badge: 'warning' as const,
        },
        {
            days: '30+ days',
            tasks: thirtyDaysTasks,
            count: thirtyDaysTasks.length,
            color: 'bg-red-50',
            borderColor: 'border-red-200',
            textColor: 'text-red-700',
            badge: 'danger' as const,
        },
    ];

    return (
        <Card padding="none">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    🕸️ Stale Tasks
                </h2>
                <Badge variant="warning" size="sm">
                    {totalStale} total
                </Badge>
            </div>

            <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {categories.map((category) => (
                        <div
                            key={category.days}
                            className={`border ${category.borderColor} rounded-lg overflow-hidden ${category.color}`}
                        >
                            <div className="px-3 py-2 border-b border-current border-opacity-20 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <AlertTriangle className={`w-4 h-4 ${category.textColor}`} />
                                    <h3 className={`font-semibold text-sm ${category.textColor}`}>
                                        {category.days}
                                    </h3>
                                </div>
                                <Badge variant={category.badge} size="sm">
                                    {category.count}
                                </Badge>
                            </div>

                            <div className="p-2">
                                {category.tasks.length > 0 ? (
                                    <div className="space-y-1.5">
                                        {category.tasks.slice(0, 2).map((task: any) => (
                                            <Link
                                                key={task._id}
                                                to="/my-tasks"
                                                className="block p-2 bg-white rounded border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                                            >
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {task.title}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-0.5 truncate">
                                                    {task.projectName || 'No project'}
                                                </p>
                                            </Link>
                                        ))}
                                        {category.tasks.length > 2 && (
                                            <p className="text-xs text-gray-500 text-center py-1 font-medium">
                                                +{category.tasks.length - 2} more
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 italic text-center py-2">
                                        None
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

export default StaleTasksWidget;
