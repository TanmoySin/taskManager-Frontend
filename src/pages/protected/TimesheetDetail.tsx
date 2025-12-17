// pages/Timesheets/TimesheetDetail.tsx (NEW FILE)
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { ArrowLeft, Calendar, Clock } from 'lucide-react';

export default function TimesheetDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: timesheet, isLoading } = useQuery({
        queryKey: ['timesheet', id],
        queryFn: async () => {
            const response = await api.get(`/timesheets/${id}`);
            return response.data;
        },
        enabled: !!id,
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
        const start = new Date(startDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
        });
        const end = new Date(endDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
        return `${start} - ${end}`;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!timesheet) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Timesheet not found</p>
                <Button variant="secondary" onClick={() => navigate('/timesheets')} className="mt-4">
                    Back to Timesheets
                </Button>
            </div>
        );
    }

    const days = [];
    const start = new Date(timesheet.weekStartDate);
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push(d);
    }

    const entriesByDate: Record<string, number> = {};
    (timesheet.timeEntries || []).forEach((e: any) => {
        const key = new Date(e.date).toISOString().split('T')[0];
        entriesByDate[key] = (entriesByDate[key] || 0) + e.hours;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <button
                    onClick={() => navigate('/timesheets')}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Timesheets
                </button>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Timesheet Details
                        </h1>
                        <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-700">
                                {formatWeek(timesheet.weekStartDate, timesheet.weekEndDate)}
                            </span>
                            <Badge variant={getStatusColor(timesheet.status)} size="md">
                                {timesheet.status}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card padding="md">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {timesheet.totalHours}h
                            </p>
                            <p className="text-xs text-gray-500">Total Hours</p>
                        </div>
                    </div>
                </Card>

                <Card padding="md">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {timesheet.billableHours}h
                            </p>
                            <p className="text-xs text-gray-500">Billable Hours</p>
                        </div>
                    </div>
                </Card>

                <Card padding="md">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Clock className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {timesheet.nonBillableHours}h
                            </p>
                            <p className="text-xs text-gray-500">Non-Billable Hours</p>
                        </div>
                    </div>
                </Card>

                <Card padding="md">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Week Overview</h3>
                    <div className="grid grid-cols-7 gap-2 text-center">
                        {days.map((d) => {
                            const key = d.toISOString().split('T')[0];
                            const hours = entriesByDate[key] || 0;
                            return (
                                <div
                                    key={key}
                                    className="p-2 border border-gray-200 rounded-lg bg-gray-50"
                                >
                                    <p className="text-xs text-gray-500">
                                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {d.getDate()}
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">{hours}h</p>
                                </div>
                            );
                        })}
                    </div>
                </Card>

            </div>

            {/* Rejection Reason */}
            {timesheet.status === 'REJECTED' && timesheet.rejectionReason && (
                <Card padding="md">
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <p className="text-sm font-semibold text-red-800 mb-2">
                            Rejection Reason:
                        </p>
                        <p className="text-sm text-red-700">{timesheet.rejectionReason}</p>
                        <p className="text-xs text-red-600 mt-2">
                            Rejected by {timesheet.rejectedBy?.name} on{' '}
                            {new Date(timesheet.rejectedAt).toLocaleString()}
                        </p>
                    </div>
                </Card>
            )}

            {/* Time Entries */}
            <Card padding="md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Time Entries ({timesheet.timeEntries?.length || 0})
                </h3>

                {timesheet.timeEntries && timesheet.timeEntries.length > 0 ? (
                    <div className="space-y-2">
                        {timesheet.timeEntries.map((entry: any) => (
                            <div
                                key={entry._id}
                                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <span className="text-lg font-bold text-blue-600">
                                                {entry.hours}h
                                            </span>
                                            <span className="text-sm text-gray-700">
                                                {entry.taskId?.title || 'Unknown Task'}
                                            </span>
                                            {entry.isBillable && (
                                                <Badge variant="success" size="sm">
                                                    Billable
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                            <span>{entry.projectId?.name || 'Unknown Project'}</span>
                                            <span>•</span>
                                            <span>
                                                {new Date(entry.date).toLocaleDateString()}
                                            </span>
                                            {entry.description && (
                                                <>
                                                    <span>•</span>
                                                    <span>{entry.description}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No time entries for this week</p>
                    </div>
                )}
            </Card>

            {/* Notes */}
            {timesheet.notes && (
                <Card padding="md">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-sm text-gray-700">{timesheet.notes}</p>
                </Card>
            )}

            {/* Approval Info */}
            {timesheet.status === 'APPROVED' && timesheet.approvedBy && (
                <Card padding="md">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="text-sm font-semibold text-green-800 mb-1">
                            Approved by {timesheet.approvedBy.name}
                        </p>
                        <p className="text-xs text-green-600">
                            {new Date(timesheet.approvedAt).toLocaleString()}
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
}
