import React from "react";
import { POPULAR_CATEGORIES } from "../config/constants";
import { CollapsibleSection } from "./CollapsibleSection";

interface CategoryFilterProps {
    availableCategories: string[];
    pendingCategories: string[];
    setPendingCategories: (categories: string[]) => void;
    showAllCategories: boolean;
    setShowAllCategories: (show: boolean) => void;
    handleCategoryToggle: (category: string) => void;
    handleSelectAll: () => void;
    handleClearAll: () => void;
    t: (key: string, options?: any) => string;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
    availableCategories,
    pendingCategories,
    setPendingCategories,
    showAllCategories,
    setShowAllCategories,
    handleCategoryToggle,
    handleSelectAll,
    handleClearAll,
    t,
}) => {
    const selectedCount = pendingCategories.length;
    const categoryLabel =
        selectedCount > 0
            ? `${t("poiFilter.categoriesLabel")} (${selectedCount})`
            : t("poiFilter.categoriesLabel");

    return (
        <div className="mb-3">
            {/* Preset buttons - always visible */}
            <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {t("poiFilter.categoryQuestion")}
                </h4>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() =>
                            setPendingCategories([
                                "attraction",
                                "museum",
                                "viewpoint",
                            ])
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                        <span>🏛️</span>
                        {t("poiFilter.presetClassic")}
                    </button>
                    <button
                        onClick={() =>
                            setPendingCategories(["viewpoint", "park", "peak"])
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                        <span>🌲</span>
                        {t("poiFilter.presetNature")}
                    </button>
                    <button
                        onClick={() =>
                            setPendingCategories([
                                "hotel",
                                "hostel",
                                "camp_site",
                            ])
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                        <span>🛏️</span>
                        {t("poiFilter.presetAccommodation")}
                    </button>
                </div>
            </div>

            {/* Categories in collapsible section */}
            <CollapsibleSection
                title={categoryLabel}
                icon="📋"
                defaultExpanded={false}
            >
                <div className="flex justify-end gap-2 text-xs mb-2">
                    <button
                        onClick={handleSelectAll}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                        {t("poiFilter.selectAll")}
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                        onClick={handleClearAll}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        {t("poiFilter.clear")}
                    </button>
                </div>

                <div className="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {(showAllCategories
                        ? availableCategories
                        : availableCategories.filter((c) =>
                              POPULAR_CATEGORIES.includes(c)
                          )
                    ).map((category) => (
                        <label
                            key={category}
                            className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        >
                            <input
                                type="checkbox"
                                checked={pendingCategories.includes(category)}
                                onChange={() => handleCategoryToggle(category)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                                {t(`categories.${category}`, category)}
                            </span>
                        </label>
                    ))}
                </div>
                <button
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="mt-2 text-xs text-blue-600 font-medium hover:underline"
                >
                    {showAllCategories
                        ? t("poiFilter.showLessCategories")
                        : t("poiFilter.showAllCategories")}
                </button>
            </CollapsibleSection>
        </div>
    );
};
