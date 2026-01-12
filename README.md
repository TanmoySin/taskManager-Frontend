# TaskManager Pro - Frontend

**React + TypeScript application for modern project and time management**

A comprehensive UI for managing workspaces, projects, tasks, Kanban boards, time tracking, and timesheet approvals with role-based access control.

---

### Dashboard
- Personalized greeting and quick stats
- Task status breakdown (To Do, In Progress, Done)
- This week's time summary (total, billable, approved hours)
- Latest timesheet status card
- Recent tasks list with quick filters
- Pending approvals widget for managers/admins

### Workspaces
- List all workspaces with search
- Create, edit, delete workspaces
- View workspace details (members, projects)
- Workspace card showing member count and owner

### Projects
- Projects list with filters (status, type, search)
- Create project with templates (Web, Mobile, Marketing, etc.)
- Project detail page:
  - Overview: stats, progress %, overdue tasks
  - Tasks section with search and filters
  - Team management modal (add/remove members, assign roles)
  - Archive/unarchive, delete actions
- Edit project modal
- New task from project detail

### Tasks (My Tasks)
- View all tasks assigned to you
- Filters: search, project, priority
- Quick actions: change status, start timer, duplicate, delete
- Task cards show priority, due date, project, subtasks progress
- Open task detail modal for full editing

### Kanban Board
- Drag-and-drop columns: BACKLOG, TODO, IN_PROGRESS, BLOCKED, REVIEW, DONE
- Task cards with visual indicators (priority badge, assignee avatar, due date)
- Filters: search, project, priority
- Reorder tasks within and across columns
- Click card to open task detail modal

### Task Detail Modal
- **Details tab:**
  - Edit title, description, status, priority, assignee, due date
  - Manage subtasks (add, toggle complete, delete)
  - Manage attachments (upload, download, delete)
- **Comments tab:**
  - Add/delete comments with author and timestamp
- **Time tab:**
  - Log manual time entries (hours, date, description, billable)
  - View time entries for this task with status badges
  - Summary: total, billable, approved hours

### Time Tracking
- Global time entries view with date range and status filters
- Summary cards: total hours, billable, approved, entry count
- Timer widget (floating bottom-right):
  - Shows running timer with elapsed time, task, project
  - Stop & Log Time or Cancel
- Delete non-approved time entries

### Timesheets
- **My Timesheets:**
  - Weekly cards with date range, status, hours
  - Create/open timesheet for current week
  - Submit timesheet for approval
  - View rejection reason if rejected
- **Timesheet Detail:**
  - Week overview grid (hours per day)
  - Total, billable, non-billable summary
  - List of all time entries for that week
  - Approval/rejection metadata

### Timesheet Approvals (Manager/Admin only)
- List of pending timesheets with user, week, hours
- Approve or reject individually (with rejection reason modal)
- Bulk approve with checkboxes
- View submitted date and notes

### Time Reports (Manager/Admin only)
- Filters: workspace, user, date range, status
- Summary: total hours, billable, approved/pending/rejected counts
- Timesheets list matching filters

### User Management (Admin only)
- CRUD for users
- Assign roles: Administrator, Manager, Employee, Client
- View user details (email, workspace, status)

### System Reset (Admin only)
- Clear all application data (workspaces, projects, tasks, time, timesheets, uploads)
- Keep only Administrator users
- Multi-step confirmation (type text, enter email, checkbox)

---

## Tech Stack

- **React** 18+ with TypeScript
- **Vite** for fast development and build
- **React Router** for navigation
- **TanStack Query (React Query)** for server state and caching
- **Redux Toolkit** for global auth state
- **Tailwind CSS** for utility-first styling
- **@dnd-kit** for drag-and-drop Kanban
- **Lucide React** for icons
- **Axios** for HTTP requests

---


### Prerequisites

- **Node.js** v18+ and npm/yarn
- Backend API running (see backend README)

### Installation

