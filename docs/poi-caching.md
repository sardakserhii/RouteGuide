# POI Caching System

## Overview

This document describes the tile-based POI caching system implemented to improve performance and reliability when fetching Points of Interest (POI) along routes.

## Problem Statement

The original implementation made single large requests to the Overpass API for entire route bounding boxes, which caused:

- Long response times or timeouts for long routes
- Heavy JSON responses
- Frontend performance degradation due to too many markers
- Overpass API rate limiting issues

## Solution Architecture

### 1. Tile-Based Querying

Instead of querying the entire route area at once, we divide the route corridor into fixed-size tiles:

- **Tile Size**: Configurable via `TILE_SIZE_DEG` (default: 0.25 degrees ≈ 28km at equator)
- **Coverage**: Tiles are calculated based on route points and a configurable radius
- **Unique Identification**: Each tile has a unique ID based on its lat/lon index

### 2. Local SQLite Cache

POIs and tile metadata are stored in a local SQLite database (`data/poi_cache.db`):

#### Database Schema

**`pois` table**

- Stores individual POI data from Overpass
- Indexed by `id` (composite: `osm_type/osm_id`)
- Includes coordinates, tags (as JSON), and last update timestamp

**`tiles` table**

- Stores tile metadata including bbox and filters hash
- Tracks when each tile was last fetched (`fetched_at`)
- `filters_hash` ensures cache invalidation when filter parameters change

**`tile_pois` table**

- Junction table linking tiles to POIs
- Allows quick retrieval of all POIs within a tile

### 3. Caching Logic

```
For each tile along the route:
  1. Calculate filters hash
  2. Check if tile exists in cache
  3. If fresh (< TTL):
     → Return cached POIs
  4. Else:
     → Fetch from Overpass API
     → Store in database
     → Link POIs to tile
     → Return fresh data
```

**Cache TTL**: Configurable via `POI_CACHE_TTL_DAYS` (default: 7 days)

### 4. Deduplication and Filtering

After collecting POIs from all tiles:

1. **Deduplication**: Remove duplicate POIs by `osm_id`
2. **Distance Filtering**: Calculate actual distance from route and filter by `maxDistance`
3. **Truncation**: Limit results to `MAX_POIS` to prevent overwhelming the frontend

## Configuration Parameters

All parameters are configured via environment variables:

| Variable             | Default | Description                        |
| -------------------- | ------- | ---------------------------------- |
| `TILE_SIZE_DEG`      | `0.25`  | Tile size in degrees               |
| `MAX_POIS`           | `1000`  | Maximum POIs returned from backend |
| `MAX_RENDERED_POIS`  | `800`   | Maximum POIs rendered on frontend  |
| `POI_CACHE_TTL_DAYS` | `7`     | Cache freshness duration           |

## API Changes

### Request

The `POST /api/pois` endpoint now accepts:

```json
{
  "bbox": [minLat, maxLat, minLng, maxLng],
  "route": [[lat, lng], ...],
  "filters": {
    "categories": ["museum", "castle", ...],
    "maxDistance": 10,
    "limit": 50,
    "useAi": false,
    "useTileCache": true  // New flag
  }
}
```

### Response

```json
{
  "pois": [...],
  "metadata": {
    "total": 500,
    "filtered": 50,
    "truncated": false,  // New flag
    "filtersApplied": {
      "categories": [...],
      "maxDistance": 10,
      "limit": 50,
      "useAi": false,
      "aiApplied": false,
      "useTileCache": true
    }
  }
}
```

The `truncated` flag indicates if results were capped at `MAX_POIS`.

## Performance Benefits

1. **Reduced Overpass Load**: Only uncached tiles trigger API requests
2. **Faster Responses**: Cached tiles return instantly
3. **Fault Tolerance**: Stale cache can be returned on Overpass errors
4. **Incremental Loading**: Tiles can be fetched in parallel (future optimization)

## Limitations & Maintenance

### Database Growth

- POI data accumulates over time
- Tiles with different filter hashes are stored separately
- **Recommendation**: Implement periodic cleanup of old tiles (e.g., > 30 days)

### Filter Changes

- Changing `categories` invalidates cache (new `filters_hash`)
- May cause cache misses until tiles are refetched

### Edge Cases

- **Tile boundaries**: POIs near tile edges may be included in multiple tiles (handled by deduplication)
- **Large radius**: Very large `maxDistance` values may generate many tiles

## Future Enhancements

1. **Parallel tile fetching**: Load multiple tiles concurrently
2. **Progressive loading**: Send tiles to frontend as they're loaded
3. **Spatial indexing**: Use R-tree for faster distance queries
4. **Cache warming**: Pre-fetch popular routes
5. **Database cleanup**: Automated purging of old/unused tiles

## Testing

Run tile utility tests:

```bash
npx ts-node tests/tiles.test.ts
```

## Files

- `src/utils/tiles.ts` - Tile calculation utilities
- `src/db/database.ts` - SQLite initialization
- `src/db/poisRepository.ts` - POI data access
- `src/db/tilesRepository.ts` - Tile data access
- `src/services/tilePoisService.ts` - Tile-based POI loading with cache
- `src/controllers/poiController.ts` - Updated endpoint logic
