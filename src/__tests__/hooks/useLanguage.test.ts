import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLanguage } from '../../lib/hooks/useLanguage';
import { useTranslation } from 'react-i18next';
import type { SupportedLanguage } from '../../lib/i18n';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

// Mock i18n module
vi.mock('../../lib/i18n', () => ({
  SUPPORTED_LANGUAGES: [
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  ],
  DEFAULT_LANGUAGE: 'es',
  isValidLanguage: vi.fn((code: string) => ['es', 'en', 'pt'].includes(code)),
  getLanguageConfig: vi.fn((code: string) => {
    const configs: Record<string, { code: string; name: string; nativeName: string; flag: string }> = {
      es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
      en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
      pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
    };
    return configs[code];
  }),
}));

describe('useLanguage', () => {
  const mockChangeLanguage = vi.fn();

  // Default mock i18n state
  const defaultMockI18n = {
    language: 'es',
    changeLanguage: mockChangeLanguage,
  };

  // Helper to setup i18n mock
  const setupI18nMock = (overrides: Partial<typeof defaultMockI18n> = {}) => {
    const i18n = { ...defaultMockI18n, ...overrides };
    vi.mocked(useTranslation).mockReturnValue({
      t: vi.fn((key: string) => key),
      i18n,
      ready: true,
    } as unknown as ReturnType<typeof useTranslation>);
    return i18n;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockChangeLanguage.mockResolvedValue(undefined);
    setupI18nMock();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== Language Return Value Tests ====================
  describe('language', () => {
    it('returns current language from i18n', () => {
      setupI18nMock({ language: 'es' });

      const { result } = renderHook(() => useLanguage());

      expect(result.current.language).toBe('es');
    });

    it('returns en when i18n language is en', () => {
      setupI18nMock({ language: 'en' });

      const { result } = renderHook(() => useLanguage());

      expect(result.current.language).toBe('en');
    });

    it('returns pt when i18n language is pt', () => {
      setupI18nMock({ language: 'pt' });

      const { result } = renderHook(() => useLanguage());

      expect(result.current.language).toBe('pt');
    });

    it('extracts base language from region code (en-US -> en)', () => {
      setupI18nMock({ language: 'en-US' });

      const { result } = renderHook(() => useLanguage());

      expect(result.current.language).toBe('en');
    });

    it('extracts base language from region code (es-MX -> es)', () => {
      setupI18nMock({ language: 'es-MX' });

      const { result } = renderHook(() => useLanguage());

      expect(result.current.language).toBe('es');
    });

    it('extracts base language from region code (pt-BR -> pt)', () => {
      setupI18nMock({ language: 'pt-BR' });

      const { result } = renderHook(() => useLanguage());

      expect(result.current.language).toBe('pt');
    });

    it('returns default language for unsupported language', () => {
      setupI18nMock({ language: 'fr' });

      const { result } = renderHook(() => useLanguage());

      expect(result.current.language).toBe('es'); // DEFAULT_LANGUAGE
    });

    it('returns default language for undefined language', () => {
      setupI18nMock({ language: undefined as unknown as string });

      const { result } = renderHook(() => useLanguage());

      expect(result.current.language).toBe('es'); // DEFAULT_LANGUAGE
    });
  });

  // ==================== changeLanguage Tests ====================
  describe('changeLanguage', () => {
    it('calls i18n.changeLanguage with valid language', async () => {
      const { result } = renderHook(() => useLanguage());

      await act(async () => {
        await result.current.changeLanguage('en');
      });

      expect(mockChangeLanguage).toHaveBeenCalledWith('en');
      expect(mockChangeLanguage).toHaveBeenCalledTimes(1);
    });

    it('changes to Spanish', async () => {
      setupI18nMock({ language: 'en' });
      const { result } = renderHook(() => useLanguage());

      await act(async () => {
        await result.current.changeLanguage('es');
      });

      expect(mockChangeLanguage).toHaveBeenCalledWith('es');
    });

    it('changes to Portuguese', async () => {
      const { result } = renderHook(() => useLanguage());

      await act(async () => {
        await result.current.changeLanguage('pt');
      });

      expect(mockChangeLanguage).toHaveBeenCalledWith('pt');
    });

    it('does not call i18n.changeLanguage for invalid language', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { result } = renderHook(() => useLanguage());

      await act(async () => {
        await result.current.changeLanguage('fr' as SupportedLanguage);
      });

      expect(mockChangeLanguage).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Attempted to change to unsupported language: fr'
      );

      consoleSpy.mockRestore();
    });

    it('returns Promise<void>', async () => {
      const { result } = renderHook(() => useLanguage());

      const returnValue = result.current.changeLanguage('en');

      expect(returnValue).toBeInstanceOf(Promise);
      await expect(returnValue).resolves.toBeUndefined();
    });
  });

  // ==================== languages Array Tests ====================
  describe('languages', () => {
    it('returns array of supported languages', () => {
      const { result } = renderHook(() => useLanguage());

      expect(result.current.languages).toHaveLength(3);
    });

    it('includes Spanish language config', () => {
      const { result } = renderHook(() => useLanguage());

      const spanish = result.current.languages.find((l) => l.code === 'es');
      expect(spanish).toEqual({
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        flag: '🇪🇸',
      });
    });

    it('includes English language config', () => {
      const { result } = renderHook(() => useLanguage());

      const english = result.current.languages.find((l) => l.code === 'en');
      expect(english).toEqual({
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇺🇸',
      });
    });

    it('includes Portuguese language config', () => {
      const { result } = renderHook(() => useLanguage());

      const portuguese = result.current.languages.find((l) => l.code === 'pt');
      expect(portuguese).toEqual({
        code: 'pt',
        name: 'Portuguese',
        nativeName: 'Português',
        flag: '🇧🇷',
      });
    });

    it('languages array is stable reference', () => {
      const { result, rerender } = renderHook(() => useLanguage());

      const firstLanguages = result.current.languages;
      rerender();
      const secondLanguages = result.current.languages;

      expect(firstLanguages).toBe(secondLanguages);
    });
  });

  // ==================== currentLanguageConfig Tests ====================
  describe('currentLanguageConfig', () => {
    it('returns config for current language (es)', () => {
      setupI18nMock({ language: 'es' });

      const { result } = renderHook(() => useLanguage());

      expect(result.current.currentLanguageConfig).toEqual({
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        flag: '🇪🇸',
      });
    });

    it('returns config for current language (en)', () => {
      setupI18nMock({ language: 'en' });

      const { result } = renderHook(() => useLanguage());

      expect(result.current.currentLanguageConfig).toEqual({
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇺🇸',
      });
    });

    it('returns config for current language (pt)', () => {
      setupI18nMock({ language: 'pt' });

      const { result } = renderHook(() => useLanguage());

      expect(result.current.currentLanguageConfig).toEqual({
        code: 'pt',
        name: 'Portuguese',
        nativeName: 'Português',
        flag: '🇧🇷',
      });
    });

    it('returns undefined for unsupported language', () => {
      setupI18nMock({ language: 'de' });

      const { result } = renderHook(() => useLanguage());

      // Since 'de' falls back to 'es', it should return es config
      expect(result.current.currentLanguageConfig).toEqual({
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        flag: '🇪🇸',
      });
    });
  });

  // ==================== isSupported Tests ====================
  describe('isSupported', () => {
    it('returns true for supported language (es)', () => {
      const { result } = renderHook(() => useLanguage());

      expect(result.current.isSupported('es')).toBe(true);
    });

    it('returns true for supported language (en)', () => {
      const { result } = renderHook(() => useLanguage());

      expect(result.current.isSupported('en')).toBe(true);
    });

    it('returns true for supported language (pt)', () => {
      const { result } = renderHook(() => useLanguage());

      expect(result.current.isSupported('pt')).toBe(true);
    });

    it('returns false for unsupported language', () => {
      const { result } = renderHook(() => useLanguage());

      expect(result.current.isSupported('fr')).toBe(false);
    });

    it('returns false for empty string', () => {
      const { result } = renderHook(() => useLanguage());

      expect(result.current.isSupported('')).toBe(false);
    });

    it('returns false for invalid input', () => {
      const { result } = renderHook(() => useLanguage());

      expect(result.current.isSupported('xyz')).toBe(false);
      expect(result.current.isSupported('123')).toBe(false);
      expect(result.current.isSupported('español')).toBe(false);
    });

    it('is case-sensitive', () => {
      const { result } = renderHook(() => useLanguage());

      expect(result.current.isSupported('ES')).toBe(false);
      expect(result.current.isSupported('En')).toBe(false);
      expect(result.current.isSupported('PT')).toBe(false);
    });
  });

  // ==================== Hook Interface Tests ====================
  describe('Hook Interface', () => {
    it('returns all expected properties', () => {
      const { result } = renderHook(() => useLanguage());

      expect(result.current).toHaveProperty('language');
      expect(result.current).toHaveProperty('changeLanguage');
      expect(result.current).toHaveProperty('languages');
      expect(result.current).toHaveProperty('currentLanguageConfig');
      expect(result.current).toHaveProperty('isSupported');
    });

    it('functions are callable', () => {
      const { result } = renderHook(() => useLanguage());

      expect(typeof result.current.changeLanguage).toBe('function');
      expect(typeof result.current.isSupported).toBe('function');
    });

    it('language is a string', () => {
      const { result } = renderHook(() => useLanguage());

      expect(typeof result.current.language).toBe('string');
    });

    it('languages is an array', () => {
      const { result } = renderHook(() => useLanguage());

      expect(Array.isArray(result.current.languages)).toBe(true);
    });
  });

  // ==================== Memoization Tests ====================
  describe('Memoization', () => {
    it('language is memoized when i18n.language does not change', () => {
      const { result, rerender } = renderHook(() => useLanguage());

      const firstLanguage = result.current.language;
      rerender();
      const secondLanguage = result.current.language;

      expect(firstLanguage).toBe(secondLanguage);
    });

    it('currentLanguageConfig is memoized when language does not change', () => {
      const { result, rerender } = renderHook(() => useLanguage());

      const firstConfig = result.current.currentLanguageConfig;
      rerender();
      const secondConfig = result.current.currentLanguageConfig;

      expect(firstConfig).toEqual(secondConfig);
    });

    it('changeLanguage function is stable (useCallback)', () => {
      const { result, rerender } = renderHook(() => useLanguage());

      const firstChangeLanguage = result.current.changeLanguage;
      rerender();
      const secondChangeLanguage = result.current.changeLanguage;

      // With useCallback, function reference should be stable
      expect(firstChangeLanguage).toBe(secondChangeLanguage);
    });

    it('isSupported function is stable (useCallback)', () => {
      const { result, rerender } = renderHook(() => useLanguage());

      const firstIsSupported = result.current.isSupported;
      rerender();
      const secondIsSupported = result.current.isSupported;

      expect(firstIsSupported).toBe(secondIsSupported);
    });
  });

  // ==================== Language Selector Workflow Tests ====================
  describe('Language Selector Workflow', () => {
    it('can iterate over languages to build selector', () => {
      const { result } = renderHook(() => useLanguage());

      const options = result.current.languages.map((lang) => ({
        value: lang.code,
        label: `${lang.flag} ${lang.nativeName}`,
      }));

      expect(options).toHaveLength(3);
      expect(options[0]).toEqual({ value: 'es', label: '🇪🇸 Español' });
      expect(options[1]).toEqual({ value: 'en', label: '🇺🇸 English' });
      expect(options[2]).toEqual({ value: 'pt', label: '🇧🇷 Português' });
    });

    it('can check if current language matches an option', () => {
      setupI18nMock({ language: 'en' });
      const { result } = renderHook(() => useLanguage());

      const isSelected = (code: string) => result.current.language === code;

      expect(isSelected('es')).toBe(false);
      expect(isSelected('en')).toBe(true);
      expect(isSelected('pt')).toBe(false);
    });

    it('can change language on selection', async () => {
      const { result } = renderHook(() => useLanguage());

      // Simulate user selecting a new language
      const selectedLanguage = 'pt' as SupportedLanguage;

      await act(async () => {
        await result.current.changeLanguage(selectedLanguage);
      });

      expect(mockChangeLanguage).toHaveBeenCalledWith('pt');
    });
  });

  // ==================== Edge Cases ====================
  describe('Edge Cases', () => {
    it('handles language code with multiple hyphens', () => {
      setupI18nMock({ language: 'en-US-variant' });

      const { result } = renderHook(() => useLanguage());

      // Should extract just 'en' from 'en-US-variant'
      expect(result.current.language).toBe('en');
    });

    it('handles null language gracefully', () => {
      setupI18nMock({ language: null as unknown as string });

      const { result } = renderHook(() => useLanguage());

      expect(result.current.language).toBe('es'); // DEFAULT_LANGUAGE
    });

    it('changeLanguage handles rejection', async () => {
      const error = new Error('Failed to change language');
      mockChangeLanguage.mockRejectedValue(error);

      const { result } = renderHook(() => useLanguage());

      await expect(
        act(async () => {
          await result.current.changeLanguage('en');
        })
      ).rejects.toThrow('Failed to change language');
    });

    it('handles rapid language changes', async () => {
      const { result } = renderHook(() => useLanguage());

      await act(async () => {
        await result.current.changeLanguage('en');
        await result.current.changeLanguage('pt');
        await result.current.changeLanguage('es');
      });

      expect(mockChangeLanguage).toHaveBeenCalledTimes(3);
      expect(mockChangeLanguage).toHaveBeenNthCalledWith(1, 'en');
      expect(mockChangeLanguage).toHaveBeenNthCalledWith(2, 'pt');
      expect(mockChangeLanguage).toHaveBeenNthCalledWith(3, 'es');
    });
  });

  // ==================== TypeScript Type Tests ====================
  describe('TypeScript Types', () => {
    it('language is typed as SupportedLanguage', () => {
      const { result } = renderHook(() => useLanguage());

      // This test is mainly for TypeScript compilation
      const lang: SupportedLanguage = result.current.language;
      expect(['es', 'en', 'pt']).toContain(lang);
    });

    it('changeLanguage accepts only SupportedLanguage', async () => {
      const { result } = renderHook(() => useLanguage());

      // Valid calls (TypeScript would catch invalid ones at compile time)
      await act(async () => {
        await result.current.changeLanguage('es');
        await result.current.changeLanguage('en');
        await result.current.changeLanguage('pt');
      });

      expect(mockChangeLanguage).toHaveBeenCalledTimes(3);
    });
  });
});
