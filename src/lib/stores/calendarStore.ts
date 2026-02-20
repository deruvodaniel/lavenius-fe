import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calendarService } from '../services/calendarService';
import { getErrorMessage, getErrorStatusCode } from '../utils/error';
import { toast } from 'sonner';

interface CalendarInfo {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
}

interface CalendarSyncStatus {
  hasToken: boolean;           // Google account connected (has calendars)
  hasSessionsCalendar: boolean; // "Sesiones" calendar exists
  sessionsCalendarId: string | null;
}

interface CalendarState {
  isConnected: boolean;
  isSyncing: boolean;
  isCheckingConnection: boolean;
  calendars: CalendarInfo[];
  syncStatus: CalendarSyncStatus;
  lastSyncAt: string | null;
  
  // Actions
  checkConnection: () => Promise<void>;
  connectCalendar: () => Promise<void>;
  syncCalendar: () => Promise<void>;
  disconnectCalendar: () => Promise<void>;
}

const STORAGE_KEY = 'lavenius-calendar';

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      isConnected: false,
      isSyncing: false,
      isCheckingConnection: false,
      calendars: [],
      syncStatus: {
        hasToken: false,
        hasSessionsCalendar: false,
        sessionsCalendarId: null,
      },
      lastSyncAt: null,

  checkConnection: async () => {
    // Avoid duplicate calls - if already checking, skip
    const state = useCalendarStore.getState();
    if (state.isCheckingConnection) return;
    
    set({ isCheckingConnection: true });
    try {
      const calendars = await calendarService.getCalendars();
      const hasCalendars = Array.isArray(calendars) && calendars.length > 0;
      
      // Find the "Sesiones" calendar (created by Lavenius)
      const sessionsCalendar = calendars?.find(
        (cal) => cal.summary === 'Sesiones' || cal.description?.includes('sesiones de terapia')
      );
      
      const syncStatus: CalendarSyncStatus = {
        hasToken: hasCalendars,
        hasSessionsCalendar: !!sessionsCalendar,
        sessionsCalendarId: sessionsCalendar?.id || null,
      };
      
      set({ 
        isConnected: hasCalendars, 
        calendars: calendars || [],
        syncStatus,
        isCheckingConnection: false 
      });
    } catch (error: unknown) {
      // Si el error es 400 "not connected", es normal - no está conectado aún
      // Solo logueamos otros errores
      const statusCode = getErrorStatusCode(error);
      if (statusCode !== 400) {
        console.error('Error checking calendar connection:', error);
      }
      set({ 
        isConnected: false, 
        calendars: [], 
        syncStatus: {
          hasToken: false,
          hasSessionsCalendar: false,
          sessionsCalendarId: null,
        },
        isCheckingConnection: false 
      });
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

      let messageReceived = false;

      // Listen for message from popup
      const handleMessage = async (event: MessageEvent) => {
        // Verify message origin if needed
        if (event.data.type === 'GOOGLE_CALENDAR_SUCCESS') {
          messageReceived = true;
          window.removeEventListener('message', handleMessage);
          
          toast.success('¡Conectado exitosamente!', {
            description: 'Google Calendar se conectó correctamente'
          });
          
          // Update connection status
          set({ isConnected: true });
          
          // Refresh calendar list and auto-sync
          await useCalendarStore.getState().checkConnection();
          
          // Auto-sync to create "Sesiones" calendar
          const state = useCalendarStore.getState();
          if (state.isConnected && !state.syncStatus.hasSessionsCalendar) {
            toast.info('Creando calendario de sesiones...', {
              description: 'Sincronizando automáticamente'
            });
            await useCalendarStore.getState().syncCalendar();
          }
        } else if (event.data.type === 'GOOGLE_CALENDAR_ERROR') {
          messageReceived = true;
          window.removeEventListener('message', handleMessage);
          
          toast.error('Error al conectar', {
            description: event.data.error || 'No se pudo conectar con Google Calendar'
          });
        }
      };

      window.addEventListener('message', handleMessage);

      // Poll to check if popup was closed (fallback when postMessage doesn't work)
      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          window.removeEventListener('message', handleMessage);
          
          // If we didn't receive a message, check connection status
          // (user may have completed auth but popup didn't send message)
          if (!messageReceived) {
            // Small delay to allow backend to process the OAuth callback
            setTimeout(async () => {
              await useCalendarStore.getState().checkConnection();
              
              // Auto-sync after successful connection to create "Sesiones" calendar
              const state = useCalendarStore.getState();
              if (state.isConnected && !state.syncStatus.hasSessionsCalendar) {
                toast.info('Creando calendario de sesiones...', {
                  description: 'Sincronizando automáticamente'
                });
                await useCalendarStore.getState().syncCalendar();
              }
            }, 1000);
          }
        }
      }, 500);

      // Cleanup after 5 minutes (in case popup is closed without completing)
      setTimeout(() => {
        clearInterval(checkPopupClosed);
        window.removeEventListener('message', handleMessage);
        }, 5 * 60 * 1000);
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Error al conectar con Google Calendar');
      toast.error(errorMessage);
      throw error;
    }
  },

  syncCalendar: async () => {
    set({ isSyncing: true });
    try {
      await calendarService.syncCalendar();
      
      toast.success('Calendario sincronizado', {
        description: 'Tu calendario de sesiones está listo para usar'
      });
      
      set({ isSyncing: false, isConnected: true, lastSyncAt: new Date().toISOString() });
      
      // Refresh connection to update syncStatus (calendar may have been created)
      useCalendarStore.getState().checkConnection();
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Error al sincronizar calendario');
      toast.error(errorMessage);
      set({ isSyncing: false });
      throw error;
    }
  },

  disconnectCalendar: async () => {
    try {
      await calendarService.disconnectCalendar();
      
      toast.success('Google Calendar desconectado');
      
      set({ 
        isConnected: false, 
        calendars: [], 
        syncStatus: {
          hasToken: false,
          hasSessionsCalendar: false,
          sessionsCalendarId: null,
        },
        lastSyncAt: null 
      });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Error al desconectar Google Calendar');
      toast.error(errorMessage);
      throw error;
    }
  },
}),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        isConnected: state.isConnected,
        syncStatus: state.syncStatus,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);
