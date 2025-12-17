import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/authSlice';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { CheckCircle2, BarChart3, Users, Clock, AlertCircle } from 'lucide-react';

export default function Homepage() {
    const [email, setEmail] = useState('admin@taskmanager.com');
    const [password, setPassword] = useState('Admin@123');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [needsVerification, setNeedsVerification] = useState(false);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setNeedsVerification(false);

        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user, sessionId } = response.data;

            dispatch(setCredentials({ token, user, sessionId }));
            navigate('/dashboard');
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Invalid credentials';
            setError(errorMsg);

            if (err.response?.data?.emailNotVerified) {
                setNeedsVerification(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async () => {
        try {
            await api.post('/auth/resend-verification', { email });
            alert('Verification email sent! Check your inbox.');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to send verification email');
        }
    };

    const features = [
        { icon: CheckCircle2, title: 'Task Management', desc: 'Organize and track tasks efficiently' },
        { icon: BarChart3, title: 'Analytics', desc: 'Real-time progress insights' },
        { icon: Users, title: 'Team Collaboration', desc: 'Work together seamlessly' },
        { icon: Clock, title: 'Time Tracking', desc: 'Monitor project timelines' },
    ];

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Features */}
            <div className="hidden lg:flex lg:w-1/2 bg-blue-600 text-white p-12 flex-col justify-between">
                <div>
                    <h1 className="text-4xl font-bold mb-3">Workspace Task Manager</h1>
                    <p className="text-blue-100 text-lg">Professional project management for modern teams</p>
                </div>

                <div className="space-y-6">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-4">
                            <div className="bg-blue-500 p-2.5 rounded-lg flex-shrink-0">
                                <feature.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-base mb-1">{feature.title}</h3>
                                <p className="text-blue-100 text-sm">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-blue-200 text-sm">© 2025 Task Manager. All rights reserved.</p>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-xl mb-4">
                            <CheckCircle2 className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
                        <p className="text-gray-600 text-sm">Sign in to continue to your workspace</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm text-red-700 font-medium">{error}</p>
                                    {needsVerification && (
                                        <button
                                            onClick={handleResendVerification}
                                            className="text-sm text-red-600 underline mt-1 hover:text-red-800"
                                        >
                                            Resend verification email
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            type="email"
                            label="Email address"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />

                        <Input
                            type="password"
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="ml-2 text-gray-600">Remember me</span>
                            </label>
                            <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                                Forgot password?
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            isLoading={isLoading}
                            className="w-full"
                        >
                            Sign in
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                                Create account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
