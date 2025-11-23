import React from "react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "de", label: "DE", flag: "🇩🇪", name: "Deutsch" },
  { code: "en", label: "EN", flag: "🇬🇧", name: "English" },
  { code: "ru", label: "RU", flag: "🇷🇺", name: "Русский" },
  { code: "uk", label: "UK", flag: "🇺🇦", name: "Українська" },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="absolute top-5 right-5 z-[1000] bg-white rounded-xl shadow-xl p-2 flex gap-1 font-sans">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
            ${
              i18n.language === lang.code
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          title={lang.name}
        >
          <span className="text-base">{lang.flag}</span>
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
