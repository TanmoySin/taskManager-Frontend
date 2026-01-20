import { type FC, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    CheckCircle2,
    AlertCircle,
    Calendar,
    Clock,
} from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import api from '../../../lib/api';
import { useProductivityStats } from '../../../hooks/useAnalytics';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import ProductivityInsights from './ProductivityInsights';

const EmployeeDashboard: FC = () => {
    const user = useAppSelector((state) => state.auth.user);

    // Get my tasks
    const { data: myTasksRaw } = useQuery({
        queryKey: ['myTasks'],
        queryFn: async () => {
            const response = await api.get('/tasks/my-tasks');
            return response.data;
        },
    });

    const myTasks: any[] = Array.isArray(myTasksRaw) ? myTasksRaw : [];

    // Get productivity stats
    const { data: productivityData, isLoading: productivityLoading } = useProductivityStats('week');

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
            if (task.status === 'DONE') return;

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        👋 Welcome, {user?.name}!
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Here's your personal task overview and performance.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/my-tasks">
                        <Button variant="secondary" size="sm">
                            View All Tasks
                        </Button>
                    </Link>
                    <Link to="/projects">
                        <Button variant="primary" size="sm">
                            New Task
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card padding="md" className="border-l-4 border-l-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Overdue</p>
                            <p className="text-3xl font-bold text-red-600">
                                {overdueTasks.length}
                            </p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                </Card>

                <Card padding="md" className="border-l-4 border-l-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Due Today</p>
                            <p className="text-3xl font-bold text-yellow-600">
                                {dueTodayTasks.length}
                            </p>
                        </div>
                        <Calendar className="w-8 h-8 text-yellow-500" />
                    </div>
                </Card>

                <Card padding="md" className="border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">This Week</p>
                            <p className="text-3xl font-bold text-blue-600">
                                {dueThisWeekTasks.length}
                            </p>
                        </div>
                        <Clock className="w-8 h-8 text-blue-500" />
                    </div>
                </Card>

                <Card padding="md" className="border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Completed (Week)</p>
                            <p className="text-3xl font-bold text-green-600">
                                {productivityData?.completedTasks || 0}
                            </p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                </Card>
            </div>

            {/* My Tasks Today */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card padding="md">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            🎯 My Tasks Today
                        </h2>

                        {/* Overdue Tasks */}
                        {overdueTasks.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                    <h3 className="font-semibold text-sm text-red-600">
                                        🔴 OVERDUE ({overdueTasks.length})
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {overdueTasks.map((task) => (
                                        <Link
                                            key={task._id}
                                            to={`/tasks/${task._id}`}
                                            className="block p-3 bg-red-50 border border-red-200 rounded-lg hover:border-red-300 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm text-gray-900 truncate">
                                                        {task.title}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {task.projectId?.name || 'No project'}
                                                    </p>
                                                </div>
                                                <Badge variant="danger" size="sm">
                                                    {getDaysOverdue(task.dueDate)} days overdue
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Due Today */}
                        {dueTodayTasks.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Calendar className="w-4 h-4 text-yellow-600" />
                                    <h3 className="font-semibold text-sm text-yellow-600">
                                        🟡 DUE TODAY ({dueTodayTasks.length})
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {dueTodayTasks.map((task) => (
                                        <Link
                                            key={task._id}
                                            to={`/tasks/${task._id}`}
                                            className="block p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:border-yellow-300 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm text-gray-900 truncate">
                                                        {task.title}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {task.projectId?.name || 'No project'}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={task.priority === 'HIGH' || task.priority === 'URGENT' ? 'danger' : 'warning'}
                                                    size="sm"
                                                >
                                                    {task.priority}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Due This Week */}
                        {dueThisWeekTasks.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    <h3 className="font-semibold text-sm text-blue-600">
                                        🟢 THIS WEEK ({dueThisWeekTasks.length})
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {dueThisWeekTasks.slice(0, 5).map((task) => (
                                        <Link
                                            key={task._id}
                                            to={`/tasks/${task._id}`}
                                            className="block p-3 bg-blue-50 border border-blue-200 rounded-lg hover:border-blue-300 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm text-gray-900 truncate">
                                                        {task.title}
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        {task.projectId?.name || 'No project'} • Due:{' '}
                                                        {new Date(task.dueDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Badge variant="info" size="sm">
                                                    {task.status}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))}
                                    {dueThisWeekTasks.length > 5 && (
                                        <p className="text-xs text-center text-gray-500 py-2">
                                            +{dueThisWeekTasks.length - 5} more tasks
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {overdueTasks.length === 0 &&
                            dueTodayTasks.length === 0 &&
                            dueThisWeekTasks.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <CheckCircle2 className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                                    <p className="text-sm">🎉 All caught up! No urgent tasks.</p>
                                </div>
                            )}
                    </Card>
                </div>

                {/* My Performance */}
                <div className="lg:col-span-1">
                    <ProductivityInsights
                        data={productivityData}
                        isLoading={productivityLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
