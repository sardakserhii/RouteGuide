export interface DbPoi {
  id: string;
  osm_type: string;
  osm_id: number;
  lat: number;
  lon: number;
  tags: string | Record<string, any>; // JSON string in SQLite, object in Postgres
  updated_at: string | Date;
}

export interface DbTile {
  id: string;
  min_lat: number;
  max_lat: number;
  min_lon: number;
  max_lon: number;
  filters_hash: string;
  fetched_at: string | Date;
}
