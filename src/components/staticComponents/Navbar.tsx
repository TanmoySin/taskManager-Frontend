import { type FC, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/authSlice';
import { Bell, LogOut, Search, ChevronDown, Timer, Clock } from 'lucide-react';
import api from '../../lib/api';
import { useUnreadCount } from '../../hooks/useNotifications';
import { useActiveTimer } from '../../hooks/useAnalytics';
import QuickTimerModal from '../modals/QuickTimerModal';

interface NavbarProps {
    sidebarToggled: boolean;
}

const Navbar: FC<NavbarProps> = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.auth.user);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showTimerModal, setShowTimerModal] = useState(false);
    const { data: activeTimer } = useActiveTimer();
    const hasActiveTimer = activeTimer?.isRunning || false;
    const timerDuration = activeTimer?.duration || 0;

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        return `${hours}:${mins.toString().padStart(2, '0')}`;
    };

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            dispatch(logout());
            navigate('/');
        }
    };

    const { data: unreadCount = 0 } = useUnreadCount();

    return (
        <nav className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search tasks, projects, or workspaces..."
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4 ml-6">
                {/* Notifications */}
                <button
                    onClick={() => navigate('/notifications')} // ✅ ADD
                    className="relative p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-semibold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
                {hasActiveTimer && (
                    <Link to="/my-tasks">
                        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                            <div className="relative">
                                <Timer className="w-4 h-4 text-orange-600" />
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-xs font-semibold text-orange-700">Timer Running</p>
                                <p className="text-xs text-orange-600 font-mono">{formatDuration(timerDuration)}</p>
                            </div>
                            <span className="sm:hidden text-sm font-mono font-semibold text-orange-700">
                                {formatDuration(timerDuration)}
                            </span>
                        </div>
                    </Link>
                )}
                <button
                    onClick={() => setShowTimerModal(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Quick Timer"
                >
                    <Clock className="w-5 h-5 text-gray-600" />
                </button>

                {/* Divider */}
                <div className="h-8 w-px bg-gray-200"></div>

                {/* User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left hidden md:block">
                                <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name}</p>
                                <p className="text-xs text-gray-500 leading-tight">{user?.email}</p>
                            </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                        <>
                            {/* Backdrop */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowUserMenu(false)}
                            ></div>

                            {/* Menu */}
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                                </div>

                                <div className="py-2">
                                    <button
                                        onClick={() => {
                                            navigate('/profile');
                                            setShowUserMenu(false);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                                    >
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <span>My Profile</span>
                                    </button>


                                    <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <span>Settings</span>
                                    </button>
                                </div>

                                <div className="border-t border-gray-100 py-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                                    >
                                        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                                            <LogOut className="w-4 h-4 text-red-600" />
                                        </div>
                                        <span className="font-medium">Sign out</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <QuickTimerModal isOpen={showTimerModal} onClose={() => setShowTimerModal(false)} />
        </nav>
    );
};

export default Navbar;
