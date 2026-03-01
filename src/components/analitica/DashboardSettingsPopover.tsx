import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/components/ui/utils';

export interface SectionVisibility {
  todaySessions: boolean;
  pendingPayments: boolean;
  birthdays: boolean;
  patientsWithoutSession: boolean;
  todaySummary: boolean;
  charts: boolean;
}

interface DashboardSettingsPopoverProps {
  /** Current visibility state for all sections */
  visibility: SectionVisibility;
  /** Callback when visibility changes */
  onVisibilityChange: (visibility: SectionVisibility) => void;
  /** Additional className for trigger button */
  className?: string;
}

interface SectionToggleProps {
  id: keyof SectionVisibility;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SectionToggle({ id, label, checked, onCheckedChange }: SectionToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <label
        htmlFor={id}
        className={cn(
          'text-sm cursor-pointer',
          checked ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
      </label>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="switch-lg"
      />
    </div>
  );
}

/**
 * Settings popover for showing/hiding dashboard sections.
 * Persists preferences and provides grouped toggles.
 */
export function DashboardSettingsPopover({
  visibility,
  onVisibilityChange,
  className,
}: DashboardSettingsPopoverProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const handleToggle = (key: keyof SectionVisibility) => (checked: boolean) => {
    onVisibilityChange({ ...visibility, [key]: checked });
  };

  const allVisible = Object.values(visibility).every(Boolean);
  const noneVisible = Object.values(visibility).every(v => !v);

  const toggleAll = () => {
    const newValue = !allVisible;
    const newVisibility: SectionVisibility = {
      todaySessions: newValue,
      pendingPayments: newValue,
      birthdays: newValue,
      patientsWithoutSession: newValue,
      todaySummary: newValue,
      charts: newValue,
    };
    onVisibilityChange(newVisibility);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'text-muted-foreground hover:text-foreground',
            'hover:bg-muted',
            'transition-colors duration-150',
            className
          )}
          title={t('dashboard.settings.title')}
          aria-label={t('dashboard.settings.title')}
        >
          <Settings className="w-5 h-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className={cn(
          'w-72 p-0',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
        )}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">
              {t('dashboard.settings.title')}
            </h4>
            <button
              onClick={toggleAll}
              className={cn(
                'text-xs px-2 py-1 rounded',
                'text-indigo-600 dark:text-indigo-400',
                'hover:bg-indigo-50 dark:hover:bg-indigo-900/30',
                'transition-colors duration-150'
              )}
            >
              {allVisible ? t('dashboard.settings.hideAll') : t('dashboard.settings.showAll')}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('dashboard.settings.description')}
          </p>
        </div>

        {/* Section Toggles */}
        <div className="px-4 py-2">
          {/* Quick Overview Group */}
          <div className="mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('dashboard.settings.quickOverview')}
            </span>
            <SectionToggle
              id="todaySummary"
              label={t('dashboard.todaySummary.title')}
              checked={visibility.todaySummary}
              onCheckedChange={handleToggle('todaySummary')}
            />
            <SectionToggle
              id="todaySessions"
              label={t('dashboard.todaySessions.title')}
              checked={visibility.todaySessions}
              onCheckedChange={handleToggle('todaySessions')}
            />
            <SectionToggle
              id="pendingPayments"
              label={t('dashboard.pendingPayments.title')}
              checked={visibility.pendingPayments}
              onCheckedChange={handleToggle('pendingPayments')}
            />
          </div>

          {/* Insights Group */}
          <div className="mb-3 pt-2 border-t">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('dashboard.settings.insights')}
            </span>
            <SectionToggle
              id="birthdays"
              label={t('dashboard.birthdays.title')}
              checked={visibility.birthdays}
              onCheckedChange={handleToggle('birthdays')}
            />
            <SectionToggle
              id="patientsWithoutSession"
              label={t('dashboard.noUpcomingSession.title')}
              checked={visibility.patientsWithoutSession}
              onCheckedChange={handleToggle('patientsWithoutSession')}
            />
          </div>

          {/* Analytics Group */}
          <div className="pt-2 border-t">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('dashboard.settings.analytics')}
            </span>
            <SectionToggle
              id="charts"
              label={t('dashboard.settings.charts')}
              checked={visibility.charts}
              onCheckedChange={handleToggle('charts')}
            />
          </div>
        </div>

        {/* Footer hint */}
        {noneVisible && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              {t('dashboard.settings.allHiddenWarning')}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
