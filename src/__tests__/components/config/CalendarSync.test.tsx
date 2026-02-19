import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ============================================================================
// MOCKS
// ============================================================================

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'settings.calendarSync.ready': 'Listo',
        'settings.calendarSync.pending': 'Pendiente',
        'settings.calendarSync.disconnected': 'Desconectado',
        'settings.calendarSync.fullyConfigured': 'Google Calendar está completamente configurado',
        'settings.calendarSync.connectedSyncNeeded': 'Conectado - necesita sincronizar',
        'settings.calendarSync.connectToSync': 'Conecta tu cuenta para sincronizar sesiones',
        'settings.calendarSync.configurationStatus': 'Estado de configuración',
        'settings.calendarSync.googleAccountConnected': 'Cuenta de Google conectada',
        'settings.calendarSync.authCompleted': 'Autorización completada',
        'settings.calendarSync.connectGoogle': 'Conecta tu cuenta de Google',
        'settings.calendarSync.sessionsCalendarCreated': 'Calendario de sesiones creado',
        'settings.calendarSync.calendarReady': 'Calendario listo para sincronizar',
        'settings.calendarSync.pressSyncToCreate': 'Presiona sincronizar para crear',
        'settings.calendarSync.willBeCreatedOnSync': 'Se creará al sincronizar',
        'settings.calendarSync.lastSync': 'Última sincronización',
        'settings.calendarSync.connect': 'Conectar Google Calendar',
        'settings.calendarSync.syncNow': 'Sincronizar ahora',
        'settings.calendarSync.syncing': 'Sincronizando...',
        'settings.calendarSync.disconnect': 'Desconectar',
        'settings.calendarSync.whatSyncs': '¿Qué se sincroniza?',
        'settings.calendarSync.syncScheduledSessions': 'Sesiones programadas',
        'settings.calendarSync.syncTimeChanges': 'Cambios de horario',
        'settings.calendarSync.syncCancellations': 'Cancelaciones',
        'settings.calendarSync.oneWaySync': 'Sincronización unidireccional',
        'settings.calendarSync.oneWaySyncWarning': 'Los cambios en Google Calendar <strong>no</strong> se reflejarán en Lavenius',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'es',
    },
  }),
}));

// Mock calendarStore
const mockCheckConnection = vi.fn();
const mockConnectCalendar = vi.fn();
const mockSyncCalendar = vi.fn();
const mockDisconnectCalendar = vi.fn();

vi.mock('@/lib/stores/calendarStore', () => ({
  useCalendarStore: vi.fn(),
}));

// Import after mocks
import CalendarSync from '../../../components/config/CalendarSync';
import { useCalendarStore } from '@/lib/stores/calendarStore';

// ============================================================================
// HELPERS
// ============================================================================

const mockCalendarStoreState = (overrides: Partial<ReturnType<typeof useCalendarStore>> = {}) => {
  const defaultState = {
    isConnected: false,
    isSyncing: false,
    isCheckingConnection: false,
    syncStatus: {
      hasToken: false,
      hasSessionsCalendar: false,
      sessionsCalendarId: null,
    },
    lastSyncAt: null,
    checkConnection: mockCheckConnection,
    connectCalendar: mockConnectCalendar,
    syncCalendar: mockSyncCalendar,
    disconnectCalendar: mockDisconnectCalendar,
  };

  vi.mocked(useCalendarStore).mockReturnValue({
    ...defaultState,
    ...overrides,
  } as ReturnType<typeof useCalendarStore>);
};

const renderCalendarSync = () => {
  return render(<CalendarSync />);
};

// ============================================================================
// TESTS
// ============================================================================

describe('CalendarSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCalendarStoreState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders the Google Calendar heading', () => {
      renderCalendarSync();
      expect(screen.getByText('Google Calendar')).toBeInTheDocument();
    });

    it('renders configuration status section', () => {
      renderCalendarSync();
      expect(screen.getByText('Estado de configuración')).toBeInTheDocument();
    });

    it('renders what syncs section', () => {
      renderCalendarSync();
      expect(screen.getByText('¿Qué se sincroniza?')).toBeInTheDocument();
    });

    it('renders sync items list', () => {
      renderCalendarSync();
      expect(screen.getByText('Sesiones programadas')).toBeInTheDocument();
      expect(screen.getByText('Cambios de horario')).toBeInTheDocument();
      expect(screen.getByText('Cancelaciones')).toBeInTheDocument();
    });

    it('renders one-way sync warning', () => {
      renderCalendarSync();
      expect(screen.getByText('Sincronización unidireccional')).toBeInTheDocument();
    });

    it('calls checkConnection on mount', () => {
      renderCalendarSync();
      expect(mockCheckConnection).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // DISCONNECTED STATE
  // ==========================================================================

  describe('Disconnected State', () => {
    beforeEach(() => {
      mockCalendarStoreState({
        isConnected: false,
        syncStatus: {
          hasToken: false,
          hasSessionsCalendar: false,
          sessionsCalendarId: null,
        },
      });
    });

    it('shows disconnected badge', () => {
      renderCalendarSync();
      expect(screen.getByText('Desconectado')).toBeInTheDocument();
    });

    it('shows connect description', () => {
      renderCalendarSync();
      expect(screen.getByText('Conecta tu cuenta para sincronizar sesiones')).toBeInTheDocument();
    });

    it('shows connect button', () => {
      renderCalendarSync();
      expect(screen.getByRole('button', { name: /conectar google calendar/i })).toBeInTheDocument();
    });

    it('does not show sync or disconnect buttons', () => {
      renderCalendarSync();
      expect(screen.queryByRole('button', { name: /sincronizar ahora/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /desconectar/i })).not.toBeInTheDocument();
    });

    it('shows checklist items as unchecked', () => {
      renderCalendarSync();
      expect(screen.getByText('Cuenta de Google conectada')).toBeInTheDocument();
      expect(screen.getByText('Conecta tu cuenta de Google')).toBeInTheDocument();
      expect(screen.getByText('Calendario de sesiones creado')).toBeInTheDocument();
      expect(screen.getByText('Se creará al sincronizar')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // CONNECTED BUT NOT SYNCED STATE
  // ==========================================================================

  describe('Connected But Not Synced State', () => {
    beforeEach(() => {
      mockCalendarStoreState({
        isConnected: true,
        syncStatus: {
          hasToken: true,
          hasSessionsCalendar: false,
          sessionsCalendarId: null,
        },
      });
    });

    it('shows pending badge', () => {
      renderCalendarSync();
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('shows connected sync needed description', () => {
      renderCalendarSync();
      expect(screen.getByText('Conectado - necesita sincronizar')).toBeInTheDocument();
    });

    it('shows sync and disconnect buttons', () => {
      renderCalendarSync();
      expect(screen.getByRole('button', { name: /sincronizar ahora/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /desconectar/i })).toBeInTheDocument();
    });

    it('does not show connect button', () => {
      renderCalendarSync();
      expect(screen.queryByRole('button', { name: /conectar google calendar/i })).not.toBeInTheDocument();
    });

    it('shows Google account connected but calendar not created', () => {
      renderCalendarSync();
      expect(screen.getByText('Autorización completada')).toBeInTheDocument();
      expect(screen.getByText('Presiona sincronizar para crear')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // FULLY CONNECTED STATE
  // ==========================================================================

  describe('Fully Connected State', () => {
    beforeEach(() => {
      mockCalendarStoreState({
        isConnected: true,
        syncStatus: {
          hasToken: true,
          hasSessionsCalendar: true,
          sessionsCalendarId: 'sessions-calendar-id',
        },
      });
    });

    it('shows ready badge', () => {
      renderCalendarSync();
      expect(screen.getByText('Listo')).toBeInTheDocument();
    });

    it('shows fully configured description', () => {
      renderCalendarSync();
      expect(screen.getByText('Google Calendar está completamente configurado')).toBeInTheDocument();
    });

    it('shows sync and disconnect buttons', () => {
      renderCalendarSync();
      expect(screen.getByRole('button', { name: /sincronizar ahora/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /desconectar/i })).toBeInTheDocument();
    });

    it('shows both checklist items as completed', () => {
      renderCalendarSync();
      expect(screen.getByText('Autorización completada')).toBeInTheDocument();
      expect(screen.getByText('Calendario listo para sincronizar')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // LOADING / CHECKING CONNECTION STATE
  // ==========================================================================

  describe('Loading State', () => {
    it('disables connect button while checking connection', () => {
      mockCalendarStoreState({
        isConnected: false,
        isCheckingConnection: true,
      });

      renderCalendarSync();
      
      const connectButton = screen.getByRole('button', { name: /conectar google calendar/i });
      expect(connectButton).toBeDisabled();
    });

    it('does not show status badge while checking connection', () => {
      mockCalendarStoreState({
        isCheckingConnection: true,
        syncStatus: {
          hasToken: false,
          hasSessionsCalendar: false,
          sessionsCalendarId: null,
        },
      });

      renderCalendarSync();
      
      // Should not show any of the status badges
      expect(screen.queryByText('Listo')).not.toBeInTheDocument();
      expect(screen.queryByText('Pendiente')).not.toBeInTheDocument();
      expect(screen.queryByText('Desconectado')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SYNCING STATE
  // ==========================================================================

  describe('Syncing State', () => {
    beforeEach(() => {
      mockCalendarStoreState({
        isConnected: true,
        isSyncing: true,
        syncStatus: {
          hasToken: true,
          hasSessionsCalendar: true,
          sessionsCalendarId: 'id',
        },
      });
    });

    it('shows syncing text on button', () => {
      renderCalendarSync();
      expect(screen.getByRole('button', { name: /sincronizando/i })).toBeInTheDocument();
    });

    it('disables sync button while syncing', () => {
      renderCalendarSync();
      const syncButton = screen.getByRole('button', { name: /sincronizando/i });
      expect(syncButton).toBeDisabled();
    });
  });

  // ==========================================================================
  // LAST SYNC DATE
  // ==========================================================================

  describe('Last Sync Date', () => {
    it('shows last sync date when available', () => {
      const lastSyncDate = '2026-02-19T10:30:00.000Z';
      mockCalendarStoreState({
        isConnected: true,
        lastSyncAt: lastSyncDate,
        syncStatus: {
          hasToken: true,
          hasSessionsCalendar: true,
          sessionsCalendarId: 'id',
        },
      });

      renderCalendarSync();
      
      expect(screen.getByText(/última sincronización/i)).toBeInTheDocument();
    });

    it('does not show last sync when null', () => {
      mockCalendarStoreState({
        isConnected: true,
        lastSyncAt: null,
      });

      renderCalendarSync();
      
      expect(screen.queryByText(/última sincronización/i)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // BUTTON INTERACTIONS
  // ==========================================================================

  describe('Button Interactions', () => {
    it('calls connectCalendar when connect button is clicked', async () => {
      const user = userEvent.setup();
      mockCalendarStoreState({
        isConnected: false,
      });

      renderCalendarSync();
      
      await user.click(screen.getByRole('button', { name: /conectar google calendar/i }));
      
      expect(mockConnectCalendar).toHaveBeenCalledTimes(1);
    });

    it('calls syncCalendar when sync button is clicked', async () => {
      const user = userEvent.setup();
      mockCalendarStoreState({
        isConnected: true,
        syncStatus: {
          hasToken: true,
          hasSessionsCalendar: true,
          sessionsCalendarId: 'id',
        },
      });

      renderCalendarSync();
      
      await user.click(screen.getByRole('button', { name: /sincronizar ahora/i }));
      
      expect(mockSyncCalendar).toHaveBeenCalledTimes(1);
    });

    it('calls disconnectCalendar when disconnect button is clicked', async () => {
      const user = userEvent.setup();
      mockCalendarStoreState({
        isConnected: true,
        syncStatus: {
          hasToken: true,
          hasSessionsCalendar: true,
          sessionsCalendarId: 'id',
        },
      });

      renderCalendarSync();
      
      await user.click(screen.getByRole('button', { name: /desconectar/i }));
      
      expect(mockDisconnectCalendar).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe('Accessibility', () => {
    it('has accessible heading', () => {
      renderCalendarSync();
      expect(screen.getByRole('heading', { name: 'Google Calendar', level: 2 })).toBeInTheDocument();
    });

    it('connect button is keyboard accessible', async () => {
      const user = userEvent.setup();
      mockCalendarStoreState({
        isConnected: false,
      });

      renderCalendarSync();
      
      const connectButton = screen.getByRole('button', { name: /conectar google calendar/i });
      connectButton.focus();
      expect(connectButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockConnectCalendar).toHaveBeenCalled();
    });

    it('sync button is keyboard accessible', async () => {
      const user = userEvent.setup();
      mockCalendarStoreState({
        isConnected: true,
        syncStatus: {
          hasToken: true,
          hasSessionsCalendar: true,
          sessionsCalendarId: 'id',
        },
      });

      renderCalendarSync();
      
      const syncButton = screen.getByRole('button', { name: /sincronizar ahora/i });
      syncButton.focus();
      expect(syncButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockSyncCalendar).toHaveBeenCalled();
    });

    it('disconnect button is keyboard accessible', async () => {
      const user = userEvent.setup();
      mockCalendarStoreState({
        isConnected: true,
        syncStatus: {
          hasToken: true,
          hasSessionsCalendar: true,
          sessionsCalendarId: 'id',
        },
      });

      renderCalendarSync();
      
      const disconnectButton = screen.getByRole('button', { name: /desconectar/i });
      disconnectButton.focus();
      expect(disconnectButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(mockDisconnectCalendar).toHaveBeenCalled();
    });

    it('has proper button roles', () => {
      mockCalendarStoreState({
        isConnected: true,
        syncStatus: {
          hasToken: true,
          hasSessionsCalendar: true,
          sessionsCalendarId: 'id',
        },
      });

      renderCalendarSync();
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles invalid lastSyncAt date gracefully', () => {
      mockCalendarStoreState({
        isConnected: true,
        lastSyncAt: 'invalid-date',
        syncStatus: {
          hasToken: true,
          hasSessionsCalendar: true,
          sessionsCalendarId: 'id',
        },
      });

      // Should not throw
      expect(() => renderCalendarSync()).not.toThrow();
    });

    it('handles state transition from disconnected to connected', async () => {
      const { rerender } = render(<CalendarSync />);
      
      // Initially disconnected
      expect(screen.getByRole('button', { name: /conectar google calendar/i })).toBeInTheDocument();
      
      // Update mock to connected
      mockCalendarStoreState({
        isConnected: true,
        syncStatus: {
          hasToken: true,
          hasSessionsCalendar: true,
          sessionsCalendarId: 'id',
        },
      });
      
      rerender(<CalendarSync />);
      
      // Now should show sync button
      expect(screen.getByRole('button', { name: /sincronizar ahora/i })).toBeInTheDocument();
    });
  });
});
