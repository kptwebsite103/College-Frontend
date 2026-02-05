import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Load saved language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    setCurrentLanguage(savedLanguage);
    i18n.changeLanguage(savedLanguage);

    // Add language class to body for CSS targeting
    document.body.classList.add(`lang-${savedLanguage}`);
    // Also set the HTML `lang` attribute so selectors like `html[lang="kn"]` match
    try {
      document.documentElement.lang = savedLanguage;
    } catch (e) {
      // ignore in non-DOM environments
    }
  }, []);

  const changeLanguage = (languageCode) => {
    // Remove old language class
    document.body.classList.remove(`lang-${currentLanguage}`);

    // Add new language class
    document.body.classList.add(`lang-${languageCode}`);

    // Update the HTML `lang` attribute as well
    try {
      document.documentElement.lang = languageCode;
    } catch (e) {
      // ignore in non-DOM environments
    }

    setCurrentLanguage(languageCode);
    i18n.changeLanguage(languageCode);
    localStorage.setItem('language', languageCode);
  };

  const getLanguageName = (code) => {
    const languages = {
      en: 'English',
      kn: 'ಕನ್ನಡ (Kannada)'
    };
    return languages[code] || code;
  };

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' }
  ];

  const value = {
    currentLanguage,
    changeLanguage,
    getLanguageName,
    availableLanguages,
    isRtl: ['ar', 'he', 'fa'].includes(currentLanguage) // For future RTL support
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;
