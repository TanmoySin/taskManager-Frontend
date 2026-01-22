import { type FC, useState } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import { useAppSelector } from '../../../store/hooks';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import {
    useDashboardOverview,
    useDeadlineAlerts,
    useTeamStatus,
    useWorkloadDistribution,
} from '../../../hooks/useAnalytics';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import OverviewMetrics from './OverviewMetrics';
import TeamStatusWidget from './TeamStatusWidget';
import AlertsWidget from './AlertsWidget';
import ProjectHealthTable from './ProjectHealthTable';
import WorkloadDistribution from './WorkloadDistribution';
import WorkloadHeatmap from './WorkloadHeatmap';
import ActivityFeed from './ActivityFeed';
import TimeTrackingWidget from './TimeTrackingWidget';
import StaleTasksWidget from './StaleTasksWidget';
import TopPerformersWidget from './TopPerformersWidget';

const AdminDashboard: FC = () => {
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

    // Dashboard analytics
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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                        📊 Admin Dashboard
                    </h1>
                    <p className="text-gray-600 text-sm mt-0.5">
                        Welcome back, {user?.name}!
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

            {/* Error banner */}
            {!workspaceId && !overviewLoading && (
                <Card padding="md" className="border-l-4 border-yellow-500 bg-yellow-50">
                    <p className="text-sm text-yellow-800">
                        ⚠️ No workspace found. Please create or join a workspace to see dashboard data.
                    </p>
                </Card>
            )}

            {/* Overview Metrics - 6 cards */}
            <OverviewMetrics data={overviewData?.overview} isLoading={overviewLoading} />

            {/* Team Status Widget */}
            <TeamStatusWidget data={teamStatusData} isLoading={teamStatusLoading} />

            {/* Alerts, Quick Stats & Time Tracking Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <AlertsWidget data={alertsData} isLoading={alertsLoading} />

                {/* Quick Stats Card */}
                <Card padding="none">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-base font-semibold text-gray-900">
                            📈 Quick Stats
                        </h2>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">
                                Completion Rate
                            </span>
                            <span className="text-xl font-bold text-blue-600">
                                {overviewData?.productivity?.completionRate || 0}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">
                                On-Time Rate
                            </span>
                            <span className="text-xl font-bold text-green-600">
                                {overviewData?.productivity?.onTimeRate || 0}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">
                                Weekly Completions
                            </span>
                            <span className="text-xl font-bold text-purple-600">
                                {overviewData?.productivity?.weeklyCompletions || 0}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* ⭐ NEW: Time Tracking Widget */}
                <TimeTrackingWidget workspaceId={workspaceId} />
            </div>

            {/* ⭐ NEW: Stale Tasks Widget */}
            <StaleTasksWidget workspaceId={workspaceId} />

            {/* Project Health Table */}
            <ProjectHealthTable projects={projects} isLoading={projectsLoading} />

            {/* Workload Distribution */}
            <WorkloadDistribution data={workloadData} isLoading={workloadLoading} />

            {/* Top Performers Widget */}
            <TopPerformersWidget workspaceId={workspaceId} period="week" />

            {/* Workload Heatmap */}
            <WorkloadHeatmap
                workspaceId={workspaceId}
                isLoading={workloadLoading}
            />

            {/* Activity Feed */}
            <ActivityFeed workspaceId={workspaceId} limit={15} />

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

export default AdminDashboard;
