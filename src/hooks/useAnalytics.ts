import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

// ========================================
// EXISTING HOOKS (Keep as is)
// ========================================

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

// ========================================
// ⭐ NEW HOOKS - PHASE 1
// ========================================

// ⭐ 1. Time Tracking Analytics - Project Level
export const useProjectTimeAnalytics = (
  projectId: string | undefined,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["projectTimeAnalytics", projectId],
    queryFn: async () => {
      const response = await api.get(
        `/time-tracking/analytics/project/${projectId}`,
      );
      return response.data;
    },
    enabled: !!projectId && enabled,
    refetchInterval: 60000, // Refresh every 1 minute
    staleTime: 50000,
  });
};

// ⭐ 2. Team Time Overview - Workspace Level (Admin/Manager)
export const useTeamTimeOverview = (
  workspaceId: string | undefined,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["teamTimeOverview", workspaceId],
    queryFn: async () => {
      const response = await api.get(
        `/time-tracking/analytics/team?workspaceId=${workspaceId}`,
      );
      return response.data;
    },
    enabled: !!workspaceId && enabled,
    refetchInterval: 60000,
    staleTime: 50000,
  });
};

// ⭐ 3. My Time Utilization - Personal (Employee)
export const useMyTimeUtilization = (enabled = true) => {
  return useQuery({
    queryKey: ["myTimeUtilization"],
    queryFn: async () => {
      const response = await api.get("/time-tracking/analytics/utilization");
      return response.data;
    },
    enabled,
    refetchInterval: 60000,
    staleTime: 50000,
  });
};

// ⭐ 4. Active Timer - Personal (All Users)
export const useActiveTimer = (enabled = true) => {
  return useQuery({
    queryKey: ["activeTimer"],
    queryFn: async () => {
      const response = await api.get("/time-tracking/timer/active");
      return response.data;
    },
    enabled,
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 25000,
  });
};

// ⭐ 5. Stale Tasks Detection
export const useStaleTasks = (
  workspaceId: string | undefined,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["staleTasks", workspaceId],
    queryFn: async () => {
      const response = await api.get(
        `/analytics/stale-tasks?workspaceId=${workspaceId}`,
      );
      return response.data;
    },
    enabled: !!workspaceId && enabled,
    refetchInterval: 3600000, // Refresh hourly (stale tasks don't change frequently)
    staleTime: 3000000,
  });
};

// ⭐ 6. Workload Calendar View
export const useWorkloadCalendar = (
  workspaceId: string | undefined,
  startDate?: string,
  endDate?: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["workloadCalendar", workspaceId, startDate, endDate],
    queryFn: async () => {
      let url = `/analytics/calendar?workspaceId=${workspaceId}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      const response = await api.get(url);
      return response.data;
    },
    enabled: !!workspaceId && enabled,
    refetchInterval: 300000, // Refresh every 5 minutes
    staleTime: 240000,
  });
};

// ⭐ 7. Workload Balance Check - Manual Check
export const useWorkloadCheck = (
  workspaceId: string | undefined,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["workloadCheck", workspaceId],
    queryFn: async () => {
      const response = await api.get(
        `/analytics/workload-check?workspaceId=${workspaceId}`,
      );
      return response.data;
    },
    enabled: !!workspaceId && enabled,
    refetchInterval: 60000,
    staleTime: 50000,
  });
};

// ⭐ 8. My Time Logs - Personal Task Time Entries
export const useMyTimeLogs = (limit = 10, enabled = true) => {
  return useQuery({
    queryKey: ["myTimeLogs", limit],
    queryFn: async () => {
      const response = await api.get(
        `/time-tracking/my-time-logs?limit=${limit}`,
      );
      return response.data;
    },
    enabled,
    refetchInterval: 60000,
    staleTime: 50000,
  });
};

// ⭐ 9. Task Time Entries - Specific Task
export const useTaskTimeEntries = (
  taskId: string | undefined,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["taskTimeEntries", taskId],
    queryFn: async () => {
      const response = await api.get(`/time-tracking/tasks/${taskId}/time`);
      return response.data;
    },
    enabled: !!taskId && enabled,
    refetchInterval: 60000,
    staleTime: 50000,
  });
};
