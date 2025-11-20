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
import { startIcon, endIcon, poiIcon } from "../../utils/mapIcons";
import RoutePanel from "../RoutePanel/RoutePanel";
import PoiFilter from "../PoiFilter/PoiFilter";

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
  const [selectionMode, setSelectionMode] = useState(null); // 'start', 'end', or null
  const [route, setRoute] = useState([]);
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState([
    "attraction",
    "museum",
    "viewpoint",
    "monument",
    "castle",
    "artwork",
    "historic",
  ]);
  const [maxDistance, setMaxDistance] = useState(null);
  const [poiMetadata, setPoiMetadata] = useState(null);

  // 1. Calculate route when start/end points change
  useEffect(() => {
    if (!startPoint || !endPoint) {
      setRoute([]);
      setPois([]);
      setPoiMetadata(null);
      return;
    }

    const getRoute = async () => {
      setLoading(true);
      setError("");
      // Don't clear POIs yet, let them stay until new route is ready or just clear them if you want
      setPois([]);
      setPoiMetadata(null);

      try {
        const latLngs = await fetchRouteData(startPoint, endPoint);
        setRoute(latLngs);
      } catch (e) {
        console.error(e);
        setError(e.message || "Ошибка загрузки маршрута");
        setLoading(false); // Stop loading if route fails
      }
    };

    getRoute();
  }, [startPoint, endPoint]);

  // 2. Fetch POIs when route or filters change
  useEffect(() => {
    if (route.length === 0) return;

    const getPois = async () => {
      setLoading(true); // Set loading while fetching POIs

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
      } catch (e) {
        console.error(e);
        // Don't overwrite route error if any, but maybe show warning
      } finally {
        setLoading(false);
      }
    };

    // Debounce POI fetching to avoid too many requests while sliding
    const timer = setTimeout(() => {
      getPois();
    }, 300);

    return () => clearTimeout(timer);
  }, [route, selectedCategories, maxDistance]);

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
    setError("");
    // Reset filters to default if desired, or keep them
    setSelectedCategories([
      "attraction",
      "museum",
      "viewpoint",
      "monument",
      "castle",
      "artwork",
      "historic",
    ]);
    setMaxDistance(null);
  };

  // Default center (Germany)
  const defaultCenter = [50.5, 10.5];
  const center = startPoint || defaultCenter;

  return (
    <div className="h-screen w-screen relative">
      <RoutePanel
        startPoint={startPoint}
        endPoint={endPoint}
        selectionMode={selectionMode}
        onSelectStart={handleSelectStart}
        onSelectEnd={handleSelectEnd}
        onClear={handleClear}
      />

      {route.length > 0 && (
        <PoiFilter
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          maxDistance={maxDistance}
          onMaxDistanceChange={setMaxDistance}
          poiCount={pois.length}
          totalCount={poiMetadata?.total || pois.length}
          disabled={loading}
        />
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
              📍 Начальная точка
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
              🏁 Конечная точка
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

        {pois.map((poi) => {
          return (
            <Marker key={poi.id} position={[poi.lat, poi.lon]} icon={poiIcon}>
              <Popup>
                <strong>{poi.name}</strong>
                <br />
                {poi.tags?.tourism && <span>{poi.tags.tourism}</span>}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {loading && (
        <div className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span>Загрузка маршрута...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute top-4 right-4 z-[1000] bg-red-100 p-3 rounded-lg shadow-lg text-red-600">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

export default MapView;
