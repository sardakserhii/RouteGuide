import { useState, useEffect, useCallback } from 'react';
import { fetchRouteData, fetchPoisData } from '../api/routeApi';
import { buildGoogleMapsDirectionsUrl } from '../utils/buildGoogleMapsDirectionsUrl';
import { getCurrentLocation } from '../services/geolocationService';
import { reverseGeocode } from '../services/geocodingService';

/**
 * Custom hook for route planning business logic
 * Manages state and handlers for route building, POI filtering, and trip planning
 * Shared between desktop and mobile UI components
 */
export function useRouteLogic() {
  // Route points state
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [selectionMode, setSelectionMode] = useState(null); // "start", "end", or null

  // Route and POI data
  const [route, setRoute] = useState([]);
  const [pois, setPois] = useState([]);
  const [poiMetadata, setPoiMetadata] = useState(null);
  const [visiblePois, setVisiblePois] = useState([]);

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState([
    'attraction',
    'museum',
    'viewpoint',
    'park',
  ]);
  const [maxDistance, setMaxDistance] = useState(null);
  const [useAi, setUseAi] = useState(false);
  const [arePoisRequested, setArePoisRequested] = useState(false);

  // Trip planning state
  const [selectedPoiIds, setSelectedPoiIds] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Geolocation state
  const [geolocationLoading, setGeolocationLoading] = useState(false);
  const [geolocationError, setGeolocationError] = useState(null);

  /**
   * Build route when start/end points change
   */
  useEffect(() => {
    if (startPoint && endPoint) {
      handleBuildRoute();
    }
  }, [startPoint, endPoint]);

  /**
   * Fetch POIs when route or filters change
   */
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
          // Fallback for old API response format
          setPois(Array.isArray(data) ? data : []);
        }
        setSelectedPoiIds([]);
      } catch (e) {
        console.error(e);
        setError('Unable to load places right now. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Debounce POI fetching to avoid too many requests
    const timer = setTimeout(() => {
      getPois();
    }, 300);

    return () => clearTimeout(timer);
  }, [route, selectedCategories, maxDistance, useAi, arePoisRequested]);

  /**
   * Reset visible POIs when POIs list changes
   */
  useEffect(() => {
    if (pois.length === 0) {
      setVisiblePois([]);
      setSelectedPoiIds([]);
    }
  }, [pois]);

  /**
   * Enable map click mode to select start point
   */
  const handleSelectStart = useCallback(() => {
    setSelectionMode('start');
  }, []);

  /**
   * Enable map click mode to select end point
   */
  const handleSelectEnd = useCallback(() => {
    setSelectionMode('end');
  }, []);

  /**
   * Process map click to set start or end point
   */
  const handlePointSelected = useCallback(
    (point) => {
      if (selectionMode === 'start') {
        setStartPoint(point);
        setSelectionMode(null);
      } else if (selectionMode === 'end') {
        setEndPoint(point);
        setSelectionMode(null);
      }
    },
    [selectionMode]
  );

  /**
   * Build route from start to end point
   */
  const handleBuildRoute = useCallback(async () => {
    if (!startPoint || !endPoint) return;

    setLoading(true);
    setError('');
    setRoute([]);
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
        e?.message || 'Unable to calculate the route. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [startPoint, endPoint]);

  /**
   * Clear all route data and filters
   */
  const handleClear = useCallback(() => {
    setStartPoint(null);
    setEndPoint(null);
    setSelectionMode(null);
    setRoute([]);
    setPois([]);
    setPoiMetadata(null);
    setSelectedPoiIds([]);
    setError('');
    setSelectedCategories(['attraction', 'museum', 'viewpoint', 'park']);
    setMaxDistance(null);
    setUseAi(false);
    setArePoisRequested(false);
    setGeolocationError(null);
  }, []);

  /**
   * Toggle POI selection for trip planning
   */
  const handleTogglePoiSelection = useCallback((poiId) => {
    setSelectedPoiIds((current) =>
      current.includes(poiId)
        ? current.filter((id) => id !== poiId)
        : [...current, poiId]
    );
  }, []);

  /**
   * Add multiple POIs to selection
   */
  const handleSelectVisiblePois = useCallback((poiIds = []) => {
    setSelectedPoiIds((current) => {
      const merged = new Set([...current, ...poiIds]);
      return Array.from(merged);
    });
  }, []);

  /**
   * Clear all POI selections
   */
  const handleClearPoiSelection = useCallback(() => {
    setSelectedPoiIds([]);
  }, []);

  /**
   * Calculate fallback distance from start point (if backend doesn't provide it)
   */
  const calculateFallbackDistance = useCallback(
    (poi) => {
      if (!startPoint) return null;
      const lng = typeof poi.lng === 'number' ? poi.lng : poi.lon;
      if (typeof poi.lat !== 'number' || typeof lng !== 'number') return null;

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
    },
    [startPoint]
  );

  /**
   * Sort POIs by distance along route for export
   */
  const sortPoisForExport = useCallback(
    (selected = []) => {
      return selected
        .map((poi) => {
          const distanceForSort =
            typeof poi.distanceAlongRoute === 'number'
              ? poi.distanceAlongRoute
              : calculateFallbackDistance(poi);
          return { ...poi, _distanceForSort: distanceForSort };
        })
        .sort((a, b) => {
          if (
            typeof a._distanceForSort === 'number' &&
            typeof b._distanceForSort === 'number'
          ) {
            return a._distanceForSort - b._distanceForSort;
          }
          if (typeof a._distanceForSort === 'number') return -1;
          if (typeof b._distanceForSort === 'number') return 1;
          return 0;
        })
        .slice(0, 23)
        .map((poi) => {
          const { _distanceForSort, ...rest } = poi;
          return rest;
        });
    },
    [calculateFallbackDistance]
  );

  /**
   * Export selected POIs to Google Maps
   */
  const handleExportToGoogleMaps = useCallback(() => {
    if (!startPoint || !endPoint) {
      window.alert(
        'Please select both start and destination before exporting.'
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
      window.alert('Could not build a Google Maps link. Please try again.');
      return;
    }

    if (selected.length > 23) {
      window.alert(
        'Google Maps allows up to 23 stops between origin and destination. Exporting the first 23 selected places.'
      );
    } else if (selected.length === 0) {
      console.info(
        '[maps] No POIs selected. Opening a direct route without stops.'
      );
    }

    window.open(url, '_blank');
  }, [startPoint, endPoint, pois, selectedPoiIds, sortPoisForExport]);

  /**
   * Use device geolocation to set start point
   * Only called on explicit user action (button click)
   */
  const handleUseCurrentLocation = useCallback(async () => {
    setGeolocationLoading(true);
    setGeolocationError(null);

    try {
      // Get current position
      const position = await getCurrentLocation();
      const { lat, lng } = position;

      // Set start point with coordinates
      setStartPoint([lat, lng]);

      // Clear selection mode if active
      setSelectionMode(null);

      // Optional: Reverse geocode to get readable name is handled by RoutePanel/MobileRouteSheet
      // The components will display the geocoded name automatically

      return { success: true, position };
    } catch (err) {
      console.error('Geolocation error:', err);
      setGeolocationError(err.message);
      return { success: false, error: err };
    } finally {
      setGeolocationLoading(false);
    }
  }, []);

  /**
   * Apply filters and trigger POI loading
   */
  const handleApplyFilters = useCallback(() => {
    setArePoisRequested(true);
  }, []);

  return {
    // State
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
    geolocationLoading,
    geolocationError,

    // Setters for external use
    setStartPoint,
    setEndPoint,
    setSelectedCategories,
    setMaxDistance,
    setUseAi,
    setVisiblePois,
    setArePoisRequested,

    // Handlers
    handleSelectStart,
    handleSelectEnd,
    handlePointSelected,
    handleBuildRoute,
    handleClear,
    handleTogglePoiSelection,
    handleSelectVisiblePois,
    handleClearPoiSelection,
    handleExportToGoogleMaps,
    handleUseCurrentLocation,
    handleApplyFilters,
  };
}
