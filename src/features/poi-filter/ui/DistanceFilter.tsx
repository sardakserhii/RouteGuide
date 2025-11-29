import React from "react";
import { CollapsibleSection } from "./CollapsibleSection";

interface DistanceFilterProps {
    pendingMaxDistance: number | null;
    setPendingMaxDistance: (distance: number | null) => void;
    t: (key: string, options?: any) => string;
}

export const DistanceFilter: React.FC<DistanceFilterProps> = ({
    pendingMaxDistance,
    setPendingMaxDistance,
    t,
}) => {
    const distanceLabel = pendingMaxDistance
        ? `${pendingMaxDistance} km`
        : t("poiFilter.distanceAuto");

    return (
        <CollapsibleSection
            title={`${t("poiFilter.distanceLabel")} — ${distanceLabel}`}
            icon="📍"
            defaultExpanded={false}
        >
            {/* Checkbox to enable/disable custom distance */}
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={pendingMaxDistance !== null}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setPendingMaxDistance(5); // Enable with default 5km
                        } else {
                            setPendingMaxDistance(null); // Disable (Auto mode)
                        }
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                    {t("poiFilter.setCustomDistance")}
                </span>
            </label>

            <div className="relative">
                <input
                    type="range"
                    min="0.5"
                    max="20"
                    step="0.5"
                    value={pendingMaxDistance ?? 5}
                    disabled={pendingMaxDistance === null}
                    onChange={(e) =>
                        setPendingMaxDistance(parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>{t("poiFilter.onRoute")}</span>
                    <span>+5 km</span>
                    <span>+20 km</span>
                </div>
            </div>
        </CollapsibleSection>
    );
};
