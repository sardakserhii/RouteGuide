import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getCategoryEmoji } from "../../utils/categoryIcons";

// Helper to calculate distance between two points in km
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
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

/**
 * Mobile places list
 * Compact single-column POI cards with trip management
 */
function MobilePlacesSheet({ routeLogic }) {
    const { t } = useTranslation();
    const {
        pois,
        startPoint,
        selectedPoiIds,
        handleTogglePoiSelection,
        handleExportToGoogleMaps,
    } = routeLogic;

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

    if (!pois || pois.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">{t("poiList.noPlaces")}</p>
                <p className="text-sm text-gray-400 mt-2">
                    {t("poiList.adjustFilters")}
                </p>
            </div>
        );
    }

    const selectedCount = selectedPoiIds.length;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {t("poiList.title")}
                    </h3>
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                        {enrichedPois.length}
                    </span>
                </div>
                <p className="text-sm text-gray-600">{t("poiList.subtitle")}</p>
            </div>

            {/* Export Button (visible when selections exist) */}
            {selectedCount > 0 && (
                <div className="sticky top-0 bg-white border border-blue-200 rounded-lg p-3 shadow-sm z-10">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">
                            {t("poiList.selected")}:{" "}
                            <strong>{selectedCount}</strong>
                            {selectedCount > 23 && (
                                <span className="text-xs text-amber-700 ml-1">
                                    (макс 23)
                                </span>
                            )}
                        </span>
                        <button
                            onClick={handleExportToGoogleMaps}
                            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                            {t("poiList.exportToGoogleMaps")} ({selectedCount})
                        </button>
                    </div>
                </div>
            )}

            {/* POI List */}
            <div className="space-y-3 pb-4">
                {enrichedPois.map((poi, index) => {
                    const isSelected = selectedPoiIds.includes(poi.id);
                    const description =
                        poi.description ||
                        poi.tags?.["description:ru"] ||
                        poi.tags?.description;

                    return (
                        <div
                            key={poi.id}
                            className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                        >
                            <div className="flex gap-3">
                                {/* Number Badge */}
                                <div className="shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 text-sm font-bold rounded-full">
                                    {index + 1}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 text-base leading-tight mb-1">
                                        {poi.name}
                                    </h4>

                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                            {getCategoryEmoji(poi.category)}{" "}
                                            {t(
                                                `categories.${poi.category}`,
                                                poi.category || "Other"
                                            )}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {poi.distance.toFixed(1)} км
                                        </span>
                                        {poi.isTopPick && (
                                            <span className="text-xs font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                                                AI
                                            </span>
                                        )}
                                    </div>

                                    {description && (
                                        <p className="text-xs text-gray-700 leading-snug line-clamp-2 mb-2 italic">
                                            {description}
                                        </p>
                                    )}

                                    {/* Action Button */}
                                    <button
                                        onClick={() =>
                                            handleTogglePoiSelection(poi.id)
                                        }
                                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isSelected
                                                ? "bg-green-100 text-green-700 border border-green-200"
                                                : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
                                        }`}
                                    >
                                        {isSelected
                                            ? t("poiList.added")
                                            : t("poiList.addToTrip")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default MobilePlacesSheet;
