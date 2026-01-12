import { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Shield, Calendar, CheckCircle, AlertCircle, Camera } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import api from '../../../lib/api';
import { setSession } from '../../../store/authSlice';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

export default function Profile() {
    const currentUser = useAppSelector((state) => state.auth.user);
    const dispatch = useAppDispatch();
    const [name, setName] = useState(currentUser?.name || '');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await api.get('/auth/me');
            dispatch(setSession({
                user: response.data,
                sessionId: response.data.sessionId || ''
            }));
        } catch (err) {
            console.error('Failed to fetch user data:', err);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            await api.put(`/auth/users/${currentUser?.id}`, { name });
            await fetchUserData();
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' });
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        const colors = {
            Administrator: 'bg-purple-100 text-purple-800 border-purple-200',
            Manager: 'bg-blue-100 text-blue-800 border-blue-200',
            Employee: 'bg-green-100 text-green-800 border-green-200',
            Client: 'bg-gray-100 text-gray-800 border-gray-200',
        };
        return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <UserIcon className="w-7 h-7 mr-3 text-blue-600" />
                    My Profile
                </h1>
                <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="text-center">
                            {/* Avatar */}
                            <div className="relative inline-block mb-4">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                    {currentUser?.name.charAt(0).toUpperCase()}
                                </div>
                                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                                    <Camera className="w-4 h-4 text-gray-600" />
                                </button>
                            </div>

                            <h2 className="text-xl font-bold text-gray-900">{currentUser?.name}</h2>
                            <p className="text-sm text-gray-500 mt-1">{currentUser?.email}</p>

                            <div className="mt-4">
                                <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(currentUser?.role || 'Employee')}`}>
                                    {currentUser?.role}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Mail className="w-5 h-5 text-gray-600" />
                                    <span className="text-sm text-gray-700">Email Status</span>
                                </div>
                                {currentUser?.isEmailVerified ? (
                                    <span className="flex items-center text-xs text-green-600 font-medium">
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Verified
                                    </span>
                                ) : (
                                    <span className="flex items-center text-xs text-orange-600 font-medium">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        Not verified
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Calendar className="w-5 h-5 text-gray-600" />
                                    <span className="text-sm text-gray-700">Member Since</span>
                                </div>
                                <span className="text-xs text-gray-600 font-medium">
                                    {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <Shield className="w-5 h-5 text-gray-600" />
                                    <span className="text-sm text-gray-700">Account Status</span>
                                </div>
                                <span className="text-xs text-green-600 font-medium flex items-center">
                                    <span className="w-2 h-2 bg-green-600 rounded-full mr-1.5"></span>
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>

                        {message && (
                            <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                                }`}>
                                <div className="flex items-center space-x-2">
                                    {message.type === 'success' ? (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                    )}
                                    <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                        {message.text}
                                    </p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleUpdateProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input
                                    label="Full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="Enter your full name"
                                />

                                <Input
                                    label="Email address"
                                    type="email"
                                    value={currentUser?.email || ''}
                                    disabled
                                    helperText="Email cannot be changed"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Role
                                    </label>
                                    <input
                                        type="text"
                                        value={currentUser?.role || ''}
                                        disabled
                                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="mt-1.5 text-xs text-gray-500">
                                        Contact an administrator to change your role
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        User ID
                                    </label>
                                    <input
                                        type="text"
                                        value={currentUser?.id || ''}
                                        disabled
                                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed font-mono"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200 flex justify-end">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    isLoading={isLoading}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Additional Sections */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Password</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Last changed 30 days ago</p>
                                </div>
                                <Button variant="secondary" size="sm">
                                    Change Password
                                </Button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                                    <p className="text-xs text-gray-500 mt-0.5">Add an extra layer of security</p>
                                </div>
                                <Button variant="secondary" size="sm">
                                    Enable
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
