import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { startIcon, endIcon } from "../../utils/mapIcons";
import {
  getCategoryIcon,
  getNumberedCategoryIcon,
} from "../../utils/categoryIcons";
import RoutePanel from "../RoutePanel/RoutePanel";
import PoiFilter from "../PoiFilter/PoiFilter";
import PoiList from "../PoiList/PoiList";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import MobileBottomSheet from "../mobile/MobileBottomSheet";
import { useRouteLogic } from "../../hooks/useRouteLogic";

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
  // Use shared business logic hook
  const routeLogic = useRouteLogic();

  const {
    startPoint,
    endPoint,
    selectionMode,
    route,
    pois,
    poiMetadata,
    visiblePois,
    selectedCategories,
    maxDistance,
    useAi,
    arePoisRequested,
    selectedPoiIds,
    loading,
    error,
    handleSelectStart,
    handleSelectEnd,
    handlePointSelected,
    handleBuildRoute,
    handleClear,
    handleTogglePoiSelection,
    handleSelectVisiblePois,
    handleClearPoiSelection,
    handleExportToGoogleMaps,
    setSelectedCategories,
    setMaxDistance,
    setUseAi,
    setVisiblePois,
    handleApplyFilters,
  } = routeLogic;

  // Default center (Germany)
  const defaultCenter = [50.5, 10.5];
  const center = startPoint || defaultCenter;
  const showPoiList = pois.length > 0 || arePoisRequested || route.length > 0;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Language Switcher (visible on all devices) */}
      <LanguageSwitcher />

      {/* Left Panel - Desktop Only */}
      <aside className="hidden md:block absolute top-0 left-0 z-[1000]">
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
            onApply={handleApplyFilters}
          />
        )}
      </aside>

      {/* Map - Full Screen on Both Mobile and Desktop */}
      <div className="absolute inset-0 z-0">
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

        {/* Loading Indicator */}
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

        {/* Error Message */}
        {error && (
          <div className="absolute top-4 right-4 z-[1000] bg-red-100 p-3 rounded-lg shadow-lg text-red-600">
            Error: {error}
          </div>
        )}

        {/* Truncation Warning */}
        {poiMetadata?.truncated && (
          <div className="absolute bottom-4 right-4 z-[1000] bg-yellow-100 p-3 rounded-lg shadow-lg text-yellow-800 max-w-xs">
            Showing {pois.length} places out of {poiMetadata.total}. Narrow
            filters to see fewer.
          </div>
        )}
      </div>

      {/* Right Panel - Desktop Only */}
      <aside className="hidden md:flex absolute top-0 right-0 h-full items-start justify-end z-[1000] pointer-events-none">
        {showPoiList && (
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
        )}
      </aside>

      {/* Mobile Bottom Sheet - Mobile Only */}
      <div className="md:hidden">
        <MobileBottomSheet routeLogic={routeLogic} />
      </div>
    </div>
  );
}

export default MapView;
