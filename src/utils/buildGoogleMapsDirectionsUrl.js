/**
 * @typedef {{ lat: number, lng: number }} LatLng
 * @typedef {{ id?: string; lat: number; lon?: number; lng?: number; distanceAlongRoute?: number }} Poi
 */

/**
 * Build a Google Maps directions URL for origin -> waypoints -> destination.
 * Returns an empty string if origin or destination are missing.
 *
 * @param {{ origin?: LatLng; destination?: LatLng; pois?: Poi[] }} params
 * @returns {string}
 */
export function buildGoogleMapsDirectionsUrl({
  origin,
  destination,
  pois = [],
}) {
  const isInvalidPoint = (point) =>
    !point || typeof point.lat !== "number" || typeof point.lng !== "number";

  if (isInvalidPoint(origin) || isInvalidPoint(destination)) {
    console.warn(
      "[maps] Origin and destination must contain numeric lat/lng values."
    );
    return "";
  }

  const formatCoord = (point) =>
    `${Number(point.lat).toFixed(6)},${Number(point.lng).toFixed(6)}`;

  const waypoints = (Array.isArray(pois) ? pois : [])
    .slice(0, 23) // Defensive limit: Google Maps allows max 25 points total (origin + destination + 23 waypoints)
    .map((poi) => {
      const lng = typeof poi.lng === "number" ? poi.lng : poi.lon;
      if (typeof poi.lat !== "number" || typeof lng !== "number") return null;
      return `${poi.lat.toFixed(6)},${lng.toFixed(6)}`;
    })
    .filter(Boolean)
    .join("|");

  const queryParts = [
    "api=1",
    `origin=${formatCoord(origin)}`,
    `destination=${formatCoord(destination)}`,
    "travelmode=driving",
  ];

  if (waypoints) {
    queryParts.push(`waypoints=${encodeURIComponent(waypoints)}`);
  }

  return `https://www.google.com/maps/dir/?${queryParts.join("&")}`;
}
