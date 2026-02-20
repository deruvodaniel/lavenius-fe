import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FichaClinica } from '../../../components/dashboard/FichaClinica';
import type { Patient, Note } from '@/lib/types/api.types';
import { PatientStatus } from '@/lib/types/api.types';
import type { SessionUI } from '@/lib/types/session';
import { SessionStatus, SessionType } from '@/lib/types/session';

// ============================================================================
// BROWSER API MOCKS
// ============================================================================

class MockResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  // Mock window.open for WhatsApp
  global.open = vi.fn();
});

// ============================================================================
// MOCK DATA
// ============================================================================

const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const pastDate = new Date(today);
pastDate.setDate(pastDate.getDate() - 7);
const pastDateStr = pastDate.toISOString().split('T')[0];
const futureDate = new Date(today);
futureDate.setDate(futureDate.getDate() + 7);
const futureDateStr = futureDate.toISOString();

const mockPatient: Patient = {
  id: 'patient-1',
  therapistId: 'therapist-1',
  firstName: 'Juan',
  lastName: 'Perez',
  email: 'juan@test.com',
  phone: '+5491123456789',
  birthDate: '1990-05-15',
  age: 34,
  healthInsurance: 'OSDE',
  frequency: 'semanal',
  diagnosis: 'Trastorno de ansiedad generalizada',
  currentTreatment: 'Terapia cognitivo-conductual',
  observations: 'Paciente colaborador, buen progreso',
  riskLevel: 'low',
  status: PatientStatus.ACTIVE,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockHighRiskPatient: Patient = {
  ...mockPatient,
  id: 'patient-2',
  firstName: 'Maria',
  lastName: 'Garcia',
  riskLevel: 'high',
};

const mockPatientNoPhone: Patient = {
  ...mockPatient,
  id: 'patient-3',
  phone: undefined,
};

const mockNotes: Note[] = [
  {
    id: 'note-1',
    text: 'Primera sesion de evaluacion.',
    noteDate: '2024-03-10',
    patientId: 'patient-1',
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
  {
    id: 'note-2',
    text: 'Sesion de seguimiento. Progreso favorable.',
    noteDate: '2024-03-17',
    patientId: 'patient-1',
    createdAt: '2024-03-17T10:00:00Z',
    updatedAt: '2024-03-17T10:00:00Z',
  },
];

const mockSessions: SessionUI[] = [
  {
    id: 'session-1',
    scheduledFrom: futureDateStr,
    scheduledTo: new Date(futureDate.getTime() + 3600000).toISOString(),
    status: SessionStatus.CONFIRMED,
    sessionSummary: 'Sesion de seguimiento',
    sessionType: SessionType.PRESENTIAL,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    patient: {
      id: 'patient-1',
      firstName: 'Juan',
      lastName: 'Perez',
    },
  },
];

const mockPastSessions: SessionUI[] = [
  {
    id: 'session-past',
    scheduledFrom: pastDate.toISOString(),
    scheduledTo: new Date(pastDate.getTime() + 3600000).toISOString(),
    status: SessionStatus.COMPLETED,
    sessionSummary: 'Sesion completada',
    sessionType: SessionType.PRESENTIAL,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    patient: {
      id: 'patient-1',
      firstName: 'Juan',
      lastName: 'Perez',
    },
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
        'clinicalFile.backToPatients': 'Volver a pacientes',
        'clinicalFile.highRisk': 'Alto riesgo',
        'clinicalFile.noHealthInsurance': 'Sin obra social',
        'clinicalFile.frequency.weekly': 'Semanal',
        'clinicalFile.frequency.biweekly': 'Quincenal',
        'clinicalFile.frequency.monthly': 'Mensual',
        'clinicalFile.frequency.notSpecified': 'No especificado',
        'clinicalFile.sections.contactInfo': 'Informacion de contacto',
        'clinicalFile.sections.upcomingAppointments': 'Proximos turnos',
        'clinicalFile.sections.diagnosis': 'Diagnostico',
        'clinicalFile.sections.currentTreatment': 'Tratamiento actual',
        'clinicalFile.sections.observations': 'Observaciones',
        'clinicalFile.sections.sessionNotes': 'Notas de sesion',
        'clinicalFile.fields.phone': 'Telefono',
        'clinicalFile.fields.email': 'Email',
        'clinicalFile.fields.lastAppointment': 'Ultima consulta',
        'clinicalFile.notRegistered': 'No registrado',
        'clinicalFile.noDiagnosis': 'Sin diagnostico registrado',
        'clinicalFile.noTreatment': 'Sin tratamiento registrado',
        'clinicalFile.noObservations': 'Sin observaciones',
        'clinicalFile.noUpcomingAppointments': 'Sin turnos proximos',
        'clinicalFile.scheduleAppointment': 'Agendar turno',
        'clinicalFile.newNote': 'Nueva nota',
        'clinicalFile.defaultSession': 'Sesion',
        'clinicalFile.actions.editPatient': 'Editar paciente',
        'clinicalFile.actions.removeRisk': 'Quitar riesgo',
        'clinicalFile.actions.markHighRisk': 'Marcar alto riesgo',
        'clinicalFile.actions.editInfo': 'Editar informacion',
        'clinicalFile.actions.sendWhatsApp': 'Enviar WhatsApp',
        'clinicalFile.messages.riskMarked': 'Paciente marcado como alto riesgo',
        'clinicalFile.messages.riskRemoved': 'Riesgo removido',
        'clinicalFile.messages.riskUpdateError': 'Error al actualizar riesgo',
        'clinicalFile.messages.infoUpdateSuccess': 'Informacion actualizada',
        'clinicalFile.messages.infoUpdateError': 'Error al actualizar informacion',
        'clinicalFile.messages.appointmentCreateSuccess': 'Turno creado exitosamente',
        'clinicalFile.messages.appointmentCreateError': 'Error al crear turno',
        'clinicalFile.messages.noteUpdateSuccess': 'Nota actualizada exitosamente',
        'clinicalFile.messages.noteCreateSuccess': 'Nota creada exitosamente',
        'clinicalFile.messages.noteSaveError': 'Error al guardar nota',
        'clinicalFile.messages.noteDeleteSuccess': 'Nota eliminada exitosamente',
        'clinicalFile.messages.noteDeleteError': 'Error al eliminar nota',
        'clinicalFile.messages.patientUpdateSuccess': 'Paciente actualizado exitosamente',
        'clinicalFile.messages.patientUpdateError': 'Error al actualizar paciente',
        'clinicalFile.messages.noPhone': 'El paciente no tiene telefono registrado',
        'clinicalFile.whatsapp.defaultMessage': `Hola ${params?.name || ''}, te escribo de mi consultorio.`,
        'clinicalFile.notes.loadError': 'Error al cargar notas',
        'clinicalFile.notes.canCreateNew': 'Puedes crear nuevas notas',
        'clinicalFile.notes.tryAgainLater': 'Intenta de nuevo mas tarde',
        'clinicalFile.notes.retry': 'Reintentar',
        'clinicalFile.notes.noNotes': 'No hay notas registradas',
        'common.save': 'Guardar',
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

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    info: (...args: unknown[]) => mockToastInfo(...args),
  },
}));

// Mock usePatients hook
const mockUpdatePatient = vi.fn(() => Promise.resolve(undefined));
const mockFetchPatients = vi.fn(() => Promise.resolve(undefined));

vi.mock('@/lib/hooks', () => ({
  usePatients: vi.fn(() => ({
    patients: [mockPatient],
    activePatients: [mockPatient],
    inactivePatients: [],
    selectedPatient: null,
    isLoading: false,
    error: null,
    fetchPatients: mockFetchPatients,
    fetchPatientById: vi.fn(() => Promise.resolve(undefined)),
    setSelectedPatient: vi.fn(),
    createPatient: vi.fn(() => Promise.resolve(undefined)),
    updatePatient: mockUpdatePatient,
    deletePatient: vi.fn(() => Promise.resolve(undefined)),
    searchPatients: vi.fn(() => Promise.resolve([])),
    clearError: vi.fn(),
  })),
}));

// Mock useNotes hook
const mockFetchNotesByPatient = vi.fn(() => Promise.resolve(undefined));
const mockCreateNote = vi.fn(() => Promise.resolve(undefined));
const mockUpdateNote = vi.fn(() => Promise.resolve(undefined));
const mockDeleteNote = vi.fn(() => Promise.resolve(undefined));
const mockClearNotes = vi.fn();
const mockClearNotesError = vi.fn();

vi.mock('@/lib/hooks/useNotes', () => ({
  useNotes: vi.fn(() => ({
    notes: mockNotes,
    selectedNote: null,
    isLoading: false,
    error: null,
    fetchNotesByPatient: mockFetchNotesByPatient,
    fetchNotesBySession: vi.fn(),
    createNote: mockCreateNote,
    updateNote: mockUpdateNote,
    deleteNote: mockDeleteNote,
    setSelectedNote: vi.fn(),
    clearError: mockClearNotesError,
    clearNotes: mockClearNotes,
  })),
}));

// Mock useSessions hook
const mockFetchUpcoming = vi.fn(() => Promise.resolve(undefined));
const mockCreateSession = vi.fn(() => Promise.resolve(undefined));

vi.mock('@/lib/stores/sessionStore', () => ({
  useSessions: vi.fn(() => ({
    sessionsUI: mockSessions,
    sessions: mockSessions,
    isLoading: false,
    error: null,
    fetchUpcoming: mockFetchUpcoming,
    fetchMonthly: vi.fn(() => Promise.resolve(undefined)),
    createSession: mockCreateSession,
    updateSession: vi.fn(() => Promise.resolve(undefined)),
    deleteSession: vi.fn(() => Promise.resolve(undefined)),
    markAsCompleted: vi.fn(() => Promise.resolve(undefined)),
    clearError: vi.fn(),
  })),
}));

// Mock child components
vi.mock('../../../components/agenda', () => ({
  TurnoDrawer: ({ isOpen, onClose, onSave, pacienteId }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: unknown) => void;
    pacienteId: string;
    patients: unknown[];
  }) => isOpen ? (
    <div data-testid="turno-drawer" role="dialog" aria-modal="true">
      <span data-testid="drawer-patient-id">{pacienteId}</span>
      <button data-testid="close-turno-drawer" onClick={onClose}>Cerrar</button>
      <button data-testid="save-turno" onClick={() => onSave({ scheduledFrom: '2024-03-20T10:00:00Z' })}>Guardar</button>
    </div>
  ) : null,
}));

vi.mock('../../../components/notes/NoteDrawer', () => ({
  NoteDrawer: ({ isOpen, onClose, onSave, note, patientId }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: unknown, noteId?: string) => void;
    note?: Note | null;
    patientId: string;
  }) => isOpen ? (
    <div data-testid="note-drawer" role="dialog" aria-modal="true">
      <span data-testid="note-drawer-mode">{note ? 'edit' : 'create'}</span>
      <span data-testid="note-drawer-patient-id">{patientId}</span>
      <button data-testid="close-note-drawer" onClick={onClose}>Cerrar</button>
      <button data-testid="save-note" onClick={() => onSave({ text: 'New note' }, note?.id)}>Guardar</button>
    </div>
  ) : null,
}));

vi.mock('../../../components/notes/NoteList', () => ({
  NoteList: ({ notes, onEdit, onDelete, emptyMessage }: {
    notes: Note[];
    onEdit: (note: Note) => void;
    onDelete: (id: string) => void;
    emptyMessage: string;
  }) => (
    <div data-testid="note-list">
      {notes.length === 0 ? (
        <p data-testid="notes-empty">{emptyMessage}</p>
      ) : (
        notes.map((note) => (
          <div key={note.id} data-testid={`note-item-${note.id}`}>
            <span>{note.text}</span>
            <button data-testid={`edit-note-${note.id}`} onClick={() => onEdit(note)}>Editar</button>
            <button data-testid={`delete-note-${note.id}`} onClick={() => onDelete(note.id)}>Eliminar</button>
          </div>
        ))
      )}
    </div>
  ),
}));

vi.mock('../../../components/pacientes/PacienteDrawer', () => ({
  PacienteDrawer: ({ isOpen, onClose, onSave, patient }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: unknown) => void;
    patient?: Patient | null;
  }) => isOpen ? (
    <div data-testid="paciente-drawer" role="dialog" aria-modal="true">
      <span data-testid="paciente-drawer-mode">{patient ? 'edit' : 'create'}</span>
      <button data-testid="close-paciente-drawer" onClick={onClose}>Cerrar</button>
      <button data-testid="save-paciente" onClick={() => onSave({ firstName: 'Updated' })}>Guardar</button>
    </div>
  ) : null,
}));

vi.mock('../../../components/shared/Skeleton', () => ({
  SkeletonNotes: ({ items }: { items: number }) => (
    <div data-testid="skeleton-notes">{items} loading notes</div>
  ),
  SkeletonSessionCard: () => (
    <div data-testid="skeleton-session-card">Loading session...</div>
  ),
}));

// Import mocked hooks for dynamic returns
import { useNotes } from '@/lib/hooks/useNotes';
import { useSessions } from '@/lib/stores/sessionStore';
import { usePatients } from '@/lib/hooks';

const mockedUseNotes = vi.mocked(useNotes);
const mockedUseSessions = vi.mocked(useSessions);
const mockedUsePatients = vi.mocked(usePatients);

// ============================================================================
// HELPER
// ============================================================================

const renderFichaClinica = (patient: Patient | null = mockPatient, onBack = vi.fn()) => {
  return render(
    <FichaClinica patient={patient} onBack={onBack} />
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('FichaClinica', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockUpdatePatient.mockImplementation(() => Promise.resolve(undefined));
    mockFetchPatients.mockImplementation(() => Promise.resolve(undefined));
    mockFetchNotesByPatient.mockImplementation(() => Promise.resolve(undefined));
    mockCreateNote.mockImplementation(() => Promise.resolve(undefined));
    mockUpdateNote.mockImplementation(() => Promise.resolve(undefined));
    mockDeleteNote.mockImplementation(() => Promise.resolve(undefined));
    mockFetchUpcoming.mockImplementation(() => Promise.resolve(undefined));
    mockCreateSession.mockImplementation(() => Promise.resolve(undefined));
    
    // Reset default mocks
    mockedUseNotes.mockReturnValue({
      notes: mockNotes,
      selectedNote: null,
      isLoading: false,
      error: null,
      fetchNotesByPatient: mockFetchNotesByPatient,
      fetchNotesBySession: vi.fn(),
      createNote: mockCreateNote as unknown as ReturnType<typeof mockedUseNotes>['createNote'],
      updateNote: mockUpdateNote as unknown as ReturnType<typeof mockedUseNotes>['updateNote'],
      deleteNote: mockDeleteNote,
      setSelectedNote: vi.fn(),
      clearError: mockClearNotesError,
      clearNotes: mockClearNotes,
    });

    mockedUseSessions.mockReturnValue({
      sessionsUI: mockSessions,
      sessions: mockSessions,
      isLoading: false,
      error: null,
      fetchUpcoming: mockFetchUpcoming,
      fetchMonthly: vi.fn(() => Promise.resolve(undefined)),
      createSession: mockCreateSession as unknown as ReturnType<typeof mockedUseSessions>['createSession'],
      updateSession: vi.fn(() => Promise.resolve(undefined)) as unknown as ReturnType<typeof mockedUseSessions>['updateSession'],
      deleteSession: vi.fn(() => Promise.resolve(undefined)),
      markAsCompleted: vi.fn(() => Promise.resolve(undefined)),
      clearError: vi.fn(),
    });

    mockedUsePatients.mockReturnValue({
      patients: [mockPatient],
      activePatients: [mockPatient],
      inactivePatients: [],
      selectedPatient: null,
      isLoading: false,
      error: null,
      fetchPatients: mockFetchPatients,
      fetchPatientById: vi.fn(() => Promise.resolve(undefined)),
      setSelectedPatient: vi.fn(),
      createPatient: vi.fn(() => Promise.resolve(undefined)) as unknown as ReturnType<typeof mockedUsePatients>['createPatient'],
      updatePatient: mockUpdatePatient as unknown as ReturnType<typeof mockedUsePatients>['updatePatient'],
      deletePatient: vi.fn(() => Promise.resolve(undefined)),
      searchPatients: vi.fn(() => Promise.resolve([])),
      clearError: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // NULL PATIENT TESTS
  // ==========================================================================

  describe('Null Patient', () => {
    it('renders nothing when patient is null', () => {
      const { container } = renderFichaClinica(null);
      expect(container).toBeEmptyDOMElement();
    });
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders back button', () => {
      renderFichaClinica();
      expect(screen.getByText('Volver a pacientes')).toBeInTheDocument();
    });

    it('renders patient name in header', () => {
      renderFichaClinica();
      expect(screen.getByRole('heading', { name: 'Juan Perez' })).toBeInTheDocument();
    });

    it('renders patient initials', () => {
      renderFichaClinica();
      expect(screen.getByText('JP')).toBeInTheDocument();
    });

    it('renders patient age', () => {
      renderFichaClinica();
      expect(screen.getByText('34 años')).toBeInTheDocument();
    });

    it('renders health insurance', () => {
      renderFichaClinica();
      expect(screen.getByText('OSDE')).toBeInTheDocument();
    });

    it('renders frequency label', () => {
      renderFichaClinica();
      expect(screen.getByText('Semanal')).toBeInTheDocument();
    });

    it('renders contact info section', () => {
      renderFichaClinica();
      expect(screen.getByText('Informacion de contacto')).toBeInTheDocument();
    });

    it('renders phone number', () => {
      renderFichaClinica();
      expect(screen.getByText('+5491123456789')).toBeInTheDocument();
    });

    it('renders email', () => {
      renderFichaClinica();
      expect(screen.getByText('juan@test.com')).toBeInTheDocument();
    });

    it('renders upcoming appointments section', () => {
      renderFichaClinica();
      expect(screen.getByText('Proximos turnos')).toBeInTheDocument();
    });

    it('renders schedule appointment button', () => {
      renderFichaClinica();
      expect(screen.getByRole('button', { name: /agendar turno/i })).toBeInTheDocument();
    });

    it('renders diagnosis section', () => {
      renderFichaClinica();
      expect(screen.getByText('Diagnostico')).toBeInTheDocument();
      expect(screen.getByText('Trastorno de ansiedad generalizada')).toBeInTheDocument();
    });

    it('renders current treatment section', () => {
      renderFichaClinica();
      expect(screen.getByText('Tratamiento actual')).toBeInTheDocument();
      expect(screen.getByText('Terapia cognitivo-conductual')).toBeInTheDocument();
    });

    it('renders observations section', () => {
      renderFichaClinica();
      expect(screen.getByText('Observaciones')).toBeInTheDocument();
      expect(screen.getByText('Paciente colaborador, buen progreso')).toBeInTheDocument();
    });

    it('renders session notes section', () => {
      renderFichaClinica();
      expect(screen.getByText('Notas de sesion')).toBeInTheDocument();
    });

    it('renders new note button', () => {
      renderFichaClinica();
      expect(screen.getByRole('button', { name: /nueva nota/i })).toBeInTheDocument();
    });

    it('renders note list with notes', () => {
      renderFichaClinica();
      expect(screen.getByTestId('note-list')).toBeInTheDocument();
      expect(screen.getByTestId('note-item-note-1')).toBeInTheDocument();
      expect(screen.getByTestId('note-item-note-2')).toBeInTheDocument();
    });

    it('fetches notes and sessions on mount', () => {
      renderFichaClinica();
      expect(mockFetchNotesByPatient).toHaveBeenCalledWith('patient-1');
      expect(mockFetchUpcoming).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // HIGH RISK PATIENT TESTS
  // ==========================================================================

  describe('High Risk Patient', () => {
    it('displays high risk badge for high risk patient', () => {
      renderFichaClinica(mockHighRiskPatient);
      expect(screen.getByText('Alto riesgo')).toBeInTheDocument();
    });

    it('renders flag icon in header for high risk', () => {
      renderFichaClinica(mockHighRiskPatient);
      // Flag button should show filled state
      const flagButton = screen.getByTitle('Quitar riesgo');
      expect(flagButton).toBeInTheDocument();
    });

    it('applies red gradient background for high risk patient', () => {
      renderFichaClinica(mockHighRiskPatient);
      const header = screen.getByRole('heading', { name: 'Maria Garcia' }).closest('.bg-gradient-to-r');
      expect(header).toHaveClass('from-red-900');
    });
  });

  // ==========================================================================
  // EMPTY STATES TESTS
  // ==========================================================================

  describe('Empty States', () => {
    it('shows "Sin obra social" when no health insurance', () => {
      const patientNoInsurance = { ...mockPatient, healthInsurance: undefined };
      renderFichaClinica(patientNoInsurance);
      expect(screen.getByText('Sin obra social')).toBeInTheDocument();
    });

    it('shows "No especificado" when no frequency', () => {
      const patientNoFrequency = { ...mockPatient, frequency: undefined };
      renderFichaClinica(patientNoFrequency);
      expect(screen.getByText('No especificado')).toBeInTheDocument();
    });

    it('shows "No registrado" when no phone', () => {
      renderFichaClinica(mockPatientNoPhone);
      expect(screen.getAllByText('No registrado').length).toBeGreaterThanOrEqual(1);
    });

    it('shows "Sin diagnostico registrado" when no diagnosis', () => {
      const patientNoDiagnosis = { ...mockPatient, diagnosis: undefined };
      renderFichaClinica(patientNoDiagnosis);
      expect(screen.getByText('Sin diagnostico registrado')).toBeInTheDocument();
    });

    it('shows "Sin tratamiento registrado" when no treatment', () => {
      const patientNoTreatment = { ...mockPatient, currentTreatment: undefined };
      renderFichaClinica(patientNoTreatment);
      expect(screen.getByText('Sin tratamiento registrado')).toBeInTheDocument();
    });

    it('shows "Sin observaciones" when no observations', () => {
      const patientNoObs = { ...mockPatient, observations: undefined };
      renderFichaClinica(patientNoObs);
      expect(screen.getByText('Sin observaciones')).toBeInTheDocument();
    });

    it('shows "Sin turnos proximos" when no upcoming sessions', () => {
      mockedUseSessions.mockReturnValue({
        sessionsUI: [],
        sessions: [],
        isLoading: false,
        error: null,
        fetchUpcoming: mockFetchUpcoming,
        fetchMonthly: vi.fn(() => Promise.resolve(undefined)),
        createSession: mockCreateSession as unknown as ReturnType<typeof mockedUseSessions>['createSession'],
        updateSession: vi.fn(() => Promise.resolve(undefined)) as unknown as ReturnType<typeof mockedUseSessions>['updateSession'],
        deleteSession: vi.fn(() => Promise.resolve(undefined)),
        markAsCompleted: vi.fn(() => Promise.resolve(undefined)),
        clearError: vi.fn(),
      });

      renderFichaClinica();
      expect(screen.getByText('Sin turnos proximos')).toBeInTheDocument();
    });

    it('shows empty notes message when no notes', () => {
      mockedUseNotes.mockReturnValue({
        notes: [],
        selectedNote: null,
        isLoading: false,
        error: null,
        fetchNotesByPatient: mockFetchNotesByPatient,
        fetchNotesBySession: vi.fn(),
        createNote: mockCreateNote as unknown as ReturnType<typeof mockedUseNotes>['createNote'],
        updateNote: mockUpdateNote as unknown as ReturnType<typeof mockedUseNotes>['updateNote'],
        deleteNote: mockDeleteNote,
        setSelectedNote: vi.fn(),
        clearError: mockClearNotesError,
        clearNotes: mockClearNotes,
      });

      renderFichaClinica();
      expect(screen.getByTestId('notes-empty')).toBeInTheDocument();
      expect(screen.getByText('No hay notas registradas')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // LOADING STATES TESTS
  // ==========================================================================

  describe('Loading States', () => {
    it('shows skeleton for notes when loading', () => {
      mockedUseNotes.mockReturnValue({
        notes: [],
        selectedNote: null,
        isLoading: true,
        error: null,
        fetchNotesByPatient: mockFetchNotesByPatient,
        fetchNotesBySession: vi.fn(),
        createNote: mockCreateNote as unknown as ReturnType<typeof mockedUseNotes>['createNote'],
        updateNote: mockUpdateNote as unknown as ReturnType<typeof mockedUseNotes>['updateNote'],
        deleteNote: mockDeleteNote,
        setSelectedNote: vi.fn(),
        clearError: mockClearNotesError,
        clearNotes: mockClearNotes,
      });

      renderFichaClinica();
      expect(screen.getByTestId('skeleton-notes')).toBeInTheDocument();
    });

    it('shows skeleton for sessions when loading', () => {
      mockedUseSessions.mockReturnValue({
        sessionsUI: [],
        sessions: [],
        isLoading: true,
        error: null,
        fetchUpcoming: mockFetchUpcoming,
        fetchMonthly: vi.fn(() => Promise.resolve(undefined)),
        createSession: mockCreateSession as unknown as ReturnType<typeof mockedUseSessions>['createSession'],
        updateSession: vi.fn(() => Promise.resolve(undefined)) as unknown as ReturnType<typeof mockedUseSessions>['updateSession'],
        deleteSession: vi.fn(() => Promise.resolve(undefined)),
        markAsCompleted: vi.fn(() => Promise.resolve(undefined)),
        clearError: vi.fn(),
      });

      renderFichaClinica();
      expect(screen.getAllByTestId('skeleton-session-card').length).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // ERROR STATES TESTS
  // ==========================================================================

  describe('Error States', () => {
    it('shows error message when notes fail to load', () => {
      mockedUseNotes.mockReturnValue({
        notes: [],
        selectedNote: null,
        isLoading: false,
        error: 'Failed to load notes',
        fetchNotesByPatient: mockFetchNotesByPatient,
        fetchNotesBySession: vi.fn(),
        createNote: mockCreateNote as unknown as ReturnType<typeof mockedUseNotes>['createNote'],
        updateNote: mockUpdateNote as unknown as ReturnType<typeof mockedUseNotes>['updateNote'],
        deleteNote: mockDeleteNote,
        setSelectedNote: vi.fn(),
        clearError: mockClearNotesError,
        clearNotes: mockClearNotes,
      });

      renderFichaClinica();
      expect(screen.getByText('Error al cargar notas')).toBeInTheDocument();
      expect(screen.getByText('Reintentar')).toBeInTheDocument();
    });

    it('shows retry button that calls fetchNotesByPatient again', async () => {
      const user = userEvent.setup();
      
      mockedUseNotes.mockReturnValue({
        notes: [],
        selectedNote: null,
        isLoading: false,
        error: 'Failed to load notes',
        fetchNotesByPatient: mockFetchNotesByPatient,
        fetchNotesBySession: vi.fn(),
        createNote: mockCreateNote as unknown as ReturnType<typeof mockedUseNotes>['createNote'],
        updateNote: mockUpdateNote as unknown as ReturnType<typeof mockedUseNotes>['updateNote'],
        deleteNote: mockDeleteNote,
        setSelectedNote: vi.fn(),
        clearError: mockClearNotesError,
        clearNotes: mockClearNotes,
      });

      renderFichaClinica();
      
      // Clear previous calls from mount
      mockFetchNotesByPatient.mockClear();
      
      await user.click(screen.getByText('Reintentar'));
      
      expect(mockFetchNotesByPatient).toHaveBeenCalledWith('patient-1');
    });
  });

  // ==========================================================================
  // BACK BUTTON TESTS
  // ==========================================================================

  describe('Back Button', () => {
    it('calls onBack when back button is clicked', async () => {
      const onBack = vi.fn();
      const user = userEvent.setup();
      
      renderFichaClinica(mockPatient, onBack);
      
      await user.click(screen.getByText('Volver a pacientes'));
      
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // FLAG TOGGLE TESTS
  // ==========================================================================

  describe('Flag Toggle', () => {
    it('toggles flag when flag button is clicked', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByTitle('Marcar alto riesgo'));
      
      expect(mockUpdatePatient).toHaveBeenCalledWith('patient-1', {
        riskLevel: 'high',
      });
    });

    it('shows success toast after flagging', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByTitle('Marcar alto riesgo'));
      
      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Paciente marcado como alto riesgo');
      });
    });

    it('removes flag when clicking on flagged patient', async () => {
      const user = userEvent.setup();
      renderFichaClinica(mockHighRiskPatient);
      
      await user.click(screen.getByTitle('Quitar riesgo'));
      
      expect(mockUpdatePatient).toHaveBeenCalledWith('patient-2', {
        riskLevel: 'low',
      });
    });

    it('shows error toast when flag update fails', async () => {
      const user = userEvent.setup();
      mockUpdatePatient.mockRejectedValue(new Error('Update failed'));
      
      renderFichaClinica();
      
      await user.click(screen.getByTitle('Marcar alto riesgo'));
      
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Error al actualizar riesgo');
      });
    });
  });

  // ==========================================================================
  // EDIT MODE TESTS
  // ==========================================================================

  describe('Edit Mode', () => {
    it('enters edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByTitle('Editar informacion'));
      
      // Should show input fields
      expect(screen.getByDisplayValue('+5491123456789')).toBeInTheDocument();
      expect(screen.getByDisplayValue('juan@test.com')).toBeInTheDocument();
    });

    it('shows save and cancel buttons in edit mode', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByTitle('Editar informacion'));
      
      expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('saves changes when save button is clicked', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByTitle('Editar informacion'));
      
      // Clear and type new value
      const phoneInput = screen.getByDisplayValue('+5491123456789');
      await user.clear(phoneInput);
      await user.type(phoneInput, '+5491199999999');
      
      await user.click(screen.getByRole('button', { name: /guardar/i }));
      
      await waitFor(() => {
        expect(mockUpdatePatient).toHaveBeenCalledWith('patient-1', expect.objectContaining({
          phone: '+5491199999999',
        }));
      });
    });

    it('shows success toast after saving', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByTitle('Editar informacion'));
      await user.click(screen.getByRole('button', { name: /guardar/i }));
      
      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('Informacion actualizada');
      });
    });

    it('cancels edit and restores original values', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByTitle('Editar informacion'));
      
      const phoneInput = screen.getByDisplayValue('+5491123456789');
      await user.clear(phoneInput);
      await user.type(phoneInput, '+5491199999999');
      
      await user.click(screen.getByRole('button', { name: /cancelar/i }));
      
      // Should show original value again
      expect(screen.getByText('+5491123456789')).toBeInTheDocument();
    });

    it('shows error toast when save fails', async () => {
      const user = userEvent.setup();
      mockUpdatePatient.mockRejectedValue(new Error('Update failed'));
      
      renderFichaClinica();
      
      await user.click(screen.getByTitle('Editar informacion'));
      await user.click(screen.getByRole('button', { name: /guardar/i }));
      
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Error al actualizar informacion');
      });
    });
  });

  // ==========================================================================
  // PATIENT DRAWER TESTS
  // ==========================================================================

  describe('Patient Drawer', () => {
    it('opens patient drawer when edit patient button is clicked', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByTitle('Editar paciente'));
      
      expect(screen.getByTestId('paciente-drawer')).toBeInTheDocument();
      expect(screen.getByTestId('paciente-drawer-mode')).toHaveTextContent('edit');
    });

    it('closes patient drawer when close button is clicked', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByTitle('Editar paciente'));
      expect(screen.getByTestId('paciente-drawer')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('close-paciente-drawer'));
      expect(screen.queryByTestId('paciente-drawer')).not.toBeInTheDocument();
    });

    it('saves patient and shows success toast', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByTitle('Editar paciente'));
      await user.click(screen.getByTestId('save-paciente'));
      
      await waitFor(() => {
        expect(mockUpdatePatient).toHaveBeenCalled();
        expect(mockToastSuccess).toHaveBeenCalledWith('Paciente actualizado exitosamente');
      });
    });
  });

  // ==========================================================================
  // TURNO DRAWER TESTS
  // ==========================================================================

  describe('Turno Drawer', () => {
    it('opens turno drawer when schedule button is clicked', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByRole('button', { name: /agendar turno/i }));
      
      expect(screen.getByTestId('turno-drawer')).toBeInTheDocument();
      expect(screen.getByTestId('drawer-patient-id')).toHaveTextContent('patient-1');
    });

    it('closes turno drawer when close button is clicked', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByRole('button', { name: /agendar turno/i }));
      expect(screen.getByTestId('turno-drawer')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('close-turno-drawer'));
      expect(screen.queryByTestId('turno-drawer')).not.toBeInTheDocument();
    });

    it('saves session and shows success toast', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByRole('button', { name: /agendar turno/i }));
      await user.click(screen.getByTestId('save-turno'));
      
      await waitFor(() => {
        expect(mockCreateSession).toHaveBeenCalled();
        expect(mockToastSuccess).toHaveBeenCalledWith('Turno creado exitosamente');
      });
    });

    it('shows error toast when session creation fails', async () => {
      const user = userEvent.setup();
      mockCreateSession.mockRejectedValue(new Error('Creation failed'));
      
      renderFichaClinica();
      
      await user.click(screen.getByRole('button', { name: /agendar turno/i }));
      await user.click(screen.getByTestId('save-turno'));
      
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Creation failed');
      });
    });
  });

  // ==========================================================================
  // NOTE DRAWER TESTS
  // ==========================================================================

  describe('Note Drawer', () => {
    it('opens note drawer in create mode when new note button is clicked', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByRole('button', { name: /nueva nota/i }));
      
      expect(screen.getByTestId('note-drawer')).toBeInTheDocument();
      expect(screen.getByTestId('note-drawer-mode')).toHaveTextContent('create');
      expect(screen.getByTestId('note-drawer-patient-id')).toHaveTextContent('patient-1');
    });

    it('opens note drawer in edit mode when edit note button is clicked', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByTestId('edit-note-note-1'));
      
      expect(screen.getByTestId('note-drawer')).toBeInTheDocument();
      expect(screen.getByTestId('note-drawer-mode')).toHaveTextContent('edit');
    });

    it('closes note drawer when close button is clicked', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByRole('button', { name: /nueva nota/i }));
      expect(screen.getByTestId('note-drawer')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('close-note-drawer'));
      expect(screen.queryByTestId('note-drawer')).not.toBeInTheDocument();
    });

    it('creates note and shows success toast', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByRole('button', { name: /nueva nota/i }));
      await user.click(screen.getByTestId('save-note'));
      
      await waitFor(() => {
        expect(mockCreateNote).toHaveBeenCalled();
        expect(mockToastSuccess).toHaveBeenCalledWith('Nota creada exitosamente');
      });
    });

    it('updates note and shows success toast when editing', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByTestId('edit-note-note-1'));
      await user.click(screen.getByTestId('save-note'));
      
      await waitFor(() => {
        expect(mockUpdateNote).toHaveBeenCalled();
        expect(mockToastSuccess).toHaveBeenCalledWith('Nota actualizada exitosamente');
      });
    });

    it('shows error toast when note save fails', async () => {
      const user = userEvent.setup();
      mockCreateNote.mockRejectedValue(new Error('Save failed'));
      
      renderFichaClinica();
      
      await user.click(screen.getByRole('button', { name: /nueva nota/i }));
      await user.click(screen.getByTestId('save-note'));
      
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Error al guardar nota');
      });
    });
  });

  // ==========================================================================
  // DELETE NOTE TESTS
  // ==========================================================================

  describe('Delete Note', () => {
    it('deletes note and shows success toast', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByTestId('delete-note-note-1'));
      
      await waitFor(() => {
        expect(mockDeleteNote).toHaveBeenCalledWith('note-1');
        expect(mockToastSuccess).toHaveBeenCalledWith('Nota eliminada exitosamente');
      });
    });

    it('shows error toast when delete fails', async () => {
      const user = userEvent.setup();
      mockDeleteNote.mockRejectedValue(new Error('Delete failed'));
      
      renderFichaClinica();
      
      await user.click(screen.getByTestId('delete-note-note-1'));
      
      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Error al eliminar nota');
      });
    });
  });

  // ==========================================================================
  // WHATSAPP TESTS
  // ==========================================================================

  describe('WhatsApp', () => {
    it('opens WhatsApp with patient phone when message button is clicked', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      const whatsappButton = screen.getByTitle('Enviar WhatsApp');
      await user.click(whatsappButton);
      
      expect(global.open).toHaveBeenCalledWith(
        expect.stringContaining('wa.me/5491123456789'),
        '_blank'
      );
    });

    it('shows info toast when patient has no phone', async () => {
      const user = userEvent.setup();
      renderFichaClinica(mockPatientNoPhone);
      
      // WhatsApp button should not be visible when no phone
      expect(screen.queryByTitle('Enviar WhatsApp')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // UPCOMING SESSIONS TESTS
  // ==========================================================================

  describe('Upcoming Sessions', () => {
    it('displays upcoming sessions for patient when they exist', () => {
      // Create a session clearly in the future
      const futureSessionDate = new Date();
      futureSessionDate.setDate(futureSessionDate.getDate() + 14); // 2 weeks ahead
      
      const futureSession: SessionUI = {
        id: 'session-future',
        scheduledFrom: futureSessionDate.toISOString(),
        scheduledTo: new Date(futureSessionDate.getTime() + 3600000).toISOString(),
        status: SessionStatus.CONFIRMED,
        sessionSummary: 'Proxima sesion programada',
        sessionType: SessionType.PRESENTIAL,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        patient: {
          id: 'patient-1',
          firstName: 'Juan',
          lastName: 'Perez',
        },
      };
      
      mockedUseSessions.mockReturnValue({
        sessionsUI: [futureSession],
        sessions: [futureSession],
        isLoading: false,
        error: null,
        fetchUpcoming: mockFetchUpcoming,
        fetchMonthly: vi.fn(() => Promise.resolve(undefined)),
        createSession: mockCreateSession as unknown as ReturnType<typeof mockedUseSessions>['createSession'],
        updateSession: vi.fn(() => Promise.resolve(undefined)) as unknown as ReturnType<typeof mockedUseSessions>['updateSession'],
        deleteSession: vi.fn(() => Promise.resolve(undefined)),
        markAsCompleted: vi.fn(() => Promise.resolve(undefined)),
        clearError: vi.fn(),
      });
      
      renderFichaClinica();
      expect(screen.getByText(/Proxima sesion programada/i)).toBeInTheDocument();
    });

    it('filters sessions to show only current patient sessions', () => {
      const futureSessionDate = new Date();
      futureSessionDate.setDate(futureSessionDate.getDate() + 14);
      
      const patientSession: SessionUI = {
        id: 'session-patient-1',
        scheduledFrom: futureSessionDate.toISOString(),
        scheduledTo: new Date(futureSessionDate.getTime() + 3600000).toISOString(),
        status: SessionStatus.CONFIRMED,
        sessionSummary: 'Sesion paciente actual',
        sessionType: SessionType.PRESENTIAL,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        patient: {
          id: 'patient-1',
          firstName: 'Juan',
          lastName: 'Perez',
        },
      };
      
      const otherPatientSession: SessionUI = {
        id: 'session-other',
        scheduledFrom: futureSessionDate.toISOString(),
        scheduledTo: new Date(futureSessionDate.getTime() + 3600000).toISOString(),
        status: SessionStatus.CONFIRMED,
        sessionSummary: 'Sesion otro paciente',
        sessionType: SessionType.PRESENTIAL,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        patient: {
          id: 'patient-other',
          firstName: 'Other',
          lastName: 'Patient',
        },
      };
      
      mockedUseSessions.mockReturnValue({
        sessionsUI: [patientSession, otherPatientSession],
        sessions: [patientSession, otherPatientSession],
        isLoading: false,
        error: null,
        fetchUpcoming: mockFetchUpcoming,
        fetchMonthly: vi.fn(() => Promise.resolve(undefined)),
        createSession: mockCreateSession as unknown as ReturnType<typeof mockedUseSessions>['createSession'],
        updateSession: vi.fn(() => Promise.resolve(undefined)) as unknown as ReturnType<typeof mockedUseSessions>['updateSession'],
        deleteSession: vi.fn(() => Promise.resolve(undefined)),
        markAsCompleted: vi.fn(() => Promise.resolve(undefined)),
        clearError: vi.fn(),
      });
      
      renderFichaClinica();
      
      // Should only show patient-1's session
      expect(screen.getByText(/Sesion paciente actual/i)).toBeInTheDocument();
      // Should not show other patient's session
      expect(screen.queryByText(/Sesion otro paciente/i)).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // LAST APPOINTMENT TESTS
  // ==========================================================================

  describe('Last Appointment', () => {
    it('displays last completed appointment date', () => {
      mockedUseSessions.mockReturnValue({
        sessionsUI: [...mockSessions, ...mockPastSessions],
        sessions: [...mockSessions, ...mockPastSessions],
        isLoading: false,
        error: null,
        fetchUpcoming: mockFetchUpcoming,
        fetchMonthly: vi.fn(() => Promise.resolve(undefined)),
        createSession: mockCreateSession as unknown as ReturnType<typeof mockedUseSessions>['createSession'],
        updateSession: vi.fn(() => Promise.resolve(undefined)) as unknown as ReturnType<typeof mockedUseSessions>['updateSession'],
        deleteSession: vi.fn(() => Promise.resolve(undefined)),
        markAsCompleted: vi.fn(() => Promise.resolve(undefined)),
        clearError: vi.fn(),
      });
      
      renderFichaClinica();
      
      expect(screen.getByText('Ultima consulta')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // AGE CALCULATION TESTS
  // ==========================================================================

  describe('Age Calculation', () => {
    it('uses age property when available', () => {
      renderFichaClinica(mockPatient);
      expect(screen.getByText('34 años')).toBeInTheDocument();
    });

    it('calculates age from birthDate when age not provided', () => {
      const birthYear = today.getFullYear() - 25;
      const patientWithBirthDate: Patient = {
        ...mockPatient,
        age: undefined,
        birthDate: `${birthYear}-01-01`,
      };
      
      renderFichaClinica(patientWithBirthDate);
      expect(screen.getByText(/25 años|24 años/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // FREQUENCY LABEL TESTS
  // ==========================================================================

  describe('Frequency Labels', () => {
    it('shows "Semanal" for weekly frequency', () => {
      renderFichaClinica({ ...mockPatient, frequency: 'semanal' });
      expect(screen.getByText('Semanal')).toBeInTheDocument();
    });

    it('shows "Quincenal" for biweekly frequency', () => {
      renderFichaClinica({ ...mockPatient, frequency: 'quincenal' });
      expect(screen.getByText('Quincenal')).toBeInTheDocument();
    });

    it('shows "Mensual" for monthly frequency', () => {
      renderFichaClinica({ ...mockPatient, frequency: 'mensual' });
      expect(screen.getByText('Mensual')).toBeInTheDocument();
    });

    it('shows raw frequency value for unknown frequencies', () => {
      renderFichaClinica({ ...mockPatient, frequency: 'trimestral' });
      expect(screen.getByText('trimestral')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // CLEANUP TESTS
  // ==========================================================================

  describe('Cleanup', () => {
    it('clears notes on unmount', () => {
      const { unmount } = renderFichaClinica();
      
      unmount();
      
      expect(mockClearNotes).toHaveBeenCalled();
      expect(mockClearNotesError).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('has accessible heading structure', () => {
      renderFichaClinica();
      expect(screen.getByRole('heading', { name: 'Juan Perez' })).toBeInTheDocument();
    });

    it('back button is keyboard accessible', async () => {
      const onBack = vi.fn();
      const user = userEvent.setup();
      
      renderFichaClinica(mockPatient, onBack);
      
      const backButton = screen.getByText('Volver a pacientes').closest('button');
      backButton?.focus();
      
      await user.keyboard('{Enter}');
      
      expect(onBack).toHaveBeenCalled();
    });

    it('edit patient button has accessible title', () => {
      renderFichaClinica();
      expect(screen.getByTitle('Editar paciente')).toBeInTheDocument();
    });

    it('flag button has accessible title', () => {
      renderFichaClinica();
      expect(screen.getByTitle('Marcar alto riesgo')).toBeInTheDocument();
    });

    it('edit contact info button has accessible title', () => {
      renderFichaClinica();
      expect(screen.getByTitle('Editar informacion')).toBeInTheDocument();
    });

    it('dialogs have proper role', async () => {
      const user = userEvent.setup();
      renderFichaClinica();
      
      await user.click(screen.getByRole('button', { name: /agendar turno/i }));
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
