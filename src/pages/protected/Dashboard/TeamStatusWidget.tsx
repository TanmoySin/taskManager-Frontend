import { type FC } from 'react';
import { Users } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

interface TeamMember {
    userId: string;
    name: string;
    email: string;
    avatarUrl?: string;
    activeTasks: number;
    inProgressCount: number;
    overdueCount: number;
    status: 'AVAILABLE' | 'WORKING' | 'OVERLOADED' | 'IDLE';
}

interface TeamStatusWidgetProps {
    data: {
        available: TeamMember[];
        working: TeamMember[];
        overloaded: TeamMember[];
        idle: TeamMember[];
        totalMembers: number;
    };
    isLoading?: boolean;
}

const TeamStatusWidget: FC<TeamStatusWidgetProps> = ({ data, isLoading }) => {
    const statusConfig = {
        AVAILABLE: { label: 'Available', color: 'bg-green-100 text-green-700', icon: '🟢' },
        WORKING: { label: 'Working', color: 'bg-blue-100 text-blue-700', icon: '🔵' },
        OVERLOADED: { label: 'Overloaded', color: 'bg-red-100 text-red-700', icon: '🔴' },
        IDLE: { label: 'Idle', color: 'bg-gray-100 text-gray-700', icon: '⚪' },
    };

    const sections = [
        { status: 'AVAILABLE', members: data?.available || [] },
        { status: 'WORKING', members: data?.working || [] },
        { status: 'OVERLOADED', members: data?.overloaded || [] },
        { status: 'IDLE', members: data?.idle || [] },
    ];

    if (isLoading) {
        return (
            <Card padding="md">
                <div className="animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="space-y-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card padding="md">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Status
                </h2>
                <Badge variant="default" size="sm">
                    {data?.totalMembers || 0} members
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {sections.map(({ status, members }) => {
                    const config = statusConfig[status as keyof typeof statusConfig];
                    return (
                        <div key={status} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                    {config.icon} {config.label}
                                </span>
                                <span className="text-xs text-gray-500">({members.length})</span>
                            </div>

                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {members.length > 0 ? (
                                    members.slice(0, 5).map((member: TeamMember) => (
                                        <div
                                            key={member.userId}
                                            className={`p-2 rounded-lg text-xs ${config.color} hover:opacity-80 transition-opacity cursor-pointer`}
                                            title={`${member.name} - ${member.activeTasks} active tasks${member.overdueCount > 0 ? `, ${member.overdueCount} overdue` : ''}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium truncate flex-1">
                                                    {member.name}
                                                </span>
                                                <span className="ml-2 font-semibold">
                                                    {member.activeTasks}
                                                </span>
                                            </div>
                                            {member.overdueCount > 0 && (
                                                <div className="text-xs mt-0.5 text-red-600 font-medium">
                                                    {member.overdueCount} overdue
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic p-2">No members</p>
                                )}
                                {members.length > 5 && (
                                    <p className="text-xs text-gray-500 text-center py-1">
                                        +{members.length - 5} more
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

export default TeamStatusWidget;
