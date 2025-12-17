import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import {
    CheckCircle2,
    AlertCircle,
    Calendar,
    FolderKanban,
    Timer,
    CheckCircle,
} from 'lucide-react';

export default function Dashboard() {
    const user = useAppSelector((state) => state.auth.user);

    // My tasks
    const {
        data: myTasksRaw,
        isLoading: tasksLoading,
        isError: tasksError,
    } = useQuery({
        queryKey: ['myTasks'],
        queryFn: async () => {
            const response = await api.get('/tasks/my-tasks');
            return response.data;
        },
    });

    const myTasks: any[] = Array.isArray(myTasksRaw) ? myTasksRaw : [];

    // Projects (normalize to array)
    const {
        data: projectsRaw,
        isError: projectsError,
    } = useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const response = await api.get('/projects');
            // /projects might return { projects, count } or plain array
            const data = response.data;
            if (Array.isArray(data)) return data;
            if (Array.isArray(data.projects)) return data.projects;
            return [];
        },
    });

    const projects: any[] = Array.isArray(projectsRaw) ? projectsRaw : [];

    // My timesheets
    const {
        data: myTimesheetsRaw,
        isLoading: timesheetsLoading,
        isError: timesheetsError,
    } = useQuery({
        queryKey: ['timesheets', { mine: true }],
        queryFn: async () => {
            const response = await api.get('/timesheets');
            return response.data;
        },
    });

    const myTimesheets: any[] = Array.isArray(myTimesheetsRaw)
        ? myTimesheetsRaw
        : [];

    // Time summary
    const {
        data: timeSummary,
        isLoading: timeSummaryLoading,
        isError: timeSummaryError,
    } = useQuery({
        queryKey: ['timeSummaryDashboard'],
        queryFn: async () => {
            const response = await api.get('/time-tracking/entries/summary');
            return response.data;
        },
    });

    // Pending approvals (Manager/Admin only)
    const {
        data: pendingTimesheetsRaw,
        isLoading: pendingLoading,
        isError: pendingError,
    } = useQuery({
        queryKey: ['pendingTimesheetsDashboard'],
        queryFn: async () => {
            const response = await api.get('/timesheets/pending');
            return response.data;
        },
        enabled: user?.role === 'Administrator' || user?.role === 'Manager',
    });

    const pendingTimesheets: any[] = Array.isArray(pendingTimesheetsRaw)
        ? pendingTimesheetsRaw
        : [];

    const now = new Date();

    const {
        totalTasks,
        activeProjects,
        todoTasks,
        inProgressTasks,
        doneTasks,
        overdueTasks,
    } = useMemo(() => {
        const total = myTasks.length;
        const todo = myTasks.filter((t: any) => t.status === 'TODO').length;
        const inProgress = myTasks.filter(
            (t: any) => t.status === 'IN_PROGRESS',
        ).length;
        const done = myTasks.filter((t: any) => t.status === 'DONE').length;
        const overdue = myTasks.filter(
            (t: any) =>
                t.dueDate &&
                new Date(t.dueDate) < now &&
                t.status !== 'DONE',
        ).length;
        const activeProj = projects.filter(
            (p: any) => p.status !== 'ARCHIVED',
        ).length;

        return {
            totalTasks: total,
            activeProjects: activeProj,
            todoTasks: todo,
            inProgressTasks: inProgress,
            doneTasks: done,
            overdueTasks: overdue,
        };
    }, [myTasks, projects, now]);

    const latestTimesheet = myTimesheets[0];

    const totalHours = timeSummary?.totalHours ?? 0;
    const billableHours = timeSummary?.billableHours ?? 0;
    const approvedHours = timeSummary?.approvedHours ?? 0;

    const mainStats = [
        {
            title: 'My Tasks',
            value: totalTasks,
            icon: CheckCircle2,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            link: '/my-tasks',
        },
        {
            title: 'Active Projects',
            value: activeProjects,
            icon: FolderKanban,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            link: '/projects',
        },
        {
            title: 'Overdue Tasks',
            value: overdueTasks,
            icon: AlertCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            link: '/my-tasks',
        },
        {
            title: 'This Week Hours',
            value: totalHours.toFixed(1),
            icon: Timer,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            link: '/time-tracking',
        },
    ];

    const taskBreakdown = [
        { label: 'To Do', value: todoTasks, color: 'text-gray-700' },
        { label: 'In Progress', value: inProgressTasks, color: 'text-blue-600' },
        { label: 'Done', value: doneTasks, color: 'text-green-600' },
    ];

    const showApprovalsWidget =
        user?.role === 'Administrator' || user?.role === 'Manager';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Welcome back, {user?.name}!
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Link to="/my-tasks">
                        <Button variant="secondary" size="sm">
                            View My Tasks
                        </Button>
                    </Link>
                    <Link to="/projects">
                        <Button variant="primary" size="sm">
                            New Project / Task
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Error banners (if any) */}
            {(tasksError || projectsError || timesheetsError || timeSummaryError || pendingError) && (
                <Card padding="md" className="border border-red-200 bg-red-50">
                    <p className="text-xs text-red-700">
                        Some data could not be loaded. Please refresh the page or try again
                        later.
                    </p>
                </Card>
            )}

            {/* Top stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mainStats.map((stat, index) => (
                    <Card key={index} padding="md" className="h-full">
                        <Link to={stat.link} className="block h-full">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </Link>
                    </Card>
                ))}
            </div>

            {/* Middle row: tasks breakdown + time summary + timesheet summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Task breakdown */}
                <Card padding="md">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-gray-900">
                            My Task Status
                        </h2>
                        <Badge variant="default" size="sm">
                            {totalTasks} total
                        </Badge>
                    </div>
                    {tasksLoading ? (
                        <div className="text-center py-6 text-xs text-gray-500">
                            Loading task stats...
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {taskBreakdown.map((item) => (
                                <div key={item.label} className="flex items-center">
                                    <span className="text-xs text-gray-500 w-20">
                                        {item.label}
                                    </span>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full mx-2">
                                        <div
                                            className={`h-2 rounded-full ${item.label === 'Done'
                                                ? 'bg-green-500'
                                                : item.label === 'In Progress'
                                                    ? 'bg-blue-500'
                                                    : 'bg-gray-500'
                                                }`}
                                            style={{
                                                width:
                                                    totalTasks > 0
                                                        ? `${(item.value / totalTasks) * 100}%`
                                                        : '0%',
                                            }}
                                        />
                                    </div>
                                    <span className={`text-xs font-medium ${item.color}`}>
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* Time summary */}
                <Card padding="md">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-gray-900">
                            This Week&apos;s Time
                        </h2>
                        <Link
                            to="/time-tracking"
                            className="text-xs text-blue-600 hover:text-blue-700"
                        >
                            Open Time Tracking
                        </Link>
                    </div>
                    {timeSummaryLoading ? (
                        <div className="text-center py-6 text-xs text-gray-500">
                            Loading time summary...
                        </div>
                    ) : timeSummary ? (
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {totalHours.toFixed(1)}h
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Billable</p>
                                <p className="text-xl font-bold text-green-600">
                                    {billableHours.toFixed(1)}h
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Approved</p>
                                <p className="text-xl font-bold text-blue-600">
                                    {approvedHours.toFixed(1)}h
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500">
                            No time entries recorded yet.
                        </p>
                    )}
                </Card>

                {/* My latest timesheet */}
                <Card padding="md">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-gray-900">
                            My Latest Timesheet
                        </h2>
                        <Link
                            to="/timesheets"
                            className="text-xs text-blue-600 hover:text-blue-700"
                        >
                            View Timesheets
                        </Link>
                    </div>
                    {timesheetsLoading ? (
                        <div className="text-center py-6 text-xs text-gray-500">
                            Loading timesheets...
                        </div>
                    ) : latestTimesheet ? (
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>
                                    {new Date(
                                        latestTimesheet.weekStartDate,
                                    ).toLocaleDateString()}{' '}
                                    –{' '}
                                    {new Date(
                                        latestTimesheet.weekEndDate,
                                    ).toLocaleDateString()}
                                </span>
                                <Badge
                                    variant={
                                        latestTimesheet.status === 'APPROVED'
                                            ? 'success'
                                            : latestTimesheet.status === 'SUBMITTED'
                                                ? 'info'
                                                : latestTimesheet.status === 'REJECTED'
                                                    ? 'danger'
                                                    : 'default'
                                    }
                                    size="sm"
                                >
                                    {latestTimesheet.status}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mt-1">
                                <div>
                                    <p className="text-xs text-gray-500">Total</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {latestTimesheet.totalHours}h
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Billable</p>
                                    <p className="text-lg font-bold text-green-600">
                                        {latestTimesheet.billableHours}h
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Non‑Billable</p>
                                    <p className="text-lg font-bold text-gray-600">
                                        {latestTimesheet.nonBillableHours}h
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500">
                            You have not created any timesheets yet.
                        </p>
                    )}
                </Card>
            </div>

            {/* Bottom row: recent tasks + approvals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent tasks */}
                <Card padding="md" className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Recent Tasks
                        </h2>
                        <Link
                            to="/my-tasks"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            View all
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {tasksLoading ? (
                            <div className="text-center py-8 text-gray-500">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3" />
                                <p className="text-sm">Loading tasks...</p>
                            </div>
                        ) : myTasks.length ? (
                            myTasks.slice(0, 5).map((task: any) => (
                                <Link
                                    key={task._id}
                                    to="/my-tasks"
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center space-x-3 flex-1">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {task.title}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {task.projectId?.name || 'No project'} •{' '}
                                                {task.priority}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Badge
                                            variant={
                                                task.status === 'DONE' ? 'success' : 'default'
                                            }
                                            size="sm"
                                        >
                                            {task.status}
                                        </Badge>
                                        {task.dueDate && (
                                            <div className="flex items-center text-xs text-gray-500">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(task.dueDate).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm">No tasks assigned yet</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Approvals widget */}
                {showApprovalsWidget && (
                    <Card padding="md">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-gray-900">
                                Timesheet Approvals
                            </h2>
                            <Link
                                to="/timesheets/approvals"
                                className="text-xs text-blue-600 hover:text-blue-700"
                            >
                                Open
                            </Link>
                        </div>
                        {pendingLoading ? (
                            <div className="text-center py-6 text-xs text-gray-500">
                                Loading pending timesheets...
                            </div>
                        ) : pendingTimesheets.length ? (
                            <div className="space-y-2">
                                <p className="text-xs text-gray-500 mb-1">
                                    Pending: {pendingTimesheets.length}
                                </p>
                                {pendingTimesheets.slice(0, 3).map((ts: any) => (
                                    <div
                                        key={ts._id}
                                        className="p-2 bg-gray-50 rounded-lg flex items-center justify-between"
                                    >
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-gray-900">
                                                {ts.userId?.name}
                                            </p>
                                            <p className="text-[11px] text-gray-500">
                                                {new Date(
                                                    ts.weekStartDate,
                                                ).toLocaleDateString()}{' '}
                                                –{' '}
                                                {new Date(
                                                    ts.weekEndDate,
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <CheckCircle className="w-4 h-4 text-yellow-500" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-500">
                                No pending timesheets to approve.
                            </p>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
}
