import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Calendar, Clock } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

interface Task {
    _id: string;
    title: string;
    assigneeName: string;
    projectName: string;
    priority: string;
    daysOverdue?: number;
    dueDate?: string;
}

interface AlertsWidgetProps {
    data: {
        overdue: Task[];
        dueToday: Task[];
        dueThisWeek: Task[];
        counts: {
            overdue: number;
            dueToday: number;
            dueThisWeek: number;
        };
    };
    isLoading?: boolean;
}

const AlertsWidget: FC<AlertsWidgetProps> = ({ data, isLoading }) => {
    if (isLoading) {
        return (
            <Card padding="md">
                <div className="animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </Card>
        );
    }

    const sections = [
        {
            title: 'Overdue',
            tasks: data?.overdue || [],
            count: data?.counts?.overdue || 0,
            icon: AlertCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
        },
        {
            title: 'Due Today',
            tasks: data?.dueToday || [],
            count: data?.counts?.dueToday || 0,
            icon: Calendar,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
        },
        {
            title: 'Due This Week',
            tasks: data?.dueThisWeek || [],
            count: data?.counts?.dueThisWeek || 0,
            icon: Clock,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
        },
    ];

    return (
        <Card padding="md">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                    ⚠️ Alerts & Critical Items
                </h2>
                <Link to="/tasks" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View All Tasks
                </Link>
            </div>

            <div className="space-y-4">
                {sections.map((section) => (
                    <div key={section.title} className={`border ${section.borderColor} rounded-lg p-3 ${section.bgColor}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <section.icon className={`w-4 h-4 ${section.color}`} />
                                <h3 className={`font-semibold text-sm ${section.color}`}>
                                    {section.title}
                                </h3>
                            </div>
                            <Badge variant="default" size="sm">
                                {section.count}
                            </Badge>
                        </div>

                        {section.tasks.length > 0 ? (
                            <div className="space-y-2 mt-3">
                                {section.tasks.slice(0, 3).map((task) => (
                                    <Link
                                        key={task._id}
                                        to={`/tasks/${task._id}`}
                                        className="block p-2 bg-white rounded border border-gray-200 hover:border-gray-300 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {task.title}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-0.5">
                                                    {task.assigneeName} • {task.projectName}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                {task.daysOverdue !== undefined && (
                                                    <Badge variant="danger" size="sm">
                                                        {task.daysOverdue}d overdue
                                                    </Badge>
                                                )}
                                                {task.priority && (
                                                    <Badge
                                                        variant={task.priority === 'HIGH' || task.priority === 'URGENT' ? 'danger' : 'default'}
                                                        size="sm"
                                                    >
                                                        {task.priority}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {section.tasks.length > 3 && (
                                    <p className="text-xs text-gray-500 text-center py-1">
                                        +{section.tasks.length - 3} more
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500 italic mt-2">No tasks in this category</p>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default AlertsWidget;
