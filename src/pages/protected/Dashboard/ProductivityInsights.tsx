import { type FC } from 'react';
import { TrendingUp, TrendingDown, Award, Calendar, Target, Zap } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

interface ProductivityInsightsProps {
    data: {
        period: string;
        totalTasks: number;
        completedTasks: number;
        inProgress: number;
        todo: number;
        onTimeRate: number;
        avgDuration: number;
        streak: number;
        trend: number;
        previousPeriod?: {
            completed: number;
            total: number;
        };
    };
    isLoading?: boolean;
}

const ProductivityInsights: FC<ProductivityInsightsProps> = ({ data, isLoading }) => {
    if (isLoading) {
        return (
            <Card padding="md">
                <div className="animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </Card>
        );
    }

    const periodLabel =
        data?.period === 'week'
            ? 'This Week'
            : data?.period === 'month'
                ? 'This Month'
                : 'Today';

    const stats = [
        {
            label: 'Tasks Completed',
            value: data?.completedTasks || 0,
            icon: Target,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            label: 'On-Time Rate',
            value: `${data?.onTimeRate || 0}%`,
            icon: Calendar,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            label: 'Avg Duration',
            value: `${data?.avgDuration || 0}d`,
            icon: Zap,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            label: 'Streak',
            value: `${data?.streak || 0} days`,
            icon: Award,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
    ];

    return (
        <Card padding="md">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                    🏆 Productivity Insights
                </h2>
                <Badge variant="info" size="sm">
                    {periodLabel}
                </Badge>
            </div>

            {/* Trend indicator */}
            {data?.trend !== 0 && (
                <div className={`mb-4 p-3 rounded-lg ${data.trend > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center gap-2">
                        {data.trend > 0 ? (
                            <>
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700">
                                    {data.trend}% increase from last period
                                </span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="w-4 h-4 text-red-600" />
                                <span className="text-sm font-medium text-red-700">
                                    {Math.abs(data.trend)}% decrease from last period
                                </span>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className={`p-3 rounded-lg ${stat.bgColor} border border-gray-200`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            <p className="text-xs text-gray-600">{stat.label}</p>
                        </div>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Task breakdown */}
            <div className="pt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-2">Task Breakdown</p>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">Completed</span>
                            <span className="font-semibold text-green-600">
                                {data?.completedTasks || 0}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500"
                                style={{
                                    width: `${data?.totalTasks ? (data.completedTasks / data.totalTasks) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">In Progress</span>
                            <span className="font-semibold text-blue-600">
                                {data?.inProgress || 0}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500"
                                style={{
                                    width: `${data?.totalTasks ? (data.inProgress / data.totalTasks) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">To Do</span>
                            <span className="font-semibold text-gray-600">
                                {data?.todo || 0}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gray-400"
                                style={{
                                    width: `${data?.totalTasks ? (data.todo / data.totalTasks) * 100 : 0}%`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Streak highlight */}
            {data?.streak && data.streak > 0 && (
                <div className="mt-3 p-2 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-center gap-2">
                        <Award className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700">
                            🔥 {data.streak} day streak! Keep it going!
                        </span>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default ProductivityInsights;
