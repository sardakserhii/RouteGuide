export interface PoiTags {
  tourism?: string;
  historic?: string;
  amenity?: string;
  natural?: string;
  shop?: string;
  image?: string;
  photo?: string;
  "image:0"?: string;
  wikimedia_commons?: string;
  "addr:street"?: string;
  "addr:housenumber"?: string;
  "addr:city"?: string;
  "addr:country"?: string;
  "description:ru"?: string;
  description?: string;
  comment?: string;
  opening_hours?: string;
  wikipedia?: string;
  website?: string;
  url?: string;
  phone?: string;
  [key: string]: string | undefined;
}

export interface Poi {
  id: string | number;
  lat: number;
  lon: number;
  name?: string;
  tags?: PoiTags;
  description?: string;
  isTopPick?: boolean;
}

export interface EnrichedPoi extends Poi {
  distance: number;
  category: string;
}

export interface CategoryOption {
  key: string;
  label: string;
  count: number;
}
