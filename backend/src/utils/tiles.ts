export interface Tile {
  id: string;
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export const TILE_SIZE_DEG = 0.25;

export function latToIndex(lat: number): number {
  return Math.floor(lat / TILE_SIZE_DEG);
}

export function lonToIndex(lon: number): number {
  return Math.floor(lon / TILE_SIZE_DEG);
}

export function getTileId(latIndex: number, lonIndex: number): string {
  return `${latIndex}_${lonIndex}`;
}

export function getTileBbox(
  latIndex: number,
  lonIndex: number
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  return {
    minLat: latIndex * TILE_SIZE_DEG,
    maxLat: (latIndex + 1) * TILE_SIZE_DEG,
    minLon: lonIndex * TILE_SIZE_DEG,
    maxLon: (lonIndex + 1) * TILE_SIZE_DEG,
  };
}

export function getTilesForRoute(route: number[][], radiusKm: number): Tile[] {
  const tiles = new Map<string, Tile>();

  // Approximation: 1 degree lat ~= 111 km
  // 1 degree lon ~= 111 km * cos(lat)
  const latDeg = radiusKm / 111;

  for (const [lat, lon] of route) {
    // Calculate the bounding box for the point + radius
    // We use a simplified approach: check the square area around the point
    const minLat = lat - latDeg;
    const maxLat = lat + latDeg;

    // Longitude degree length varies with latitude
    const lonScale = Math.cos((lat * Math.PI) / 180);
    const lonDeg = radiusKm / (111 * Math.abs(lonScale || 0.0001)); // Avoid div by zero

    const minLon = lon - lonDeg;
    const maxLon = lon + lonDeg;

    const startLatIdx = latToIndex(minLat);
    const endLatIdx = latToIndex(maxLat);
    const startLonIdx = lonToIndex(minLon);
    const endLonIdx = lonToIndex(maxLon);

    for (let i = startLatIdx; i <= endLatIdx; i++) {
      for (let j = startLonIdx; j <= endLonIdx; j++) {
        const id = getTileId(i, j);
        if (!tiles.has(id)) {
          tiles.set(id, {
            id,
            ...getTileBbox(i, j),
          });
        }
      }
    }
  }

  return Array.from(tiles.values());
}
