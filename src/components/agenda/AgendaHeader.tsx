/**
 * Agenda Header Component
 * Contains title, search, view toggle, and calendar connection status
 */

import { useTranslation } from 'react-i18next';
import { Plus, Search, X, CheckCircle2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TipBanner } from '@/components/onboarding';
import { ViewModeToggle } from './ViewModeToggle';
import type { ViewMode } from '@/lib/hooks/useAgenda';

interface AgendaHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchResultsCount: number;
  isDesktop: boolean;
  isCalendarConnected: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  onConnectCalendar: () => void;
  onSyncCalendar: () => void;
  onNewTurno: () => void;
}

export function AgendaHeader({
  viewMode,
  onViewModeChange,
  searchTerm,
  onSearchChange,
  searchResultsCount,
  isDesktop,
  isCalendarConnected,
  isSyncing,
  lastSyncAt,
  onConnectCalendar,
  onSyncCalendar,
  onNewTurno,
}: AgendaHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 flex-shrink-0">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('agenda.title')}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
            {t('agenda.subtitle')}
          </p>
        </div>
        <button
          onClick={onNewTurno}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          {t('agenda.newSession')}
        </button>
      </div>

      {/* Search + View Toggle row */}
      <div className="flex flex-row gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={t('agenda.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
            aria-label={t('agenda.searchPlaceholder')}
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={t('agenda.clearSearch')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <ViewModeToggle 
          value={viewMode} 
          onChange={onViewModeChange} 
          isMobile={!isDesktop}
          labels={{
            list: t('agenda.views.list'),
            calendar: t('agenda.views.calendar'),
            both: t('agenda.views.both'),
          }}
        />
      </div>

      {/* Search results count */}
      {searchTerm && (
        <p className="text-sm text-gray-500">
          {t('agenda.searchResults', { count: searchResultsCount })}
          {searchTerm && ` ${t('agenda.searchResultsFor', { search: searchTerm })}`}
        </p>
      )}

      {/* Calendar connection status */}
      {!isCalendarConnected ? (
        <TipBanner
          tipId="agenda-connect-calendar"
          title={t('agenda.googleCalendar.connectTitle')}
          description={t('agenda.googleCalendar.connectDescription')}
          variant="info"
          action={{
            label: t('agenda.googleCalendar.connectNow'),
            onClick: onConnectCalendar
          }}
        />
      ) : (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">{t('agenda.googleCalendar.connected')}</span>
            {lastSyncAt && (
              <span className="text-xs text-green-600">
                · {t('agenda.googleCalendar.lastSync')}: {new Date(lastSyncAt).toLocaleString('es-AR', { 
                  day: 'numeric', 
                  month: 'short', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            )}
          </div>
          <button
            onClick={onSyncCalendar}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-900 px-3 py-1.5 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? t('agenda.googleCalendar.syncing') : t('agenda.googleCalendar.sync')}
          </button>
        </div>
      )}
    </div>
  );
}
