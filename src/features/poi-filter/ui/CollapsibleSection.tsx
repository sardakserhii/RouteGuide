import React, { useState } from "react";

interface CollapsibleSectionProps {
    title: string;
    icon?: string;
    defaultExpanded?: boolean;
    children: React.ReactNode;
    className?: string;
    headerClassName?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    icon,
    defaultExpanded = false,
    children,
    className = "",
    headerClassName = "",
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className={`border border-gray-200 rounded-lg mb-3 ${className}`}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors ${headerClassName}`}
            >
                <div className="flex items-center gap-2">
                    {icon && <span className="text-base">{icon}</span>}
                    <span className="text-sm font-medium text-gray-700">
                        {title}
                    </span>
                </div>
                <svg
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>
            {isExpanded && <div className="px-3 pb-3 pt-0">{children}</div>}
        </div>
    );
};
