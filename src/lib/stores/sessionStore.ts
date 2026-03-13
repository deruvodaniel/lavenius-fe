import { create } from 'zustand';
import { sessionService } from '../api/sessions';
import { getErrorMessage, getErrorStatusCode } from '../utils/error';
import { SessionDeleteScope } from '../types/session';
import type { CreateSessionDto, SessionResponse, SessionUI, UpdateSessionDto } from '../types/session';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Smart-merge incoming sessions into an existing array.
 *
 * If a `dateWindow` is provided the merge first removes every existing session
 * whose `scheduledFrom` falls inside that window, then adds all incoming
 * sessions (de-duplicated by ID).  This guarantees that:
 *   - Sessions that were deleted on the backend are removed (they're no longer
 *     in the incoming response for that window).
 *   - Sessions outside the window are preserved (e.g. other months).
 *   - The returned array is always sorted chronologically.
 */
const mergeSessions = (
  existing: SessionResponse[],
  incoming: SessionResponse[],
  dateWindow?: { start: Date; end: Date },
): SessionResponse[] => {
  let base = existing;

  if (dateWindow) {
    const windowStart = dateWindow.start.getTime();
    const windowEnd = dateWindow.end.getTime();
    base = existing.filter((s) => {
      const t = new Date(s.scheduledFrom).getTime();
      return t < windowStart || t > windowEnd;
    });
  }

  // Merge: base + incoming, de-dup by ID (incoming wins)
  const map = new Map(base.map((s) => [s.id, s]));
  for (const session of incoming) {
    map.set(session.id, session);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.scheduledFrom).getTime() - new Date(b.scheduledFrom).getTime(),
  );
};

// ============================================================================
// STORE
// ============================================================================

interface SessionState {
  sessions: SessionResponse[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUpcoming: () => Promise<void>;
  fetchMonthly: (year: number, month: number) => Promise<void>;
  createSession: (data: CreateSessionDto) => Promise<SessionResponse>;
  updateSession: (id: string, data: UpdateSessionDto) => Promise<SessionResponse>;
  deleteSession: (id: string, scope?: SessionDeleteScope) => Promise<void>;
  markAsCompleted: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useSessionStore = create<SessionState>((set, _get) => ({
  sessions: [],
  isLoading: false,
  error: null,

  /**
   * Fetch upcoming sessions (next 30 days, limited to ~10).
   * Smart-merges into the store — replaces only sessions inside the
   * upcoming window while preserving sessions from other months.
   */
  fetchUpcoming: async () => {
    set({ isLoading: true, error: null });
    try {
      const sessions = await sessionService.getUpcoming();
      const incoming = Array.isArray(sessions) ? sessions : [];

      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      set((state) => ({
        sessions: mergeSessions(state.sessions, incoming, {
          start: now,
          end: thirtyDaysLater,
        }),
        isLoading: false,
      }));
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Error al cargar sesiones');
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Fetch all sessions for a specific month.
   * Smart-merges into the store — replaces only sessions within that
   * month while preserving sessions from other months.
   *
   * Does NOT set isLoading to avoid flashing a spinner during navigation.
   */
  fetchMonthly: async (year: number, month: number) => {
    try {
      const sessions = await sessionService.getMonthly(year, month);
      const incoming = Array.isArray(sessions) ? sessions : [];

      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

      set((state) => ({
        sessions: mergeSessions(state.sessions, incoming, {
          start: monthStart,
          end: monthEnd,
        }),
      }));
    } catch (error: unknown) {
      console.error('[SessionStore] Error fetching monthly sessions:', error);
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
    } catch (error: unknown) {
      const backendMessage = getErrorMessage(error, '');
      const statusCode = getErrorStatusCode(error);

      // Provide user-friendly error messages
      let errorMessage = 'Error al crear sesión';

      if (backendMessage.includes('calendar event') || backendMessage.includes('calendar')) {
        errorMessage = 'Para agendar turnos, primero debes conectar tu Google Calendar en Configuración';
      } else if (statusCode === 500) {
        // Error 500 al crear sesión generalmente es problema con Google Calendar o email inválido
        errorMessage = 'Error al crear el turno. Verifica que el email del paciente sea válido y que tu Google Calendar esté conectado en Configuración';
      } else if (backendMessage) {
        errorMessage = backendMessage;
      }

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
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Error al actualizar sesión');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  /**
   * Eliminar sesión
   * @param scope - Alcance de eliminación para sesiones recurrentes (opcional)
   */
  deleteSession: async (id: string, scope?: SessionDeleteScope) => {
    set({ isLoading: true, error: null });
    try {
      await sessionService.delete(id, scope);

      set((state) => {
        // When deleting with scope 'this_and_future', remove all sessions
        // with the same recurrenceId that are on or after the deleted session
        if (scope === SessionDeleteScope.THIS_AND_FUTURE) {
          const deletedSession = state.sessions.find((s) => s.id === id);
          if (deletedSession?.recurrenceId) {
            const deletedDate = new Date(deletedSession.scheduledFrom);
            return {
              sessions: state.sessions.filter((s) =>
                s.recurrenceId !== deletedSession.recurrenceId ||
                new Date(s.scheduledFrom) < deletedDate
              ),
              isLoading: false,
            };
          }
        }
        // Default: remove only the single session
        return {
          sessions: state.sessions.filter((s) => s.id !== id),
          isLoading: false,
        };
      });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Error al eliminar sesión');
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
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Error al completar sesión');
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

    // Build patient name from embedded data (may be empty if encryption fails)
    const patientName = session.patient
      ? `${session.patient.firstName || ''} ${session.patient.lastName || ''}`.trim() || undefined
      : undefined;

    return {
      ...session,
      // Normalize cost: TypeORM returns decimal columns as strings
      cost: Number(session.cost) || undefined,
      patientName,
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
