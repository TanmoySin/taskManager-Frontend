import { type FC } from 'react';
import { Clock, TrendingUp, TrendingDown, Timer } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import { useTeamTimeOverview } from '../../../hooks/useAnalytics';

interface TimeTrackingWidgetProps {
    workspaceId?: string;
}

const TimeTrackingWidget: FC<TimeTrackingWidgetProps> = ({ workspaceId }) => {
    const { data, isLoading } = useTeamTimeOverview(workspaceId);

    if (isLoading) {
        return (
            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
                </div>
                <div className="p-4 space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                </div>
            </Card>
        );
    }

    if (!data) {
        return null;
    }

    const totalHours = data.totalHoursLogged || 0;
    const estimatedHours = data.totalEstimatedHours || 0;
    const variance = totalHours - estimatedHours;
    const variancePercent = estimatedHours > 0
        ? ((variance / estimatedHours) * 100).toFixed(1)
        : 0;
    const avgHoursPerDay = data.averageHoursPerDay || 0;
    const activeTimers = data.activeTimersCount || 0;

    const isOverEstimate = variance > 0;

    return (
        <Card padding="none">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    ⏱️ Time Tracking Overview
                </h2>
            </div>

            <div className="p-4 space-y-2">
                {/* Total Hours Logged */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                        <p className="text-xs font-medium text-gray-600">Hours Logged (Week)</p>
                        <p className="text-xl font-bold text-blue-600 mt-0.5">
                            {totalHours.toFixed(1)}h
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Estimated</p>
                        <p className="text-sm font-semibold text-gray-700">{estimatedHours.toFixed(1)}h</p>
                    </div>
                </div>

                {/* Variance */}
                <div className={`flex items-center justify-between p-3 rounded-lg ${isOverEstimate ? 'bg-red-50' : 'bg-green-50'
                    }`}>
                    <div className="flex items-center gap-2">
                        {isOverEstimate ? (
                            <TrendingUp className="w-4 h-4 text-red-600" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-green-600" />
                        )}
                        <div>
                            <p className="text-xs font-medium text-gray-600">Variance</p>
                            <p className={`text-lg font-bold mt-0.5 ${isOverEstimate ? 'text-red-600' : 'text-green-600'
                                }`}>
                                {isOverEstimate ? '+' : ''}{variance.toFixed(1)}h
                            </p>
                        </div>
                    </div>
                    <Badge variant={isOverEstimate ? 'danger' : 'success'} size="sm">
                        {isOverEstimate ? '+' : ''}{variancePercent}%
                    </Badge>
                </div>

                {/* Average Hours & Active Timers */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-600 mb-1">Avg/Day</p>
                        <p className="text-lg font-bold text-purple-600">
                            {avgHoursPerDay.toFixed(1)}h
                        </p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Timer className="w-3.5 h-3.5 text-orange-600" />
                            <p className="text-xs font-medium text-gray-600">Active Now</p>
                        </div>
                        <p className="text-lg font-bold text-orange-600">
                            {activeTimers}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default TimeTrackingWidget;
