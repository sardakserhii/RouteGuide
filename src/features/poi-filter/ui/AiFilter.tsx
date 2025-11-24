import React from "react";

interface AiFilterProps {
    pendingUseAi: boolean;
    setPendingUseAi: (useAi: boolean) => void;
    t: (key: string, options?: any) => string;
}

export const AiFilter: React.FC<AiFilterProps> = ({
    pendingUseAi,
    setPendingUseAi,
    t,
}) => {
    return (
        <div className="mb-6 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">?</span>
                    <div>
                        <h4 className="text-sm font-semibold text-indigo-900">
                            {t("poiFilter.aiTitle")}
                        </h4>
                        <p className="text-xs text-indigo-600">
                            {t("poiFilter.aiSubtitle")}
                        </p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={pendingUseAi}
                        onChange={(e) => setPendingUseAi(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
            </div>
        </div>
    );
};
