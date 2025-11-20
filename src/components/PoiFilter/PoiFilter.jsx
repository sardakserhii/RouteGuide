import React, { useState } from "react";

const CATEGORY_LABELS = {
  // Tourism
  attraction: "Attraction",
  museum: "Museum",
  viewpoint: "Viewpoint",
  hotel: "Hotel",
  hostel: "Hostel",
  guest_house: "Guest house",
  camp_site: "Camp site",
  theme_park: "Theme park",
  zoo: "Zoo",

  // Historic
  monument: "Monument",
  memorial: "Memorial",
  castle: "Castle",
  ruins: "Ruins",
  archaeological_site: "Archaeological site",

  // Nature
  peak: "Peak",
  beach: "Beach",
  cave: "Cave entrance",
  cliff: "Cliff",
  water: "Water feature",
  park: "Park",

  // Amenity
  restaurant: "Restaurant",
  cafe: "Cafe",
  bar: "Bar",
  pub: "Pub",
  fast_food: "Fast food",
  cinema: "Cinema",
  theatre: "Theatre",
  arts_centre: "Arts centre",

  // Shop
  mall: "Shopping mall",
  souvenir: "Souvenir shop",
  gift: "Gift shop",
};

const PoiFilter = ({
  availableCategories = Object.keys(CATEGORY_LABELS),
  selectedCategories,
  onCategoriesChange,
  maxDistance,
  onMaxDistanceChange,
  useAi,
  onUseAiChange,
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
          <span className="text-lg">??</span>
          <h3 className="font-semibold text-gray-800">Place filters</h3>
          {poiCount !== undefined && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {poiCount}
            </span>
          )}
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          {isExpanded ? "–" : "+"}
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
                Max distance from route
              </label>
              <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {maxDistance ? `${maxDistance} km` : "Auto"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="50"
                step="0.5"
                value={maxDistance || 20}
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
                  Auto
                </label>
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
                    Smart AI filtering
                  </h4>
                  <p className="text-xs text-indigo-600">
                    Gemini picks highlights for you
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={useAi}
                  onChange={(e) => onUseAiChange(e.target.checked)}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          {/* Categories Filter */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-gray-700">
                Categories
              </label>
              <div className="flex gap-2 text-xs">
                <button
                  onClick={handleSelectAll}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Select all
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleClearAll}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear
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
              Showing {poiCount} of {totalCount} places
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PoiFilter;
