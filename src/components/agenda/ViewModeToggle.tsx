/**
 * View Mode Toggle Component
 * Allows switching between list, calendar, and both views
 */

import { List, Calendar, LayoutGrid } from 'lucide-react';
import type { ViewMode } from '@/lib/hooks/useAgenda';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  isMobile: boolean;
  labels: { list: string; calendar: string; both: string };
}

export function ViewModeToggle({ value, onChange, isMobile, labels }: ViewModeToggleProps) {
  const options: { value: ViewMode; label: string; icon: React.ReactNode }[] = isMobile
    ? [
        { value: 'list', label: labels.list, icon: <List className="w-4 h-4" /> },
        { value: 'calendar', label: labels.calendar, icon: <Calendar className="w-4 h-4" /> },
      ]
    : [
        { value: 'list', label: labels.list, icon: <List className="w-4 h-4" /> },
        { value: 'both', label: labels.both, icon: <LayoutGrid className="w-4 h-4" /> },
        { value: 'calendar', label: labels.calendar, icon: <Calendar className="w-4 h-4" /> },
      ];

  return (
    <div className="inline-flex items-center bg-muted rounded-lg p-1 gap-0.5">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${isActive
                ? 'bg-background text-indigo-600 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }
            `}
            aria-pressed={isActive}
            aria-label={option.label}
          >
            {option.icon}
            <span className={isMobile ? 'hidden xs:inline' : ''}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
