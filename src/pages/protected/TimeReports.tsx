import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { BarChart3, Filter } from 'lucide-react';

export default function TimeReports() {
    const [filters, setFilters] = useState({
        workspaceId: '',
        userId: '',
        startDate: '',
        endDate: '',
        status: '',
    });

    const { data, isLoading } = useQuery({
        queryKey: ['timesheetReport', filters],
        queryFn: async () => {
            const response = await api.get('/timesheets/report', { params: filters });
            return response.data;
        },
    });

    const summary = data?.summary;
    const timesheets = data?.timesheets || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Time Reports</h1>
                <BarChart3 className="w-6 h-6 text-gray-400" />
            </div>

            {/* Filters */}
            <Card padding="md">
                <div className="flex items-center space-x-4">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <div className="grid grid-cols-4 gap-3 flex-1">
                        <Input
                            type="date"
                            label="Start Date"
                            value={filters.startDate}
                            onChange={(e) =>
                                setFilters({ ...filters, startDate: e.target.value })
                            }
                        />
                        <Input
                            type="date"
                            label="End Date"
                            value={filters.endDate}
                            onChange={(e) =>
                                setFilters({ ...filters, endDate: e.target.value })
                            }
                        />
                        <Input
                            type="text"
                            label="User ID (optional)"
                            value={filters.userId}
                            onChange={(e) =>
                                setFilters({ ...filters, userId: e.target.value })
                            }
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) =>
                                    setFilters({ ...filters, status: e.target.value })
                                }
                                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All</option>
                                <option value="DRAFT">Draft</option>
                                <option value="SUBMITTED">Submitted</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Summary */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card padding="md">
                        <p className="text-xs text-gray-500">Total Hours</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {summary.totalHours}h
                        </p>
                    </Card>
                    <Card padding="md">
                        <p className="text-xs text-gray-500">Billable Hours</p>
                        <p className="text-2xl font-bold text-green-600">
                            {summary.billableHours}h
                        </p>
                    </Card>
                    <Card padding="md">
                        <p className="text-xs text-gray-500">Approved Timesheets</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {summary.approvedTimesheets}
                        </p>
                    </Card>
                    <Card padding="md">
                        <p className="text-xs text-gray-500">Pending Timesheets</p>
                        <p className="text-2xl font-bold text-yellow-600">
                            {summary.pendingTimesheets}
                        </p>
                    </Card>
                </div>
            )}

            {/* Timesheets list */}
            <Card padding="md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Timesheets ({timesheets.length})
                </h3>
                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                    </div>
                ) : timesheets.length ? (
                    <div className="space-y-2">
                        {timesheets.map((ts: any) => (
                            <div
                                key={ts._id}
                                className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {ts.userId?.name} •{' '}
                                        {new Date(ts.weekStartDate).toLocaleDateString()} –{' '}
                                        {new Date(ts.weekEndDate).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Workspace: {ts.workspaceId?.name} • Hours:{' '}
                                        {ts.totalHours}h (Billable {ts.billableHours}h)
                                    </p>
                                </div>
                                <Badge
                                    variant={
                                        ts.status === 'APPROVED'
                                            ? 'success'
                                            : ts.status === 'SUBMITTED'
                                                ? 'info'
                                                : ts.status === 'REJECTED'
                                                    ? 'danger'
                                                    : 'default'
                                    }
                                    size="sm"
                                >
                                    {ts.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p>No timesheets found for this filter.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
