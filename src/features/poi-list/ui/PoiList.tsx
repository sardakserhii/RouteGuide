import React from "react";
import { Poi, EnrichedPoi } from "../model/types";
import { usePoiListModel } from "../model/usePoiListModel";
import { PoiCategoryFilter } from "./PoiCategoryFilter";
import { PoiCard } from "./PoiCard";

interface PoiListProps {
    pois: Poi[];
    startPoint: [number, number] | null;
    onVisibleChange?: (visiblePois: EnrichedPoi[]) => void;
    selectedPoiIds?: (string | number)[];
    onTogglePoiSelection?: (id: string | number) => void;
    onExportRoute?: () => void;
}

const PoiList: React.FC<PoiListProps> = ({
    pois,
    startPoint,
    onVisibleChange = () => {},
    selectedPoiIds = [],
    onTogglePoiSelection = () => {},
    onExportRoute = () => {},
}) => {
    const {
        enrichedPois,
        categoryOptions,
        selectedCategories,
        visiblePois,
        toggleCategory,
        t,
    } = usePoiListModel({ pois, startPoint, onVisibleChange });

    const panelClass =
        "m-5 w-[420px] max-w-[430px] max-h-[calc(100vh-40px)] bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col border border-gray-100 pointer-events-auto";

    if (!pois || pois.length === 0) {
        return (
            <div className={panelClass}>
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-gray-600 gap-2">
                    <div className="text-3xl">🧭</div>
                    <p className="text-sm font-semibold">
                        {t("poiList.noPlaces", "Пока нет точек интереса")}
                    </p>
                    <p className="text-xs text-gray-500">
                        {t(
                            "poiList.adjustFilters",
                            "Нажмите «Показать места» после выбора фильтров."
                        )}
                    </p>
                </div>
            </div>
        );
    }

    const selectedCount = selectedPoiIds.length;

    return (
        <div className={panelClass}>
            <div className="p-4 bg-white border-b border-gray-100 shadow-sm z-10 space-y-2">
                <div className="flex items-start gap-2">
                    <div className="text-xl">🧭</div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-gray-800">
                                {t("poiList.title")}
                            </h2>
                            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                                {visiblePois.length}/{enrichedPois.length}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">
                            {t("poiList.subtitle")}
                        </p>
                    </div>
                </div>

                {/* Quick category filter */}
                <PoiCategoryFilter
                    categoryOptions={categoryOptions}
                    selectedCategories={selectedCategories}
                    onToggleCategory={toggleCategory}
                />

                <div className="flex flex-wrap items-center gap-2 pt-2">
                    <span className="text-xs text-gray-600">
                        Selected places:{" "}
                        <span className="font-semibold text-gray-900">
                            {selectedCount}
                        </span>
                        {selectedCount > 23 && (
                            <span className="text-[11px] text-amber-700 ml-1">
                                (max 23)
                            </span>
                        )}
                    </span>
                    <div className="ml-auto flex flex-wrap gap-2">
                        {selectedCount > 0 && (
                            <button
                                onClick={onExportRoute}
                                className="text-xs px-3 py-1 rounded-full font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700"
                            >
                                {t("poiList.exportToGoogleMaps")} ({selectedCount})
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-4 bg-gray-50 custom-scrollbar">
                {visiblePois.map((poi, index) => (
                    <PoiCard
                        key={poi.id}
                        poi={poi}
                        index={index}
                        isSelected={selectedPoiIds.includes(poi.id)}
                        onToggleSelection={onTogglePoiSelection}
                        t={t}
                    />
                ))}
            </div>
        </div>
    );
};

export default PoiList;
