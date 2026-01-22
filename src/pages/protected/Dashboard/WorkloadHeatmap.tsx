import { type FC, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useWorkloadCalendar } from '../../../hooks/useAnalytics';

interface WorkloadHeatmapProps {
    workspaceId?: string;
    isLoading?: boolean;
}

const WorkloadHeatmap: FC<WorkloadHeatmapProps> = ({ workspaceId, isLoading: parentLoading }) => {
    const [dateRange, setDateRange] = useState<'7' | '14' | '30'>('7');
    const [startDate, setStartDate] = useState<string>('');

    // Calculate date range
    const { start, end } = useMemo(() => {
        const today = new Date();
        const start = startDate ? new Date(startDate) : new Date(today);
        const end = new Date(start);
        end.setDate(start.getDate() + parseInt(dateRange));

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
        };
    }, [dateRange, startDate]);

    // Fetch calendar data from backend
    const { data: calendarData, isLoading } = useWorkloadCalendar(
        workspaceId,
        start,
        end,
        !!workspaceId
    );

    // Generate date array based on range
    const dates = useMemo(() => {
        const startDateObj = new Date(start);
        const days = parseInt(dateRange);
        return Array.from({ length: days }, (_, i) => {
            const date = new Date(startDateObj);
            date.setDate(startDateObj.getDate() + i);
            return date;
        });
    }, [start, dateRange]);

    // Process calendar data
    const { teamMembers, heatmapData } = useMemo(() => {
        if (!calendarData || !calendarData.calendar) {
            return { teamMembers: [], heatmapData: {} };
        }

        const members = calendarData.members || [];
        const calendar = calendarData.calendar || {};

        // Transform calendar data to heatmap format
        const data: Record<string, Record<string, number>> = {};

        members.forEach((member: any) => {
            data[member.userId] = {};
            dates.forEach((date) => {
                const dateStr = date.toISOString().split('T')[0];
                data[member.userId][dateStr] = 0;
            });
        });

        // Populate with actual task counts
        Object.keys(calendar).forEach((dateStr) => {
            const dayData = calendar[dateStr];
            Object.keys(dayData).forEach((userId) => {
                if (data[userId] && data[userId][dateStr] !== undefined) {
                    data[userId][dateStr] = dayData[userId];
                }
            });
        });

        return { teamMembers: members, heatmapData: data };
    }, [calendarData, dates]);

    const getHeatColor = (count: number) => {
        if (count === 0) return 'bg-gray-100';
        if (count <= 2) return 'bg-green-200';
        if (count <= 4) return 'bg-yellow-200';
        if (count <= 6) return 'bg-orange-300';
        return 'bg-red-400';
    };

    const handlePrevious = () => {
        const currentStart = new Date(start);
        currentStart.setDate(currentStart.getDate() - parseInt(dateRange));
        setStartDate(currentStart.toISOString().split('T')[0]);
    };

    const handleNext = () => {
        const currentStart = new Date(start);
        currentStart.setDate(currentStart.getDate() + parseInt(dateRange));
        setStartDate(currentStart.toISOString().split('T')[0]);
    };

    const handleToday = () => {
        setStartDate('');
    };

    if (parentLoading || isLoading) {
        return (
            <Card padding="none">
                <div className="p-4 border-b border-gray-200">
                    <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
                </div>
                <div className="p-4">
                    <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </Card>
        );
    }

    if (!teamMembers || teamMembers.length === 0) {
        return null;
    }

    return (
        <Card padding="none">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    📅 Workload Calendar
                </h2>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    {/* Date Range Selector */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        {(['7', '14', '30'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${dateRange === range
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {range} days
                            </button>
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-1">
                        <Button variant="secondary" size="sm" onClick={handlePrevious}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleToday}>
                            Today
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleNext}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-4 overflow-x-auto">
                <div className="min-w-max">
                    {/* Header - Dates */}
                    <div className="flex items-center mb-2">
                        <div className="w-32 sm:w-40 flex-shrink-0"></div>
                        <div className="flex gap-2">
                            {dates.map((date) => {
                                const isToday = date.toDateString() === new Date().toDateString();
                                return (
                                    <div key={date.toISOString()} className="w-16 text-center">
                                        <p className={`text-xs font-semibold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </p>
                                        <p className={`text-xs ${isToday ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                                            {date.getDate()}/{date.getMonth() + 1}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Rows - Members */}
                    <div className="space-y-1.5">
                        {teamMembers.slice(0, 10).map((member: any) => (
                            <div key={member.userId} className="flex items-center">
                                <div className="w-32 sm:w-40 flex-shrink-0 pr-3">
                                    <p className="text-sm font-medium text-gray-900 truncate" title={member.name}>
                                        {member.name}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    {dates.map((date) => {
                                        const dateStr = date.toISOString().split('T')[0];
                                        const count = heatmapData[member.userId]?.[dateStr] || 0;
                                        const isToday = date.toDateString() === new Date().toDateString();

                                        return (
                                            <div
                                                key={dateStr}
                                                className={`w-16 h-12 rounded ${getHeatColor(count)} flex items-center justify-center border-2 ${isToday ? 'border-blue-400' : 'border-gray-200'
                                                    } hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer`}
                                                title={`${member.name} - ${count} tasks on ${date.toLocaleDateString()}`}
                                            >
                                                <span className="text-sm font-bold text-gray-700">
                                                    {count > 0 ? count : ''}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {teamMembers.length > 10 && (
                        <p className="text-xs text-gray-500 text-center mt-3">
                            Showing first 10 members • {teamMembers.length - 10} more not displayed
                        </p>
                    )}

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-gray-200">
                        <span className="text-xs text-gray-600 font-medium">Workload:</span>
                        <div className="flex items-center gap-2">
                            {[
                                { label: 'None', color: 'bg-gray-100' },
                                { label: '1-2', color: 'bg-green-200' },
                                { label: '3-4', color: 'bg-yellow-200' },
                                { label: '5-6', color: 'bg-orange-300' },
                                { label: '7+', color: 'bg-red-400' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-1">
                                    <div className={`w-4 h-4 rounded ${item.color} border border-gray-300`}></div>
                                    <span className="text-xs text-gray-600">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default WorkloadHeatmap;
