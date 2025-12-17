import { type FC, useState, useRef, useEffect } from 'react';

interface DropdownMenuItem {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

interface DropdownMenuProps {
    trigger: React.ReactNode;
    items: DropdownMenuItem[];
    align?: 'left' | 'right';
}

const DropdownMenu: FC<DropdownMenuProps> = ({ trigger, items, align = 'right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔄 Dropdown toggle, isOpen:', isOpen);
        setIsOpen(!isOpen);
    };

    const handleItemClick = (item: DropdownMenuItem) => {
        console.log('✅ Menu item clicked:', item.label);
        item.onClick();
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            {/* Trigger */}
            <div onClick={handleToggle}>
                {trigger}
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className={`absolute top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 ${align === 'right' ? 'right-0' : 'left-0'
                        }`}
                    style={{ zIndex: 9999 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {items.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">No items</div>
                    ) : (
                        items.map((item, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleItemClick(item);
                                }}
                                className={`w-full px-4 py-2.5 text-left text-sm flex items-center space-x-2 transition-colors ${item.variant === 'danger'
                                        ? 'text-red-600 hover:bg-red-50'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                                <span>{item.label}</span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default DropdownMenu;
