import { type FC } from 'react';
import { Users } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

interface Employee {
    userId: string;
    name: string;
    email: string;
    avatarUrl?: string;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    overdueCount: number;
    inProgressCount: number;
    todoCount: number;
    status: 'AVAILABLE' | 'WORKING' | 'OVERLOADED' | 'IDLE';
    capacity: number;
}

interface WorkloadDistributionProps {
    data: Employee[];
    isLoading?: boolean;
}

const WorkloadDistribution: FC<WorkloadDistributionProps> = ({ data, isLoading }) => {
    const statusConfig = {
        AVAILABLE: { emoji: '🟢', label: 'Available', color: 'text-green-600', bgColor: 'bg-green-50' },
        WORKING: { emoji: '🔵', label: 'Healthy', color: 'text-blue-600', bgColor: 'bg-blue-50' },
        OVERLOADED: { emoji: '🔴', label: 'Overloaded', color: 'text-red-600', bgColor: 'bg-red-50' },
        IDLE: { emoji: '⚪', label: 'Idle', color: 'text-gray-600', bgColor: 'bg-gray-50' },
    };

    if (isLoading) {
        return (
            <Card padding="md">
                <div className="animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card padding="md">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    🎯 Workload Distribution
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
                    <Users className="w-5 h-5" />
                    🎯 Workload Distribution
                </h2>
                <Badge variant="default" size="sm">
                    {data.length} members
                </Badge>
            </div>

            <div className="space-y-3">
                {data.map((employee) => {
                    const statusInfo = statusConfig[employee.status];
                    const capacityColor =
                        employee.capacity >= 120
                            ? 'bg-red-500'
                            : employee.capacity >= 80
                                ? 'bg-yellow-500'
                                : employee.capacity >= 50
                                    ? 'bg-blue-500'
                                    : 'bg-green-500';

                    return (
                        <div
                            key={employee.userId}
                            className={`p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors ${statusInfo.bgColor}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-700 flex-shrink-0">
                                        {employee.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900 truncate">
                                            {employee.name}
                                        </p>
                                        <p className="text-xs text-gray-600 truncate">
                                            {employee.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Badge
                                        variant={
                                            employee.status === 'OVERLOADED'
                                                ? 'danger'
                                                : employee.status === 'WORKING'
                                                    ? 'info'
                                                    : 'default'
                                        }
                                        size="sm"
                                    >
                                        {statusInfo.emoji} {statusInfo.label}
                                    </Badge>
                                </div>
                            </div>

                            {/* Task bubbles visualization */}
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex gap-1">
                                    {[...Array(Math.min(employee.activeTasks, 10))].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-3 h-3 rounded-full ${i < employee.overdueCount
                                                    ? 'bg-red-500'
                                                    : i < employee.overdueCount + employee.inProgressCount
                                                        ? 'bg-blue-500'
                                                        : 'bg-gray-400'
                                                }`}
                                            title={
                                                i < employee.overdueCount
                                                    ? 'Overdue'
                                                    : i < employee.overdueCount + employee.inProgressCount
                                                        ? 'In Progress'
                                                        : 'To Do'
                                            }
                                        />
                                    ))}
                                    {employee.activeTasks > 10 && (
                                        <span className="text-xs text-gray-500 ml-1">
                                            +{employee.activeTasks - 10}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div>
                                    <p className="text-xs text-gray-500">Active</p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {employee.activeTasks}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Overdue</p>
                                    <p className={`text-sm font-semibold ${employee.overdueCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                        {employee.overdueCount}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Completed</p>
                                    <p className="text-sm font-semibold text-green-600">
                                        {employee.completedTasks}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Capacity</p>
                                    <p className={`text-sm font-semibold ${employee.capacity >= 100 ? 'text-red-600' : 'text-gray-900'}`}>
                                        {employee.capacity}%
                                    </p>
                                </div>
                            </div>

                            {/* Capacity bar */}
                            <div className="mt-2">
                                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${capacityColor}`}
                                        style={{ width: `${Math.min(employee.capacity, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

export default WorkloadDistribution;
