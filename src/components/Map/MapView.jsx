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

  // Calculate route when both points are selected
  useEffect(() => {
    if (!startPoint || !endPoint) {
      setRoute([]);
      setPois([]);
      return;
    }

    const getRouteAndPois = async () => {
      setLoading(true);
      setError("");
      setPois([]);

      try {
        // 1. Get Route
        const latLngs = await fetchRouteData(startPoint, endPoint);
        setRoute(latLngs);

        // 2. Calculate Bounding Box for POIs
        if (latLngs.length > 0) {
          const lats = latLngs.map((p) => p[0]);
          const lngs = latLngs.map((p) => p[1]);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);

          // 3. Get POIs
          const poisData = await fetchPoisData(
            [minLat, maxLat, minLng, maxLng],
            latLngs
          );
          console.log("✅ Setting POIs state:", poisData?.length || 0);
          setPois(poisData);
        }
      } catch (e) {
        console.error(e);
        setError(e.message || "Ошибка загрузки данных");
      } finally {
        setLoading(false);
      }
    };

    getRouteAndPois();
  }, [startPoint, endPoint]);

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
    setError("");
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
