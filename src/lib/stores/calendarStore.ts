import { create } from 'zustand';
import { calendarService } from '../services/calendarService';
import { toast } from 'sonner';

interface CalendarState {
  isConnected: boolean;
  isSyncing: boolean;
  isCheckingConnection: boolean;
  calendars: any[];
  
  // Actions
  checkConnection: () => Promise<void>;
  connectCalendar: () => Promise<void>;
  syncCalendar: () => Promise<void>;
  disconnectCalendar: () => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  isConnected: false,
  isSyncing: false,
  isCheckingConnection: false,
  calendars: [],

  checkConnection: async () => {
    set({ isCheckingConnection: true });
    try {
      const calendars = await calendarService.getCalendars();
      set({ 
        isConnected: Array.isArray(calendars) && calendars.length > 0, 
        calendars: calendars || [],
        isCheckingConnection: false 
      });
    } catch (error: any) {
      // Si el error es 400 "not connected", es normal - no está conectado aún
      // Solo logueamos otros errores
      if (error?.statusCode !== 400) {
        console.error('Error checking calendar connection:', error);
      }
      set({ isConnected: false, calendars: [], isCheckingConnection: false });
    }
  },

  connectCalendar: async () => {
    try {
      const response = await calendarService.getAuthUrl();
      
      const authUrl = response.authUrl;
      
      if (!authUrl) {
        toast.error('Error al obtener URL de autorización', {
          description: 'No se pudo generar la URL de Google Calendar'
        });
        return;
      }
      
      // Open auth URL in new window
      const popup = window.open(authUrl, '_blank', 'width=600,height=700');
      
      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        // Popup bloqueado - mostrar mensaje al usuario
        toast.error('Popup bloqueado', {
          description: 'Por favor permite popups para este sitio y vuelve a intentar'
        });
        return;
      }
      
      toast.info('Conectando con Google Calendar...', {
        description: 'Por favor autoriza la aplicación en la ventana que se abrió'
      });

      // Listen for message from popup
      const handleMessage = (event: MessageEvent) => {
        // Verify message origin if needed
        if (event.data.type === 'GOOGLE_CALENDAR_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          
          toast.success('¡Conectado exitosamente!', {
            description: 'Google Calendar se conectó correctamente'
          });
          
          // Update connection status
          set({ isConnected: true });
          
          // Refresh calendar list
          useCalendarStore.getState().checkConnection();
        } else if (event.data.type === 'GOOGLE_CALENDAR_ERROR') {
          window.removeEventListener('message', handleMessage);
          
          toast.error('Error al conectar', {
            description: event.data.error || 'No se pudo conectar con Google Calendar'
          });
        }
      };

      window.addEventListener('message', handleMessage);

      // Cleanup listener after 5 minutes (in case popup is closed without completing)
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
      }, 5 * 60 * 1000);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al conectar con Google Calendar';
      toast.error(errorMessage);
      throw error;
    }
  },

  syncCalendar: async () => {
    set({ isSyncing: true });
    try {
      const response = await calendarService.syncCalendar();
      
      toast.success('Calendario sincronizado', {
        description: `${response.sessionsSynced} sesiones sincronizadas con Google Calendar`
      });
      
      set({ isSyncing: false, isConnected: true });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al sincronizar calendario';
      toast.error(errorMessage);
      set({ isSyncing: false });
      throw error;
    }
  },

  disconnectCalendar: async () => {
    try {
      await calendarService.disconnectCalendar();
      
      toast.success('Google Calendar desconectado');
      
      set({ isConnected: false, calendars: [] });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al desconectar Google Calendar';
      toast.error(errorMessage);
      throw error;
    }
  },
}));
