import { type FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FolderKanban, Users, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import api from '../../../lib/api';
import { useAppSelector } from '../../../store/hooks';
import { useDeadlineAlerts, useProductivityStats } from '../../../hooks/useAnalytics';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import OverviewMetrics from './OverviewMetrics';
import AlertsWidget from './AlertsWidget';
import ProductivityInsights from './ProductivityInsights';
import ProjectHealthTable from './ProjectHealthTable';
import ActivityFeed from './ActivityFeed';
import ProjectTimeWidget from './ProjectTimeWidget';
import TeamTimeOverview from './TeamTimeOverview';

const ManagerDashboard: FC = () => {
    const user = useAppSelector((state) => state.auth.user);
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');

    // Fetch all workspaces
    const { data: workspacesData } = useQuery({
        queryKey: ['userWorkspaces'],
        queryFn: async () => {
            const response = await api.get('/workspaces');
            const workspaces = Array.isArray(response.data)
                ? response.data
                : response.data.workspaces || [];
            return workspaces;
        },
    });

    const workspaces = Array.isArray(workspacesData) ? workspacesData : [];
    const currentWorkspace = selectedWorkspaceId
        ? workspaces.find((w: any) => w._id === selectedWorkspaceId)
        : workspaces[0];
    const workspaceId = currentWorkspace?._id;

    // Get manager's projects
    const { data: projectsRaw, isLoading: projectsLoading, refetch: refetchProjects } = useQuery({
        queryKey: ['managerProjects', workspaceId],
        queryFn: async () => {
            const response = await api.get('/projects');
            const data = response.data;
            if (Array.isArray(data)) return data;
            if (Array.isArray(data.projects)) return data.projects;
            return [];
        },
        enabled: !!workspaceId,
    });

    const projects = Array.isArray(projectsRaw) ? projectsRaw : [];

    // Get tasks for manager's projects
    const { data: tasksRaw, refetch: refetchTasks } = useQuery({
        queryKey: ['managerTasks', workspaceId],
        queryFn: async () => {
            const response = await api.get('/tasks');
            return response.data;
        },
        enabled: !!workspaceId,
    });

    const tasks = Array.isArray(tasksRaw) ? tasksRaw : [];

    // Get alerts for manager's workspace
    const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useDeadlineAlerts(workspaceId);

    // Get productivity stats
    const { data: productivityData, isLoading: productivityLoading, refetch: refetchProductivity } = useProductivityStats('week');

    // Calculate overview metrics
    const activeProjects = projects.filter((p: any) => p.status === 'ACTIVE' || p.status === 'PLANNED').length;
    const activeTasks = tasks.filter((t: any) => t.status !== 'DONE' && t.status !== 'CANCELED').length;
    const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length;
    const overdueTasks = tasks.filter(
        (t: any) =>
            t.dueDate &&
            new Date(t.dueDate) < new Date() &&
            t.status !== 'DONE' &&
            t.status !== 'CANCELED'
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
        dueTodayCount: alertsData?.counts?.dueToday || 0,
    };

    // Refresh all data
    const handleRefreshAll = () => {
        refetchProjects();
        refetchTasks();
        refetchAlerts();
        refetchProductivity();
    };

    const isRefreshing = projectsLoading || alertsLoading || productivityLoading;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                        🎯 Manager Dashboard
                    </h1>
                    <p className="text-gray-600 text-sm mt-0.5">
                        Welcome back, {user?.name}! Manage your projects and team.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Workspace Selector */}
                    {workspaces.length > 1 && (
                        <div className="relative">
                            <select
                                value={selectedWorkspaceId || workspaces[0]?._id || ''}
                                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                                className="pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                            >
                                {workspaces.map((ws: any) => (
                                    <option key={ws._id} value={ws._id}>
                                        {ws.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    )}

                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleRefreshAll}
                        disabled={isRefreshing}
                        isLoading={isRefreshing}
                    >
                        <RefreshCw className={`w-4 h-4 ${!isRefreshing && 'mr-2'}`} />
                        {!isRefreshing && <span className="hidden sm:inline">Refresh</span>}
                    </Button>
                </div>
            </div>

            {/* Overview Metrics */}
            <OverviewMetrics data={overviewMetrics} isLoading={projectsLoading} />

            {/* My Projects Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link to="/projects">
                    <Card padding="md" className="h-full hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-2.5 rounded-lg flex-shrink-0">
                                <FolderKanban className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-600 mb-0.5">My Projects</p>
                                <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {projects.length}
                                </p>
                            </div>
                        </div>
                    </Card>
                </Link>

                <Card padding="md" className="hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-50 p-2.5 rounded-lg flex-shrink-0">
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-600 mb-0.5">Team Members</p>
                            <p className="text-2xl font-bold text-gray-900">{teamMemberIds.size}</p>
                        </div>
                    </div>
                </Card>

                <Link to="/my-tasks">
                    <Card padding="md" className="h-full hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-50 p-2.5 rounded-lg flex-shrink-0">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-600 mb-0.5">Needs Attention</p>
                                <p className="text-2xl font-bold text-red-600 group-hover:text-red-700 transition-colors">
                                    {overdueTasks}
                                </p>
                            </div>
                        </div>
                    </Card>
                </Link>
            </div>

            {/* Alerts & Productivity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AlertsWidget data={alertsData} isLoading={alertsLoading} />
                <ProductivityInsights data={productivityData} isLoading={productivityLoading} />
            </div>

            {/* Project Health Table */}
            <ProjectHealthTable projects={projects} isLoading={projectsLoading} />

            {/* ⭐ NEW: Project Time Widget */}
            <ProjectTimeWidget projects={projects} isLoading={projectsLoading} />

            {/* ⭐ NEW: Team Time Overview */}
            <TeamTimeOverview workspaceId={workspaceId} />

            {/* Requires Attention & Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Requires My Attention */}
                <Card padding="none">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-base font-semibold text-gray-900">
                            📋 Requires My Attention
                        </h2>
                    </div>
                    <div className="p-4">
                        {overdueTasks > 0 || (alertsData?.counts?.dueToday || 0) > 0 ? (
                            <div className="space-y-2">
                                {overdueTasks > 0 && (
                                    <Link to="/my-tasks">
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer">
                                            <p className="text-sm font-medium text-red-700">
                                                🔴 {overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''} in your projects
                                            </p>
                                        </div>
                                    </Link>
                                )}
                                {(alertsData?.counts?.dueToday || 0) > 0 && (
                                    <Link to="/my-tasks">
                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer">
                                            <p className="text-sm font-medium text-yellow-700">
                                                🟡 {alertsData.counts.dueToday} task{alertsData.counts.dueToday > 1 ? 's' : ''} due today
                                            </p>
                                        </div>
                                    </Link>
                                )}
                                {(alertsData?.counts?.dueThisWeek || 0) > 0 && (
                                    <Link to="/my-tasks">
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                                            <p className="text-sm font-medium text-blue-700">
                                                🔵 {alertsData.counts.dueThisWeek} task{alertsData.counts.dueThisWeek > 1 ? 's' : ''} due this week
                                            </p>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-50 rounded-full mb-3">
                                    <span className="text-2xl">✅</span>
                                </div>
                                <p className="text-sm text-gray-600 font-medium">All caught up!</p>
                                <p className="text-xs text-gray-500 mt-1">No urgent items require your attention.</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Recent Activity Feed */}
                <ActivityFeed workspaceId={workspaceId} limit={10} />
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

export default ManagerDashboard;
