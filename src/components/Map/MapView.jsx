import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useState, useEffect } from "react";

import { fetchRouteData, fetchPoisData } from "../../api/routeApi";
import { startIcon, endIcon } from "../../utils/mapIcons";
import {
  getCategoryIcon,
  getNumberedCategoryIcon,
} from "../../utils/categoryIcons";
import RoutePanel from "../RoutePanel/RoutePanel";
import PoiFilter from "../PoiFilter/PoiFilter";
import PoiList from "../PoiList/PoiList";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import { buildGoogleMapsDirectionsUrl } from "../../utils/buildGoogleMapsDirectionsUrl";

// Component to handle map clicks
function MapClickHandler({ selectionMode, onPointSelected }) {
  useMapEvents({
    click(e) {
      if (selectionMode) {
        const { lat, lng } = e.latlng;
        onPointSelected([lat, lng]);
      }
    },
  });
  return null;
}

function MapView() {
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [selectionMode, setSelectionMode] = useState(null); // "start", "end", or null
  const [route, setRoute] = useState([]);
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visiblePois, setVisiblePois] = useState([]);
  const [selectedPoiIds, setSelectedPoiIds] = useState([]);

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState([
    "attraction",
    "museum",
    "viewpoint",
    "park",
  ]);
  const [maxDistance, setMaxDistance] = useState(null);
  const [useAi, setUseAi] = useState(false);
  const [poiMetadata, setPoiMetadata] = useState(null);
  const [arePoisRequested, setArePoisRequested] = useState(false);

  // 1. Calculate route when start/end points change
  // 1. Calculate route when start/end points change
  useEffect(() => {
    if (startPoint && endPoint) {
      handleBuildRoute();
    }
  }, [startPoint, endPoint]);

  // 1. Handle Route Building
  const handleBuildRoute = async () => {
    if (!startPoint || !endPoint) return;

    setLoading(true);
    setError("");
    setRoute([]);
    setPois([]);
    setPoiMetadata(null);
    setPois([]);
    setPoiMetadata(null);
    setArePoisRequested(true); // Auto-request POIs
    setVisiblePois([]);
    setSelectedPoiIds([]);

    try {
      const latLngs = await fetchRouteData(startPoint, endPoint);
      setRoute(latLngs);
    } catch (e) {
      console.error(e);
      setRoute([]);
      setError(
        e?.message || "Unable to calculate the route. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Clear route if points change (optional, but keeps state consistent)
  // useEffect(() => {
  //   setRoute([]);
  //   setPois([]);
  //   setPoiMetadata(null);
  //   setArePoisRequested(false);
  // }, [startPoint, endPoint]);

  // 2. Fetch POIs when route or filters change
  // 2. Fetch POIs when requested or filters change

  useEffect(() => {
    if (route.length === 0 || !arePoisRequested) return;

    const getPois = async () => {
      setLoading(true);

      try {
        // Calculate Bounding Box
        const lats = route.map((p) => p[0]);
        const lngs = route.map((p) => p[1]);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        // Prepare filters
        const filters = {
          categories: selectedCategories,
          maxDistance: maxDistance,
          limit: 50,
          useAi: useAi,
        };

        const data = await fetchPoisData(
          [minLat, maxLat, minLng, maxLng],
          route,
          filters
        );

        if (data.pois) {
          setPois(data.pois);
          setPoiMetadata(data.metadata);
        } else {
          // Fallback for old API response format if any
          setPois(Array.isArray(data) ? data : []);
        }
        setSelectedPoiIds([]);
      } catch (e) {
        console.error(e);
        setError("Unable to load places right now. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    // Debounce POI fetching to avoid too many requests while sliding
    const timer = setTimeout(() => {
      getPois();
    }, 300);

    return () => clearTimeout(timer);
  }, [route, selectedCategories, maxDistance, useAi, arePoisRequested]);

  useEffect(() => {
    if (pois.length === 0) {
      setVisiblePois([]);
      setSelectedPoiIds([]);
    }
  }, [pois]);

  const handlePointSelected = (point) => {
    if (selectionMode === "start") {
      setStartPoint(point);
      setSelectionMode(null);
    } else if (selectionMode === "end") {
      setEndPoint(point);
      setSelectionMode(null);
    }
  };

  const handleSelectStart = () => {
    setSelectionMode("start");
  };

  const handleSelectEnd = () => {
    setSelectionMode("end");
  };

  const handleClear = () => {
    setStartPoint(null);
    setEndPoint(null);
    setSelectionMode(null);
    setRoute([]);
    setPois([]);
    setPoiMetadata(null);
    setSelectedPoiIds([]);
    setError("");
    setSelectedCategories(["attraction", "museum", "viewpoint", "park"]);
    setMaxDistance(null);
    setUseAi(false);
    setArePoisRequested(false);
  };

  const handleTogglePoiSelection = (poiId) => {
    setSelectedPoiIds((current) =>
      current.includes(poiId)
        ? current.filter((id) => id !== poiId)
        : [...current, poiId]
    );
  };

  const handleSelectVisiblePois = (poiIds = []) => {
    setSelectedPoiIds((current) => {
      const merged = new Set([...current, ...poiIds]);
      return Array.from(merged);
    });
  };

  const handleClearPoiSelection = () => {
    setSelectedPoiIds([]);
  };

  // If backend does not provide distanceAlongRoute, use distance from origin as an approximation
  const calculateFallbackDistance = (poi) => {
    if (!startPoint) return null;
    const lng = typeof poi.lng === "number" ? poi.lng : poi.lon;
    if (typeof poi.lat !== "number" || typeof lng !== "number") return null;

    const R = 6371;
    const dLat = ((poi.lat - startPoint[0]) * Math.PI) / 180;
    const dLon = ((lng - startPoint[1]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((startPoint[0] * Math.PI) / 180) *
        Math.cos((poi.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const sortPoisForExport = (selected = []) => {
    return selected
      .map((poi) => {
        const distanceForSort =
          typeof poi.distanceAlongRoute === "number"
            ? poi.distanceAlongRoute
            : calculateFallbackDistance(poi);
        return { ...poi, _distanceForSort: distanceForSort };
      })
      .sort((a, b) => {
        if (
          typeof a._distanceForSort === "number" &&
          typeof b._distanceForSort === "number"
        ) {
          return a._distanceForSort - b._distanceForSort;
        }
        if (typeof a._distanceForSort === "number") return -1;
        if (typeof b._distanceForSort === "number") return 1;
        return 0;
      })
      .slice(0, 23)
      .map((poi) => {
        const { _distanceForSort, ...rest } = poi;
        return rest;
      });
  };

  const handleExportToGoogleMaps = () => {
    if (!startPoint || !endPoint) {
      window.alert(
        "Please select both start and destination before exporting."
      );
      return;
    }

    const selected = pois.filter((poi) => selectedPoiIds.includes(poi.id));
    const waypoints = sortPoisForExport(selected);
    const url = buildGoogleMapsDirectionsUrl({
      origin: { lat: startPoint[0], lng: startPoint[1] },
      destination: { lat: endPoint[0], lng: endPoint[1] },
      pois: waypoints,
    });

    if (!url) {
      window.alert("Could not build a Google Maps link. Please try again.");
      return;
    }

    if (selected.length > 23) {
      window.alert(
        "Google Maps allows up to 23 stops between origin and destination. Exporting the first 23 selected places."
      );
    } else if (selected.length === 0) {
      console.info(
        "[maps] No POIs selected. Opening a direct route without stops."
      );
    }

    window.open(url, "_blank");
  };

  // Default center (Germany)
  const defaultCenter = [50.5, 10.5];
  const center = startPoint || defaultCenter;

  return (
    <div className="h-screen w-screen relative">
      <LanguageSwitcher />

      <RoutePanel
        startPoint={startPoint}
        endPoint={endPoint}
        selectionMode={selectionMode}
        onSelectStart={handleSelectStart}
        onSelectEnd={handleSelectEnd}
        onClear={handleClear}
        onBuildRoute={handleBuildRoute}
        routeBuilt={route.length > 0}
      />

      {route.length > 0 && (
        <>
          <PoiFilter
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
            maxDistance={maxDistance}
            onMaxDistanceChange={setMaxDistance}
            useAi={useAi}
            onUseAiChange={setUseAi}
            poiCount={pois.length}
            totalCount={poiMetadata?.total || pois.length}
            disabled={loading}
            onApply={() => setArePoisRequested(true)}
          />
          <PoiList
            key={`${startPoint ? startPoint.join(",") : "no-start"}-${
              pois.length
            }`}
            pois={pois}
            startPoint={startPoint}
            onVisibleChange={setVisiblePois}
            selectedPoiIds={selectedPoiIds}
            onTogglePoiSelection={handleTogglePoiSelection}
            onSelectVisible={handleSelectVisiblePois}
            onClearSelection={handleClearPoiSelection}
            onExportRoute={handleExportToGoogleMaps}
          />
        </>
      )}

      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ cursor: selectionMode ? "crosshair" : "grab" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          selectionMode={selectionMode}
          onPointSelected={handlePointSelected}
        />

        {startPoint && (
          <Marker position={startPoint} icon={startIcon}>
            <Popup>
              Start point
              <br />
              <small>
                {startPoint[0].toFixed(5)}, {startPoint[1].toFixed(5)}
              </small>
            </Popup>
          </Marker>
        )}

        {endPoint && (
          <Marker position={endPoint} icon={endIcon}>
            <Popup>
              Destination
              <br />
              <small>
                {endPoint[0].toFixed(5)}, {endPoint[1].toFixed(5)}
              </small>
            </Popup>
          </Marker>
        )}

        {route.length > 0 && (
          <Polyline positions={route} color="#2563eb" weight={4} />
        )}

        {(visiblePois.length ? visiblePois : pois).map((poi, index) => {
          return (
            <Marker
              key={poi.id}
              position={[poi.lat, poi.lon]}
              icon={getNumberedCategoryIcon(poi.category, index + 1)}
            >
              <Popup>
                <strong>{poi.name}</strong>
                <br />
                {poi.tags?.tourism && <span>{poi.tags.tourism}</span>}
                {poi.description && (
                  <div className="mt-2 text-sm text-gray-700 italic border-t pt-1">
                    About: {poi.description}
                  </div>
                )}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white p-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span>
              {useAi
                ? "Fetching places with AI filtering..."
                : "Loading data..."}
            </span>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute top-4 right-4 z-[1000] bg-red-100 p-3 rounded-lg shadow-lg text-red-600">
          Error: {error}
        </div>
      )}
      {poiMetadata?.truncated && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-yellow-100 p-3 rounded-lg shadow-lg text-yellow-800 max-w-xs">
          Showing {pois.length} places out of {poiMetadata.total}. Narrow
          filters to see fewer.
        </div>
      )}
    </div>
  );
}

export default MapView;
