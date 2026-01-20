
import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, CheckSquare, FolderKanban, Users,
    ChevronLeft, ChevronRight, Settings, Trello, UserCog, User,
    Trash2
} from 'lucide-react';
import { useAppSelector } from '../../store/hooks';

interface SidebarProps {
    isExpanded: boolean;
    onToggleSidebar: () => void;
}

const Sidebar: FC<SidebarProps> = ({ isExpanded, onToggleSidebar }) => {
    const user = useAppSelector((state) => state.auth.user);

    // ✅ Base menu items for all users
    const menuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/my-tasks', icon: CheckSquare, label: 'My Tasks' },
        { path: '/projects', icon: FolderKanban, label: 'Projects' },
        { path: '/kanban', icon: Trello, label: 'Kanban Board' },
        { path: '/workspaces', icon: Users, label: 'Workspaces' },
    ];

    // ✅ Admin/Manager only items
    const adminMenuItems = user?.role === 'Administrator' || user?.role === 'Manager'
        ? [{ path: '/users', icon: UserCog, label: 'User Management' }, { path: '/admin/system-reset', icon: Trash2, label: 'System Reset' }]
        : [];

    const allMenuItems = [...menuItems, ...adminMenuItems];

    return (
        <aside className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${isExpanded ? 'w-64' : 'w-20'}`}>
            {/* Header */}
            <div className={`h-16 border-b border-gray-200 flex items-center justify-between px-4`}>
                {isExpanded ? (
                    <>
                        <div className="flex items-center space-x-2">
                            <img
                                src="/public/Tanmoy.jpg"
                                alt="TaskManager Logo"
                                className="w-8 h-8 rounded-lg object-cover"
                            />
                            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                                TaskManager
                            </span>
                        </div>
                        <button
                            onClick={onToggleSidebar}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={onToggleSidebar}
                        className="w-full flex flex-row items-center space-y-2"
                    >
                        <img
                            src="/public/Tanmoy.jpg"
                            alt="TaskManager Logo"
                            className="w-8 h-8 rounded-lg object-cover"
                        />
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {allMenuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        title={!isExpanded ? item.label : undefined}
                        className={({ isActive }) =>
                            `flex items-center ${isExpanded ? 'px-4 space-x-3' : 'px-0 justify-center'} py-3 rounded-lg transition-all duration-200 group relative ${isActive
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full"></div>
                                )}
                                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'}`} />
                                {isExpanded && (
                                    <span className="text-sm">{item.label}</span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer - Profile Link */}
            <div className="border-t border-gray-200 p-3 space-y-1">
                <NavLink
                    to="/profile"
                    title={!isExpanded ? 'My Profile' : undefined}
                    className={({ isActive }) =>
                        `flex items-center ${isExpanded ? 'px-4 space-x-3' : 'px-0 justify-center'} py-3 rounded-lg transition-all duration-200 group relative ${isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`
                    }
                >
                    {({ isActive }) => (
                        <>
                            <User className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'}`} />
                            {isExpanded && <span className="text-sm">My Profile</span>}
                        </>
                    )}
                </NavLink>

                <NavLink
                    to="/settings"
                    title={!isExpanded ? 'Settings' : undefined}
                    className={({ isActive }) =>
                        `flex items-center ${isExpanded ? 'px-4 space-x-3' : 'px-0 justify-center'} py-3 rounded-lg transition-all duration-200 group relative ${isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`
                    }
                >
                    {({ isActive }) => (
                        <>
                            <Settings className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'}`} />
                            {isExpanded && <span className="text-sm">Settings</span>}
                        </>
                    )}
                </NavLink>
            </div>
        </aside>
    );
};

export default Sidebar;
