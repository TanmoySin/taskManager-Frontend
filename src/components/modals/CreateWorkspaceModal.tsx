// src/components/modals/CreateWorkspaceModal.tsx
import { type FC, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Users, Building2, AlertCircle } from 'lucide-react';
import { useAppSelector } from '../../store/hooks'; // 🔥 ADD THIS

interface CreateWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateWorkspaceModal: FC<CreateWorkspaceModalProps> = ({
    isOpen,
    onClose,
}) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
    });

    // 🔥 GLOBAL ADMIN CHECK
    const userRole = useAppSelector((state) => state.auth.user?.role);
    const isGlobalAdmin = userRole === 'Administrator';

    const createWorkspaceMutation = useMutation({
        mutationFn: (data: any) => api.post('/workspaces', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            onClose();
            resetForm();
        },
        onError: (error: any) => {
            alert(
                'Failed to create workspace: ' +
                (error.response?.data?.error || error.message),
            );
        },
    });

    const resetForm = () => {
        setFormData({ name: '' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createWorkspaceMutation.mutate(formData);
    };

    // 🔥 CLOSE MODAL IF NOT GLOBAL ADMIN
    if (!isGlobalAdmin && isOpen) {
        onClose();
    }

    return (
        <Modal
            isOpen={isOpen && isGlobalAdmin} // 🔥 ONLY OPEN FOR GLOBAL ADMIN
            onClose={onClose}
            title="Create Workspace"
            size="md"
        >
            {/* 🔥 PERMISSION DENIED MESSAGE */}
            {!isGlobalAdmin ? (
                <div className="py-8 px-6 text-center">
                    <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Insufficient Permissions
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                        Only Global Administrators can create new workspaces.
                    </p>
                    <p className="text-xs text-gray-500">
                        Your role: {userRole || 'Guest'}
                    </p>
                </div>
            ) : (
                <>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <Building2 className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>

                        <Input
                            label="Workspace Name"
                            type="text"
                            placeholder="e.g., Marketing Team, Design Studio"
                            required
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                        />

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900">
                                        Team Workspace
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Create a shared space for your team to collaborate on
                                        projects and tasks.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {createWorkspaceMutation.isError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                Failed to create workspace. Please try again.
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <Button type="button" variant="secondary" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                isLoading={createWorkspaceMutation.isPending}
                            >
                                Create Workspace
                            </Button>
                        </div>
                    </form>
                </>
            )}
        </Modal>
    );
};

export default CreateWorkspaceModal;
