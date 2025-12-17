import type { FC } from "react";
import Dashboard from "../pages/protected/Dashboard";
import MyTasks from "../pages/protected/MyTasks";
import Workspaces from "../pages/protected/Workspaces";
import Timesheets from "../pages/protected/Timesheets";
import KanbanBoard from "../pages/protected/KanbanBoard";
import Notifications from "../pages/protected/Notifications";
import WorkspaceDetail from "../pages/protected/WorkspaceDetail";
import UserManagement from "../pages/protected/AuthAndUserManagement/UserManagement";
import Profile from "../pages/protected/AuthAndUserManagement/Profile";
import TimeTracking from "../pages/protected/TimeTracking";
import TimesheetDetail from "../pages/protected/TimesheetDetail";
import TimeReports from "../pages/protected/TimeReports";
import TimesheetApprovals from "../pages/protected/TimesheetApprovals";
import Projects from "../pages/protected/ProjectManagement/Projects";
import ProjectDetail from "../pages/protected/ProjectManagement/ProjectDetail";
import SystemReset from "../admin/SystemReset";

interface RouteConfig {
    path: string;
    component: FC;
    roles?: string[]; // ✅ Add optional role-based access
}

export const DynamicRoutes: RouteConfig[] = [
    { path: "/dashboard", component: Dashboard },
    { path: "/my-tasks", component: MyTasks },
    { path: "/projects", component: Projects },
    { path: "/projects/:id", component: ProjectDetail },
    { path: "/kanban", component: KanbanBoard },
    { path: "/workspaces", component: Workspaces },
    { path: "/workspaces/:id", component: WorkspaceDetail },
    { path: "/timesheets", component: Timesheets },
    { path: "/notifications", component: Notifications },
    { path: "/time-tracking", component: TimeTracking },
    { path: "/timesheets/:id", component: TimesheetDetail },


    // ✅ Step 1: User Management
    {
        path: "/users",
        component: UserManagement,
        roles: ["Administrator", "Manager"] // Only Admin & Manager
    },
    {
        path: "/reports/time",
        component: TimeReports,
        roles: ["Administrator", "Manager"],
    },

    {
        path: "/timesheets/approvals",
        component: TimesheetApprovals,
        roles: ["Administrator", "Manager"],
    },
    {
        path: '/admin/system-reset',
        component: SystemReset,
        roles: ['Administrator'],
    },
    { path: "/profile", component: Profile },
];
