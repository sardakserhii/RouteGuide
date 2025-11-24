import React from "react";
import { EnrichedPoi } from "../model/types";
import { formatAddress } from "../lib/poiUtils";
import { getCategoryEmoji } from "../../../utils/categoryIcons";
import { PoiImage } from "./PoiImage";

interface PoiCardProps {
    poi: EnrichedPoi;
    index: number;
    isSelected: boolean;
    onToggleSelection: (id: string | number) => void;
    t: (key: string, defaultValue?: string) => string;
}

export const PoiCard: React.FC<PoiCardProps> = ({
    poi,
    index,
    isSelected,
    onToggleSelection,
    t,
}) => {
    const imageUrl =
        poi.tags?.image ||
        poi.tags?.photo ||
        poi.tags?.["image:0"] ||
        poi.tags?.["wikimedia_commons"];
    const address = formatAddress(poi.tags);
    const description =
        poi.description ||
        poi.tags?.["description:ru"] ||
        poi.tags?.description ||
        poi.tags?.comment;

    return (
        <div
            className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group"
        >
            <div className="flex gap-3">
                {/* Image Placeholder or Real Image */}
                <PoiImage imageUrl={imageUrl} alt={poi.name} />

                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-base leading-tight group-hover:text-blue-700 transition-colors flex items-center gap-2">
                                <span className="shrink-0 w-5 h-5 flex items-center justify-center bg-gray-200 text-gray-600 text-xs font-bold rounded-full">
                                    {index + 1}
                                </span>
                                {poi.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                                    <span>
                                        {getCategoryEmoji(poi.category)}
                                    </span>
                                    {t(
                                        `categories.${poi.category}`,
                                        poi.category || "Other"
                                    )}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {poi.distance.toFixed(1)} km
                                    from start
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                            <button
                                onClick={() => onToggleSelection(poi.id)}
                                className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                                    isSelected
                                        ? "bg-green-100 text-green-700 border border-green-200"
                                        : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
                                }`}
                            >
                                {isSelected
                                    ? t("poiList.added")
                                    : t("poiList.addToTrip")}
                            </button>
                            {poi.isTopPick && (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                                    AI TOP
                                </span>
                            )}
                            {poi.tags?.opening_hours && (
                                <span
                                    className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 max-w-40 truncate"
                                    title={poi.tags.opening_hours}
                                >
                                    {poi.tags.opening_hours}
                                </span>
                            )}
                        </div>
                    </div>

                    {address && (
                        <div className="flex items-start gap-1 text-xs text-gray-600">
                            <span className="mt-0.5">📍</span>
                            <span className="truncate">
                                {address}
                            </span>
                        </div>
                    )}

                    {description && (
                        <p className="text-xs text-gray-700 leading-snug line-clamp-3 bg-gray-50 p-2 rounded-lg border border-gray-100 italic">
                            {description}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                        {poi.tags?.wikipedia && (
                            <a
                                href={`https://wikipedia.org/wiki/${poi.tags.wikipedia}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full border border-gray-200 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Wikipedia
                            </a>
                        )}
                        {(poi.tags?.website || poi.tags?.url) && (
                            <a
                                href={poi.tags.website || poi.tags.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200 hover:bg-blue-200 hover:text-blue-900 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Website
                            </a>
                        )}
                        {poi.tags?.phone && (
                            <a
                                href={`tel:${poi.tags.phone}`}
                                className="text-[11px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200 hover:bg-green-200 hover:text-green-900 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Tel. {poi.tags.phone}
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
