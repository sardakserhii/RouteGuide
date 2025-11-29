import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { reverseGeocode } from "../../services/geocodingService";

function RoutePanel({
    startPoint,
    endPoint,
    selectionMode,
    onSelectStart,
    onSelectEnd,
    onClear,
    onBuildRoute,
    routeBuilt,
}) {
    const { t } = useTranslation();
    const [startLocationName, setStartLocationName] = useState(null);
    const [endLocationName, setEndLocationName] = useState(null);
    const [geocodingStart, setGeocodingStart] = useState(false);
    const [geocodingEnd, setGeocodingEnd] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    // Auto-collapse when route is built
    useEffect(() => {
        if (routeBuilt) {
            setIsExpanded(false);
        }
    }, [routeBuilt]);

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
                        `${startPoint[0].toFixed(5)}, ${startPoint[1].toFixed(
                            5
                        )}`
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

    return (
        <div className="absolute top-5 left-5 z-[1000] bg-white rounded-xl shadow-xl min-w-80 font-sans overflow-hidden">
            {/* Collapsible Header */}
            <div
                className="p-4 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div>
                    <h2 className="m-0 text-lg font-semibold text-gray-800">
                        {t("routePanel.title")}
                    </h2>
                    {!isExpanded && startPoint && endPoint && (
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-[250px]">
                            {startLocationName?.split(",")[0]} →{" "}
                            {endLocationName?.split(",")[0]}
                        </p>
                    )}
                </div>
                <button className="text-gray-400 hover:text-gray-600 text-xl font-light">
                    {isExpanded ? "−" : "+"}
                </button>
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
                <div className="p-5 pt-3">
                    <p className="text-xs text-gray-500 mb-4">
                        {t("routePanel.subtitle")}
                    </p>

                    {/* Start Point Section */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                        <div className="mb-2">
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                {t("routePanel.startPoint")}
                            </label>
                            {startPoint ? (
                                <span className="block text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-md mb-2">
                                    {geocodingStart ? (
                                        <span className="italic">
                                            {t("routePanel.loadingLocation")}
                                        </span>
                                    ) : (
                                        startLocationName ||
                                        `${startPoint[0].toFixed(
                                            5
                                        )}, ${startPoint[1].toFixed(5)}`
                                    )}
                                </span>
                            ) : (
                                <span className="block text-xs text-gray-400 italic mb-2">
                                    {t("routePanel.startPlaceholder")}
                                </span>
                            )}
                        </div>
                        <button
                            className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${
                    selectionMode === "start"
                        ? "bg-green-600 text-white hover:bg-green-700 animate-pulse"
                        : "bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-300"
                }`}
                            onClick={onSelectStart}
                        >
                            {selectionMode === "start"
                                ? t("routePanel.clickToSet")
                                : t("routePanel.pickOnMap")}
                        </button>
                    </div>

                    {/* End Point Section */}
                    <div className="mb-4 pb-4">
                        <div className="mb-2">
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                {t("routePanel.destination")}
                            </label>
                            {endPoint ? (
                                <span className="block text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-md mb-2">
                                    {geocodingEnd ? (
                                        <span className="italic">
                                            {t("routePanel.loadingLocation")}
                                        </span>
                                    ) : (
                                        endLocationName ||
                                        `${endPoint[0].toFixed(
                                            5
                                        )}, ${endPoint[1].toFixed(5)}`
                                    )}
                                </span>
                            ) : (
                                <span className="block text-xs text-gray-400 italic mb-2">
                                    {t("routePanel.endPlaceholder")}
                                </span>
                            )}
                        </div>
                        <button
                            className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${
                    selectionMode === "end"
                        ? "bg-green-600 text-white hover:bg-green-700 animate-pulse"
                        : "bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-300"
                }`}
                            onClick={onSelectEnd}
                        >
                            {selectionMode === "end"
                                ? t("routePanel.clickToSet")
                                : t("routePanel.pickOnMap")}
                        </button>
                    </div>

                    {/* Example text */}
                    <div className="mb-4 text-center">
                        <span className="text-xs text-gray-400 italic">
                            {t("routePanel.exampleRoute")}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    {!routeBuilt && (
                        <button
                            disabled={!startPoint || !endPoint}
                            className={`w-full px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-200
                  ${
                      startPoint && endPoint
                          ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-indigo-300 hover:-translate-y-0.5"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                            onClick={onBuildRoute}
                        >
                            {t("routePanel.buildRoute")}
                        </button>
                    )}

                    {/* Clear Button */}
                    {(startPoint || endPoint) && (
                        <button
                            className="w-full px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-medium
                         transition-all duration-200 hover:bg-red-50 mt-3"
                            onClick={onClear}
                        >
                            {t("routePanel.clearPoints")}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default RoutePanel;
