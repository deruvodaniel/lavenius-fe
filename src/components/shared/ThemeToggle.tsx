import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { cn } from '@/components/ui/utils';

const THEME_OPTIONS = [
  { value: 'light', icon: Sun, labelKey: 'settings.theme.light' },
  { value: 'system', icon: Monitor, labelKey: 'settings.theme.system' },
  { value: 'dark', icon: Moon, labelKey: 'settings.theme.dark' },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
      {THEME_OPTIONS.map(({ value, icon: Icon, labelKey }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          aria-label={t(labelKey)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            theme === value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          {t(labelKey)}
        </button>
      ))}
    </div>
  );
}
