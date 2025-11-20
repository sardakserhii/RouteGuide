import React, { useMemo } from "react";

// Helper to calculate distance between two points in km
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const PoiList = ({ pois, startPoint }) => {
  const sortedPois = useMemo(() => {
    if (!startPoint || !pois || pois.length === 0) return [];

    const [startLat, startLng] = startPoint;

    return [...pois]
      .map((poi) => ({
        ...poi,
        distance: haversineDistance(startLat, startLng, poi.lat, poi.lon),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [pois, startPoint]);

  if (!pois || pois.length === 0) return null;

  return (
    <div className="absolute top-5 right-5 bottom-5 w-96 bg-white shadow-2xl rounded-xl overflow-hidden flex flex-col z-[1000] border border-gray-100">
      <div className="p-4 bg-white border-b border-gray-100 shadow-sm z-10">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span>📍</span> Интересные места
          <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full ml-auto">
            {sortedPois.length}
          </span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Отсортировано по удаленности от старта
        </p>
      </div>

      <div className="overflow-y-auto flex-1 p-3 space-y-3 bg-gray-50 custom-scrollbar">
        {sortedPois.map((poi) => (
          <div
            key={poi.id}
            className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 group"
          >
            <div className="flex gap-3">
              {/* Image Placeholder or Real Image */}
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
                {poi.tags?.image ? (
                  <img
                    src={poi.tags.image}
                    alt={poi.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full flex items-center justify-center bg-blue-50 text-blue-300 ${
                    poi.tags?.image ? "hidden" : "flex"
                  }`}
                >
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-1 truncate group-hover:text-blue-600 transition-colors">
                  {poi.name}
                </h3>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {poi.tags?.tourism || "Место"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {poi.distance.toFixed(1)} км
                  </span>
                </div>

                {poi.tags?.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {poi.tags.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {poi.tags?.wikipedia && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">
                      Wikipedia
                    </span>
                  )}
                  {poi.tags?.website && (
                    <a
                      href={poi.tags.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 hover:bg-blue-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Сайт
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PoiList;
