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

export const CATEGORY_LABELS: Record<string, string> = {
  attraction: "Достопримечательности",
  museum: "Музеи",
  viewpoint: "Смотровые площадки",
  hotel: "Отели",
  hostel: "Хостелы",
  guest_house: "Гостевые дома",
  camp_site: "Кемпинги",
  theme_park: "Парки развлечений",
  zoo: "Зоопарки",
  monument: "Памятники",
  memorial: "Мемориалы",
  castle: "Замки",
  ruins: "Руины",
  archaeological_site: "Археология",
  peak: "Вершины",
  beach: "Пляжи",
  cave: "Пещеры",
  cliff: "Скалы",
  water: "Водоемы",
  park: "Парки",
  restaurant: "Рестораны",
  cafe: "Кафе",
  bar: "Бары",
  pub: "Пабы",
  fast_food: "Фастфуд",
  cinema: "Кинотеатры",
  theatre: "Театры",
  arts_centre: "Арт-центры",
  mall: "Торговые центры",
  souvenir: "Сувениры",
  gift: "Подарки",
};
