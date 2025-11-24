import React from "react";

interface PoiFilterHeaderProps {
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    poiCount?: number;
    t: (key: string, options?: any) => string;
}

export const PoiFilterHeader: React.FC<PoiFilterHeaderProps> = ({
    isExpanded,
    setIsExpanded,
    poiCount,
    t,
}) => {
    return (
        <div
            className="p-4 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded-t-xl"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-800">
                    {t("poiFilter.title")}
                </h3>
                {poiCount !== undefined && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        {poiCount}
                    </span>
                )}
            </div>
            <button className="text-gray-400 hover:text-gray-600">
                {isExpanded ? "−" : "+"}
            </button>
        </div>
    );
};
