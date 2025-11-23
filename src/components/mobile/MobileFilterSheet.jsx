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
function MobileFilterSheet({ routeLogic, onComplete }) {
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        {t("poiFilter.title", "Фільтри місць")}
      </h3>
      <p className="text-sm text-gray-600">
        {t("poiFilter.subtitle", "Налаштуйте, що ви хочете побачити")}
      </p>

      {/* Distance Filter */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">
            {t("poiFilter.distanceLabel", "Відстань від маршруту")}
          </label>
          <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {pendingMaxDistance
              ? `${pendingMaxDistance} км`
              : t("poiFilter.distanceAuto", "Авто")}
          </span>
        </div>

        <label className="flex items-center gap-2 mb-2 cursor-pointer">
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
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-600">
            {t("poiFilter.setCustomDistance", "Встановити власну відстань")}
          </span>
        </label>

        <input
          type="range"
          min="0.5"
          max="20"
          step="0.5"
          value={pendingMaxDistance ?? 5}
          disabled={pendingMaxDistance === null}
          onChange={(e) => setPendingMaxDistance(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{t("poiFilter.onRoute", "На маршруті")}</span>
          <span>+5 км</span>
          <span>+20 км</span>
        </div>
      </div>

      {/* AI Filter Toggle */}
      <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <div>
              <h4 className="text-sm font-semibold text-indigo-900">
                {t("poiFilter.aiTitle", "AI фільтрація")}
              </h4>
              <p className="text-xs text-indigo-600">
                {t("poiFilter.aiSubtitle", "Розумний вибір місць")}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={pendingUseAi}
              onChange={(e) => setPendingUseAi(e.target.checked)}
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>

      {/* Categories Filter */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          {t("poiFilter.categoryQuestion", "Які місця вас цікавлять?")}
        </h4>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() =>
              setPendingCategories(["attraction", "museum", "viewpoint"])
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50"
          >
            <span>🏛️</span>
            {t("poiFilter.presetClassic", "Класика")}
          </button>
          <button
            onClick={() => setPendingCategories(["viewpoint", "park", "peak"])}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50"
          >
            <span>🌲</span>
            {t("poiFilter.presetNature", "Природа")}
          </button>
          <button
            onClick={() =>
              setPendingCategories(["hotel", "hostel", "camp_site"])
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50"
          >
            <span>🛏️</span>
            {t("poiFilter.presetAccommodation", "Житло")}
          </button>
        </div>

        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">
            {t("poiFilter.categoriesLabel", "Категорії")}
          </label>
          <div className="flex gap-2 text-xs">
            <button
              onClick={handleSelectAll}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {t("poiFilter.selectAll", "Всі")}
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleClearAll}
              className="text-gray-500 hover:text-gray-700"
            >
              {t("poiFilter.clear", "Очистити")}
            </button>
          </div>
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto">
          {(showAllCategories
            ? ALL_CATEGORIES
            : ALL_CATEGORIES.filter((c) => POPULAR_CATEGORIES.includes(c))
          ).map((category) => (
            <label
              key={category}
              className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={pendingCategories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
                className="w-4 h-4 text-blue-600 rounded"
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
            ? t("poiFilter.showLessCategories", "Показати менше")
            : t("poiFilter.showAllCategories", "Показати все")}
        </button>
      </div>

      {/* Apply Button */}
      <button
        onClick={handleApply}
        disabled={loading}
        className="w-full px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading
          ? t("poiFilter.loading", "Завантаження...")
          : t("poiFilter.showPlaces", "Показати місця")}
      </button>

      {/* Status */}
      {poiMetadata?.total > 0 && (
        <div className="text-xs text-center text-gray-500">
          {t("poiFilter.showingPlaces", {
            count: pois.length,
            total: poiMetadata.total,
            defaultValue: `Показано ${pois.length} з ${poiMetadata.total}`,
          })}
        </div>
      )}
    </div>
  );
}

export default MobileFilterSheet;
