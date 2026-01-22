import { type FC } from 'react';
import { Link } from 'react-router-dom';
import {
    FolderKanban,
    CheckSquare,
    CheckCircle,
    Users,
    AlertCircle,
    Calendar,
} from 'lucide-react';
import Card from '../../../components/ui/Card';

interface OverviewMetricsProps {
    data: {
        totalProjects: number;
        activeProjects: number;
        totalTasks: number;
        activeTasks: number;
        completedTasks: number;
        teamMembers: number;
        overdueCount: number;
        dueTodayCount: number;
    };
    isLoading?: boolean;
}

const OverviewMetrics: FC<OverviewMetricsProps> = ({ data, isLoading }) => {
    const metrics = [
        {
            title: 'Total Projects',
            value: data?.totalProjects || 0,
            icon: FolderKanban,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            link: '/projects',
        },
        {
            title: 'Active Tasks',
            value: data?.activeTasks || 0,
            icon: CheckSquare,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            link: '/my-tasks',
        },
        {
            title: 'Completed',
            value: data?.completedTasks || 0,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            link: '/my-tasks',
        },
        {
            title: 'Team Members',
            value: data?.teamMembers || 0,
            icon: Users,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            link: '/users',
        },
        {
            title: 'Overdue',
            value: data?.overdueCount || 0,
            icon: AlertCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            link: '/my-tasks',
        },
        {
            title: 'Due Today',
            value: data?.dueTodayCount || 0,
            icon: Calendar,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            link: '/my-tasks',
        },
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} padding="md">
                        <div className="animate-pulse">
                            <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
                            <div className="h-6 bg-gray-200 rounded w-12"></div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {metrics.map((metric, index) => (
                <Link key={index} to={metric.link}>
                    <Card
                        padding="md"
                        className="h-full hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-600 mb-1 truncate">
                                    {metric.title}
                                </p>
                                <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {metric.value}
                                </p>
                            </div>
                            <div className={`${metric.bgColor} p-2 rounded-lg flex-shrink-0`}>
                                <metric.icon className={`w-4 h-4 ${metric.color}`} />
                            </div>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    );
};

export default OverviewMetrics;
