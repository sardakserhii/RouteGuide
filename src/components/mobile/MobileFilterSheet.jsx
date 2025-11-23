import { useState, useEffect } from "react";
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

/**
 * Mobile filter interface for POI filtering
 * Compact version of desktop PoiFilter
 */
function MobileFilterSheet({ routeLogic, onComplete, onBack }) {
    const { t } = useTranslation();
    const {
        selectedCategories,
        setSelectedCategories,
        maxDistance,
        setMaxDistance,
        useAi,
        setUseAi,
        handleApplyFilters,
        pois,
        poiMetadata,
        loading,
    } = routeLogic;

    const [pendingCategories, setPendingCategories] =
        useState(selectedCategories);
    const [pendingMaxDistance, setPendingMaxDistance] = useState(maxDistance);
    const [pendingUseAi, setPendingUseAi] = useState(useAi);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const sliderValueForPosition = pendingMaxDistance ?? 5;
    const sliderPercent = Math.min(
        100,
        Math.max(0, ((sliderValueForPosition - 0.5) / (20 - 0.5)) * 100)
    );
    const distanceDisplay = pendingMaxDistance
        ? `${pendingMaxDistance} км`
        : t("poiFilter.distanceAuto");

    // Keep pending state in sync
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
        setPendingCategories(ALL_CATEGORIES);
    };

    const handleClearAll = () => {
        setPendingCategories([]);
    };

    const handleApply = () => {
        setSelectedCategories(pendingCategories);
        setMaxDistance(pendingMaxDistance);
        setUseAi(pendingUseAi);
        handleApplyFilters();
        if (onComplete) onComplete();
    };

    const handleReset = () => {
        const defaultCategories = ["attraction", "museum", "viewpoint", "park"];
        setPendingCategories(defaultCategories);
        setPendingMaxDistance(null);
        setPendingUseAi(false);
        setSelectedCategories(defaultCategories);
        setMaxDistance(null);
        setUseAi(false);
        handleApplyFilters();
    };

    return (
        <div className="bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)] border border-slate-100 overflow-hidden ">
            <div className="">
                {/* Header */}
                {/* <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <button
                        onClick={onBack}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95 transition"
                        aria-label="Back to tabs"
                    >
                        ←
                    </button>
                    <div className="text-base font-semibold text-slate-900">
                        {t("poiFilter.title")}
                    </div>
                    <button
                        onClick={handleReset}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                        {t("poiFilter.reset")}
                    </button>
                </div> */}

                <div className="p-4 space-y-6">
                    <p className="text-sm text-slate-600">
                        {t("poiFilter.subtitle")}
                    </p>

                    {/* Distance Filter */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-800">
                                    {t("poiFilter.distanceLabel")}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    {t("poiFilter.onRoute")} → 20 км
                                </p>
                            </div>
                            <button
                                onClick={() => setPendingMaxDistance(null)}
                                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                                    pendingMaxDistance === null
                                        ? "border-blue-200 text-blue-700 bg-blue-50"
                                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                }`}
                            >
                                {t("poiFilter.distanceAuto")}
                            </button>
                        </div>

                        <div className="relative pt-4 pb-2">
                            <div
                                className="absolute -top-1 left-0 transform -translate-y-1/2"
                                style={{
                                    left: `calc(${sliderPercent}% - 26px)`,
                                }}
                            >
                                <div className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full shadow-lg">
                                    {distanceDisplay}
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="20"
                                step="0.5"
                                value={sliderValueForPosition}
                                disabled={pendingMaxDistance === null}
                                onChange={(e) =>
                                    setPendingMaxDistance(
                                        parseFloat(e.target.value)
                                    )
                                }
                                className={`w-full h-2 rounded-full appearance-none bg-slate-200 accent-blue-600 ${
                                    pendingMaxDistance === null
                                        ? "opacity-60 cursor-not-allowed"
                                        : "cursor-pointer"
                                }`}
                            />
                            <div className="flex justify-between text-[11px] text-slate-500 pt-2">
                                <span>0.5 км</span>
                                <span>10 км</span>
                                <span>20 км</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex-1">
                                <input
                                    type="checkbox"
                                    checked={pendingMaxDistance !== null}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setPendingMaxDistance(5);
                                        } else {
                                            setPendingMaxDistance(null);
                                        }
                                    }}
                                    className="w-4 h-4 accent-blue-600"
                                />
                                <span className="text-sm text-slate-700">
                                    {t("poiFilter.setCustomDistance")}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-3 py-2 min-w-[92px]">
                                <input
                                    type="number"
                                    min="0.5"
                                    max="20"
                                    step="0.5"
                                    disabled={pendingMaxDistance === null}
                                    value={pendingMaxDistance ?? ""}
                                    onChange={(e) => {
                                        const next = parseFloat(e.target.value);
                                        if (Number.isNaN(next)) {
                                            setPendingMaxDistance(null);
                                            return;
                                        }
                                        setPendingMaxDistance(
                                            Math.min(20, Math.max(0.5, next))
                                        );
                                    }}
                                    className="w-full text-sm text-slate-800 font-semibold outline-none disabled:text-slate-400"
                                />
                                <span className="text-xs text-slate-500">
                                    км
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    {t("poiFilter.categoriesLabel")}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                    {t("poiFilter.categoryQuestion")}
                                </p>
                            </div>
                            <div className="flex gap-2 text-xs font-semibold">
                                <button
                                    onClick={handleSelectAll}
                                    className="text-blue-600 hover:text-blue-700"
                                >
                                    {t("poiFilter.selectAll")}
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    className="text-slate-500 hover:text-slate-700"
                                >
                                    {t("poiFilter.clear")}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() =>
                                    setPendingCategories([
                                        "attraction",
                                        "museum",
                                        "viewpoint",
                                    ])
                                }
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
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
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
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
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
                            >
                                <span>🛏️</span>
                                {t("poiFilter.presetAccommodation")}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                            {(showAllCategories
                                ? ALL_CATEGORIES
                                : ALL_CATEGORIES.filter((c) =>
                                      POPULAR_CATEGORIES.includes(c)
                                  )
                            ).map((category) => (
                                <label
                                    key={category}
                                    className="flex items-center gap-3 px-3 py-2 rounded-2xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50/60 transition-colors cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={pendingCategories.includes(
                                            category
                                        )}
                                        onChange={() =>
                                            handleCategoryToggle(category)
                                        }
                                        className="w-4 h-4 accent-blue-600"
                                    />
                                    <span className="text-sm text-slate-800">
                                        {t(`categories.${category}`, category)}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <button
                            onClick={() =>
                                setShowAllCategories(!showAllCategories)
                            }
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                            {showAllCategories
                                ? t("poiFilter.showLessCategories")
                                : t("poiFilter.showAllCategories")}
                        </button>
                    </div>

                    {/* AI Recommendations */}
                    <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-indigo-100 text-indigo-600">
                                ✨
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-indigo-900">
                                    {t("poiFilter.aiTitle")}
                                </p>
                                <p className="text-[11px] text-indigo-600">
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
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    {/* Apply Button */}
                    <div className="border-t border-slate-100 pt-4">
                        <button
                            onClick={handleApply}
                            disabled={loading}
                            className="w-full px-4 py-3 rounded-2xl text-sm font-semibold transition-all bg-blue-600 text-white shadow-[0_12px_24px_rgba(37,99,235,0.35)] hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                        >
                            {loading
                                ? t("poiFilter.loading")
                                : t("poiFilter.showPlaces")}
                        </button>
                        {poiMetadata?.total > 0 && (
                            <div className="text-[11px] text-center text-slate-500 mt-2">
                                {t("poiFilter.showingPlaces", {
                                    count: pois.length,
                                    total: poiMetadata.total,
                                    defaultValue: `Показано ${pois.length} з ${poiMetadata.total}`,
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MobileFilterSheet;
