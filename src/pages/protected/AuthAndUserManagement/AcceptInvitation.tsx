import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, AlertCircle } from 'lucide-react';
import { useAppDispatch } from '../../../store/hooks';
import api from '../../../lib/api';
import { setCredentials } from '../../../store/authSlice';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

export default function AcceptInvitation() {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [tokenValid, setTokenValid] = useState(true);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setTokenValid(false);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        const token = searchParams.get('token');
        if (!token) {
            setError('Invalid invitation link');
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.post('/auth/accept-invitation', {
                token,
                password,
            });

            // Auto-login
            dispatch(setCredentials({
                token: response.data.token,
                user: response.data.user,
            }));

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to accept invitation');
        } finally {
            setIsLoading(false);
        }
    };

    if (!tokenValid) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid invitation</h2>
                    <p className="text-gray-600 mb-6">
                        This invitation link is invalid or has expired.
                    </p>
                    <Link to="/">
                        <Button variant="primary" className="w-full">
                            Go to login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
                        <Mail className="w-7 h-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Accept invitation</h2>
                    <p className="text-gray-600 text-sm">Set your password to get started</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="password"
                        label="Password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                        helperText="Must be at least 6 characters"
                    />

                    <Input
                        type="password"
                        label="Confirm password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        isLoading={isLoading}
                        className="w-full"
                    >
                        Set password & continue
                    </Button>
                </form>
            </div>
        </div>
    );
}
