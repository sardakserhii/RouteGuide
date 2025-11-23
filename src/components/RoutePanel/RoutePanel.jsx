import { useState, useEffect } from "react";
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

  return (
    <div className="absolute top-5 left-5 z-[1000] bg-white rounded-xl shadow-xl p-5 min-w-80 font-sans">
      <h2 className="m-0 text-lg font-semibold text-gray-800">
        Step 1. Build route
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Enter start and destination to see the path.
      </p>

      {/* Start Point Section */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Start point
          </label>
          {startPoint ? (
            <span className="block text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-md mb-2">
              {geocodingStart ? (
                <span className="italic">Loading location...</span>
              ) : (
                startLocationName ||
                `${startPoint[0].toFixed(5)}, ${startPoint[1].toFixed(5)}`
              )}
            </span>
          ) : (
            <span className="block text-xs text-gray-400 italic mb-2">
              Munich, address or place
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
            ? "Click on the map to set"
            : "Pick on map"}
        </button>
      </div>

      {/* End Point Section */}
      <div className="mb-4 pb-4">
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Destination
          </label>
          {endPoint ? (
            <span className="block text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-md mb-2">
              {geocodingEnd ? (
                <span className="italic">Loading location...</span>
              ) : (
                endLocationName ||
                `${endPoint[0].toFixed(5)}, ${endPoint[1].toFixed(5)}`
              )}
            </span>
          ) : (
            <span className="block text-xs text-gray-400 italic mb-2">
              Nuremberg, address or place
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
          {selectionMode === "end" ? "Click on the map to set" : "Pick on map"}
        </button>
      </div>

      {/* Example text */}
      <div className="mb-4 text-center">
        <span className="text-xs text-gray-400 italic">
          Example: Munich → Nuremberg
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
          Build route
        </button>
      )}

      {/* Clear Button */}
      {(startPoint || endPoint) && (
        <button
          className="w-full px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-medium
                     transition-all duration-200 hover:bg-red-50 mt-3"
          onClick={onClear}
        >
          Clear points and filters
        </button>
      )}
    </div>
  );
}

export default RoutePanel;
