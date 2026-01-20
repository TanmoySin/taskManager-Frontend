import { type FC, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import Card from '../../../components/ui/Card';

interface Task {
    _id: string;
    title: string;
    dueDate: string;
    assigneeId: {
        _id: string;
        name: string;
    };
    status: string;
    priority: string;
}

interface WorkloadHeatmapProps {
    tasks: Task[];
    teamMembers: any[];
    isLoading?: boolean;
}

const WorkloadHeatmap: FC<WorkloadHeatmapProps> = ({
    tasks,
    teamMembers,
    isLoading,
}) => {
    // Get next 5 weekdays
    const weekDays = useMemo(() => {
        const days = [];
        const today = new Date();

        for (let i = 0; i < 5; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);

            days.push({
                date: date,
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                dateStr: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fullDate: date.toISOString().split('T')[0],
            });
        }

        return days;
    }, []);

    // Calculate workload per employee per day
    const heatmapData = useMemo(() => {
        const data: any = {};

        teamMembers.forEach((member: any) => {
            const userId = member.userId || member._id;
            const userName = member.name;

            data[userId] = {
                name: userName,
                days: {},
            };

            weekDays.forEach((day) => {
                data[userId].days[day.fullDate] = {
                    tasks: [],
                    count: 0,
                };
            });
        });

        // Distribute tasks
        tasks.forEach((task) => {
            if (!task.dueDate || task.status === 'DONE') return;

            // ✅ FIX: Handle both string and object types
            let assigneeId: string;
            if (typeof task.assigneeId === 'string') {
                assigneeId = task.assigneeId;
            } else if (task.assigneeId?._id) {
                assigneeId = task.assigneeId._id;
            } else {
                return;
            }

            if (!data[assigneeId]) return;

            const taskDate = new Date(task.dueDate).toISOString().split('T')[0];

            if (data[assigneeId].days[taskDate]) {
                data[assigneeId].days[taskDate].tasks.push(task);
                data[assigneeId].days[taskDate].count++;
            }
        });

        return data;
    }, [tasks, teamMembers, weekDays]);

    // Get cell color based on task count
    const getCellColor = (count: number) => {
        if (count === 0) return 'bg-gray-100 text-gray-400';
        if (count === 1) return 'bg-green-100 text-green-700 font-semibold';
        if (count === 2) return 'bg-green-200 text-green-800 font-semibold';
        if (count === 3) return 'bg-yellow-200 text-yellow-800 font-bold';
        if (count === 4) return 'bg-yellow-300 text-yellow-900 font-bold';
        if (count >= 5) return 'bg-red-300 text-red-900 font-bold';
        return 'bg-gray-100';
    };

    const getEmojiIndicator = (count: number) => {
        if (count === 0) return '';
        if (count <= 2) return '🟢';
        if (count <= 4) return '🟡';
        return '🔴';
    };

    if (isLoading) {
        return (
            <Card padding="md">
                <div className="animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </Card>
        );
    }

    const employeeList = Object.keys(heatmapData);

    if (employeeList.length === 0) {
        return (
            <Card padding="md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    📅 Workload Heatmap
                </h2>
                <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No team members found</p>
                </div>
            </Card>
        );
    }

    return (
        <Card padding="md">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    📅 Workload Heatmap - Next 5 Days
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span>🟢 Light</span>
                    <span>🟡 Moderate</span>
                    <span>🔴 Heavy</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b-2 border-gray-300">
                            <th className="text-left text-xs font-semibold text-gray-700 pb-3 pr-4 sticky left-0 bg-white">
                                Employee
                            </th>
                            {weekDays.map((day) => (
                                <th
                                    key={day.fullDate}
                                    className="text-center text-xs font-semibold text-gray-700 pb-3 px-3"
                                >
                                    <div>{day.dayName}</div>
                                    <div className="text-gray-500 font-normal">{day.dateStr}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {employeeList.map((userId) => {
                            const employee = heatmapData[userId];

                            return (
                                <tr key={userId} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="py-3 pr-4 sticky left-0 bg-white">
                                        <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                            {employee.name}
                                        </p>
                                    </td>
                                    {weekDays.map((day) => {
                                        const dayData = employee.days[day.fullDate];
                                        const count = dayData?.count || 0;
                                        const emoji = getEmojiIndicator(count);

                                        return (
                                            <td
                                                key={day.fullDate}
                                                className="px-3 py-3 text-center"
                                                title={
                                                    count > 0
                                                        ? `${count} task${count > 1 ? 's' : ''} due:\n${dayData.tasks.map((t: any) => `- ${t.title}`).join('\n')}`
                                                        : 'No tasks due'
                                                }
                                            >
                                                <div
                                                    className={`inline-flex items-center justify-center w-12 h-12 rounded-lg transition-all ${getCellColor(count)} cursor-pointer hover:shadow-md`}
                                                >
                                                    <span className="text-sm">
                                                        {count > 0 ? (
                                                            <>
                                                                {emoji} {count}
                                                            </>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2 font-semibold">Legend:</p>
                <div className="flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded bg-gray-100 border border-gray-300"></div>
                        <span className="text-gray-600">0 tasks</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded bg-green-100 border border-green-300"></div>
                        <span className="text-gray-600">1-2 tasks (Light)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded bg-yellow-200 border border-yellow-400"></div>
                        <span className="text-gray-600">3-4 tasks (Moderate)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded bg-red-300 border border-red-400"></div>
                        <span className="text-gray-600">5+ tasks (Heavy)</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default WorkloadHeatmap;
