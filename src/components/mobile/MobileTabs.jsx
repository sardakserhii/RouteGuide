import { useTranslation } from "react-i18next";

/**
 * Tab navigation for mobile bottom sheet
 */
function MobileTabs({ activeTab, onTabChange }) {
    const { t } = useTranslation();

    const tabs = [
        { id: "route", label: t("mobileNav.route"), icon: "🗺️" },
        { id: "filters", label: t("mobileNav.filters"), icon: "⚙️" },
        { id: "places", label: t("mobileNav.places"), icon: "📍" },
    ];

    return (
        <div className="flex border-b border-gray-200 bg-gray-50">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        activeTab === tab.id
                            ? "bg-white text-blue-700 border-b-2 border-blue-600"
                            : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>
    );
}

export default MobileTabs;
