import { useEffect } from 'react';
import { useCalendarStore } from '@/lib/stores/calendarStore';
import { Button } from '../ui/button';
import { Calendar as CalendarIcon, RefreshCw, Link2Off } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';

export default function CalendarSync() {
  const {
    isConnected,
    isSyncing,
    isCheckingConnection,
    connectCalendar,
    syncCalendar,
    disconnectCalendar,
    checkConnection,
  } = useCalendarStore();

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <CardTitle>Google Calendar</CardTitle>
          </div>
          {isConnected && (
            <Badge variant="default" className="bg-green-500">
              Conectado
            </Badge>
          )}
          {!isConnected && !isCheckingConnection && (
            <Badge variant="secondary">Desconectado</Badge>
          )}
        </div>
        <CardDescription>
          {isConnected
            ? 'Tu calendario está sincronizado con Google Calendar'
            : 'Conecta tu cuenta de Google para sincronizar tus sesiones'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected && (
          <Button
            onClick={connectCalendar}
            disabled={isCheckingConnection}
            className="w-full"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Conectar Google Calendar
          </Button>
        )}

        {isConnected && (
          <div className="space-y-3">
            <Button
              onClick={syncCalendar}
              disabled={isSyncing}
              className="w-full"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
            </Button>

            <Button
              onClick={disconnectCalendar}
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
            >
              <Link2Off className="mr-2 h-4 w-4" />
              Desconectar
            </Button>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-1">¿Qué se sincroniza?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Todas tus sesiones agendadas</li>
            <li>Cambios en horarios de sesiones</li>
            <li>Cancelación de sesiones</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
