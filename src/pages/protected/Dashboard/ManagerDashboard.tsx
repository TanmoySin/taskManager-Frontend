import { type FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FolderKanban, Users, AlertCircle } from 'lucide-react';
import api from '../../../lib/api';
import { useAppSelector } from '../../../store/hooks';
import { useDeadlineAlerts, useProductivityStats } from '../../../hooks/useAnalytics';
import Badge from '../../../components/ui/Badge';
import Card from '../../../components/ui/Card';
import OverviewMetrics from './OverviewMetrics';
import AlertsWidget from './AlertsWidget';
import ProductivityInsights from './ProductivityInsights';
import ProjectHealthTable from './ProjectHealthTable';

const ManagerDashboard: FC = () => {
    const user = useAppSelector((state) => state.auth.user);

    // Get manager's projects
    const { data: projectsRaw, isLoading: projectsLoading } = useQuery({
        queryKey: ['managerProjects'],
        queryFn: async () => {
            const response = await api.get('/projects');
            const data = response.data;
            if (Array.isArray(data)) return data;
            if (Array.isArray(data.projects)) return data.projects;
            return [];
        },
    });

    const projects = Array.isArray(projectsRaw) ? projectsRaw : [];

    // Get tasks for manager's projects
    const { data: tasksRaw } = useQuery({
        queryKey: ['managerTasks'],
        queryFn: async () => {
            const response = await api.get('/tasks');
            return response.data;
        },
    });

    const tasks = Array.isArray(tasksRaw) ? tasksRaw : [];

    // Get user's workspace
    const { data: workspaceData } = useQuery({
        queryKey: ['userWorkspace'],
        queryFn: async () => {
            const response = await api.get('/workspaces');
            const workspaces = Array.isArray(response.data) ? response.data : response.data.workspaces || [];
            return workspaces[0];
        },
    });

    const workspaceId = workspaceData?._id;

    // Get alerts for manager's workspace
    const { data: alertsData, isLoading: alertsLoading } = useDeadlineAlerts(workspaceId);

    // Get productivity stats
    const { data: productivityData, isLoading: productivityLoading } = useProductivityStats('week');

    // Calculate overview metrics
    const activeProjects = projects.filter((p: any) => p.status === 'ACTIVE' || p.status === 'PLANNED').length;
    const activeTasks = tasks.filter((t: any) => t.status !== 'DONE').length;
    const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length;
    const overdueTasks = tasks.filter(
        (t: any) =>
            t.dueDate &&
            new Date(t.dueDate) < new Date() &&
            t.status !== 'DONE'
    ).length;

    // Get unique team members
    const teamMemberIds = new Set();
    projects.forEach((project: any) => {
        project.members?.forEach((member: any) => {
            teamMemberIds.add(member.userId?._id || member.userId);
        });
    });

    const overviewMetrics = {
        totalProjects: projects.length,
        activeProjects,
        totalTasks: tasks.length,
        activeTasks,
        completedTasks,
        teamMembers: teamMemberIds.size,
        overdueCount: overdueTasks,
        dueTodayCount: 0, // Calculated from alerts
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        🎯 Manager Dashboard
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Welcome back, {user?.name}! Manage your projects and team.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/projects">
                        <Badge variant="info" size="md">
                            {activeProjects} Active Projects
                        </Badge>
                    </Link>
                </div>
            </div>

            {/* Overview Metrics */}
            <OverviewMetrics data={overviewMetrics} isLoading={projectsLoading} />

            {/* My Projects Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card padding="md" className="hover:shadow-md transition-shadow">
                    <Link to="/projects" className="block">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <FolderKanban className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">My Projects</p>
                                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                            </div>
                        </div>
                    </Link>
                </Card>

                <Card padding="md" className="hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-50 p-3 rounded-lg">
                            <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Team Members</p>
                            <p className="text-2xl font-bold text-gray-900">{teamMemberIds.size}</p>
                        </div>
                    </div>
                </Card>

                <Card padding="md" className="hover:shadow-md transition-shadow">
                    <Link to="/tasks" className="block">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-50 p-3 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Requires Attention</p>
                                <p className="text-2xl font-bold text-red-600">{overdueTasks}</p>
                            </div>
                        </div>
                    </Link>
                </Card>
            </div>

            {/* Alerts & Productivity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AlertsWidget data={alertsData} isLoading={alertsLoading} />
                <ProductivityInsights data={productivityData} isLoading={productivityLoading} />
            </div>

            {/* Project Health Table */}
            <ProjectHealthTable projects={projects} isLoading={projectsLoading} />

            {/* Recent Activity */}
            <Card padding="md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    📋 Requires My Attention
                </h2>
                <div className="space-y-2">
                    {overdueTasks > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-medium text-red-700">
                                🔴 {overdueTasks} overdue tasks in your projects
                            </p>
                        </div>
                    )}
                    {alertsData?.counts?.dueToday > 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm font-medium text-yellow-700">
                                🟡 {alertsData.counts.dueToday} tasks due today
                            </p>
                        </div>
                    )}
                    {overdueTasks === 0 && alertsData?.counts?.dueToday === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">✅ All caught up! No urgent items.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default ManagerDashboard;
