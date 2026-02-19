import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/components/ui/utils';

const languages = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
] as const;

type LanguageCode = (typeof languages)[number]['code'];

interface LanguageSwitcherProps {
  /** Display variant - dropdown uses Select, buttons uses toggle group */
  variant?: 'dropdown' | 'buttons';
  /** Show "Language" / "Idioma" label above the selector */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * LanguageSwitcher - Allows users to change the application language
 * 
 * @example
 * // In Settings page with label
 * <LanguageSwitcher showLabel variant="dropdown" />
 * 
 * @example
 * // In Landing page header (compact)
 * <LanguageSwitcher variant="buttons" />
 */
export function LanguageSwitcher({
  variant = 'dropdown',
  showLabel = false,
  className,
}: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as LanguageCode;

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  const currentLang = languages.find((lang) => lang.code === currentLanguage) || languages[0];

  if (variant === 'buttons') {
    return (
      <div
        className={cn('flex items-center', className)}
        role="group"
        aria-label={t('common.selectLanguage', 'Select language')}
      >
        {showLabel && (
          <span className="mr-3 text-sm font-medium text-gray-700">
            {t('common.language', 'Idioma')}
          </span>
        )}
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 gap-1">
          {languages.map((lang) => {
            const isActive = lang.code === currentLanguage;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
                aria-pressed={isActive}
                aria-label={`${t('common.switchTo', 'Switch to')} ${lang.label}`}
              >
                <span aria-hidden="true">{lang.flag}</span>
                <span className="hidden sm:inline">{lang.label}</span>
                <span className="sm:hidden">{lang.code.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Default: dropdown variant
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {showLabel && (
        <label
          htmlFor="language-select"
          className="text-sm font-medium text-gray-700"
        >
          {t('common.language', 'Idioma')}
        </label>
      )}
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger
          id="language-select"
          className="w-full min-w-[180px] bg-white"
          aria-label={t('common.selectLanguage', 'Select language')}
        >
          <SelectValue>
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-600" aria-hidden="true" />
              <span aria-hidden="true">{currentLang.flag}</span>
              <span>{currentLang.label}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white">
          {languages.map((lang) => (
            <SelectItem
              key={lang.code}
              value={lang.code}
              className="cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span aria-hidden="true">{lang.flag}</span>
                <span>{lang.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export type { LanguageSwitcherProps };
