import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Trash2, Shield, Bell, CheckCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { logout } from '../store/authSlice';

export default function SystemReset() {
    const user = useAppSelector((state) => state.auth.user);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();

    const [confirmText, setConfirmText] = useState('');
    const [emailConfirm, setEmailConfirm] = useState('');
    const [acknowledged, setAcknowledged] = useState(false);

    const resetMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post('/api/admin/reset-app');
            return response.data;
        },
        onSuccess: () => {
            alert('Application data has been cleared. You may need to sign in again.');
            dispatch(logout());
            navigate('/');
        },
        onError: (error: any) => {
            alert(
                'Failed to reset application: ' +
                (error?.response?.data?.error || error.message),
            );
        },
    });

    // ✅ ADD: Test Notifications Mutation
    const createTestNotificationsMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post('/test/create-test-notifications');
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            alert(`✅ Created ${data.notifications.length} test notifications! Check the bell icon 🔔`);
        },
        onError: (error: any) => {
            alert('Failed to create notifications: ' + (error?.response?.data?.error || error.message));
        },
    });

    // ✅ ADD: Clear All Notifications Mutation
    const clearAllNotificationsMutation = useMutation({
        mutationFn: async () => {
            const response = await api.delete('/test/clear-all-notifications');
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            alert(`🗑️ Deleted ${data.deletedCount} notifications`);
        },
        onError: (error: any) => {
            alert('Failed to clear notifications: ' + (error?.response?.data?.error || error.message));
        },
    });

    const isAdmin = user?.role === 'Administrator';

    const canSubmit =
        isAdmin &&
        confirmText === 'DELETE EVERYTHING' &&
        emailConfirm === user?.email &&
        acknowledged &&
        !resetMutation.isPending;

    if (!isAdmin) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900">System Reset</h1>
                <Card padding="md" className="border border-red-200 bg-red-50">
                    <p className="text-sm text-red-700">
                        You do not have permission to access this page.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">System Reset</h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Permanently clear all application data. This action cannot be undone.
                    </p>
                </div>
                <Shield className="w-8 h-8 text-red-500" />
            </div>

            {/* ✅ ADD: Test Notifications Section */}
            <Card padding="md" className="border border-blue-200 bg-blue-50">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                        <Bell className="w-6 h-6 text-blue-600 mt-1" />
                        <div>
                            <h2 className="text-sm font-semibold text-blue-800">
                                🧪 Test Notifications
                            </h2>
                            <p className="text-xs text-blue-700 mt-1">
                                Create sample notifications to test the notification system.
                                This will create 4 different types of notifications.
                            </p>
                            <div className="mt-3 space-y-1 text-xs text-blue-700">
                                <div className="flex items-center gap-2">
                                    <Badge variant="info" size="sm">1</Badge>
                                    <span>⏰ Task Due Soon (DUE_DATE_REMINDER)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="info" size="sm">2</Badge>
                                    <span>🚨 Team Workload Alert (DEADLINE)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="info" size="sm">3</Badge>
                                    <span>📋 New Task Assigned (TASK_ASSIGNED)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="info" size="sm">4</Badge>
                                    <span>💬 You were mentioned (MENTION)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => createTestNotificationsMutation.mutate()}
                            isLoading={createTestNotificationsMutation.isPending}
                        >
                            <Bell className="w-4 h-4 mr-2" />
                            Create Test Notifications
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => clearAllNotificationsMutation.mutate()}
                            isLoading={clearAllNotificationsMutation.isPending}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear All Notifications
                        </Button>
                    </div>
                </div>

                {/* Success message after creation */}
                {createTestNotificationsMutation.isSuccess && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">
                                ✅ Test notifications created! Check the bell icon 🔔 in the navbar.
                            </span>
                        </div>
                    </div>
                )}
            </Card>

            {/* Warning card */}
            <Card padding="lg" className="border border-red-200 bg-red-50">
                <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
                    <div className="space-y-3">
                        <div>
                            <h2 className="text-sm font-semibold text-red-800">
                                Danger Zone: Clear All Data
                            </h2>
                            <p className="text-xs text-red-700 mt-1">
                                This will delete all workspaces, projects, tasks, time entries,
                                timesheets, notifications, and uploaded files. Only Administrator
                                users will remain. This cannot be undone.
                            </p>
                        </div>

                        <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                            <li>All projects and tasks will be permanently removed.</li>
                            <li>All time tracking data and timesheets will be deleted.</li>
                            <li>All media stored in Cloudinary for this app will be removed.</li>
                            <li>Only Administrator user accounts will remain in the system.</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Confirmation form */}
            <Card padding="md" className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Step 1: Type <span className="font-mono">DELETE EVERYTHING</span> to confirm
                    </label>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="DELETE EVERYTHING"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Step 2: Enter your administrator email
                    </label>
                    <input
                        type="email"
                        value={emailConfirm}
                        onChange={(e) => setEmailConfirm(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder={user?.email || 'admin@example.com'}
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        id="ack"
                        type="checkbox"
                        checked={acknowledged}
                        onChange={(e) => setAcknowledged(e.target.checked)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                    />
                    <label
                        htmlFor="ack"
                        className="text-xs text-gray-700 cursor-pointer"
                    >
                        I understand that this will permanently delete all data and cannot be
                        undone.
                    </label>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                    <Button
                        variant="danger"
                        size="md"
                        onClick={() => {
                            if (
                                window.confirm(
                                    'Are you absolutely sure? This will permanently delete all application data.',
                                )
                            ) {
                                resetMutation.mutate();
                            }
                        }}
                        disabled={!canSubmit}
                        isLoading={resetMutation.isPending}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All Data
                    </Button>
                </div>
            </Card>
        </div>
    );
}
