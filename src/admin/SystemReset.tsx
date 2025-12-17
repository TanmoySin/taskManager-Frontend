import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Trash2, Shield } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { logout } from '../store/authSlice';

export default function SystemReset() {
    const user = useAppSelector((state) => state.auth.user);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

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
