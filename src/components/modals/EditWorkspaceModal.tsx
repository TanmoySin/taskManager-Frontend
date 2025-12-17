// src/components/modals/EditWorkspaceModal.tsx
import { type FC, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Building2 } from 'lucide-react';

interface EditWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspace: any;
}

const EditWorkspaceModal: FC<EditWorkspaceModalProps> = ({
    isOpen,
    onClose,
    workspace,
}) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
    });

    useEffect(() => {
        if (workspace) {
            setFormData({
                name: workspace.name || '',
            });
        }
    }, [workspace]);

    const updateWorkspaceMutation = useMutation({
        mutationFn: (data: any) =>
            api.patch(`/workspaces/${workspace._id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            queryClient.invalidateQueries({
                queryKey: ['workspace', workspace._id],
            });
            onClose();
        },
        onError: (error: any) => {
            alert(
                'Failed to update workspace: ' +
                (error.response?.data?.error || error.message),
            );
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateWorkspaceMutation.mutate(formData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Workspace"
            size="md"
        >
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

                {updateWorkspaceMutation.isError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        Failed to update workspace. Please try again.
                    </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={updateWorkspaceMutation.isPending}
                    >
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default EditWorkspaceModal;
