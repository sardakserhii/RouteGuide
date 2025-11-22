import L from "leaflet";

// Fix for default marker icons in React-Leaflet
// We need to ensure the default icon logic doesn't interfere, although we are creating custom icons.
// The previous mapIcons.js handled this globally, so we can assume it's fine or re-apply if needed.

const createColorIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

// Colors available in leaflet-color-markers:
// blue, gold, red, green, orange, yellow, violet, grey, black

export const CATEGORY_ICONS = {
  // Food & Drink -> Red/Orange
  restaurant: createColorIcon("red"),
  cafe: createColorIcon("orange"),
  bar: createColorIcon("red"),
  pub: createColorIcon("red"),
  fast_food: createColorIcon("red"),
  food_court: createColorIcon("red"),
  ice_cream: createColorIcon("orange"),

  // Accommodation -> Gold/Yellow
  hotel: createColorIcon("gold"),
  hostel: createColorIcon("gold"),
  guest_house: createColorIcon("gold"),
  motel: createColorIcon("gold"),
  apartment: createColorIcon("gold"),
  camp_site: createColorIcon("gold"),

  // Nature & Parks -> Green
  park: createColorIcon("green"),
  natural: createColorIcon("green"),
  viewpoint: createColorIcon("green"),
  garden: createColorIcon("green"),
  forest: createColorIcon("green"),
  beach: createColorIcon("green"),

  // Culture & History -> Violet
  museum: createColorIcon("violet"),
  artwork: createColorIcon("violet"),
  historic: createColorIcon("violet"),
  monument: createColorIcon("violet"),
  castle: createColorIcon("violet"),
  attraction: createColorIcon("violet"),
  theatre: createColorIcon("violet"),
  cinema: createColorIcon("violet"),
  arts_centre: createColorIcon("violet"),

  // Shopping -> Yellow/Orange (using yellow/gold distinct from accommodation if possible, or just orange)
  shop: createColorIcon("yellow"),
  supermarket: createColorIcon("yellow"),
  mall: createColorIcon("yellow"),
  market: createColorIcon("yellow"),

  // Transport -> Grey
  station: createColorIcon("grey"),
  bus_station: createColorIcon("grey"),
  fuel: createColorIcon("grey"),
  parking: createColorIcon("grey"),

  // Other -> Blue (Default)
  other: createColorIcon("blue"),
};

export const CATEGORY_EMOJIS = {
  // Food & Drink
  restaurant: "🍽️",
  cafe: "☕",
  bar: "🍸",
  pub: "🍺",
  fast_food: "🍔",
  food_court: "🍱",
  ice_cream: "🍦",

  // Accommodation
  hotel: "🏨",
  hostel: "🛏️",
  guest_house: "🏡",
  motel: "🏨",
  apartment: "🏢",
  camp_site: "⛺",

  // Nature & Parks
  park: "🌳",
  natural: "🌿",
  viewpoint: "🔭",
  garden: "🌻",
  forest: "🌲",
  beach: "🏖️",

  // Culture & History
  museum: "🏛️",
  artwork: "🎨",
  historic: "📜",
  monument: "🗿",
  castle: "🏰",
  attraction: "🎡",
  theatre: "🎭",
  cinema: "🎬",
  arts_centre: "🎨",

  // Shopping
  shop: "🛍️",
  supermarket: "🛒",
  mall: "🏬",
  market: "🏪",

  // Transport
  station: "🚉",
  bus_station: "🚌",
  fuel: "⛽",
  parking: "🅿️",

  // Other
  other: "📍",
};

export const getCategoryIcon = (category) => {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.other;
};

export const getCategoryEmoji = (category) => {
  return CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS.other;
};
