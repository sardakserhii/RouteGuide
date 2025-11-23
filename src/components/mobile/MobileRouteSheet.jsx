import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { reverseGeocode } from "../../services/geocodingService";

/**
 * Mobile route building interface
 * Allows users to set start/end points and build routes
 * Includes geolocation feature for start point
 */
function MobileRouteSheet({ routeLogic }) {
  const { t } = useTranslation();
  const {
    startPoint,
    endPoint,
    selectionMode,
    handleSelectStart,
    handleSelectEnd,
    handleBuildRoute,
    handleClear,
    handleUseCurrentLocation,
    geolocationLoading,
    geolocationError,
    route,
  } = routeLogic;

  const [startLocationName, setStartLocationName] = useState(null);
  const [endLocationName, setEndLocationName] = useState(null);
  const [geocodingStart, setGeocodingStart] = useState(false);
  const [geocodingEnd, setGeocodingEnd] = useState(false);

  // Geocode start point when it changes
  useEffect(() => {
    if (startPoint) {
      setGeocodingStart(true);
      reverseGeocode(startPoint[0], startPoint[1])
        .then((name) => {
          setStartLocationName(name);
          setGeocodingStart(false);
        })
        .catch(() => {
          setStartLocationName(
            `${startPoint[0].toFixed(5)}, ${startPoint[1].toFixed(5)}`
          );
          setGeocodingStart(false);
        });
    } else {
      setStartLocationName(null);
    }
  }, [startPoint]);

  // Geocode end point when it changes
  useEffect(() => {
    if (endPoint) {
      setGeocodingEnd(true);
      reverseGeocode(endPoint[0], endPoint[1])
        .then((name) => {
          setEndLocationName(name);
          setGeocodingEnd(false);
        })
        .catch(() => {
          setEndLocationName(
            `${endPoint[0].toFixed(5)}, ${endPoint[1].toFixed(5)}`
          );
          setGeocodingEnd(false);
        });
    } else {
      setEndLocationName(null);
    }
  }, [endPoint]);

  const handleGeolocationClick = async () => {
    const result = await handleUseCurrentLocation();
    // Error handling is managed by the hook and displayed below
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        {t("routePanel.title", "Побудуйте маршрут")}
      </h3>
      <p className="text-sm text-gray-600">
        {t("routePanel.subtitle", "Оберіть початкову та кінцеву точки")}
      </p>

      {/* Start Point Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t("routePanel.startPoint", "Початкова точка")}
        </label>
        {startPoint ? (
          <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            {geocodingStart ? (
              <span className="italic">
                {t("routePanel.loadingLocation", "Завантаження...")}
              </span>
            ) : (
              startLocationName ||
              `${startPoint[0].toFixed(5)}, ${startPoint[1].toFixed(5)}`
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic px-3 py-2">
            {t("routePanel.startPlaceholder", "Не вибрано")}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSelectStart}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              selectionMode === "start"
                ? "bg-green-600 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {selectionMode === "start"
              ? t("routePanel.clickToSet", "Натисніть на карту")
              : t("routePanel.pickOnMap", "Обрати на карті")}
          </button>

          <button
            onClick={handleGeolocationClick}
            disabled={geolocationLoading}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {geolocationLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>{t("mobile.locating", "Визначення...")}</span>
              </>
            ) : (
              <>
                <span>📍</span>
                <span>{t("mobile.useMyLocation", "Моє місце")}</span>
              </>
            )}
          </button>
        </div>

        {/* Geolocation Error */}
        {geolocationError && (
          <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            {geolocationError}
          </div>
        )}
      </div>

      {/* End Point Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {t("routePanel.destination", "Кінцева точка")}
        </label>
        {endPoint ? (
          <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            {geocodingEnd ? (
              <span className="italic">
                {t("routePanel.loadingLocation", "Завантаження...")}
              </span>
            ) : (
              endLocationName ||
              `${endPoint[0].toFixed(5)}, ${endPoint[1].toFixed(5)}`
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-400 italic px-3 py-2">
            {t("routePanel.endPlaceholder", "Не вибрано")}
          </div>
        )}

        <button
          onClick={handleSelectEnd}
          className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            selectionMode === "end"
              ? "bg-green-600 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {selectionMode === "end"
            ? t("routePanel.clickToSet", "Натисніть на карту")
            : t("routePanel.pickOnMap", "Обрати на карті")}
        </button>
      </div>

      {/* Example Route */}
      <div className="text-center">
        <span className="text-xs text-gray-400 italic">
          {t("routePanel.exampleRoute", "Наприклад: Київ → Львів")}
        </span>
      </div>

      {/* Action Buttons */}
      {route.length === 0 && (
        <button
          disabled={!startPoint || !endPoint}
          onClick={handleBuildRoute}
          className={`w-full px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${
            startPoint && endPoint
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {t("routePanel.buildRoute", "Збудувати маршрут")}
        </button>
      )}

      {/* Clear Button */}
      {(startPoint || endPoint) && (
        <button
          onClick={handleClear}
          className="w-full px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50 transition-all"
        >
          {t("routePanel.clearPoints", "Очистити")}
        </button>
      )}
    </div>
  );
}

export default MobileRouteSheet;
