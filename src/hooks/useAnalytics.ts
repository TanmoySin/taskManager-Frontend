import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

// ✅ Team Status Hook
export const useTeamStatus = (
  workspaceId: string | undefined,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["teamStatus", workspaceId],
    queryFn: async () => {
      const response = await api.get(
        `/analytics/team-status?workspaceId=${workspaceId}`,
      );
      return response.data;
    },
    enabled: !!workspaceId && enabled,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000,
  });
};

// ✅ Deadline Alerts Hook
export const useDeadlineAlerts = (
  workspaceId: string | undefined,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["deadlineAlerts", workspaceId],
    queryFn: async () => {
      const response = await api.get(
        `/analytics/deadlines?workspaceId=${workspaceId}`,
      );
      return response.data;
    },
    enabled: !!workspaceId && enabled,
    refetchInterval: 60000, // Refresh every 1 minute
    staleTime: 50000,
  });
};

// ✅ Workload Distribution Hook
export const useWorkloadDistribution = (
  workspaceId: string | undefined,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["workloadDistribution", workspaceId],
    queryFn: async () => {
      const response = await api.get(
        `/analytics/workload?workspaceId=${workspaceId}`,
      );
      return response.data;
    },
    enabled: !!workspaceId && enabled,
    refetchInterval: 30000,
    staleTime: 25000,
  });
};

// ✅ Dashboard Overview Hook
export const useDashboardOverview = (
  workspaceId: string | undefined,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["dashboardOverview", workspaceId],
    queryFn: async () => {
      const response = await api.get(
        `/analytics/dashboard?workspaceId=${workspaceId}`,
      );
      return response.data;
    },
    enabled: !!workspaceId && enabled,
    refetchInterval: 30000,
    staleTime: 25000,
  });
};

// ✅ Productivity Stats Hook
export const useProductivityStats = (
  period: "week" | "month" | "today" = "week",
) => {
  return useQuery({
    queryKey: ["productivityStats", period],
    queryFn: async () => {
      const response = await api.get(
        `/analytics/productivity?period=${period}`,
      );
      return response.data;
    },
    refetchInterval: 60000,
    staleTime: 50000,
  });
};

// ✅ Project Health Hook
export const useProjectHealth = (
  projectId: string | undefined,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["projectHealth", projectId],
    queryFn: async () => {
      const response = await api.get(`/analytics/project-health/${projectId}`);
      return response.data;
    },
    enabled: !!projectId && enabled,
    refetchInterval: 60000,
    staleTime: 50000,
  });
};

// ✅ Activity Feed Hook
export const useActivityFeed = (
  workspaceId: string | undefined,
  limit = 20,
) => {
  return useQuery({
    queryKey: ["activityFeed", workspaceId, limit],
    queryFn: async () => {
      const response = await api.get(
        `/analytics/activity?workspaceId=${workspaceId}&limit=${limit}`,
      );
      return response.data;
    },
    enabled: !!workspaceId,
    refetchInterval: 30000,
    staleTime: 25000,
  });
};

// ✅ Top Performers Hook
export const useTopPerformers = (
  workspaceId: string | undefined,
  period: "week" | "month" = "week",
  limit = 10,
) => {
  return useQuery({
    queryKey: ["topPerformers", workspaceId, period, limit],
    queryFn: async () => {
      const response = await api.get(
        `/analytics/top-performers?workspaceId=${workspaceId}&period=${period}&limit=${limit}`,
      );
      return response.data;
    },
    enabled: !!workspaceId,
    refetchInterval: 60000,
    staleTime: 50000,
  });
};
