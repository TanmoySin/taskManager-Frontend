import { type FC, useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

interface MentionInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    projectId?: string;
    disabled?: boolean;
    className?: string;
}

const MentionInput: FC<MentionInputProps> = ({
    value,
    onChange,
    placeholder = 'Type @ to mention someone...',
    projectId,
    disabled = false,
    className = '',
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Fetch project members for mentions
    const { data: members } = useQuery({
        queryKey: ['projectMembers', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            const response = await api.get(`/projects/${projectId}/members`);
            return response.data;
        },
        enabled: !!projectId,
    });

    // Parse text for @ symbol
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const cursorPos = e.target.selectionStart || 0;

        onChange(newValue);
        setCursorPosition(cursorPos);

        // Check if user is typing @mention
        const textBeforeCursor = newValue.substring(0, cursorPos);
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

        if (mentionMatch) {
            setMentionSearch(mentionMatch[1]);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    // Filter members based on search
    const filteredMembers = members?.filter((member: any) =>
        member.name?.toLowerCase().includes(mentionSearch.toLowerCase())
    ) || [];

    // Insert mention
    const insertMention = (username: string) => {
        const textBeforeCursor = value.substring(0, cursorPosition);
        const textAfterCursor = value.substring(cursorPosition);

        // Replace partial mention with full username
        const newTextBefore = textBeforeCursor.replace(/@\w*$/, `@${username} `);
        const newValue = newTextBefore + textAfterCursor;

        onChange(newValue);
        setShowSuggestions(false);

        // Focus back on textarea
        setTimeout(() => {
            textareaRef.current?.focus();
            const newCursorPos = newTextBefore.length;
            textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowSuggestions(false);
        if (showSuggestions) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showSuggestions]);

    return (
        <div className="relative">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                rows={3}
                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg 
          focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none
          disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
            />

            {/* Mention Suggestions Dropdown */}
            {showSuggestions && filteredMembers.length > 0 && (
                <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredMembers.map((member: any) => (
                        <button
                            key={member._id || member.userId?._id}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                insertMention(member.name || member.userId?.name);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors flex items-center space-x-2"
                        >
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-medium text-blue-600">
                                    {(member.name || member.userId?.name)?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {member.name || member.userId?.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {member.email || member.userId?.email}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MentionInput;
