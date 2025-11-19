function RoutePanel({
  startPoint,
  endPoint,
  selectionMode,
  onSelectStart,
  onSelectEnd,
  onClear,
}) {
  return (
    <div className="absolute top-5 left-5 z-[1000] bg-white rounded-xl shadow-xl p-5 min-w-80 font-sans">
      <h2 className="m-0 mb-4 text-lg font-semibold text-gray-800">
        🗺️ Планировщик маршрута
      </h2>

      {/* Start Point Section */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            📍 Начальная точка:
          </label>
          {startPoint ? (
            <span className="block text-xs font-mono text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-md mb-2">
              {startPoint[0].toFixed(5)}, {startPoint[1].toFixed(5)}
            </span>
          ) : (
            <span className="block text-xs text-gray-400 italic mb-2">
              Не выбрана
            </span>
          )}
        </div>
        <button
          className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${
              selectionMode === "start"
                ? "bg-green-600 text-white hover:bg-green-700 animate-pulse"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-300"
            }`}
          onClick={onSelectStart}
        >
          {selectionMode === "start"
            ? "👆 Кликните на карту"
            : "Выбрать на карте"}
        </button>
      </div>

      {/* End Point Section */}
      <div className="mb-4 pb-4">
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            🏁 Конечная точка:
          </label>
          {endPoint ? (
            <span className="block text-xs font-mono text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-md mb-2">
              {endPoint[0].toFixed(5)}, {endPoint[1].toFixed(5)}
            </span>
          ) : (
            <span className="block text-xs text-gray-400 italic mb-2">
              Не выбрана
            </span>
          )}
        </div>
        <button
          className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
            ${
              selectionMode === "end"
                ? "bg-green-600 text-white hover:bg-green-700 animate-pulse"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-300"
            }`}
          onClick={onSelectEnd}
        >
          {selectionMode === "end"
            ? "👆 Кликните на карту"
            : "Выбрать на карте"}
        </button>
      </div>

      {/* Clear Button */}
      {(startPoint || endPoint) && (
        <button
          className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium
                     transition-all duration-200 hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-300 mt-2"
          onClick={onClear}
        >
          🗑️ Очистить всё
        </button>
      )}

      {/* Route Info */}
      {startPoint && endPoint && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-xs font-medium text-center">
          ✅ Маршрут рассчитывается...
        </div>
      )}
    </div>
  );
}

export default RoutePanel;
