import { type FC, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    CheckCircle2,
    AlertCircle,
    Calendar,
    Clock,
    RefreshCw,
} from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import api from '../../../lib/api';
import { useProductivityStats } from '../../../hooks/useAnalytics';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import ProductivityInsights from './ProductivityInsights';
import MyTimeWidget from './MyTimeWidget';

const EmployeeDashboard: FC = () => {
    const user = useAppSelector((state) => state.auth.user);

    // Get my tasks
    const { data: myTasksRaw, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
        queryKey: ['myTasks'],
        queryFn: async () => {
            const response = await api.get('/tasks/my-tasks');
            return response.data;
        },
    });

    const myTasks: any[] = Array.isArray(myTasksRaw) ? myTasksRaw : [];

    // Get productivity stats
    const { data: productivityData, isLoading: productivityLoading, refetch: refetchProductivity } = useProductivityStats('week');

    const now = new Date();
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Categorize tasks
    const { overdueTasks, dueTodayTasks, dueThisWeekTasks } = useMemo(() => {
        const overdue: any[] = [];
        const today: any[] = [];
        const week: any[] = [];
        const other: any[] = [];

        myTasks.forEach((task) => {
            if (task.status === 'DONE' || task.status === 'CANCELED') return;

            if (task.dueDate) {
                const dueDate = new Date(task.dueDate);

                if (dueDate < now) {
                    overdue.push(task);
                } else if (dueDate <= todayEnd) {
                    today.push(task);
                } else if (dueDate <= weekEnd) {
                    week.push(task);
                } else {
                    other.push(task);
                }
            } else {
                other.push(task);
            }
        });

        return {
            overdueTasks: overdue,
            dueTodayTasks: today,
            dueThisWeekTasks: week,
            otherTasks: other,
        };
    }, [myTasks, now, todayEnd, weekEnd]);

    const getDaysOverdue = (dueDate: string) => {
        const due = new Date(dueDate);
        const diffTime = now.getTime() - due.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleRefreshAll = () => {
        refetchTasks();
        refetchProductivity();
    };

    const isRefreshing = tasksLoading || productivityLoading;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                        👋 Welcome, {user?.name}!
                    </h1>
                    <p className="text-gray-600 text-sm mt-0.5">
                        Here's your personal task overview and performance.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/my-tasks">
                        <Button variant="secondary" size="sm">
                            <span className="hidden sm:inline">View All Tasks</span>
                            <span className="sm:hidden">All Tasks</span>
                        </Button>
                    </Link>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleRefreshAll}
                        disabled={isRefreshing}
                        isLoading={isRefreshing}
                    >
                        <RefreshCw className={`w-4 h-4 ${!isRefreshing && 'sm:mr-2'}`} />
                        <span className="hidden sm:inline">{!isRefreshing && 'Refresh'}</span>
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card padding="md" className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-600 mb-1 truncate">Overdue</p>
                            <p className="text-2xl sm:text-3xl font-bold text-red-600">
                                {overdueTasks.length}
                            </p>
                        </div>
                        <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 flex-shrink-0" />
                    </div>
                </Card>

                <Card padding="md" className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-600 mb-1 truncate">Due Today</p>
                            <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                                {dueTodayTasks.length}
                            </p>
                        </div>
                        <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 flex-shrink-0" />
                    </div>
                </Card>

                <Card padding="md" className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-600 mb-1 truncate">This Week</p>
                            <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                                {dueThisWeekTasks.length}
                            </p>
                        </div>
                        <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
                    </div>
                </Card>

                <Card padding="md" className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-600 mb-1 truncate">Done (Week)</p>
                            <p className="text-2xl sm:text-3xl font-bold text-green-600">
                                {productivityData?.completedTasks || 0}
                            </p>
                        </div>
                        <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
                    </div>
                </Card>
            </div>

            {/* My Tasks Today */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <Card padding="none">
                        <div className="p-4 border-b border-gray-200">
                            <h2 className="text-base font-semibold text-gray-900">
                                🎯 My Tasks Today
                            </h2>
                        </div>

                        <div className="p-4">
                            {/* Overdue Tasks */}
                            {overdueTasks.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                        <h3 className="font-semibold text-sm text-red-600">
                                            OVERDUE ({overdueTasks.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {overdueTasks.map((task) => (
                                            <Link
                                                key={task._id}
                                                to={`/my-tasks`}
                                                className="block p-3 bg-red-50 border border-red-200 rounded-lg hover:border-red-300 hover:shadow-sm transition-all"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-gray-900 truncate">
                                                            {task.title}
                                                        </p>
                                                        <p className="text-xs text-gray-600 mt-0.5 truncate">
                                                            {task.projectId?.name || 'No project'}
                                                        </p>
                                                    </div>
                                                    <Badge variant="danger" size="sm">
                                                        {getDaysOverdue(task.dueDate)}d
                                                    </Badge>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Due Today */}
                            {dueTodayTasks.length > 0 && (
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-yellow-600" />
                                        <h3 className="font-semibold text-sm text-yellow-600">
                                            DUE TODAY ({dueTodayTasks.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {dueTodayTasks.map((task) => (
                                            <Link
                                                key={task._id}
                                                to={`/my-tasks`}
                                                className="block p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:border-yellow-300 hover:shadow-sm transition-all"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-gray-900 truncate">
                                                            {task.title}
                                                        </p>
                                                        <p className="text-xs text-gray-600 mt-0.5 truncate">
                                                            {task.projectId?.name || 'No project'}
                                                        </p>
                                                    </div>
                                                    {task.priority && (
                                                        <Badge
                                                            variant={
                                                                task.priority === 'HIGH' || task.priority === 'URGENT'
                                                                    ? 'danger'
                                                                    : 'warning'
                                                            }
                                                            size="sm"
                                                        >
                                                            {task.priority}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Due This Week */}
                            {dueThisWeekTasks.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-blue-600" />
                                        <h3 className="font-semibold text-sm text-blue-600">
                                            THIS WEEK ({dueThisWeekTasks.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {dueThisWeekTasks.slice(0, 5).map((task) => (
                                            <Link
                                                key={task._id}
                                                to={`/my-tasks`}
                                                className="block p-3 bg-blue-50 border border-blue-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-gray-900 truncate">
                                                            {task.title}
                                                        </p>
                                                        <p className="text-xs text-gray-600 mt-0.5 truncate">
                                                            {task.projectId?.name || 'No project'} •{' '}
                                                            {new Date(task.dueDate).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                            })}
                                                        </p>
                                                    </div>
                                                    <Badge variant="info" size="sm">
                                                        {task.status}
                                                    </Badge>
                                                </div>
                                            </Link>
                                        ))}
                                        {dueThisWeekTasks.length > 5 && (
                                            <p className="text-xs text-center text-gray-500 py-2 font-medium">
                                                +{dueThisWeekTasks.length - 5} more
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {overdueTasks.length === 0 &&
                                dueTodayTasks.length === 0 &&
                                dueThisWeekTasks.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-3">
                                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium mb-1">
                                            🎉 All caught up!
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            No urgent tasks require your attention.
                                        </p>
                                    </div>
                                )}
                        </div>
                    </Card>
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-1 space-y-4">
                    {/* ⭐ NEW: My Time Widget */}
                    <MyTimeWidget />

                    {/* My Performance */}
                    <ProductivityInsights
                        data={productivityData}
                        isLoading={productivityLoading}
                    />
                </div>
            </div>

            {/* Footer info */}
            <div className="text-center py-3">
                <p className="text-xs text-gray-500">
                    Dashboard auto-refreshes every 30 seconds • Last updated:{' '}
                    {new Date().toLocaleTimeString()}
                </p>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
