import { type FC } from 'react';
import { Users, Timer } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { useTeamTimeOverview } from '../../../hooks/useAnalytics';

interface TeamTimeOverviewProps {
    workspaceId?: string;
}

const TeamTimeOverview: FC<TeamTimeOverviewProps> = ({ workspaceId }) => {
    const { data, isLoading } = useTeamTimeOverview(workspaceId);

    if (isLoading) {
        return (
            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </Card>
        );
    }

    if (!data || !data.members) {
        return null;
    }

    const members = data.members || [];
    const topPerformers = [...members]
        .sort((a: any, b: any) => (b.hoursLogged || 0) - (a.hoursLogged || 0))
        .slice(0, 8);

    return (
        <Card padding="none">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    👥 Team Time Overview
                </h2>
                <Badge variant="default" size="sm">
                    {members.length} members
                </Badge>
            </div>

            <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {topPerformers.map((member: any) => {
                        const hours = member.hoursLogged || 0;
                        const utilization = member.utilization || 0;
                        const hasActiveTimer = member.hasActiveTimer || false;

                        return (
                            <div
                                key={member.userId}
                                className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0 shadow-sm">
                                        {member.name?.charAt(0).toUpperCase()}
                                    </div>
                                    {hasActiveTimer && (
                                        <Timer className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                                    )}
                                </div>

                                <p className="font-medium text-sm text-gray-900 truncate mb-1" title={member.name}>
                                    {member.name}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-600">Hours</p>
                                        <p className="text-lg font-bold text-blue-600">
                                            {hours.toFixed(1)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-600">Util.</p>
                                        <p className={`text-sm font-semibold ${utilization >= 80
                                                ? 'text-green-600'
                                                : utilization >= 50
                                                    ? 'text-yellow-600'
                                                    : 'text-gray-600'
                                            }`}>
                                            {utilization}%
                                        </p>
                                    </div>
                                </div>

                                {/* Utilization bar */}
                                <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${utilization >= 80
                                                ? 'bg-green-500'
                                                : utilization >= 50
                                                    ? 'bg-yellow-500'
                                                    : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${Math.min(utilization, 100)}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {members.length > 8 && (
                    <p className="text-xs text-gray-500 text-center mt-3">
                        Showing top 8 by hours logged • {members.length - 8} more not displayed
                    </p>
                )}
            </div>
        </Card>
    );
};

export default TeamTimeOverview;
