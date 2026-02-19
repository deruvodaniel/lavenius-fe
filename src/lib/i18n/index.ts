/**
 * @file i18n configuration for Lavenius
 * @description Internationalization setup using i18next with react-i18next
 * 
 * Supported Languages:
 * - Spanish (es) - Default/Fallback
 * - English (en)
 * - Portuguese (pt)
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import es from '@/locales/es.json';
import en from '@/locales/en.json';
import pt from '@/locales/pt.json';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Supported language codes
 */
export type SupportedLanguage = 'es' | 'en' | 'pt';

/**
 * Language configuration object
 */
export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default language for the application
 */
export const DEFAULT_LANGUAGE: SupportedLanguage = 'es';

/**
 * Available languages with metadata
 */
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
  },
];

/**
 * Language codes array for validation
 */
export const LANGUAGE_CODES: SupportedLanguage[] = SUPPORTED_LANGUAGES.map(
  (lang) => lang.code
);

/**
 * Local storage key for language persistence
 */
export const LANGUAGE_STORAGE_KEY = 'lavenius_language';

// ============================================================================
// RESOURCES
// ============================================================================

/**
 * Translation resources bundled with the app
 */
const resources = {
  es: { translation: es },
  en: { translation: en },
  pt: { translation: pt },
};

// ============================================================================
// I18N INITIALIZATION
// ============================================================================

i18n
  // Detect user language from browser/localStorage
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Translation resources
    resources,
    
    // Default and fallback language
    fallbackLng: DEFAULT_LANGUAGE,
    
    // Supported languages
    supportedLngs: LANGUAGE_CODES,
    
    // Debug mode (disable in production)
    debug: import.meta.env.DEV,
    
    // Interpolation settings
    interpolation: {
      // React already escapes values
      escapeValue: false,
    },
    
    // Language detection options
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Cache user language in localStorage
      caches: ['localStorage'],
      
      // Key for localStorage
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },
    
    // React-specific options
    react: {
      // Wait for translations to load before rendering
      useSuspense: true,
    },
  });

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a language code is supported
 */
export const isValidLanguage = (code: string): code is SupportedLanguage => {
  return LANGUAGE_CODES.includes(code as SupportedLanguage);
};

/**
 * Get language config by code
 */
export const getLanguageConfig = (
  code: SupportedLanguage
): LanguageConfig | undefined => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
};

/**
 * Get current language from i18n
 */
export const getCurrentLanguage = (): SupportedLanguage => {
  const lang = i18n.language;
  return isValidLanguage(lang) ? lang : DEFAULT_LANGUAGE;
};

// ============================================================================
// EXPORTS
// ============================================================================

export default i18n;
