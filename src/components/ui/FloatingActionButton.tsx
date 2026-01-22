import { type FC, useState } from 'react';
import { Plus, Clock, FileText, Users, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import QuickTimerModal from '../modals/QuickTimerModal';

const FloatingActionButton: FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showTimerModal, setShowTimerModal] = useState(false);

    const actions = [
        {
            icon: Clock,
            label: 'Start Timer',
            color: 'bg-red-500 hover:bg-red-600',
            onClick: () => {
                setShowTimerModal(true);
                setIsOpen(false);
            },
        },
        {
            icon: FileText,
            label: 'New Task',
            color: 'bg-blue-500 hover:bg-blue-600',
            href: '/my-tasks',
        },
        {
            icon: Users,
            label: 'New Project',
            color: 'bg-green-500 hover:bg-green-600',
            href: '/projects',
        },
    ];

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-6 right-6 z-30">
                {/* Action Menu */}
                {isOpen && (
                    <div className="absolute bottom-16 right-0 space-y-2 mb-2">
                        {actions.map((action, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <span className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                                    {action.label}
                                </span>
                                {action.onClick ? (
                                    <button
                                        onClick={action.onClick}
                                        className={`w-12 h-12 rounded-full ${action.color} text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110`}
                                    >
                                        <action.icon className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <Link to={action.href!}>
                                        <div
                                            className={`w-12 h-12 rounded-full ${action.color} text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110`}
                                        >
                                            <action.icon className="w-5 h-5" />
                                        </div>
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Main FAB */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center transition-all ${isOpen ? 'rotate-45' : ''
                        }`}
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </button>
            </div>

            {/* Timer Modal */}
            <QuickTimerModal isOpen={showTimerModal} onClose={() => setShowTimerModal(false)} />

            {/* Animation styles */}
            <style>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out forwards;
                }
            `}</style>
        </>
    );
};

export default FloatingActionButton;
