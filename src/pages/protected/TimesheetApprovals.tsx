import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { CheckCircle, XCircle, Calendar, User } from 'lucide-react';

export default function TimesheetApprovals() {
    const queryClient = useQueryClient();
    const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    // Fetch pending timesheets
    const { data: pendingTimesheets, isLoading } = useQuery({
        queryKey: ['pendingTimesheets'],
        queryFn: async () => {
            const response = await api.get('/timesheets/pending');
            return response.data;
        },
    });

    // Approve timesheet
    const approveTimesheetMutation = useMutation({
        mutationFn: (id: string) => api.post(`/timesheets/${id}/approve`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingTimesheets'] });
            alert('Timesheet approved successfully!');
        },
        onError: (error: any) => {
            alert('Failed to approve: ' + (error.response?.data?.error || error.message));
        },
    });

    // Reject timesheet
    const rejectTimesheetMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            api.post(`/timesheets/${id}/reject`, { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingTimesheets'] });
            setIsRejectModalOpen(false);
            setRejectionReason('');
            setSelectedTimesheet(null);
            alert('Timesheet rejected');
        },
        onError: (error: any) => {
            alert('Failed to reject: ' + (error.response?.data?.error || error.message));
        },
    });

    // Bulk approve
    const bulkApproveMutation = useMutation({
        mutationFn: (timesheetIds: string[]) =>
            api.post('/timesheets/bulk-approve', { timesheetIds }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pendingTimesheets'] });
            alert('Timesheets approved successfully!');
        },
    });

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const handleSelectAll = () => {
        if (selectedIds.length === pendingTimesheets?.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pendingTimesheets?.map((t: any) => t._id) || []);
        }
    };

    const handleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((sid) => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleReject = (timesheet: any) => {
        setSelectedTimesheet(timesheet);
        setIsRejectModalOpen(true);
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
                    <h1 className="text-2xl font-bold text-gray-900">Timesheet Approvals</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Review and approve team timesheets
                    </p>
                </div>
                {selectedIds.length > 0 && (
                    <Button
                        variant="primary"
                        size="md"
                        onClick={() => bulkApproveMutation.mutate(selectedIds)}
                        isLoading={bulkApproveMutation.isPending}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Selected ({selectedIds.length})
                    </Button>
                )}
            </div>

            {/* Pending Timesheets */}
            <Card padding="md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Pending Approvals ({pendingTimesheets?.length || 0})
                    </h3>
                    {pendingTimesheets && pendingTimesheets.length > 0 && (
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedIds.length === pendingTimesheets.length}
                                onChange={handleSelectAll}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Select All</span>
                        </label>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : pendingTimesheets && pendingTimesheets.length > 0 ? (
                    <div className="space-y-3">
                        {pendingTimesheets.map((timesheet: any) => (
                            <div
                                key={timesheet._id}
                                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(timesheet._id)}
                                            onChange={() => handleSelectOne(timesheet._id)}
                                            className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        />

                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span className="font-semibold text-gray-900">
                                                    {timesheet.userId?.name}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    ({timesheet.userId?.email})
                                                </span>
                                            </div>

                                            <div className="flex items-center space-x-3 mb-3">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-700">
                                                    {formatWeek(timesheet.weekStartDate, timesheet.weekEndDate)}
                                                </span>
                                                <Badge variant="info" size="sm">
                                                    {timesheet.status}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 mb-3">
                                                <div className="bg-white p-2 rounded border border-gray-200">
                                                    <p className="text-xs text-gray-500">Total Hours</p>
                                                    <p className="text-lg font-bold text-blue-600">{timesheet.totalHours}h</p>
                                                </div>
                                                <div className="bg-white p-2 rounded border border-gray-200">
                                                    <p className="text-xs text-gray-500">Billable</p>
                                                    <p className="text-lg font-bold text-green-600">{timesheet.billableHours}h</p>
                                                </div>
                                                <div className="bg-white p-2 rounded border border-gray-200">
                                                    <p className="text-xs text-gray-500">Non-Billable</p>
                                                    <p className="text-lg font-bold text-gray-600">{timesheet.nonBillableHours}h</p>
                                                </div>
                                            </div>

                                            {timesheet.notes && (
                                                <div className="bg-blue-50 p-2 rounded mb-3">
                                                    <p className="text-xs font-medium text-blue-800 mb-1">Notes:</p>
                                                    <p className="text-sm text-blue-700">{timesheet.notes}</p>
                                                </div>
                                            )}

                                            <p className="text-xs text-gray-500">
                                                Submitted: {new Date(timesheet.submittedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 ml-4">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => approveTimesheetMutation.mutate(timesheet._id)}
                                            isLoading={approveTimesheetMutation.isPending}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Approve
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleReject(timesheet)}
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <CheckCircle className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                        <p>No pending timesheets</p>
                        <p className="text-sm mt-1">All timesheets have been reviewed</p>
                    </div>
                )}
            </Card>

            {/* Reject Modal */}
            <Modal
                isOpen={isRejectModalOpen}
                onClose={() => {
                    setIsRejectModalOpen(false);
                    setRejectionReason('');
                    setSelectedTimesheet(null);
                }}
                title="Reject Timesheet"
                size="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Please provide a reason for rejecting this timesheet. The user will be notified.
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Rejection Reason *
                        </label>
                        <textarea
                            rows={4}
                            required
                            placeholder="e.g., Missing time entries, incorrect hours, needs clarification..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setIsRejectModalOpen(false);
                                setRejectionReason('');
                                setSelectedTimesheet(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                if (rejectionReason.trim()) {
                                    rejectTimesheetMutation.mutate({
                                        id: selectedTimesheet._id,
                                        reason: rejectionReason,
                                    });
                                }
                            }}
                            isLoading={rejectTimesheetMutation.isPending}
                            disabled={!rejectionReason.trim()}
                        >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject Timesheet
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
