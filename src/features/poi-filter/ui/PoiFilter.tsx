import React from "react";
import { ALL_CATEGORIES } from "../config/constants";
import { usePoiFilterModel } from "../model/usePoiFilterModel";
import { PoiFilterHeader } from "./PoiFilterHeader";
import { DistanceFilter } from "./DistanceFilter";
import { AiFilter } from "./AiFilter";
import { CategoryFilter } from "./CategoryFilter";

interface PoiFilterProps {
    availableCategories?: string[];
    selectedCategories: string[];
    onCategoriesChange: (categories: string[]) => void;
    maxDistance: number | null;
    onMaxDistanceChange: (distance: number | null) => void;
    useAi: boolean;
    onUseAiChange: (useAi: boolean) => void;
    poiCount?: number;
    totalCount: number;
    disabled?: boolean;
    onApply?: () => void;
    isExpanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
}

const PoiFilter: React.FC<PoiFilterProps> = ({
    availableCategories = ALL_CATEGORIES,
    selectedCategories,
    onCategoriesChange,
    maxDistance,
    onMaxDistanceChange,
    useAi,
    onUseAiChange,
    poiCount,
    totalCount,
    disabled,
    onApply,
    isExpanded: isExpandedProp,
    onExpandedChange,
}) => {
    const {
        isExpanded: isExpandedInternal,
        setIsExpanded: setIsExpandedInternal,
        showAllCategories,
        setShowAllCategories,
        pendingCategories,
        setPendingCategories,
        pendingMaxDistance,
        setPendingMaxDistance,
        pendingUseAi,
        setPendingUseAi,
        handleCategoryToggle,
        handleSelectAll,
        handleClearAll,
        handleApply,
        t,
    } = usePoiFilterModel({
        availableCategories,
        selectedCategories,
        onCategoriesChange,
        maxDistance,
        onMaxDistanceChange,
        useAi,
        onUseAiChange,
        onApply,
    });

    // Use controlled state if provided, otherwise use internal state
    const isExpanded =
        isExpandedProp !== undefined ? isExpandedProp : isExpandedInternal;
    const setIsExpanded = (expanded: boolean) => {
        if (onExpandedChange) {
            onExpandedChange(expanded);
        } else {
            setIsExpandedInternal(expanded);
        }
    };

    const handleApplyAndCollapse = () => {
        handleApply();
        setIsExpanded(false);
    };

    return (
        <div
            className={`mt-3 ml-5 bg-white rounded-xl shadow-xl min-w-80 max-w-[340px] font-sans transition-all duration-300 overflow-hidden flex flex-col ${
                isExpanded ? "max-h-[calc(100vh-100px)]" : ""
            }`}
        >
            <PoiFilterHeader
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
                poiCount={poiCount}
                t={t}
            />

            {isExpanded && (
                <div className="px-4 pt-2 text-xs text-gray-500 flex-shrink-0">
                    {t("poiFilter.subtitle")}
                </div>
            )}

            {/* Content */}
            {isExpanded && (
                <div
                    className={`p-4 overflow-y-auto flex-1 ${
                        disabled ? "opacity-50 pointer-events-none" : ""
                    }`}
                >
                    <DistanceFilter
                        pendingMaxDistance={pendingMaxDistance}
                        setPendingMaxDistance={setPendingMaxDistance}
                        t={t}
                    />

                    <AiFilter
                        pendingUseAi={pendingUseAi}
                        setPendingUseAi={setPendingUseAi}
                        t={t}
                    />

                    <CategoryFilter
                        availableCategories={availableCategories}
                        pendingCategories={pendingCategories}
                        setPendingCategories={setPendingCategories}
                        showAllCategories={showAllCategories}
                        setShowAllCategories={setShowAllCategories}
                        handleCategoryToggle={handleCategoryToggle}
                        handleSelectAll={handleSelectAll}
                        handleClearAll={handleClearAll}
                        t={t}
                    />
                </div>
            )}

            {/* Fixed footer with apply button */}
            {isExpanded && (
                <div
                    className={`px-4 pb-4 pt-2 border-t border-gray-100 flex-shrink-0 bg-white ${
                        disabled ? "opacity-50 pointer-events-none" : ""
                    }`}
                >
                    <div className="flex justify-end">
                        <button
                            onClick={handleApplyAndCollapse}
                            className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {t("poiFilter.showPlaces")}
                        </button>
                    </div>

                    {/* Status Footer */}
                    {totalCount > 0 && (
                        <div className="pt-2 text-xs text-center text-gray-500">
                            {t("poiFilter.showingPlaces", {
                                count: poiCount,
                                total: totalCount,
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PoiFilter;
