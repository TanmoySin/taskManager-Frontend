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
            link: '/tasks',
        },
        {
            title: 'Completed',
            value: data?.completedTasks || 0,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            link: '/tasks',
        },
        {
            title: 'Team Members',
            value: data?.teamMembers || 0,
            icon: Users,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            link: '/team',
        },
        {
            title: 'Overdue',
            value: data?.overdueCount || 0,
            icon: AlertCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            link: '/tasks',
        },
        {
            title: 'Due Today',
            value: data?.dueTodayCount || 0,
            icon: Calendar,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            link: '/tasks',
        },
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                    <Card key={i} padding="md">
                        <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {metrics.map((metric, index) => (
                <Card key={index} padding="md" className="h-full hover:shadow-md transition-shadow">
                    <Link to={metric.link} className="block h-full">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="text-xs font-medium text-gray-600 mb-1">
                                    {metric.title}
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {metric.value}
                                </p>
                            </div>
                            <div className={`${metric.bgColor} p-3 rounded-lg`}>
                                <metric.icon className={`w-5 h-5 ${metric.color}`} />
                            </div>
                        </div>
                    </Link>
                </Card>
            ))}
        </div>
    );
};

export default OverviewMetrics;
