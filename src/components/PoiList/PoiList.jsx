import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getCategoryEmoji } from "../../utils/categoryIcons";

// Helper to calculate distance between two points in km
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const deriveCategory = (poi) => {
  const tags = poi.tags || {};
  return (
    tags.tourism ||
    tags.historic ||
    tags.amenity ||
    tags.natural ||
    tags.shop ||
    "other"
  );
};

const formatAddress = (tags = {}) => {
  const parts = [
    [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" "),
    tags["addr:city"],
    tags["addr:country"],
  ].filter(Boolean);
  return parts.join(", ");
};

const PoiImage = ({ imageUrl, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!imageUrl) return null;

  return (
    <div
      className={`${
        isLoaded ? "block" : "hidden"
      } w-24 h-24 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden relative shadow-inner`}
    >
      <img
        src={imageUrl}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-cover"
        onLoad={() => setIsLoaded(true)}
        onError={(e) => {
          // Ensure it stays hidden if error occurs after load (unlikely but possible) or just doesn't load
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
};

const PoiList = ({
  pois,
  startPoint,
  onVisibleChange = () => {},
  selectedPoiIds = [],
  onTogglePoiSelection = () => {},
  onSelectVisible = () => {},
  onClearSelection = () => {},
  onExportRoute = () => {},
}) => {
  const { t } = useTranslation();
  const enrichedPois = useMemo(() => {
    if (!startPoint || !pois || pois.length === 0) return [];

    const [startLat, startLng] = startPoint;

    return [...pois]
      .map((poi) => {
        const distance = haversineDistance(
          startLat,
          startLng,
          poi.lat,
          poi.lon
        );
        const category = deriveCategory(poi);
        return { ...poi, distance, category };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [pois, startPoint]);

  const categoryOptions = useMemo(() => {
    const counts = enrichedPois.reduce((acc, poi) => {
      const key = poi.category || "other";
      acc.set(key, (acc.get(key) || 0) + 1);
      return acc;
    }, new Map());

    return Array.from(counts.entries())
      .map(([key, count]) => ({
        key,
        label: t(`categories.${key}`, key),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [enrichedPois]);

  const [selectedCategories, setSelectedCategories] = useState(() =>
    categoryOptions.map((c) => c.key)
  );

  // Automatically add new categories when they appear
  useEffect(() => {
    const currentCategoryKeys = categoryOptions.map((c) => c.key);
    const newCategories = currentCategoryKeys.filter(
      (key) => !selectedCategories.includes(key)
    );

    if (newCategories.length > 0) {
      setSelectedCategories((current) => [...current, ...newCategories]);
    }
  }, [categoryOptions]);

  const [isExportMode, setIsExportMode] = useState(false);

  const visiblePois = useMemo(() => {
    if (selectedCategories.length === 0) return [];
    return enrichedPois.filter((poi) =>
      selectedCategories.includes(poi.category)
    );
  }, [enrichedPois, selectedCategories]);

  useEffect(() => {
    onVisibleChange(visiblePois);
  }, [visiblePois, onVisibleChange]);

  // Reset export mode when POIs change or selection is cleared
  useEffect(() => {
    if (selectedPoiIds.length === 0 && !isExportMode) {
      // Optional: logic if needed when selection clears outside of export mode
    }
  }, [selectedPoiIds, isExportMode]);

  const handleExportClick = () => {
    setIsExportMode(true);
  };

  const handleCancelExport = () => {
    setIsExportMode(false);
    onClearSelection();
  };

  const handleConfirmExport = () => {
    onExportRoute();
    setIsExportMode(false);
  };

  if (!pois || pois.length === 0) return null;

  const selectedCount = selectedPoiIds.length;

  return (
    <div className="absolute top-5 right-5 bottom-5 w-[420px] max-w-[430px] bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col z-[1000] border border-gray-100">
      <div className="p-4 bg-white border-b border-gray-100 shadow-sm z-10 space-y-2">
        <div className="flex items-start gap-2">
          <div className="text-xl">🧭</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-800">
                {t("poiList.title")}
              </h2>
              <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                {visiblePois.length}/{enrichedPois.length}
              </span>
            </div>
            <p className="text-xs text-gray-500">{t("poiList.subtitle")}</p>
          </div>
        </div>

        {/* Quick category filter */}
        {categoryOptions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {categoryOptions.map((cat) => {
              const isActive = selectedCategories.includes(cat.key);
              return (
                <button
                  key={cat.key}
                  onClick={() =>
                    setSelectedCategories((current) => {
                      if (current.includes(cat.key)) {
                        return current.filter((c) => c !== cat.key);
                      }
                      return [...current, cat.key];
                    })
                  }
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
        )}

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs text-gray-600">
            Selected places:{" "}
            <span className="font-semibold text-gray-900">{selectedCount}</span>
            {selectedCount > 23 && (
              <span className="text-[11px] text-amber-700 ml-1">(max 23)</span>
            )}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            {selectedCount > 0 && (
              <button
                onClick={onExportRoute}
                className="text-xs px-3 py-1 rounded-full font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700"
              >
                {t("poiList.exportToGoogleMaps")} ({selectedCount})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-4 space-y-4 bg-gray-50 custom-scrollbar">
        {visiblePois.map((poi, index) => {
          const imageUrl =
            poi.tags?.image ||
            poi.tags?.photo ||
            poi.tags?.["image:0"] ||
            poi.tags?.["wikimedia_commons"];
          const address = formatAddress(poi.tags);
          const description =
            poi.description ||
            poi.tags?.["description:ru"] ||
            poi.tags?.description ||
            poi.tags?.comment;

          return (
            <div
              key={poi.id}
              className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex gap-3">
                {/* Image Placeholder or Real Image */}
                {/* Image Placeholder or Real Image */}
                <PoiImage imageUrl={imageUrl} alt={poi.name} />

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 text-base leading-tight group-hover:text-blue-700 transition-colors flex items-center gap-2">
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-gray-200 text-gray-600 text-xs font-bold rounded-full">
                          {index + 1}
                        </span>
                        {poi.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                          <span>{getCategoryEmoji(poi.category)}</span>
                          {t(
                            `categories.${poi.category}`,
                            poi.category || "Other"
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {poi.distance.toFixed(1)} km from start
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <button
                        onClick={() => onTogglePoiSelection(poi.id)}
                        className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                          selectedPoiIds.includes(poi.id)
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
                        }`}
                      >
                        {selectedPoiIds.includes(poi.id)
                          ? t("poiList.added")
                          : t("poiList.addToTrip")}
                      </button>
                      {poi.isTopPick && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                          AI TOP
                        </span>
                      )}
                      {poi.tags?.opening_hours && (
                        <span
                          className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 max-w-[160px] truncate"
                          title={poi.tags.opening_hours}
                        >
                          {poi.tags.opening_hours}
                        </span>
                      )}
                    </div>
                  </div>

                  {address && (
                    <div className="flex items-start gap-1 text-xs text-gray-600">
                      <span className="mt-[2px]">📍</span>
                      <span className="truncate">{address}</span>
                    </div>
                  )}

                  {description && (
                    <p className="text-xs text-gray-700 leading-snug line-clamp-3 bg-gray-50 p-2 rounded-lg border border-gray-100 italic">
                      {description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {poi.tags?.wikipedia && (
                      <a
                        href={`https://wikipedia.org/wiki/${poi.tags.wikipedia}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full border border-gray-200 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Wikipedia
                      </a>
                    )}
                    {(poi.tags?.website || poi.tags?.url) && (
                      <a
                        href={poi.tags.website || poi.tags.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200 hover:bg-blue-200 hover:text-blue-900 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Website
                      </a>
                    )}
                    {poi.tags?.phone && (
                      <a
                        href={`tel:${poi.tags.phone}`}
                        className="text-[11px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200 hover:bg-green-200 hover:text-green-900 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Tel. {poi.tags.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PoiList;
