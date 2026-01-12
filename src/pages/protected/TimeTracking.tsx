
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Timer, Filter, Trash2 } from 'lucide-react';

export default function TimeTracking() {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        projectId: '',
        status: '',
    });

    // Fetch time entries
    const { data: timeEntries, isLoading } = useQuery({
        queryKey: ['timeEntries', filters],
        queryFn: async () => {
            const response = await api.get('/time-tracking/entries', { params: filters });
            return response.data;
        },
    });

    // Fetch summary
    const { data: summary } = useQuery({
        queryKey: ['timeSummary', filters],
        queryFn: async () => {
            const response = await api.get('/time-tracking/entries/summary', { params: filters });
            return response.data;
        },
    });

    // Delete time entry
    const deleteEntryMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/time-tracking/entries/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
            queryClient.invalidateQueries({ queryKey: ['timeSummary'] });
        },
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Time Tracking</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        View and manage your time entries
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card padding="md">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Timer className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{summary.totalHours}h</p>
                                <p className="text-xs text-gray-500">Total Hours</p>
                            </div>
                        </div>
                    </Card>

                    <Card padding="md">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Timer className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{summary.billableHours}h</p>
                                <p className="text-xs text-gray-500">Billable</p>
                            </div>
                        </div>
                    </Card>

                    <Card padding="md">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Timer className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{summary.approvedHours}h</p>
                                <p className="text-xs text-gray-500">Approved</p>
                            </div>
                        </div>
                    </Card>

                    <Card padding="md">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <Timer className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{summary.entryCount}</p>
                                <p className="text-xs text-gray-500">Entries</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card padding="md">
                <div className="flex items-center space-x-4">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <div className="grid grid-cols-4 gap-3 flex-1">
                        <Input
                            type="date"
                            label="Start Date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                        <Input
                            type="date"
                            label="End Date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Status</option>
                                <option value="DRAFT">Draft</option>
                                <option value="SUBMITTED">Submitted</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => setFilters({ startDate: '', endDate: '', projectId: '', status: '' })}
                            className="mt-6"
                        >
                            Clear Filters
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Time Entries List */}
            <Card padding="md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Entries</h3>
                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : timeEntries && timeEntries.length > 0 ? (
                    <div className="space-y-2">
                        {timeEntries.map((entry: any) => (
                            <div key={entry._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-1">
                                        <span className="text-lg font-bold text-blue-600">{entry.hours}h</span>
                                        <span className="text-sm text-gray-600">{entry.taskId?.title || 'Unknown Task'}</span>
                                        {entry.isBillable && <Badge variant="success" size="sm">Billable</Badge>}
                                        <Badge
                                            variant={
                                                entry.status === 'APPROVED' ? 'success' :
                                                    entry.status === 'REJECTED' ? 'danger' : 'default'
                                            }
                                            size="sm"
                                        >
                                            {entry.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <span>{entry.projectId?.name || 'Unknown Project'}</span>
                                        <span>•</span>
                                        <span>{new Date(entry.date).toLocaleDateString()}</span>
                                        {entry.description && (
                                            <>
                                                <span>•</span>
                                                <span className="line-clamp-1">{entry.description}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {entry.status !== 'APPROVED' && (
                                    <button
                                        onClick={() => {
                                            if (confirm('Delete this time entry?')) {
                                                deleteEntryMutation.mutate(entry._id);
                                            }
                                        }}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Timer className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                        <p>No time entries found</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
