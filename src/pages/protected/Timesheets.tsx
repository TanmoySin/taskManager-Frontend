// pages/Timesheets/Timesheets.tsx (NEW FILE)
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { FileText, Calendar, Send, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Timesheets() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: '',
    });

    // Fetch timesheets
    const { data: timesheets, isLoading } = useQuery({
        queryKey: ['timesheets', filters],
        queryFn: async () => {
            const response = await api.get('/timesheets', { params: filters });
            return response.data;
        },
    });

    // Submit timesheet
    const submitTimesheetMutation = useMutation({
        mutationFn: (id: string) => api.post(`/timesheets/${id}/submit`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['timesheets'] });
        },
        onError: (error: any) => {
            alert('Failed to submit: ' + (error.response?.data?.error || error.message));
        },
    });

    const createTimesheetMutation = useMutation({
        mutationFn: async () => {
            // You need a workspaceId; simplest is: use the first workspace
            const workspacesRes = await api.get('/workspaces');
            const workspaces = workspacesRes.data;
            if (!workspaces || workspaces.length === 0) {
                throw new Error('No workspace found. Create a workspace first.');
            }

            const workspaceId = workspaces[0]._id;

            const response = await api.post('/timesheets', {
                workspaceId,
                date: new Date().toISOString(), // current week
            });
            return response.data;
        },
        onSuccess: (timesheet) => {
            queryClient.invalidateQueries({ queryKey: ['timesheets'] });
            navigate(`/timesheets/${timesheet._id}`);
        },
        onError: (error: any) => {
            alert(
                'Failed to create timesheet: ' +
                (error.response?.data?.error || error.message),
            );
        },
    });

    const getStatusColor = (status: string) => {
        const colors: any = {
            DRAFT: 'default',
            SUBMITTED: 'info',
            APPROVED: 'success',
            REJECTED: 'danger',
        };
        return colors[status] || 'default';
    };

    const formatWeek = (startDate: string, endDate: string) => {
        const start = new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const end = new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${start} - ${end}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Timesheets</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Submit your weekly timesheets for approval
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="md"
                    onClick={() => createTimesheetMutation.mutate()}
                    isLoading={createTimesheetMutation.isPending}
                >
                    <FileText className="w-4 h-4 mr-2" />
                    Create Timesheet
                </Button>
            </div>

            {/* Filters */}
            <Card padding="md">
                <div className="grid grid-cols-3 gap-4">
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
                </div>
            </Card>

            {/* Timesheets List */}
            <div className="space-y-3">
                {isLoading ? (
                    <Card padding="lg">
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-3">Loading timesheets...</p>
                        </div>
                    </Card>
                ) : timesheets && timesheets.length > 0 ? (
                    timesheets.map((timesheet: any) => (
                        <Card
                            key={timesheet._id}
                            padding="md"
                            className="hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <Calendar className="w-5 h-5 text-gray-400" />
                                        <h3 className="text-base font-semibold text-gray-900">
                                            Week of {formatWeek(timesheet.weekStartDate, timesheet.weekEndDate)}
                                        </h3>
                                        <Badge variant={getStatusColor(timesheet.status)} size="sm">
                                            {timesheet.status}
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-3 gap-6 mt-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Total Hours</p>
                                            <p className="text-lg font-bold text-blue-600">{timesheet.totalHours}h</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Billable Hours</p>
                                            <p className="text-lg font-bold text-green-600">{timesheet.billableHours}h</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Non-Billable Hours</p>
                                            <p className="text-lg font-bold text-gray-600">{timesheet.nonBillableHours}h</p>
                                        </div>
                                    </div>

                                    {timesheet.status === 'REJECTED' && timesheet.rejectionReason && (
                                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</p>
                                            <p className="text-sm text-red-700">{timesheet.rejectionReason}</p>
                                        </div>
                                    )}

                                    {timesheet.notes && (
                                        <div className="mt-3">
                                            <p className="text-xs text-gray-500">Notes: {timesheet.notes}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2 ml-4">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => navigate(`/timesheets/${timesheet._id}`)}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View
                                    </Button>

                                    {timesheet.status === 'DRAFT' && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => submitTimesheetMutation.mutate(timesheet._id)}
                                            isLoading={submitTimesheetMutation.isPending}
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            Submit
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <Card padding="lg">
                        <div className="text-center py-12 text-gray-500">
                            <FileText className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                            <p>No timesheets found</p>
                            <p className="text-sm mt-1">Create your first timesheet to get started</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
