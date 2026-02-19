/**
 * @file useLanguage hook
 * @description Custom hook for language management in Lavenius
 * 
 * Usage:
 * ```tsx
 * const { language, changeLanguage, languages, currentLanguageConfig } = useLanguage();
 * ```
 */

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type SupportedLanguage,
  type LanguageConfig,
  SUPPORTED_LANGUAGES,
  isValidLanguage,
  getLanguageConfig,
  DEFAULT_LANGUAGE,
} from '@/lib/i18n';

/**
 * Return type for useLanguage hook
 */
export interface UseLanguageReturn {
  /** Current active language code */
  language: SupportedLanguage;
  
  /** Function to change the current language */
  changeLanguage: (lang: SupportedLanguage) => Promise<void>;
  
  /** Array of all supported languages with metadata */
  languages: LanguageConfig[];
  
  /** Configuration object for the current language */
  currentLanguageConfig: LanguageConfig | undefined;
  
  /** Check if a given language code is supported */
  isSupported: (code: string) => boolean;
}

/**
 * Custom hook for language management
 * 
 * Provides:
 * - Current language code
 * - Function to change language
 * - List of supported languages
 * - Current language configuration
 * 
 * @example
 * ```tsx
 * function LanguageSelector() {
 *   const { language, changeLanguage, languages } = useLanguage();
 * 
 *   return (
 *     <select 
 *       value={language} 
 *       onChange={(e) => changeLanguage(e.target.value as SupportedLanguage)}
 *     >
 *       {languages.map((lang) => (
 *         <option key={lang.code} value={lang.code}>
 *           {lang.flag} {lang.nativeName}
 *         </option>
 *       ))}
 *     </select>
 *   );
 * }
 * ```
 */
export function useLanguage(): UseLanguageReturn {
  const { i18n } = useTranslation();

  // Get current language, ensuring it's a valid SupportedLanguage
  const language = useMemo((): SupportedLanguage => {
    const currentLang = i18n.language;
    
    // Handle language codes with region (e.g., "en-US" -> "en")
    const baseLang = currentLang?.split('-')[0];
    
    if (isValidLanguage(baseLang)) {
      return baseLang;
    }
    
    return DEFAULT_LANGUAGE;
  }, [i18n.language]);

  // Change language function
  const changeLanguage = useCallback(
    async (lang: SupportedLanguage): Promise<void> => {
      if (!isValidLanguage(lang)) {
        console.warn(`Attempted to change to unsupported language: ${lang}`);
        return;
      }
      
      await i18n.changeLanguage(lang);
    },
    [i18n]
  );

  // Get current language config
  const currentLanguageConfig = useMemo(
    () => getLanguageConfig(language),
    [language]
  );

  // Check if a language is supported
  const isSupported = useCallback((code: string): boolean => {
    return isValidLanguage(code);
  }, []);

  return {
    language,
    changeLanguage,
    languages: SUPPORTED_LANGUAGES,
    currentLanguageConfig,
    isSupported,
  };
}

export default useLanguage;
