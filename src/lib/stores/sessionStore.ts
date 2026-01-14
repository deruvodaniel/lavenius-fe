import { create } from 'zustand';
import { sessionService } from '../api/sessions';
import type { CreateSessionDto, SessionResponse, SessionUI, UpdateSessionDto } from '../types/session';

interface SessionState {
  sessions: SessionResponse[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchUpcoming: () => Promise<void>;
  fetchMonthly: (year: number, month: number) => Promise<void>;
  createSession: (data: CreateSessionDto) => Promise<SessionResponse>;
  updateSession: (id: string, data: UpdateSessionDto) => Promise<SessionResponse>;
  deleteSession: (id: string) => Promise<void>;
  markAsCompleted: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useSessionStore = create<SessionState>((set, _get) => ({
  sessions: [],
  isLoading: false,
  error: null,

  /**
   * Obtener próximas sesiones
   */
  fetchUpcoming: async () => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await sessionService.getUpcoming();
      set({ sessions: Array.isArray(sessions) ? sessions : [], isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al cargar sesiones';
      set({ error: errorMessage, isLoading: false, sessions: [] });
    }
  },

  /**
   * Obtener sesiones de un mes específico
   */
  fetchMonthly: async (year: number, month: number) => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await sessionService.getMonthly(year, month);
      set({ sessions: Array.isArray(sessions) ? sessions : [], isLoading: false });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al cargar sesiones del mes';
      set({ error: errorMessage, isLoading: false, sessions: [] });
    }
  },

  /**
   * Crear nueva sesión
   */
  createSession: async (data: CreateSessionDto) => {
    set({ isLoading: true, error: null });
    try {
      const newSession = await sessionService.create(data);
      
      // Agregar a la lista manteniendo el orden cronológico
      set((state) => ({
        sessions: [...(state.sessions || []), newSession].sort(
          (a, b) => new Date(a.scheduledFrom).getTime() - new Date(b.scheduledFrom).getTime()
        ),
        isLoading: false
      }));
      
      return newSession;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al crear sesión';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Actualizar sesión existente
   */
  updateSession: async (id: string, data: UpdateSessionDto) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await sessionService.update(id, data);
      
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? updated : s)),
        isLoading: false
      }));
      
      return updated;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al actualizar sesión';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Eliminar sesión
   */
  deleteSession: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await sessionService.delete(id);
      
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
        isLoading: false
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al eliminar sesión';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Marcar sesión como completada
   */
  markAsCompleted: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await sessionService.markAsCompleted(id);
      
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? updated : s)),
        isLoading: false
      }));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al completar sesión';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Limpiar error
   */
  clearError: () => set({ error: null })
}));

/**
 * Hook personalizado para usar sesiones con datos extendidos para UI
 */
export const useSessions = () => {
  const store = useSessionStore();
  
  // Transform sessions to UI-friendly format
  const sessionsUI: SessionUI[] = (store.sessions || [])
    .filter(session => session && session.scheduledFrom && session.scheduledTo)
    .map((session) => {
    const scheduledFrom = new Date(session.scheduledFrom);
    const scheduledTo = new Date(session.scheduledTo);
    const now = new Date();
    
    return {
      ...session,
      patientName: session.patient 
        ? `${session.patient.firstName} ${session.patient.lastName || ''}`.trim()
        : undefined,
      duration: session.actualDuration || 
        Math.round((scheduledTo.getTime() - scheduledFrom.getTime()) / (1000 * 60)),
      isPast: scheduledTo < now,
      isToday: scheduledFrom.toDateString() === now.toDateString(),
      formattedDate: scheduledFrom.toLocaleDateString('es-AR'),
      formattedTime: `${scheduledFrom.toLocaleTimeString('es-AR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })} - ${scheduledTo.toLocaleTimeString('es-AR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`
    };
  });
  
  return {
    ...store,
    sessionsUI
  };
};
