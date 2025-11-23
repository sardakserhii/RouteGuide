import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const ALL_CATEGORIES = [
    "attraction",
    "museum",
    "viewpoint",
    "hotel",
    "hostel",
    "guest_house",
    "camp_site",
    "theme_park",
    "zoo",
    "monument",
    "memorial",
    "castle",
    "ruins",
    "archaeological_site",
    "peak",
    "beach",
    "cave",
    "cliff",
    "water",
    "park",
    "restaurant",
    "cafe",
    "bar",
    "pub",
    "fast_food",
    "cinema",
    "theatre",
    "arts_centre",
    "mall",
    "souvenir",
    "gift",
];

const POPULAR_CATEGORIES = [
    "attraction",
    "museum",
    "viewpoint",
    "park",
    "restaurant",
    "cafe",
];

const PoiFilter = ({
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
}) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(true);
    const [showAllCategories, setShowAllCategories] = useState(false);

    // Local pending state; applies only after clicking "Apply filters"
    const [pendingCategories, setPendingCategories] =
        useState(selectedCategories);
    const [pendingMaxDistance, setPendingMaxDistance] = useState(maxDistance);
    const [pendingUseAi, setPendingUseAi] = useState(useAi);

    const categoriesChanged =
        pendingCategories.length !== selectedCategories.length ||
        pendingCategories.some((c) => !selectedCategories.includes(c));
    const hasChanges =
        categoriesChanged ||
        pendingMaxDistance !== maxDistance ||
        pendingUseAi !== useAi;

    // Keep pending state in sync if parent resets filters
    useEffect(() => {
        setPendingCategories(selectedCategories);
    }, [selectedCategories]);

    useEffect(() => {
        setPendingMaxDistance(maxDistance);
    }, [maxDistance]);

    useEffect(() => {
        setPendingUseAi(useAi);
    }, [useAi]);

    const handleCategoryToggle = (category) => {
        const newCategories = pendingCategories.includes(category)
            ? pendingCategories.filter((c) => c !== category)
            : [...pendingCategories, category];
        setPendingCategories(newCategories);
    };

    const handleSelectAll = () => {
        setPendingCategories(availableCategories);
    };

    const handleClearAll = () => {
        setPendingCategories([]);
    };

    const handleApply = () => {
        onCategoriesChange(pendingCategories);
        onMaxDistanceChange(pendingMaxDistance);
        onUseAiChange(pendingUseAi);
        if (onApply) onApply();
    };

    return (
        <div className="absolute top-[500px] left-5 z-[1000]  bg-white rounded-xl shadow-xl min-w-80 font-sans transition-all duration-300">
            {/* Header */}
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
            {isExpanded && (
                <div className="px-4 pt-2 text-xs text-gray-500">
                    {t("poiFilter.subtitle")}
                </div>
            )}

            {/* Content */}
            {isExpanded && (
                <div
                    className={`p-5 ${
                        disabled ? "opacity-50 pointer-events-none" : ""
                    }`}
                >
                    {/* Distance Filter */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700">
                                {t("poiFilter.distanceLabel")}
                            </label>
                            <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {pendingMaxDistance
                                    ? `${pendingMaxDistance} km`
                                    : t("poiFilter.distanceAuto")}
                            </span>
                        </div>

                        {/* Checkbox to enable/disable custom distance */}
                        <label className="flex items-center gap-2 mb-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={pendingMaxDistance !== null}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setPendingMaxDistance(5); // Enable with default 5km
                                    } else {
                                        setPendingMaxDistance(null); // Disable (Auto mode)
                                    }
                                }}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">
                                {t("poiFilter.setCustomDistance")}
                            </span>
                        </label>

                        <div className="relative mb-5">
                            <input
                                type="range"
                                min="0.5"
                                max="20"
                                step="0.5"
                                value={pendingMaxDistance ?? 5}
                                disabled={pendingMaxDistance === null}
                                onChange={(e) =>
                                    setPendingMaxDistance(
                                        parseFloat(e.target.value)
                                    )
                                }
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                <span>{t("poiFilter.onRoute")}</span>
                                <span>+5 km</span>
                                <span>+20 km</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Filter Toggle */}
                    <div className="mb-6 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">?</span>
                                <div>
                                    <h4 className="text-sm font-semibold text-indigo-900">
                                        {t("poiFilter.aiTitle")}
                                    </h4>
                                    <p className="text-xs text-indigo-600">
                                        {t("poiFilter.aiSubtitle")}
                                    </p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={pendingUseAi}
                                    onChange={(e) =>
                                        setPendingUseAi(e.target.checked)
                                    }
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>

                    {/* Categories Filter */}
                    <div className="mb-4">
                        {/* Header guidance text */}
                        <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                {t("poiFilter.categoryQuestion")}
                            </h4>
                        </div>

                        {/* Preset buttons */}
                        <div className="flex flex-wrap gap-2 mb-4">
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
                                    setPendingCategories([
                                        "viewpoint",
                                        "park",
                                        "peak",
                                    ])
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

                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-medium text-gray-700">
                                {t("poiFilter.categoriesLabel")}
                            </label>
                            <div className="flex gap-2 text-xs">
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
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
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
                                        checked={pendingCategories.includes(
                                            category
                                        )}
                                        onChange={() =>
                                            handleCategoryToggle(category)
                                        }
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                        {t(`categories.${category}`, category)}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <button
                            onClick={() =>
                                setShowAllCategories(!showAllCategories)
                            }
                            className="mt-2 text-xs text-blue-600 font-medium hover:underline"
                        >
                            {showAllCategories
                                ? t("poiFilter.showLessCategories")
                                : t("poiFilter.showAllCategories")}
                        </button>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleApply}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700`}
                        >
                            {t("poiFilter.showPlaces")}
                        </button>
                    </div>

                    {/* Status Footer */}
                    {totalCount > 0 && (
                        <div className="pt-3 border-t border-gray-100 text-xs text-center text-gray-500">
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
