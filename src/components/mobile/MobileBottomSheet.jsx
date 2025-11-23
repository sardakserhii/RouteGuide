import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import MobileTabs from "./MobileTabs";
import MobileRouteSheet from "./MobileRouteSheet";
import MobileFilterSheet from "./MobileFilterSheet";
import MobilePlacesSheet from "./MobilePlacesSheet";

/**
 * Mobile bottom sheet container with tabs
 * Displays route building, filters, and places list
 * Supports collapse/expand functionality
 */
function MobileBottomSheet({ routeLogic }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("route");
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Track if user has manually changed tabs to prevent auto-switching from overriding
    const hasManuallyChangedTab = useRef(false);

    const { route, arePoisRequested } = routeLogic;

    // Auto-switch tabs based on progress (only if user hasn't manually changed tabs)
    useEffect(() => {
        // Switch to filters after route is built (only if user hasn't manually navigated)
        if (
            !hasManuallyChangedTab.current &&
            activeTab === "route" &&
            route.length > 0 &&
            !arePoisRequested
        ) {
            setActiveTab("filters");
        }
    }, [activeTab, route.length, arePoisRequested]);

    // Reset to the Route tab when everything is cleared
    useEffect(() => {
        if (route.length === 0) {
            setActiveTab("route");
            hasManuallyChangedTab.current = false;
            setIsCollapsed(false);
            setIsExpanded(false);
        }
    }, [route.length]);

    // Handle manual tab changes
    const handleTabChange = (newTab) => {
        hasManuallyChangedTab.current = true;
        setActiveTab(newTab);
    };

    const handleToggleCollapse = () => {
        if (isCollapsed) {
            // Expand from collapsed
            setIsCollapsed(false);
        } else if (isExpanded) {
            // Go back to normal from expanded
            setIsExpanded(false);
        } else {
            // Collapse from normal
            setIsCollapsed(true);
        }
    };

    const handleExpand = () => {
        setIsCollapsed(false);
        setIsExpanded(true);
    };

    // Determine height based on state
    const heightClass = isCollapsed
        ? "h-auto"
        : isExpanded
        ? "max-h-[90vh]"
        : "max-h-[70vh]";

    return (
        <div
            className={`fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-2xl shadow-2xl ${heightClass} overflow-hidden flex flex-col transition-all duration-300`}
        >
            {/* Drag Handle and Collapse Button */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
                <button
                    onClick={handleToggleCollapse}
                    className="flex-1 flex items-center justify-center gap-2 py-1 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={
                        isCollapsed ? t("mobile.expand") : t("mobile.collapse")
                    }
                >
                    <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
                    <span className="text-xs">{isCollapsed ? "▲" : "▼"}</span>
                </button>
                {!isCollapsed && !isExpanded && (
                    <button
                        onClick={handleExpand}
                        className="px-3 py-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                        aria-label={t("mobile.expandFull")}
                    >
                        ⬆️ {t("mobile.expandFull")}
                    </button>
                )}
            </div>

            {/* Tab Navigation - hidden when collapsed */}
            {!isCollapsed && (
                <MobileTabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                />
            )}

            {/* Tab Content - hidden when collapsed */}
            {!isCollapsed && (
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {activeTab === "route" && (
                        <MobileRouteSheet routeLogic={routeLogic} />
                    )}
                    {activeTab === "filters" && (
                        <MobileFilterSheet
                            routeLogic={routeLogic}
                            onComplete={() => setActiveTab("places")}
                        />
                    )}
                    {activeTab === "places" && (
                        <MobilePlacesSheet routeLogic={routeLogic} />
                    )}
                </div>
            )}
        </div>
    );
}

export default MobileBottomSheet;
