export const CATEGORY_MAPPINGS: Record<string, string[]> = {
  // Tourism
  attraction: [
    'node["tourism"="attraction"]',
    'way["tourism"="attraction"]',
    'relation["tourism"="attraction"]',
  ],
  museum: ['node["tourism"="museum"]', 'way["tourism"="museum"]'],
  viewpoint: ['node["tourism"="viewpoint"]'],
  hotel: ['node["tourism"="hotel"]', 'way["tourism"="hotel"]'],
  hostel: ['node["tourism"="hostel"]', 'way["tourism"="hostel"]'],
  guest_house: [
    'node["tourism"="guest_house"]',
    'way["tourism"="guest_house"]',
  ],
  camp_site: ['node["tourism"="camp_site"]', 'way["tourism"="camp_site"]'],
  theme_park: ['node["tourism"="theme_park"]', 'way["tourism"="theme_park"]'],
  zoo: ['node["tourism"="zoo"]', 'way["tourism"="zoo"]'],

  // Historic
  monument: [
    'node["tourism"="monument"]',
    'node["historic"="monument"]',
    'way["historic"="monument"]',
  ],
  memorial: ['node["historic"="memorial"]', 'way["historic"="memorial"]'],
  castle: ['node["historic"="castle"]', 'way["historic"="castle"]'],
  ruins: ['node["historic"="ruins"]', 'way["historic"="ruins"]'],
  archaeological_site: [
    'node["historic"="archaeological_site"]',
    'way["historic"="archaeological_site"]',
  ],

  // Nature
  peak: ['node["natural"="peak"]'],
  beach: ['node["natural"="beach"]', 'way["natural"="beach"]'],
  cave: ['node["natural"="cave_entrance"]'],
  cliff: ['node["natural"="cliff"]', 'way["natural"="cliff"]'],
  water: ['node["natural"="water"]', 'way["natural"="water"]'],
  park: ['node["leisure"="park"]', 'way["leisure"="park"]'],

  // Amenity
  restaurant: ['node["amenity"="restaurant"]', 'way["amenity"="restaurant"]'],
  cafe: ['node["amenity"="cafe"]', 'way["amenity"="cafe"]'],
  bar: ['node["amenity"="bar"]', 'way["amenity"="bar"]'],
  pub: ['node["amenity"="pub"]', 'way["amenity"="pub"]'],
  fast_food: ['node["amenity"="fast_food"]', 'way["amenity"="fast_food"]'],
  cinema: ['node["amenity"="cinema"]', 'way["amenity"="cinema"]'],
  theatre: ['node["amenity"="theatre"]', 'way["amenity"="theatre"]'],
  arts_centre: [
    'node["amenity"="arts_centre"]',
    'way["amenity"="arts_centre"]',
  ],

  // Shop
  mall: ['node["shop"="mall"]', 'way["shop"="mall"]'],
  souvenir: ['node["shop"="souvenir"]'],
  gift: ['node["shop"="gift"]'],
};

/**
 * Determine the primary category for a POI based on its tags
 */
export function determineCategory(
  tags: Record<string, string> | undefined
): string {
  if (!tags) return "other";

  // Check each category definition
  for (const [category, queries] of Object.entries(CATEGORY_MAPPINGS)) {
    // Each query is like 'node["tourism"="attraction"]'
    // We need to check if the tags match any of these conditions
    for (const query of queries) {
      // Extract key and value from query, e.g., ["tourism"="attraction"]
      const match = query.match(/\["([^"]+)"="([^"]+)"\]/);
      if (match) {
        const key = match[1];
        const value = match[2];
        if (tags[key] === value) {
          return category;
        }
      }
    }
  }

  return "other";
}

export const CATEGORY_LABELS: Record<string, string> = {
  attraction: "Attraction",
  museum: "Museum",
  viewpoint: "Viewpoint",
  hotel: "Hotel",
  hostel: "Hostel",
  guest_house: "Guest house",
  camp_site: "Camp site",
  theme_park: "Theme park",
  zoo: "Zoo",
  monument: "Monument",
  memorial: "Memorial",
  castle: "Castle",
  ruins: "Ruins",
  archaeological_site: "Archaeological site",
  peak: "Peak",
  beach: "Beach",
  cave: "Cave entrance",
  cliff: "Cliff",
  water: "Water feature",
  park: "Park",
  restaurant: "Restaurant",
  cafe: "Cafe",
  bar: "Bar",
  pub: "Pub",
  fast_food: "Fast food",
  cinema: "Cinema",
  theatre: "Theatre",
  arts_centre: "Arts centre",
  mall: "Shopping mall",
  souvenir: "Souvenir shop",
  gift: "Gift shop",
};
