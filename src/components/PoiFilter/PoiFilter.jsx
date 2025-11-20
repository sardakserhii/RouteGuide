import React, { useState } from "react";

const CATEGORY_LABELS = {
  attraction: "Достопримечательности",
  museum: "Музеи",
  viewpoint: "Смотровые площадки",
  monument: "Памятники",
  castle: "Замки",
  artwork: "Арт-объекты",
  historic: "Исторические места",
};

const PoiFilter = ({
  availableCategories = Object.keys(CATEGORY_LABELS),
  selectedCategories,
  onCategoriesChange,
  maxDistance,
  onMaxDistanceChange,
  poiCount,
  totalCount,
  disabled,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCategoryToggle = (category) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    onCategoriesChange(newCategories);
  };

  const handleSelectAll = () => {
    onCategoriesChange(availableCategories);
  };

  const handleClearAll = () => {
    onCategoriesChange([]);
  };

  return (
    <div className="absolute top-[280px] left-5 z-[1000] bg-white rounded-xl shadow-xl min-w-80 font-sans transition-all duration-300">
      {/* Header */}
      <div
        className="p-4 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded-t-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <h3 className="font-semibold text-gray-800">Фильтры мест</h3>
          {poiCount !== undefined && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {poiCount}
            </span>
          )}
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          {isExpanded ? "▼" : "▲"}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div
          className={`p-5 ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        >
          {/* Distance Filter */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">
                Расстояние от маршрута
              </label>
              <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {maxDistance ? `${maxDistance} км` : "Авто"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="50"
                step="0.5"
                value={maxDistance || 20} // Default visual value if auto
                disabled={maxDistance === null}
                onChange={(e) =>
                  onMaxDistanceChange(parseFloat(e.target.value))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex items-center gap-1.5 min-w-[60px]">
                <input
                  type="checkbox"
                  id="auto-dist"
                  checked={maxDistance === null}
                  onChange={(e) =>
                    onMaxDistanceChange(e.target.checked ? null : 5)
                  }
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label
                  htmlFor="auto-dist"
                  className="text-xs text-gray-600 cursor-pointer select-none"
                >
                  Авто
                </label>
              </div>
            </div>
          </div>

          {/* Categories Filter */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-700">
                Категории
              </label>
              <div className="flex gap-2 text-xs">
                <button
                  onClick={handleSelectAll}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Все
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleClearAll}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Сбросить
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {availableCategories.map((category) => (
                <label
                  key={category}
                  className="flex items-center gap-2.5 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {CATEGORY_LABELS[category] || category}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Footer */}
          {totalCount > 0 && (
            <div className="pt-3 border-t border-gray-100 text-xs text-center text-gray-500">
              Показано {poiCount} из {totalCount} найденных мест
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PoiFilter;
