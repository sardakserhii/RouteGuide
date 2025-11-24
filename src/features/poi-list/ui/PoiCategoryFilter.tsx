import React from "react";
import { CategoryOption } from "../model/types";
import { getCategoryEmoji } from "../../../utils/categoryIcons";

interface PoiCategoryFilterProps {
    categoryOptions: CategoryOption[];
    selectedCategories: string[];
    onToggleCategory: (categoryKey: string) => void;
}

export const PoiCategoryFilter: React.FC<PoiCategoryFilterProps> = ({
    categoryOptions,
    selectedCategories,
    onToggleCategory,
}) => {
    if (categoryOptions.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 pt-1">
            {categoryOptions.map((cat) => {
                const isActive = selectedCategories.includes(cat.key);
                return (
                    <button
                        key={cat.key}
                        onClick={() => onToggleCategory(cat.key)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            isActive
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                        {getCategoryEmoji(cat.key)} {cat.label} ({cat.count})
                    </button>
                );
            })}
        </div>
    );
};
