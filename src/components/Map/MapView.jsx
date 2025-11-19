import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useEffect } from "react";

import { fetchRouteData, fetchPoisData } from "../../api/routeApi";

const to = [48.7798583906272, 9.186483038222779];
const from = [49.14355281960858, 9.211053078790103];

function MapView() {
  const [route, setRoute] = useState([]); // [ [lat, lng], ... ]
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const getRouteAndPois = async () => {
      setLoading(true);
      setError("");
      setPois([]);

      try {
        // 1. Get Route
        const latLngs = await fetchRouteData(from, to);
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
  }, []); // Run once on mount for now, since from/to are constants

  return (
    <div className="h-screen w-screen">
      <MapContainer
        center={from}
        zoom={6}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={from}>
          <Popup>Старт</Popup>
        </Marker>

        <Marker position={to}>
          <Popup>Финиш</Popup>
        </Marker>

        {route.length > 0 && <Polyline positions={route} />}

        {pois.map((poi) => {
          console.log("🗺️ Rendering POI:", poi.name, "at", poi.lat, poi.lon);
          return (
            <Marker key={poi.id} position={[poi.lat, poi.lon]}>
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
        <div className="absolute top-4 left-16 z-[1000] bg-white p-2 rounded shadow">
          Загрузка...
        </div>
      )}
      {error && (
        <div className="absolute top-4 left-16 z-[1000] bg-red-100 p-2 rounded shadow text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}

export default MapView;
