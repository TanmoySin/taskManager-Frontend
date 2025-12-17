import { type FC } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSessionWarning, updateSessionActivity } from '../store/authSlice';
import Button from './ui/Button';
import api from '../lib/api';

const SessionWarningModal: FC = () => {
    const dispatch = useAppDispatch();
    const { isSessionWarning, sessionExpiry } = useAppSelector((state) => state.auth);

    if (!isSessionWarning) return null;

    const timeRemaining = sessionExpiry ? Math.floor((sessionExpiry - Date.now()) / 1000) : 0;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    const handleStayLoggedIn = async () => {
        try {
            // Make a lightweight API call to extend session
            await api.get('/auth/session-status');
            dispatch(updateSessionActivity());
            dispatch(setSessionWarning(false));
        } catch (error) {
            console.error('Failed to extend session:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Session Expiring Soon
                            </h3>
                            <p className="text-sm text-gray-600 mt-0.5">
                                Your session will expire in{' '}
                                <span className="font-semibold text-orange-600">
                                    {minutes}:{seconds.toString().padStart(2, '0')}
                                </span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => dispatch(setSessionWarning(false))}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                    You'll be logged out automatically due to inactivity. Click below to stay logged in.
                </p>

                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => dispatch(setSessionWarning(false))}
                        className="flex-1"
                    >
                        Dismiss
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleStayLoggedIn}
                        className="flex-1"
                    >
                        Stay Logged In
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SessionWarningModal;
