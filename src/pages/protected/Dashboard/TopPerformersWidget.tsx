import { type FC } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { useTopPerformers } from '../../../hooks/useAnalytics';

interface TopPerformersWidgetProps {
    workspaceId?: string;
    period?: 'week' | 'month';
}

const TopPerformersWidget: FC<TopPerformersWidgetProps> = ({ workspaceId, period = 'week' }) => {
    const { data, isLoading } = useTopPerformers(workspaceId, period, 10);

    if (isLoading) {
        return (
            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
                </div>
                <div className="p-4 space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                </div>
            </Card>
        );
    }

    const performers = data?.topPerformers || [];

    if (performers.length === 0) {
        return (
            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        🏆 Top Performers
                    </h2>
                </div>
                <div className="p-8 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500">No activity data yet</p>
                </div>
            </Card>
        );
    }

    const getMedalIcon = (index: number) => {
        if (index === 0) return { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50' };
        if (index === 1) return { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-50' };
        if (index === 2) return { icon: Award, color: 'text-orange-500', bg: 'bg-orange-50' };
        return { icon: Award, color: 'text-blue-500', bg: 'bg-blue-50' };
    };

    return (
        <Card padding="none">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    🏆 Top Performers
                </h2>
                <div className="flex items-center gap-2">
                    <select
                        value={period}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                        disabled
                    >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                </div>
            </div>

            <div className="p-4">
                <div className="space-y-2">
                    {performers.map((performer: any, index: number) => {
                        const medal = getMedalIcon(index);
                        const MedalIcon = medal.icon;

                        return (
                            <div
                                key={performer.userId}
                                className={`p-3 rounded-lg border-2 ${index < 3 ? 'border-current' : 'border-gray-200'
                                    } ${medal.bg} hover:shadow-md transition-all`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Rank/Medal */}
                                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                                        {index < 3 ? (
                                            <MedalIcon className={`w-6 h-6 ${medal.color}`} />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-sm font-bold text-gray-600">
                                                    {index + 1}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                                                {performer.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-gray-900 truncate">
                                                    {performer.name}
                                                </p>
                                                <p className="text-xs text-gray-600 truncate">
                                                    {performer.email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-600">Completed</p>
                                            <p className="text-lg font-bold text-green-600">
                                                {performer.completedTasks}
                                            </p>
                                        </div>
                                        {performer.onTimeRate !== undefined && (
                                            <Badge
                                                variant={
                                                    performer.onTimeRate >= 80
                                                        ? 'success'
                                                        : performer.onTimeRate >= 60
                                                            ? 'warning'
                                                            : 'default'
                                                }
                                                size="sm"
                                            >
                                                {performer.onTimeRate}% on-time
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
};

export default TopPerformersWidget;
