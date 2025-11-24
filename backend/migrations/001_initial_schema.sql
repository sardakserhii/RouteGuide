-- RouteGuide POI Caching Schema for Supabase PostgreSQL
-- This schema stores POIs (Points of Interest) and tiles for efficient caching

-- Table: pois
-- Stores Points of Interest data from Overpass API
CREATE TABLE IF NOT EXISTS pois (
    id TEXT PRIMARY KEY,
    osm_type TEXT NOT NULL,
    osm_id BIGINT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    tags JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table: tiles
-- Stores tile metadata for spatial caching
CREATE TABLE IF NOT EXISTS tiles (
    id TEXT NOT NULL,
    min_lat DOUBLE PRECISION NOT NULL,
    max_lat DOUBLE PRECISION NOT NULL,
    min_lon DOUBLE PRECISION NOT NULL,
    max_lon DOUBLE PRECISION NOT NULL,
    filters_hash TEXT NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, filters_hash)
);

-- Table: tile_pois
-- Junction table linking tiles to POIs
CREATE TABLE IF NOT EXISTS tile_pois (
    tile_id TEXT NOT NULL,
    filters_hash TEXT NOT NULL,
    poi_id TEXT NOT NULL,
    PRIMARY KEY (tile_id, filters_hash, poi_id),
    FOREIGN KEY (tile_id, filters_hash) REFERENCES tiles(id, filters_hash) ON DELETE CASCADE,
    FOREIGN KEY (poi_id) REFERENCES pois(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pois_coords ON pois(lat, lon);
CREATE INDEX IF NOT EXISTS idx_pois_osm ON pois(osm_type, osm_id);
CREATE INDEX IF NOT EXISTS idx_tiles_filters ON tiles(filters_hash);
CREATE INDEX IF NOT EXISTS idx_tiles_fetched ON tiles(fetched_at);
CREATE INDEX IF NOT EXISTS idx_tile_pois_tile ON tile_pois(tile_id, filters_hash);
CREATE INDEX IF NOT EXISTS idx_tile_pois_poi ON tile_pois(poi_id);

-- Enable Row Level Security (optional, but recommended for Supabase)
ALTER TABLE pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tile_pois ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated access (adjust as needed)
CREATE POLICY "Enable read access for all users" ON pois
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON pois
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON pois
    FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON tiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON tiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON tiles
    FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON tile_pois
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON tile_pois
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON tile_pois
    FOR DELETE USING (true);
