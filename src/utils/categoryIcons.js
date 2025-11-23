
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

const CATEGORY_COLORS = {
  // Food & Drink -> Red/Orange
  restaurant: "red",
  cafe: "orange",
  bar: "red",
  pub: "red",
  fast_food: "red",
  food_court: "red",
  ice_cream: "orange",

  // Accommodation -> Gold/Yellow
  hotel: "gold",
  hostel: "gold",
  guest_house: "gold",
  motel: "gold",
  apartment: "gold",
  camp_site: "gold",

  // Nature & Parks -> Green
  park: "green",
  natural: "green",
  viewpoint: "green",
  garden: "green",
  forest: "green",
  beach: "green",

  // Culture & History -> Violet
  museum: "violet",
  artwork: "violet",
  historic: "violet",
  monument: "violet",
  castle: "violet",
  attraction: "violet",
  theatre: "violet",
  cinema: "violet",
  arts_centre: "violet",

  // Shopping -> Yellow/Orange
  shop: "yellow",
  supermarket: "yellow",
  mall: "yellow",
  market: "yellow",

  // Transport -> Grey
  station: "grey",
  bus_station: "grey",
  fuel: "grey",
  parking: "grey",

  // Other -> Blue (Default)
  other: "blue",
};

export const CATEGORY_ICONS = Object.entries(CATEGORY_COLORS).reduce(
  (acc, [category, color]) => {
    acc[category] = createColorIcon(color);
    return acc;
  },
  {}
);

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

export const getNumberedCategoryIcon = (category, number) => {
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  return new L.DivIcon({
    className: "custom-div-icon",
    html: `<div style="position: relative; width: 25px; height: 41px;">
            <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png" style="width: 25px; height: 41px;">
            <div style="position: absolute; top: 2px; left: 0; width: 100%; text-align: center; font-size: 11px; font-weight: bold; color: black; text-shadow: 0 0 2px white;">${number}</div>
           </div>`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

export const getCategoryEmoji = (category) => {
  return CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS.other;
};
