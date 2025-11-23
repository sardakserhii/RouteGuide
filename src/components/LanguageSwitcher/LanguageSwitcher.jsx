import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "de", label: "DE", flag: "🇩🇪", name: "Deutsch" },
  { code: "en", label: "EN", flag: "🇬🇧", name: "English" },
  { code: "ru", label: "RU", flag: "🇷🇺", name: "Русский" },
  { code: "uk", label: "UK", flag: "🇺🇦", name: "Українська" },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  const currentLanguage = LANGUAGES.find((lang) => lang.code === i18n.language) || LANGUAGES[0];

  return (
    <div className="absolute top-5 right-5 z-[1000] font-sans">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
      >
        <span className="text-base">{currentLanguage.flag}</span>
        <span>{currentLanguage.label}</span>
        <span className={`text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl py-2 min-w-[140px]">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200
                ${
                  i18n.language === lang.code
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              title={lang.name}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
