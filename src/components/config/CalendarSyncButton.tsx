import { useEffect } from 'react';
import { useCalendarStore } from '@/lib/stores/calendarStore';
import { Button } from '../ui/button';
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react';

interface CalendarSyncButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
}

export default function CalendarSyncButton({
  variant = 'outline',
  size = 'default',
  showIcon = true,
}: CalendarSyncButtonProps) {
  const {
    isConnected,
    isSyncing,
    connectCalendar,
    syncCalendar,
    checkConnection,
  } = useCalendarStore();

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const handleClick = async () => {
    if (isConnected) {
      await syncCalendar();
    } else {
      await connectCalendar();
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isSyncing}
      variant={variant}
      size={size}
    >
      {showIcon && (
        <>
          {isSyncing ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CalendarIcon className="mr-2 h-4 w-4" />
          )}
        </>
      )}
      {isSyncing
        ? 'Sincronizando...'
        : isConnected
        ? 'Sincronizar Google Calendar'
        : 'Conectar Google Calendar'}
    </Button>
  );
}
