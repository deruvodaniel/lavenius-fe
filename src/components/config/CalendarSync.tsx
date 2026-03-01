import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCalendarStore } from '@/lib/stores/calendarStore';
import { Button } from '../ui/button';
import { Calendar as CalendarIcon, RefreshCw, Link2Off, CheckCircle2, Circle, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';

// Checklist item component
interface ChecklistItemProps {
  label: string;
  checked: boolean;
  isLoading?: boolean;
  description?: string;
}

const ChecklistItem = ({ label, checked, isLoading, description }: ChecklistItemProps) => (
  <div className="flex items-start gap-3 py-2">
    <div className="mt-0.5">
      {isLoading ? (
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      ) : checked ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      ) : (
        <Circle className="w-5 h-5 text-muted-foreground" />
      )}
    </div>
    <div className="flex-1">
      <p className={`text-sm font-medium ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
  </div>
);

export default function CalendarSync() {
  const { t, i18n } = useTranslation();
  const {
    isConnected,
    isSyncing,
    isCheckingConnection,
    syncStatus,
    lastSyncAt,
    connectCalendar,
    syncCalendar,
    disconnectCalendar,
    checkConnection,
  } = useCalendarStore();

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Format last sync date
  const formatLastSync = (isoDate: string | null) => {
    if (!isoDate) return null;
    try {
      const date = new Date(isoDate);
      const locale = i18n.language === 'en' ? 'en-US' : i18n.language === 'pt' ? 'pt-BR' : 'es-AR';
      return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  const lastSyncFormatted = formatLastSync(lastSyncAt);

  return (
    <Card className="overflow-hidden bg-card">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">Google Calendar</h2>
              {syncStatus.hasToken && syncStatus.hasSessionsCalendar && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" />
                  {t('settings.calendarSync.ready')}
                </span>
              )}
              {syncStatus.hasToken && !syncStatus.hasSessionsCalendar && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  <AlertTriangle className="w-3 h-3" />
                  {t('settings.calendarSync.pending')}
                </span>
              )}
              {!syncStatus.hasToken && !isCheckingConnection && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  <Circle className="w-3 h-3" />
                  {t('settings.calendarSync.disconnected')}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {syncStatus.hasToken && syncStatus.hasSessionsCalendar
                ? t('settings.calendarSync.fullyConfigured')
                : syncStatus.hasToken
                ? t('settings.calendarSync.connectedSyncNeeded')
                : t('settings.calendarSync.connectToSync')}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-4">
        
        {/* Status Checklist */}
        <div className="bg-muted border border-border rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">{t('settings.calendarSync.configurationStatus')}</p>
          <div className="divide-y divide-border">
            <ChecklistItem
              label={t('settings.calendarSync.googleAccountConnected')}
              checked={syncStatus.hasToken}
              isLoading={isCheckingConnection}
              description={syncStatus.hasToken ? t('settings.calendarSync.authCompleted') : t('settings.calendarSync.connectGoogle')}
            />
            <ChecklistItem
              label={t('settings.calendarSync.sessionsCalendarCreated')}
              checked={syncStatus.hasSessionsCalendar}
              isLoading={isCheckingConnection}
              description={
                syncStatus.hasSessionsCalendar 
                  ? t('settings.calendarSync.calendarReady')
                  : syncStatus.hasToken 
                    ? t('settings.calendarSync.pressSyncToCreate')
                    : t('settings.calendarSync.willBeCreatedOnSync')
              }
            />
          </div>
          {lastSyncFormatted && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
              {t('settings.calendarSync.lastSync')}: {lastSyncFormatted}
            </p>
          )}
        </div>

        {/* Actions */}
        {!isConnected && (
          <Button
            onClick={connectCalendar}
            disabled={isCheckingConnection}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {t('settings.calendarSync.connect')}
          </Button>
        )}

        {isConnected && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={syncCalendar}
              disabled={isSyncing}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? t('settings.calendarSync.syncing') : t('settings.calendarSync.syncNow')}
            </Button>

            <Button
              onClick={disconnectCalendar}
              variant="outline"
              className="flex-1 sm:flex-none text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50"
            >
              <Link2Off className="mr-2 h-4 w-4" />
              {t('settings.calendarSync.disconnect')}
            </Button>
          </div>
        )}

        {/* Info section */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">{t('settings.calendarSync.whatSyncs')}</p>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
              {t('settings.calendarSync.syncScheduledSessions')}
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
              {t('settings.calendarSync.syncTimeChanges')}
            </li>
            <li className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
              {t('settings.calendarSync.syncCancellations')}
            </li>
          </ul>
        </div>

        {/* Disclaimer - One-way sync warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">{t('settings.calendarSync.oneWaySync')}</p>
              <p 
                className="text-sm text-red-600 mt-1"
                dangerouslySetInnerHTML={{ __html: t('settings.calendarSync.oneWaySyncWarning') }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
