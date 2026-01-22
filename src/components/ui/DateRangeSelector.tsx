import { type FC } from 'react';

interface DateRangeSelectorProps {
    value: string;
    onChange: (value: string) => void;
    options?: { value: string; label: string }[];
}

const DateRangeSelector: FC<DateRangeSelectorProps> = ({
    value,
    onChange,
    options = [
        { value: '7', label: '7 days' },
        { value: '14', label: '14 days' },
        { value: '30', label: '30 days' },
    ],
}) => {
    return (
        <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${value === option.value
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

export default DateRangeSelector;
