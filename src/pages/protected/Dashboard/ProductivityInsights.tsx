import { type FC } from 'react';
import { TrendingUp, CheckCircle, Clock, Target } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { useMyTimeUtilization } from '../../../hooks/useAnalytics';

interface ProductivityInsightsProps {
    data?: any;
    isLoading?: boolean;
}

const ProductivityInsights: FC<ProductivityInsightsProps> = ({ data, isLoading }) => {
    // Fetch time utilization data
    const { data: timeData } = useMyTimeUtilization(!isLoading);

    if (isLoading) {
        return (
            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
                </div>
                <div className="p-4 space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                </div>
            </Card>
        );
    }

    const completedTasks = data?.completedTasks || 0;
    const completionRate = data?.completionRate || 0;
    const onTimeRate = data?.onTimeRate || 0;
    const avgCompletionTime = data?.avgCompletionTime || 0;

    // Time tracking data
    const weekHours = timeData?.weekHours || 0;
    const utilization = timeData?.utilization || 0;
    const avgHoursPerTask = timeData?.averageHoursPerTask || 0;

    return (
        <Card padding="none">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    📊 Productivity Insights
                </h2>
            </div>

            <div className="p-4 space-y-2">
                {/* Completed Tasks */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <div>
                            <p className="text-xs font-medium text-gray-600">Tasks Completed</p>
                            <p className="text-sm text-gray-500 mt-0.5">This week</p>
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
                </div>

                {/* Completion Rate */}
                <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-medium text-gray-600">Completion Rate</span>
                        </div>
                        <Badge
                            variant={
                                completionRate >= 80
                                    ? 'success'
                                    : completionRate >= 60
                                        ? 'info'
                                        : 'warning'
                            }
                            size="sm"
                        >
                            {completionRate}%
                        </Badge>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${completionRate >= 80
                                    ? 'bg-green-500'
                                    : completionRate >= 60
                                        ? 'bg-blue-500'
                                        : 'bg-yellow-500'
                                }`}
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                </div>

                {/* On-Time Rate */}
                <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">On-Time Delivery</span>
                        <Badge
                            variant={
                                onTimeRate >= 80
                                    ? 'success'
                                    : onTimeRate >= 60
                                        ? 'warning'
                                        : 'danger'
                            }
                            size="sm"
                        >
                            {onTimeRate}%
                        </Badge>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${onTimeRate >= 80
                                    ? 'bg-green-500'
                                    : onTimeRate >= 60
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                }`}
                            style={{ width: `${onTimeRate}%` }}
                        />
                    </div>
                </div>

                {/* ⭐ NEW: Time Tracking Stats */}
                {weekHours > 0 && (
                    <>
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-600" />
                                <div>
                                    <p className="text-xs font-medium text-gray-600">Hours Logged</p>
                                    <p className="text-sm text-gray-500 mt-0.5">This week</p>
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-orange-600">{weekHours.toFixed(1)}h</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                <p className="text-xs text-gray-600 mb-1">Utilization</p>
                                <p className={`text-lg font-bold ${utilization >= 80 ? 'text-green-600' : 'text-gray-700'
                                    }`}>
                                    {utilization}%
                                </p>
                            </div>
                            <div className="p-2 bg-gray-50 rounded border border-gray-200">
                                <p className="text-xs text-gray-600 mb-1">Avg hrs/task</p>
                                <p className="text-lg font-bold text-gray-700">
                                    {avgHoursPerTask.toFixed(1)}h
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {/* Average Completion Time */}
                {avgCompletionTime > 0 && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-xs font-medium text-gray-600">Avg Completion Time</span>
                        <span className="text-sm font-bold text-gray-900">
                            {avgCompletionTime.toFixed(1)} days
                        </span>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ProductivityInsights;
