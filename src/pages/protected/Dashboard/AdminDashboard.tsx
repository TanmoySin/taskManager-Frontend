import { type FC } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { useDashboardOverview, useDeadlineAlerts, useTeamStatus, useWorkloadDistribution } from '../../../hooks/useAnalytics';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import OverviewMetrics from './OverviewMetrics';
import TeamStatusWidget from './TeamStatusWidget';
import AlertsWidget from './AlertsWidget';
import ProjectHealthTable from './ProjectHealthTable';
import WorkloadDistribution from './WorkloadDistribution';
import WorkloadHeatmap from './WorkloadHeatmap';
import ActivityFeed from './ActivityFeed';

const AdminDashboard: FC = () => {
    const user = useAppSelector((state) => state.auth.user);

    // Get user's workspace (assuming user has a workspaceId)
    const { data: workspaceData } = useQuery({
        queryKey: ['userWorkspace'],
        queryFn: async () => {
            const response = await api.get('/workspaces');
            const workspaces = Array.isArray(response.data) ? response.data : response.data.workspaces || [];
            return workspaces[0]; // Get first workspace
        },
    });

    const workspaceId = workspaceData?._id;

    const { data: allTasksRaw } = useQuery({
        queryKey: ['allTasks', workspaceId],
        queryFn: async () => {
            const response = await api.get('/tasks');
            return response.data;
        },
        enabled: !!workspaceId,
    });

    const allTasks = Array.isArray(allTasksRaw) ? allTasksRaw : [];

    // Fetch all dashboard data
    const {
        data: overviewData,
        isLoading: overviewLoading,
        refetch: refetchOverview,
    } = useDashboardOverview(workspaceId);

    const {
        data: teamStatusData,
        isLoading: teamStatusLoading,
        refetch: refetchTeamStatus,
    } = useTeamStatus(workspaceId);

    const {
        data: alertsData,
        isLoading: alertsLoading,
        refetch: refetchAlerts,
    } = useDeadlineAlerts(workspaceId);

    const {
        data: workloadData,
        isLoading: workloadLoading,
        refetch: refetchWorkload,
    } = useWorkloadDistribution(workspaceId);

    // Get projects with health data
    const { data: projectsRaw, isLoading: projectsLoading } = useQuery({
        queryKey: ['projects', workspaceId],
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

    // Refresh all data
    const handleRefreshAll = () => {
        refetchOverview();
        refetchTeamStatus();
        refetchAlerts();
        refetchWorkload();
    };

    const isRefreshing =
        overviewLoading || teamStatusLoading || alertsLoading || workloadLoading;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        📊 Admin Dashboard
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Welcome back, {user?.name}! Here's your workspace overview.
                    </p>
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRefreshAll}
                    disabled={isRefreshing}
                    isLoading={isRefreshing}
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Error banner */}
            {!workspaceId && !overviewLoading && (
                <Card padding="md" className="border border-yellow-200 bg-yellow-50">
                    <p className="text-sm text-yellow-700">
                        ⚠️ No workspace found. Please create or join a workspace to see dashboard data.
                    </p>
                </Card>
            )}

            {/* Overview Metrics - 6 cards */}
            <OverviewMetrics
                data={overviewData?.overview}
                isLoading={overviewLoading}
            />

            {/* Team Status Widget */}
            <TeamStatusWidget data={teamStatusData} isLoading={teamStatusLoading} />

            {/* Alerts & Project Health Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alerts Widget */}
                <AlertsWidget data={alertsData} isLoading={alertsLoading} />

                {/* Quick Stats Card */}
                <Card padding="md">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        📈 Quick Stats
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">
                                Completion Rate
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                                {overviewData?.productivity?.completionRate || 0}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">
                                On-Time Rate
                            </span>
                            <span className="text-lg font-bold text-green-600">
                                {overviewData?.productivity?.onTimeRate || 0}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">
                                Weekly Completions
                            </span>
                            <span className="text-lg font-bold text-purple-600">
                                {overviewData?.productivity?.weeklyCompletions || 0}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Project Health Table */}
            <ProjectHealthTable projects={projects} isLoading={projectsLoading} />

            {/* Workload Distribution */}
            <WorkloadDistribution data={workloadData} isLoading={workloadLoading} />

            <WorkloadHeatmap
                tasks={allTasks}
                teamMembers={workloadData || []}
                isLoading={workloadLoading}
            />

            <ActivityFeed limit={15} />

            {/* Footer info */}
            <div className="text-center py-4">
                <p className="text-xs text-gray-500">
                    Dashboard auto-refreshes every 30 seconds • Last updated:{' '}
                    {new Date().toLocaleTimeString()}
                </p>
            </div>
        </div>
    );
};

export default AdminDashboard;
