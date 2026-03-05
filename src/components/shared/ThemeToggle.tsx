import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
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
        <Button
          key={value}
          variant="ghost"
          size="sm"
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          aria-label={t(labelKey)}
          className={cn(
            'gap-1.5 h-auto px-3 py-1.5',
            theme === value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm hover:bg-white dark:hover:bg-gray-700'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-transparent'
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          {t(labelKey)}
        </Button>
      ))}
    </div>
  );
}
