import { type ButtonHTMLAttributes, type FC } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'info' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    disabledMessage?: string; // Optional tooltip message
}

const Button: FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    children,
    className = '',
    disabled,
    disabledMessage,
    ...props
}) => {
    const baseStyles = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm focus:ring-blue-500',
        secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus:ring-gray-400',
        danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500',
        warning: 'bg-yellow-500 text-white hover:bg-yellow-600 active:bg-yellow-700 focus:ring-yellow-400',
        info: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 focus:ring-blue-400',
        ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-400',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    // Enhanced disabled styles
    const disabledStyles = 'disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 disabled:shadow-none disabled:cursor-not-allowed disabled:hover:bg-gray-300 disabled:active:bg-gray-300 disabled:transform-none';

    const isDisabled = disabled || isLoading;

    return (
        <div className="relative inline-block group">
            <button
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
                disabled={isDisabled}
                aria-disabled={isDisabled}
                title={isDisabled && disabledMessage ? disabledMessage : undefined}
                {...props}
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                    </>
                ) : children}
            </button>

            {/* Optional tooltip for disabled state */}
            {isDisabled && disabledMessage && (
                <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    {disabledMessage}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
            )}
        </div>
    );
};

export default Button;
