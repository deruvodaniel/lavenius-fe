import { useTranslation } from 'react-i18next';
import { Check, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/components/ui/utils';
import { useState, useRef, useEffect } from 'react';

// SVG Flag components for reliable cross-platform rendering
const FlagES = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
    <path fill="#c60b1e" d="M0 0h640v480H0z"/>
    <path fill="#ffc400" d="M0 120h640v240H0z"/>
  </svg>
);

const FlagUS = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
    <path fill="#bd3d44" d="M0 0h640v480H0z"/>
    <path stroke="#fff" strokeWidth="37" d="M0 55.3h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640"/>
    <path fill="#192f5d" d="M0 0h364.8v258.5H0z"/>
    <marker id="us"><circle r="16" fill="#fff"/></marker>
    <path fill="none" markerMid="url(#us)" d="m0 0 18.3 0h36.6l36.6 0h36.6l36.6 0h36.6l36.6 0h36.6l36.6 0h9.2M0 0l0 32.4v32.4l0 32.4v32.4l0 32.4v32.4l0 32.4v32.4l0 9.3" transform="matrix(.73 0 0 .69 24 14.6)"/>
  </svg>
);

const FlagBR = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
    <path fill="#229e45" d="M0 0h640v480H0z"/>
    <path fill="#f8e509" d="M321.4 436.5 21.5 240l299.9-196.5L620.8 240z"/>
    <circle cx="321.4" cy="240" r="100" fill="#2b49a3"/>
    <path fill="#fff" d="M221.4 240a100 100 0 0 1 200 0 115 50 0 0 0-200 0z"/>
  </svg>
);

type LanguageCode = 'es' | 'en' | 'pt';

interface LanguageOption {
  code: LanguageCode;
  label: string;
  Flag: React.FC<{ className?: string }>;
}

const languages: LanguageOption[] = [
  { code: 'es', label: 'Español', Flag: FlagES },
  { code: 'en', label: 'English', Flag: FlagUS },
  { code: 'pt', label: 'Português', Flag: FlagBR },
];

interface LanguageSwitcherProps {
  /**
   * Display variant:
   * - 'compact': Flag-only button with dropdown (ideal for headers/landing)
   * - 'dropdown': Full Select with icon and label (for settings pages)
   * - 'buttons': Toggle button group (legacy, kept for backwards compatibility)
   */
  variant?: 'compact' | 'dropdown' | 'buttons';
  /** Show "Language" / "Idioma" label above the selector */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Alignment of dropdown content (for compact variant) */
  align?: 'start' | 'center' | 'end';
}

/**
 * LanguageSwitcher - Allows users to change the application language
 *
 * @example
 * // Compact flag dropdown for landing/header (recommended)
 * <LanguageSwitcher variant="compact" />
 *
 * @example
 * // In Settings page with label
 * <LanguageSwitcher showLabel variant="dropdown" />
 *
 * @example
 * // Legacy button group style
 * <LanguageSwitcher variant="buttons" />
 */
export function LanguageSwitcher({
  variant = 'compact',
  showLabel = false,
  className,
  align = 'end',
}: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as LanguageCode;
  const [open, setOpen] = useState(false);

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  const currentLang =
    languages.find((lang) => lang.code === currentLanguage) || languages[0];

  // Handle click outside to close dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Compact: Flag-only dropdown (ideal for landing page headers)
  if (variant === 'compact' || variant === 'buttons') {
    return (
      <div className={cn('relative flex items-center', className)} ref={dropdownRef}>
        {showLabel && (
          <span className="mr-3 text-sm font-medium text-foreground">
            {t('common.language', 'Idioma')}
          </span>
        )}
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            'inline-flex items-center h-9 gap-1.5 px-2.5 rounded-md',
            'bg-background/80 backdrop-blur-md border border-border/60 shadow-sm',
            'hover:bg-background hover:shadow-md hover:border-border',
            'text-foreground',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1',
            'transition-all duration-200'
          )}
          aria-label={t('common.selectLanguage', 'Select language')}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <currentLang.Flag className="w-5 h-4 rounded-sm" aria-hidden="true" />
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180'
            )}
            aria-hidden="true"
          />
          <span className="sr-only">{currentLang.label}</span>
        </button>
        
        {/* Dropdown Menu */}
        {open && (
          <div
            className={cn(
              'absolute top-full mt-2 z-[100]',
              align === 'end' ? 'right-0' : align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2',
              'min-w-[160px] p-1.5',
              'bg-background border border-border shadow-xl rounded-xl',
              'animate-in fade-in-0 zoom-in-95 duration-150'
            )}
            role="listbox"
            aria-label={t('common.selectLanguage', 'Select language')}
          >
            <div className="flex flex-col gap-0.5">
              {languages.map((lang) => {
                const isActive = lang.code === currentLanguage;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg',
                      'text-sm font-medium text-left',
                      'transition-colors duration-150',
                      'hover:bg-muted',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset',
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-foreground'
                    )}
                  >
                    <lang.Flag className="w-5 h-4 rounded-sm" aria-hidden="true" />
                    <span className="flex-1">{lang.label}</span>
                    {isActive && (
                      <Check
                        className="h-4 w-4 text-indigo-600 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default: Full dropdown with Select (for settings pages)
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {showLabel && (
        <label
          htmlFor="language-select"
          className="text-sm font-medium text-foreground"
        >
          {t('common.language', 'Idioma')}
        </label>
      )}
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger
          id="language-select"
          className="w-full min-w-[180px]"
          aria-label={t('common.selectLanguage', 'Select language')}
        >
          <SelectValue>
            <span className="flex items-center gap-2">
              <currentLang.Flag className="w-5 h-4 rounded-sm" aria-hidden="true" />
              <span>{currentLang.label}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem
              key={lang.code}
              value={lang.code}
              className="cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <lang.Flag className="w-5 h-4 rounded-sm" aria-hidden="true" />
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
