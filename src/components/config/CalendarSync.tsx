import { useEffect } from 'react';
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
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      ) : checked ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      ) : (
        <Circle className="w-5 h-5 text-gray-300" />
      )}
    </div>
    <div className="flex-1">
      <p className={`text-sm font-medium ${checked ? 'text-gray-900' : 'text-gray-500'}`}>
        {label}
      </p>
      {description && (
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      )}
    </div>
  </div>
);

export default function CalendarSync() {
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
      return date.toLocaleDateString('es-AR', {
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
    <Card className="overflow-hidden bg-white">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Google Calendar</h2>
              {syncStatus.hasToken && syncStatus.hasSessionsCalendar && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" />
                  Listo
                </span>
              )}
              {syncStatus.hasToken && !syncStatus.hasSessionsCalendar && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  <AlertTriangle className="w-3 h-3" />
                  Pendiente
                </span>
              )}
              {!syncStatus.hasToken && !isCheckingConnection && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  <Circle className="w-3 h-3" />
                  Desconectado
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {syncStatus.hasToken && syncStatus.hasSessionsCalendar
                ? 'Tu calendario está completamente configurado'
                : syncStatus.hasToken
                ? 'Conectado - Sincroniza para crear el calendario de sesiones'
                : 'Conecta tu cuenta de Google para sincronizar tus sesiones'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-4">
        
        {/* Status Checklist */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Estado de configuración</p>
          <div className="divide-y divide-gray-100">
            <ChecklistItem
              label="Cuenta de Google conectada"
              checked={syncStatus.hasToken}
              isLoading={isCheckingConnection}
              description={syncStatus.hasToken ? 'Autorización completada' : 'Conecta tu cuenta de Google'}
            />
            <ChecklistItem
              label="Calendario 'Sesiones' creado"
              checked={syncStatus.hasSessionsCalendar}
              isLoading={isCheckingConnection}
              description={
                syncStatus.hasSessionsCalendar 
                  ? 'Calendario listo en tu Google Calendar' 
                  : syncStatus.hasToken 
                    ? 'Presiona "Sincronizar" para crearlo' 
                    : 'Se creará al sincronizar'
              }
            />
          </div>
          {lastSyncFormatted && (
            <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200">
              Última sincronización: {lastSyncFormatted}
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
            Conectar Google Calendar
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
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
            </Button>

            <Button
              onClick={disconnectCalendar}
              variant="outline"
              className="flex-1 sm:flex-none text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
            >
              <Link2Off className="mr-2 h-4 w-4" />
              Desconectar
            </Button>
          </div>
        )}

        {/* Info section */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">¿Qué se sincroniza?</p>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
              Todas tus sesiones agendadas
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
              Cambios en horarios de sesiones
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
              Cancelación de sesiones
            </li>
          </ul>
        </div>

        {/* Disclaimer - One-way sync warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Sincronización unidireccional</p>
              <p className="text-sm text-red-600 mt-1">
                La sincronización funciona solo desde Lavenius hacia Google Calendar. 
                Los cambios que realices directamente en Google Calendar <strong>no se reflejarán</strong> en la aplicación.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
