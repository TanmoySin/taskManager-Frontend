import { type FC } from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

const ConfirmDialog: FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false,
}) => {
    const config = {
        danger: {
            icon: AlertTriangle,
            iconColor: 'text-red-600',
            buttonVariant: 'danger' as const,
        },
        warning: {
            icon: AlertCircle,
            iconColor: 'text-yellow-600',
            buttonVariant: 'warning' as const,
        },
        info: {
            icon: Info,
            iconColor: 'text-blue-600',
            buttonVariant: 'info' as const,
        },
    }[variant];

    const Icon = config.icon;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 ${config.iconColor}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-gray-700 flex-1">{message}</p>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant={config.buttonVariant}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        isLoading={isLoading}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
