import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Agenda } from '../../../components/agenda/Agenda';
import { SessionStatus, SessionType } from '@/lib/types/session';
import type { SessionUI } from '@/lib/types/session';

// ============================================================================
// BROWSER API MOCKS
// ============================================================================

// Mock IntersectionObserver
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor(private callback: IntersectionObserverCallback) {}
  
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

// Mock ResizeObserver
class MockResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

// ============================================================================
// MOCK DATA
// ============================================================================

const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

const mockSessions: SessionUI[] = [
  {
    id: 'session-1',
    scheduledFrom: `${todayStr}T10:00:00.000Z`,
    scheduledTo: `${todayStr}T11:00:00.000Z`,
    status: SessionStatus.PENDING,
    sessionType: SessionType.PRESENTIAL,
    patient: { id: 'patient-1', firstName: 'Juan', lastName: 'Pérez' },
    patientName: 'Juan Pérez',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    duration: 60,
    isPast: false,
    isToday: true,
    formattedDate: today.toLocaleDateString('es-AR'),
    formattedTime: '10:00 - 11:00',
    cost: 5000,
  },
  {
    id: 'session-2',
    scheduledFrom: `${todayStr}T14:00:00.000Z`,
    scheduledTo: `${todayStr}T15:00:00.000Z`,
    status: SessionStatus.CONFIRMED,
    sessionType: SessionType.REMOTE,
    patient: { id: 'patient-2', firstName: 'María', lastName: 'García' },
    patientName: 'María García',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    duration: 60,
    isPast: false,
    isToday: true,
    formattedDate: today.toLocaleDateString('es-AR'),
    formattedTime: '14:00 - 15:00',
    cost: 5000,
  },
  {
    id: 'session-3',
    scheduledFrom: `${tomorrowStr}T09:00:00.000Z`,
    scheduledTo: `${tomorrowStr}T10:00:00.000Z`,
    status: SessionStatus.COMPLETED,
    sessionType: SessionType.PRESENTIAL,
    patient: { id: 'patient-1', firstName: 'Juan', lastName: 'Pérez' },
    patientName: 'Juan Pérez',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    duration: 60,
    isPast: false,
    isToday: false,
    formattedDate: tomorrow.toLocaleDateString('es-AR'),
    formattedTime: '09:00 - 10:00',
    cost: 5000,
  },
];

const mockPatients = [
  {
    id: 'patient-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@test.com',
    phone: '+5491123456789',
    status: 'ACTIVE' as const,
    notes: '',
    healthInsurance: 'OSDE',
  },
  {
    id: 'patient-2',
    firstName: 'María',
    lastName: 'García',
    email: 'maria@test.com',
    phone: '+5491198765432',
    status: 'ACTIVE' as const,
    notes: '',
    healthInsurance: 'Swiss Medical',
  },
];

// ============================================================================
// MOCKS
// ============================================================================

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'agenda.title': 'Agenda',
        'agenda.subtitle': 'Gestiona tus turnos y citas',
        'agenda.newSession': 'Nuevo turno',
        'agenda.upcoming': 'Próximos turnos',
        'agenda.today': 'Hoy',
        'agenda.tomorrow': 'Mañana',
        'agenda.noSessions': 'No hay turnos programados',
        'agenda.noSessionsDescription': 'Agrega tu primer turno para comenzar',
        'agenda.addFirstSession': 'Agregar primer turno',
        'agenda.searchPlaceholder': 'Buscar por paciente...',
        'agenda.searchResults': `${params?.count || 0} resultados`,
        'agenda.searchResultsFor': `para "${params?.search || ''}"`,
        'agenda.noResults': 'No se encontraron resultados',
        'agenda.noResultsDescription': `No hay turnos para "${params?.search || ''}"`,
        'agenda.clearSearch': 'Limpiar búsqueda',
        'agenda.views.list': 'Lista',
        'agenda.views.calendar': 'Calendario',
        'agenda.views.both': 'Ambos',
        'agenda.loadingMore': 'Cargando más...',
        'agenda.loadingPatientDetails': 'Cargando detalles del paciente...',
        'agenda.googleCalendar.connectTitle': 'Conecta tu Google Calendar',
        'agenda.googleCalendar.connectDescription': 'Sincroniza tus turnos con Google Calendar',
        'agenda.googleCalendar.connectNow': 'Conectar ahora',
        'agenda.googleCalendar.connected': 'Google Calendar conectado',
        'agenda.googleCalendar.lastSync': 'Última sincronización',
        'agenda.googleCalendar.sync': 'Sincronizar',
        'agenda.googleCalendar.syncing': 'Sincronizando...',
        'agenda.messages.createSuccess': 'Turno creado exitosamente',
        'agenda.messages.updateSuccess': 'Turno actualizado exitosamente',
        'agenda.messages.deleteSuccess': 'Turno eliminado exitosamente',
        'agenda.messages.deleteError': 'Error al eliminar el turno',
        'agenda.messages.deleteConfirmTitle': 'Eliminar turno',
        'agenda.messages.deleteConfirmDescription': `¿Estás seguro de eliminar el turno de ${params?.patientName || ''}?`,
        'agenda.messages.rescheduleSuccess': 'Turno reprogramado exitosamente',
        'agenda.messages.rescheduleError': 'Error al reprogramar el turno',
        'common.delete': 'Eliminar',
        'common.cancel': 'Cancelar',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock sonner toast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockToastInfo = vi.fn();
const mockToastLoading = vi.fn();
const mockToastDismiss = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    info: (...args: unknown[]) => mockToastInfo(...args),
    loading: (...args: unknown[]) => mockToastLoading(...args),
    dismiss: (...args: unknown[]) => mockToastDismiss(...args),
  },
}));

// Mock session store
const mockFetchUpcoming = vi.fn();
const mockCreateSession = vi.fn();
const mockUpdateSession = vi.fn();
const mockDeleteSession = vi.fn();
const mockClearError = vi.fn();

vi.mock('@/lib/stores/sessionStore', () => ({
  useSessions: vi.fn(() => ({
    sessionsUI: mockSessions,
    isLoading: false,
    error: null,
    fetchUpcoming: mockFetchUpcoming,
    createSession: mockCreateSession,
    updateSession: mockUpdateSession,
    deleteSession: mockDeleteSession,
    clearError: mockClearError,
  })),
  useSessionStore: vi.fn(() => ({
    sessions: mockSessions,
    isLoading: false,
    error: null,
  })),
}));

// Mock patient hook
const mockFetchPatients = vi.fn();
const mockFetchPatientById = vi.fn();
const mockSetSelectedPatient = vi.fn();

vi.mock('@/lib/hooks', () => ({
  usePatients: vi.fn(() => ({
    patients: mockPatients,
    selectedPatient: null,
    fetchPatients: mockFetchPatients,
    fetchPatientById: mockFetchPatientById,
    setSelectedPatient: mockSetSelectedPatient,
    isLoading: false,
    error: null,
  })),
  useResponsive: vi.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isMobileOrTablet: false,
  })),
}));

// Mock payments hook
const mockFetchPayments = vi.fn();
const mockIsSessionPaid = vi.fn(() => false);

vi.mock('@/lib/hooks/usePayments', () => ({
  usePayments: vi.fn(() => ({
    payments: [],
    isLoading: false,
    error: null,
    fetchPayments: mockFetchPayments,
    isSessionPaid: mockIsSessionPaid,
  })),
}));

// Mock calendar store
const mockConnectCalendar = vi.fn();
const mockSyncCalendar = vi.fn();
const mockCheckConnection = vi.fn();

vi.mock('@/lib/stores/calendarStore', () => ({
  useCalendarStore: vi.fn(() => ({
    isConnected: false,
    isSyncing: false,
    lastSyncAt: null,
    connectCalendar: mockConnectCalendar,
    syncCalendar: mockSyncCalendar,
    checkConnection: mockCheckConnection,
  })),
}));

// Mock patient service
vi.mock('@/lib/services/patient.service', () => ({
  patientService: {
    getById: vi.fn(),
  },
}));

// Mock whatsapp utils
vi.mock('@/lib/utils/whatsappTemplates', () => ({
  formatTurnoReminderMessage: vi.fn(() => 'Test WhatsApp message'),
  openWhatsApp: vi.fn(),
}));

// Mock child components that are complex
vi.mock('../../../components/agenda/FullCalendarView', () => ({
  FullCalendarView: ({ sessions, onEventClick, onDateSelect }: {
    sessions: SessionUI[];
    onEventClick?: (session: SessionUI) => void;
    onDateSelect?: (start: Date, end: Date) => void;
  }) => (
    <div data-testid="full-calendar-view">
      <span data-testid="calendar-session-count">{sessions.length} sessions</span>
      {sessions.map(s => (
        <button
          key={s.id}
          data-testid={`calendar-event-${s.id}`}
          onClick={() => onEventClick?.(s)}
        >
          {s.patientName}
        </button>
      ))}
      <button
        data-testid="calendar-date-select"
        onClick={() => onDateSelect?.(new Date(), new Date())}
      >
        Select Date
      </button>
    </div>
  ),
}));

vi.mock('../../../components/agenda/TurnoDrawer', () => ({
  TurnoDrawer: ({ isOpen, onClose, session }: {
    isOpen: boolean;
    onClose: () => void;
    session: SessionUI | null;
  }) => isOpen ? (
    <div data-testid="turno-drawer">
      <span>{session ? 'Edit Session' : 'New Session'}</span>
      <button data-testid="close-drawer" onClick={onClose}>Close</button>
    </div>
  ) : null,
}));

vi.mock('../../../components/agenda/SessionDetailsModal', () => ({
  SessionDetailsModal: ({ isOpen, session, onClose, onEdit }: {
    isOpen: boolean;
    session: SessionUI | null;
    onClose: () => void;
    onEdit: () => void;
  }) => isOpen ? (
    <div data-testid="session-details-modal">
      <span>Session Details: {session?.patientName}</span>
      <button data-testid="edit-session" onClick={onEdit}>Edit</button>
      <button data-testid="close-modal" onClick={onClose}>Close</button>
    </div>
  ) : null,
}));

vi.mock('../../../components/agenda/TurnoCard', () => ({
  TurnoCard: ({ session, patient, onEditClick, onDeleteClick, onPatientClick }: {
    session: SessionUI;
    patient?: { id: string; nombre: string };
    onEditClick: () => void;
    onDeleteClick: () => void;
    onPatientClick: (id: string) => void;
  }) => (
    <div data-testid={`turno-card-${session.id}`}>
      <span data-testid="patient-name">{patient?.nombre || session.patientName}</span>
      <span data-testid="session-time">{session.formattedTime}</span>
      <span data-testid="session-status">{session.status}</span>
      <button data-testid={`edit-${session.id}`} onClick={onEditClick}>Edit</button>
      <button data-testid={`delete-${session.id}`} onClick={onDeleteClick}>Delete</button>
      <button 
        data-testid={`patient-click-${session.id}`} 
        onClick={() => patient && onPatientClick(patient.id)}
      >
        View Patient
      </button>
    </div>
  ),
}));

vi.mock('../../../components/shared', () => ({
  SkeletonList: ({ items }: { items: number }) => (
    <div data-testid="skeleton-list">{items} loading items</div>
  ),
  EmptyState: ({ title, description, action }: {
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
  }) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <button onClick={action.onClick}>{action.label}</button>}
    </div>
  ),
  ConfirmDialog: ({ open, title, description, onConfirm, onCancel, confirmLabel, cancelLabel }: {
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel: string;
    cancelLabel: string;
  }) => open ? (
    <div data-testid="confirm-dialog" role="dialog">
      <h2>{title}</h2>
      <p>{description}</p>
      <button data-testid="confirm-delete" onClick={onConfirm}>{confirmLabel}</button>
      <button data-testid="cancel-delete" onClick={onCancel}>{cancelLabel}</button>
    </div>
  ) : null,
}));

vi.mock('../../../components/config/CalendarSyncButton', () => ({
  default: () => <button data-testid="calendar-sync-button">Sync Calendar</button>,
}));

vi.mock('../../../components/onboarding', () => ({
  TipBanner: ({ title, description, action }: {
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
  }) => (
    <div data-testid="tip-banner">
      <h4>{title}</h4>
      <p>{description}</p>
      {action && <button onClick={action.onClick}>{action.label}</button>}
    </div>
  ),
}));

vi.mock('../../../components/dashboard/FichaClinica', () => ({
  FichaClinica: ({ patient, onBack }: { patient: unknown; onBack: () => void }) => (
    <div data-testid="ficha-clinica">
      <span>Patient Details</span>
      <button data-testid="back-from-ficha" onClick={onBack}>Back</button>
    </div>
  ),
}));

// Import mocked hooks for dynamic returns
import { useSessions } from '@/lib/stores/sessionStore';
import { usePatients, useResponsive } from '@/lib/hooks';
import { usePayments } from '@/lib/hooks/usePayments';
import { useCalendarStore } from '@/lib/stores/calendarStore';

const mockedUseSessions = vi.mocked(useSessions);
const mockedUsePatients = vi.mocked(usePatients);
const mockedUseResponsive = vi.mocked(useResponsive);
const mockedUsePayments = vi.mocked(usePayments);
const mockedUseCalendarStore = vi.mocked(useCalendarStore);

// ============================================================================
// HELPER
// ============================================================================

const renderAgenda = () => {
  return render(
    <BrowserRouter>
      <Agenda />
    </BrowserRouter>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('Agenda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset default mocks
    mockedUseSessions.mockReturnValue({
      sessionsUI: mockSessions,
      sessions: mockSessions,
      isLoading: false,
      error: null,
      fetchUpcoming: mockFetchUpcoming,
      fetchMonthly: vi.fn(),
      createSession: mockCreateSession,
      updateSession: mockUpdateSession,
      deleteSession: mockDeleteSession,
      markAsCompleted: vi.fn(),
      clearError: mockClearError,
    });

    mockedUsePatients.mockReturnValue({
      patients: mockPatients,
      activePatients: mockPatients,
      inactivePatients: [],
      selectedPatient: null,
      isLoading: false,
      error: null,
      fetchPatients: mockFetchPatients,
      fetchPatientById: mockFetchPatientById,
      setSelectedPatient: mockSetSelectedPatient,
      createPatient: vi.fn(),
      updatePatient: vi.fn(),
      deletePatient: vi.fn(),
      searchPatients: vi.fn(),
      clearError: vi.fn(),
    });

    mockedUseResponsive.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isMobileOrTablet: false,
    });

    mockedUsePayments.mockReturnValue({
      payments: [],
      paidPayments: [],
      pendingPayments: [],
      isLoading: false,
      error: null,
      totals: { paid: 0, pending: 0, total: 0 },
      pagination: { page: 1, pageSize: 10, total: 0 },
      fetchPayments: mockFetchPayments,
      createPayment: vi.fn(),
      updatePayment: vi.fn(),
      markAsPaid: vi.fn(),
      deletePayment: vi.fn(),
      reset: vi.fn(),
      isSessionPaid: mockIsSessionPaid,
    });

    mockedUseCalendarStore.mockReturnValue({
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
      connectCalendar: mockConnectCalendar,
      syncCalendar: mockSyncCalendar,
      checkConnection: mockCheckConnection,
      disconnectCalendar: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders page title', () => {
      renderAgenda();
      expect(screen.getByRole('heading', { name: 'Agenda' })).toBeInTheDocument();
    });

    it('renders subtitle', () => {
      renderAgenda();
      expect(screen.getByText('Gestiona tus turnos y citas')).toBeInTheDocument();
    });

    it('renders "Add Appointment" button', () => {
      renderAgenda();
      expect(screen.getByRole('button', { name: /nuevo turno/i })).toBeInTheDocument();
    });

    it('renders search input', () => {
      renderAgenda();
      expect(screen.getByPlaceholderText('Buscar por paciente...')).toBeInTheDocument();
    });

    it('renders view mode toggle buttons', () => {
      renderAgenda();
      expect(screen.getByRole('button', { name: /lista/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /calendario/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ambos/i })).toBeInTheDocument();
    });

    it('renders upcoming sessions section', () => {
      renderAgenda();
      expect(screen.getByText('Próximos turnos')).toBeInTheDocument();
    });

    it('renders calendar view in default "both" mode on desktop', () => {
      renderAgenda();
      expect(screen.getByTestId('full-calendar-view')).toBeInTheDocument();
    });

    it('shows loading state while fetching sessions', () => {
      mockedUseSessions.mockReturnValue({
        sessionsUI: [],
        sessions: [],
        isLoading: true,
        error: null,
        fetchUpcoming: mockFetchUpcoming,
        fetchMonthly: vi.fn(),
        createSession: mockCreateSession,
        updateSession: mockUpdateSession,
        deleteSession: mockDeleteSession,
        markAsCompleted: vi.fn(),
        clearError: mockClearError,
      });

      renderAgenda();
      expect(screen.getByTestId('skeleton-list')).toBeInTheDocument();
    });

    it('fetches data on mount', () => {
      renderAgenda();
      
      expect(mockFetchUpcoming).toHaveBeenCalledTimes(1);
      expect(mockFetchPatients).toHaveBeenCalledTimes(1);
      expect(mockFetchPayments).toHaveBeenCalledTimes(1);
      expect(mockCheckConnection).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // APPOINTMENTS DISPLAY
  // ==========================================================================

  describe('Appointments Display', () => {
    it('displays session cards with patient names', () => {
      renderAgenda();
      
      expect(screen.getByTestId('turno-card-session-1')).toBeInTheDocument();
      expect(screen.getByTestId('turno-card-session-2')).toBeInTheDocument();
    });

    it('shows today label for today appointments', () => {
      renderAgenda();
      expect(screen.getByText('Hoy')).toBeInTheDocument();
    });

    it('groups appointments by date', () => {
      renderAgenda();
      
      // Today's appointments
      const todaySection = screen.getByText('Hoy').closest('div');
      expect(todaySection).toBeInTheDocument();
      
      // Tomorrow's appointments
      expect(screen.getByText('Mañana')).toBeInTheDocument();
    });

    it('shows session status on cards', () => {
      renderAgenda();
      
      const session1Card = screen.getByTestId('turno-card-session-1');
      expect(within(session1Card).getByTestId('session-status')).toHaveTextContent('pending');
    });

    it('shows session time on cards', () => {
      renderAgenda();
      
      const session1Card = screen.getByTestId('turno-card-session-1');
      expect(within(session1Card).getByTestId('session-time')).toHaveTextContent('10:00 - 11:00');
    });
  });

  // ==========================================================================
  // CALENDAR VIEWS
  // ==========================================================================

  describe('Calendar Views', () => {
    it('shows list view when list mode is selected', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      await user.click(screen.getByRole('button', { name: /lista/i }));
      
      // List should be visible
      expect(screen.getByText('Próximos turnos')).toBeInTheDocument();
      
      // Calendar should not be visible in list-only mode
      expect(screen.queryByTestId('full-calendar-view')).not.toBeInTheDocument();
    });

    it('shows calendar view when calendar mode is selected', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      await user.click(screen.getByRole('button', { name: /calendario/i }));
      
      // Calendar should be visible
      expect(screen.getByTestId('full-calendar-view')).toBeInTheDocument();
      
      // List section should not be visible
      expect(screen.queryByText('Próximos turnos')).not.toBeInTheDocument();
    });

    it('shows both views when "both" mode is selected', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      await user.click(screen.getByRole('button', { name: /ambos/i }));
      
      expect(screen.getByText('Próximos turnos')).toBeInTheDocument();
      expect(screen.getByTestId('full-calendar-view')).toBeInTheDocument();
    });

    it('passes sessions to calendar component', () => {
      renderAgenda();
      
      expect(screen.getByTestId('calendar-session-count')).toHaveTextContent('3 sessions');
    });

    it('calendar shows appointment events', () => {
      renderAgenda();
      
      expect(screen.getByTestId('calendar-event-session-1')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-event-session-2')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // INTERACTIONS
  // ==========================================================================

  describe('Interactions', () => {
    it('opens new appointment drawer when clicking new session button', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      await user.click(screen.getByRole('button', { name: /nuevo turno/i }));
      
      expect(screen.getByTestId('turno-drawer')).toBeInTheDocument();
      expect(screen.getByText('New Session')).toBeInTheDocument();
    });

    it('opens edit drawer when clicking edit on session card', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      await user.click(screen.getByTestId('edit-session-1'));
      
      expect(screen.getByTestId('turno-drawer')).toBeInTheDocument();
      expect(screen.getByText('Edit Session')).toBeInTheDocument();
    });

    it('opens details modal when clicking calendar event', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      await user.click(screen.getByTestId('calendar-event-session-1'));
      
      expect(screen.getByTestId('session-details-modal')).toBeInTheDocument();
      expect(screen.getByText(/Session Details: Juan Pérez/)).toBeInTheDocument();
    });

    it('opens new appointment drawer when selecting date on calendar', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      await user.click(screen.getByTestId('calendar-date-select'));
      
      expect(screen.getByTestId('turno-drawer')).toBeInTheDocument();
      expect(screen.getByText('New Session')).toBeInTheDocument();
    });

    it('opens delete confirmation when clicking delete on session', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      await user.click(screen.getByTestId('delete-session-1'));
      
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      expect(screen.getByText('Eliminar turno')).toBeInTheDocument();
    });

    it('closes drawer when close button is clicked', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      await user.click(screen.getByRole('button', { name: /nuevo turno/i }));
      expect(screen.getByTestId('turno-drawer')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('close-drawer'));
      expect(screen.queryByTestId('turno-drawer')).not.toBeInTheDocument();
    });

    it('transitions from details modal to edit drawer', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      // Open details modal via calendar event
      await user.click(screen.getByTestId('calendar-event-session-1'));
      expect(screen.getByTestId('session-details-modal')).toBeInTheDocument();
      
      // Click edit
      await user.click(screen.getByTestId('edit-session'));
      
      // Modal should close, drawer should open
      expect(screen.queryByTestId('session-details-modal')).not.toBeInTheDocument();
      expect(screen.getByTestId('turno-drawer')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // FILTERING
  // ==========================================================================

  describe('Filtering', () => {
    it('filters appointments by patient name', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      const searchInput = screen.getByPlaceholderText('Buscar por paciente...');
      await user.type(searchInput, 'Juan');
      
      // Should show search results count
      await waitFor(() => {
        expect(screen.getByText(/resultados/)).toBeInTheDocument();
      });
    });

    it('shows clear search button when search has value', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      const searchInput = screen.getByPlaceholderText('Buscar por paciente...');
      await user.type(searchInput, 'Juan');
      
      // Clear button should appear (the X icon)
      const clearButton = searchInput.parentElement?.querySelector('button');
      expect(clearButton).toBeInTheDocument();
    });

    it('clears search when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      const searchInput = screen.getByPlaceholderText('Buscar por paciente...');
      await user.type(searchInput, 'Juan');
      
      const clearButton = searchInput.parentElement?.querySelector('button');
      expect(clearButton).toBeInTheDocument();
      
      await user.click(clearButton!);
      
      expect(searchInput).toHaveValue('');
    });

    it('shows no results empty state when search has no matches', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      const searchInput = screen.getByPlaceholderText('Buscar por paciente...');
      await user.type(searchInput, 'NonExistentPatient');
      
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        expect(screen.getByText('No se encontraron resultados')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // DELETE CONFIRMATION
  // ==========================================================================

  describe('Delete Confirmation', () => {
    it('shows confirmation dialog with patient name', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      await user.click(screen.getByTestId('delete-session-1'));
      
      const dialog = screen.getByTestId('confirm-dialog');
      expect(within(dialog).getByText(/Juan Pérez/)).toBeInTheDocument();
    });

    it('closes dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      await user.click(screen.getByTestId('delete-session-1'));
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('cancel-delete'));
      
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });

    it('calls deleteSession when confirm is clicked', async () => {
      const user = userEvent.setup();
      mockDeleteSession.mockResolvedValue(undefined);
      renderAgenda();
      
      await user.click(screen.getByTestId('delete-session-1'));
      await user.click(screen.getByTestId('confirm-delete'));
      
      await waitFor(() => {
        expect(mockDeleteSession).toHaveBeenCalledWith('session-1');
      });
    });

    it('shows success toast after successful deletion', async () => {
      const user = userEvent.setup();
      mockDeleteSession.mockResolvedValue(undefined);
      renderAgenda();
      
      await user.click(screen.getByTestId('delete-session-1'));
      await user.click(screen.getByTestId('confirm-delete'));
      
      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Turno eliminado exitosamente');
      });
    });

    it('shows error toast when deletion fails', async () => {
      const user = userEvent.setup();
      mockDeleteSession.mockRejectedValue(new Error('Delete failed'));
      renderAgenda();
      
      await user.click(screen.getByTestId('delete-session-1'));
      await user.click(screen.getByTestId('confirm-delete'));
      
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Error al eliminar el turno');
      });
    });
  });

  // ==========================================================================
  // EMPTY STATES
  // ==========================================================================

  describe('Empty States', () => {
    it('shows empty state when no sessions exist', () => {
      mockedUseSessions.mockReturnValue({
        sessionsUI: [],
        sessions: [],
        isLoading: false,
        error: null,
        fetchUpcoming: mockFetchUpcoming,
        fetchMonthly: vi.fn(),
        createSession: mockCreateSession,
        updateSession: mockUpdateSession,
        deleteSession: mockDeleteSession,
        markAsCompleted: vi.fn(),
        clearError: mockClearError,
      });

      renderAgenda();
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No hay turnos programados')).toBeInTheDocument();
    });

    it('shows add first session action in empty state', () => {
      mockedUseSessions.mockReturnValue({
        sessionsUI: [],
        sessions: [],
        isLoading: false,
        error: null,
        fetchUpcoming: mockFetchUpcoming,
        fetchMonthly: vi.fn(),
        createSession: mockCreateSession,
        updateSession: mockUpdateSession,
        deleteSession: mockDeleteSession,
        markAsCompleted: vi.fn(),
        clearError: mockClearError,
      });

      renderAgenda();
      
      expect(screen.getByRole('button', { name: 'Agregar primer turno' })).toBeInTheDocument();
    });

    it('opens drawer when clicking add first session button', async () => {
      const user = userEvent.setup();
      mockedUseSessions.mockReturnValue({
        sessionsUI: [],
        sessions: [],
        isLoading: false,
        error: null,
        fetchUpcoming: mockFetchUpcoming,
        fetchMonthly: vi.fn(),
        createSession: mockCreateSession,
        updateSession: mockUpdateSession,
        deleteSession: mockDeleteSession,
        markAsCompleted: vi.fn(),
        clearError: mockClearError,
      });

      renderAgenda();
      
      await user.click(screen.getByRole('button', { name: 'Agregar primer turno' }));
      
      expect(screen.getByTestId('turno-drawer')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // ERROR STATES
  // ==========================================================================

  describe('Error States', () => {
    it('shows error toast when error occurs', () => {
      mockedUseSessions.mockReturnValue({
        sessionsUI: [],
        sessions: [],
        isLoading: false,
        error: 'Failed to fetch sessions',
        fetchUpcoming: mockFetchUpcoming,
        fetchMonthly: vi.fn(),
        createSession: mockCreateSession,
        updateSession: mockUpdateSession,
        deleteSession: mockDeleteSession,
        markAsCompleted: vi.fn(),
        clearError: mockClearError,
      });

      renderAgenda();
      
      expect(mockToastError).toHaveBeenCalledWith('Failed to fetch sessions');
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // GOOGLE CALENDAR INTEGRATION
  // ==========================================================================

  describe('Google Calendar Integration', () => {
    it('shows connect calendar banner when not connected', () => {
      renderAgenda();
      
      expect(screen.getByTestId('tip-banner')).toBeInTheDocument();
      expect(screen.getByText('Conecta tu Google Calendar')).toBeInTheDocument();
    });

    it('calls connect calendar when connect button is clicked', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      await user.click(screen.getByRole('button', { name: 'Conectar ahora' }));
      
      expect(mockConnectCalendar).toHaveBeenCalled();
    });

    it('shows connected status when calendar is connected', () => {
      mockedUseCalendarStore.mockReturnValue({
        isConnected: true,
        isSyncing: false,
        isCheckingConnection: false,
        calendars: [],
        syncStatus: {
          hasToken: true,
          hasSessionsCalendar: true,
          sessionsCalendarId: 'sessions-calendar-id',
        },
        lastSyncAt: '2024-01-15T10:00:00.000Z',
        connectCalendar: mockConnectCalendar,
        syncCalendar: mockSyncCalendar,
        checkConnection: mockCheckConnection,
        disconnectCalendar: vi.fn(),
      });

      renderAgenda();
      
      expect(screen.getByText('Google Calendar conectado')).toBeInTheDocument();
    });

    it('shows sync button when calendar is connected', () => {
      mockedUseCalendarStore.mockReturnValue({
        isConnected: true,
        isSyncing: false,
        isCheckingConnection: false,
        calendars: [],
        syncStatus: {
          hasToken: true,
          hasSessionsCalendar: true,
          sessionsCalendarId: 'sessions-calendar-id',
        },
        lastSyncAt: null,
        connectCalendar: mockConnectCalendar,
        syncCalendar: mockSyncCalendar,
        checkConnection: mockCheckConnection,
        disconnectCalendar: vi.fn(),
      });

      renderAgenda();
      
      expect(screen.getByRole('button', { name: /sincronizar/i })).toBeInTheDocument();
    });

    it('shows syncing state when calendar is syncing', () => {
      mockedUseCalendarStore.mockReturnValue({
        isConnected: true,
        isSyncing: true,
        isCheckingConnection: false,
        calendars: [],
        syncStatus: {
          hasToken: true,
          hasSessionsCalendar: true,
          sessionsCalendarId: 'sessions-calendar-id',
        },
        lastSyncAt: null,
        connectCalendar: mockConnectCalendar,
        syncCalendar: mockSyncCalendar,
        checkConnection: mockCheckConnection,
        disconnectCalendar: vi.fn(),
      });

      renderAgenda();
      
      expect(screen.getByRole('button', { name: /sincronizando/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sincronizando/i })).toBeDisabled();
    });
  });

  // ==========================================================================
  // MOBILE RESPONSIVENESS
  // ==========================================================================

  describe('Mobile Responsiveness', () => {
    it('defaults to list view on mobile', () => {
      mockedUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isMobileOrTablet: true,
      });

      renderAgenda();
      
      // On mobile, should show list but not calendar by default
      expect(screen.getByText('Próximos turnos')).toBeInTheDocument();
    });

    it('hides "both" option on mobile view toggle', () => {
      mockedUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isMobileOrTablet: true,
      });

      renderAgenda();
      
      // Both option should not be available on mobile
      expect(screen.queryByRole('button', { name: /ambos/i })).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // PATIENT DETAILS NAVIGATION
  // ==========================================================================

  describe('Patient Details Navigation', () => {
    it('navigates to patient details when patient is clicked', async () => {
      const user = userEvent.setup();
      
      // Setup mock to return selected patient after click
      const mockSetSelectedPatientWithState = vi.fn();
      mockFetchPatientById.mockResolvedValue(mockPatients[0]);
      
      mockedUsePatients.mockReturnValue({
        patients: mockPatients,
        activePatients: mockPatients,
        inactivePatients: [],
        selectedPatient: mockPatients[0],
        isLoading: false,
        error: null,
        fetchPatients: mockFetchPatients,
        fetchPatientById: mockFetchPatientById,
        setSelectedPatient: mockSetSelectedPatientWithState,
        createPatient: vi.fn(),
        updatePatient: vi.fn(),
        deletePatient: vi.fn(),
        searchPatients: vi.fn(),
        clearError: vi.fn(),
      });

      renderAgenda();
      
      await user.click(screen.getByTestId('patient-click-session-1'));
      
      await waitFor(() => {
        expect(mockFetchPatientById).toHaveBeenCalledWith('patient-1');
      });
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe('Accessibility', () => {
    it('has accessible heading structure', () => {
      renderAgenda();
      
      expect(screen.getByRole('heading', { name: 'Agenda', level: 1 })).toBeInTheDocument();
    });

    it('search input has accessible placeholder', () => {
      renderAgenda();
      
      const searchInput = screen.getByPlaceholderText('Buscar por paciente...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('buttons are accessible', () => {
      renderAgenda();
      
      const newSessionButton = screen.getByRole('button', { name: /nuevo turno/i });
      expect(newSessionButton).toBeEnabled();
    });

    it('confirmation dialog is a proper dialog', async () => {
      const user = userEvent.setup();
      renderAgenda();
      
      await user.click(screen.getByTestId('delete-session-1'));
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
