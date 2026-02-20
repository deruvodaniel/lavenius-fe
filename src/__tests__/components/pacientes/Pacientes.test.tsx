import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pacientes } from '../../../components/pacientes/Pacientes';
import { PatientStatus, SessionType } from '@/lib/types/api.types';
import type { Patient } from '@/lib/types/api.types';

// ============================================================================
// BROWSER API MOCKS
// ============================================================================

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

const mockPatients: Patient[] = [
  {
    id: 'patient-1',
    therapistId: 'therapist-1',
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan@test.com',
    phone: '+5491123456789',
    status: PatientStatus.ACTIVE,
    notes: '',
    healthInsurance: 'OSDE',
    birthDate: '1990-05-15',
    sessionType: SessionType.PRESENTIAL,
    frequency: 'semanal',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'patient-2',
    therapistId: 'therapist-1',
    firstName: 'Maria',
    lastName: 'Garcia',
    email: 'maria@test.com',
    phone: '+5491198765432',
    status: PatientStatus.ACTIVE,
    notes: '',
    healthInsurance: 'Swiss Medical',
    birthDate: '1985-08-20',
    sessionType: SessionType.REMOTE,
    frequency: 'quincenal',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'patient-3',
    therapistId: 'therapist-1',
    firstName: 'Carlos',
    lastName: 'Lopez',
    email: 'carlos@test.com',
    phone: '+5491155555555',
    status: PatientStatus.ACTIVE,
    notes: '',
    healthInsurance: 'Galeno',
    birthDate: '1978-12-01',
    sessionType: SessionType.PRESENTIAL,
    frequency: 'mensual',
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

const mockSessions: unknown[] = [];

// ============================================================================
// MOCKS
// ============================================================================

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'patients.title': 'Pacientes',
        'patients.patientCount': `${params?.count || 0} pacientes`,
        'patients.found': 'encontrados',
        'patients.found_plural': 'encontrados',
        'patients.registered': 'registrado',
        'patients.registered_plural': 'registrados',
        'patients.newPatient': 'Nuevo Paciente',
        'patients.searchPlaceholder': 'Buscar paciente...',
        'patients.noPatients': 'No hay pacientes registrados',
        'patients.noPatientsDescription': 'Comienza agregando tu primer paciente',
        'patients.noPatientsFilterDescription': 'No se encontraron pacientes con los filtros aplicados',
        'patients.addFirstPatient': 'Agregar primer paciente',
        'patients.loadingPatientFile': 'Cargando ficha del paciente...',
        'patients.modality.label': 'Modalidad',
        'patients.modality.all': 'Todas',
        'patients.modality.presential': 'Presencial',
        'patients.modality.remote': 'Remoto',
        'patients.modality.mixed': 'Mixto',
        'patients.frequency.label': 'Frecuencia',
        'patients.frequency.all': 'Todas',
        'patients.frequency.weekly': 'Semanal',
        'patients.frequency.biweekly': 'Quincenal',
        'patients.frequency.monthly': 'Mensual',
        'patients.filters.onlyWithSessionsThisWeek': 'Solo con turnos esta semana',
        'patients.filters.clearFilters': 'Limpiar filtros',
        'patients.sort.nameAsc': 'Nombre A-Z',
        'patients.sort.nameDesc': 'Nombre Z-A',
        'patients.sort.ageAsc': 'Menor edad',
        'patients.sort.ageDesc': 'Mayor edad',
        'patients.sort.recent': 'Mas recientes',
        'patients.view.cards': 'Tarjetas',
        'patients.view.table': 'Tabla',
        'patients.fields.ageYears': `${params?.age || 0} anos`,
        'patients.nextAppointment.today': 'Hoy',
        'patients.nextAppointment.inOneDay': 'Manana',
        'patients.nextAppointment.inDays': `En ${params?.days || 0} dias`,
        'patients.nextAppointment.noAppointments': 'Sin turnos',
        'patients.nextAppointment.nextIn': 'Proximo turno',
        'patients.nextAppointment.todayLower': 'hoy',
        'patients.nextAppointment.oneDayLower': 'manana',
        'patients.nextAppointment.daysLower': `${params?.days || 0} dias`,
        'patients.nextAppointment.noUpcomingAppointments': 'Sin turnos proximos',
        'patients.table.patient': 'Paciente',
        'patients.table.age': 'Edad',
        'patients.table.healthInsurance': 'Cobertura',
        'patients.table.modality': 'Modalidad',
        'patients.table.nextAppointment': 'Proximo turno',
        'patients.table.actions': 'Acciones',
        'patients.actions.editPatient': 'Editar paciente',
        'patients.actions.deletePatient': 'Eliminar paciente',
        'patients.messages.loadError': 'Error al cargar paciente',
        'patients.messages.createSuccess': 'Paciente creado exitosamente',
        'patients.messages.updateSuccess': 'Paciente actualizado exitosamente',
        'patients.messages.deleteSuccess': 'Paciente eliminado exitosamente',
        'patients.messages.saveError': 'Error al guardar paciente',
        'patients.messages.deleteError': 'Error al eliminar paciente',
        'patients.messages.deleteConfirmTitle': 'Eliminar paciente',
        'patients.messages.deleteConfirmDescription': `Estas seguro de eliminar a ${params?.name || ''}?`,
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
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    info: vi.fn(),
  },
}));

// Mock functions
const mockFetchPatients = vi.fn(() => Promise.resolve(undefined));
const mockFetchPatientById = vi.fn(() => Promise.resolve(undefined));
const mockCreatePatient = vi.fn(() => Promise.resolve(undefined));
const mockUpdatePatient = vi.fn(() => Promise.resolve(undefined));
const mockDeletePatient = vi.fn(() => Promise.resolve(undefined));
const mockFetchUpcoming = vi.fn(() => Promise.resolve(undefined));
const mockSetSelectedPatient = vi.fn();
const mockClearError = vi.fn();

// Mock usePatients hook
vi.mock('@/lib/hooks', () => ({
  usePatients: vi.fn(() => ({
    patients: mockPatients,
    activePatients: mockPatients,
    inactivePatients: [],
    selectedPatient: null,
    isLoading: false,
    error: null,
    fetchPatients: mockFetchPatients,
    fetchPatientById: mockFetchPatientById,
    setSelectedPatient: mockSetSelectedPatient,
    createPatient: mockCreatePatient,
    updatePatient: mockUpdatePatient,
    deletePatient: mockDeletePatient,
    searchPatients: vi.fn(() => Promise.resolve([])),
    clearError: mockClearError,
  })),
  useErrorToast: vi.fn(),
  useResponsive: vi.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isMobileOrTablet: false,
  })),
}));

// Mock sessionStore
vi.mock('@/lib/stores/sessionStore', () => ({
  useSessionStore: vi.fn(() => ({
    sessions: mockSessions,
    fetchUpcoming: mockFetchUpcoming,
  })),
}));

// Mock child components
vi.mock('../../../components/pacientes/PacienteDrawer', () => ({
  PacienteDrawer: ({ isOpen, onClose, onSave, patient }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: unknown) => void;
    patient?: unknown | null;
  }) => isOpen ? (
    <div data-testid="paciente-drawer">
      <span>{patient ? 'Editar Paciente' : 'Nuevo Paciente'}</span>
      <button data-testid="close-drawer" onClick={onClose}>Cerrar</button>
      <button data-testid="save-patient" onClick={() => onSave({ firstName: 'Test', lastName: 'User' })}>Guardar</button>
    </div>
  ) : null,
}));

vi.mock('../../../components/dashboard', () => ({
  FichaClinica: ({ patient, onBack }: { patient: unknown; onBack: () => void }) => (
    <div data-testid="ficha-clinica">
      <span>Ficha Clinica</span>
      <button data-testid="back-button" onClick={onBack}>Volver</button>
    </div>
  ),
}));

vi.mock('../../../components/shared', () => ({
  AnimatedList: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="animated-list" className={className}>{children}</div>
  ),
  SkeletonCard: () => <div data-testid="skeleton-card">Loading...</div>,
  EmptyState: ({ icon: Icon, title, description, action }: {
    icon: React.ElementType;
    title: string;
    description: string;
    action?: { label: string; onClick: () => void };
  }) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {action && <button data-testid="empty-action" onClick={action.onClick}>{action.label}</button>}
    </div>
  ),
  ConfirmDialog: ({ open, title, description, onConfirm, confirmLabel, cancelLabel, onOpenChange }: {
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmLabel: string;
    cancelLabel: string;
    variant?: string;
    isLoading?: boolean;
    onOpenChange: (open: boolean) => void;
    onCancel?: () => void;
  }) => open ? (
    <div data-testid="confirm-dialog" role="dialog">
      <h2>{title}</h2>
      <p>{description}</p>
      <button data-testid="confirm-action" onClick={onConfirm}>{confirmLabel}</button>
      <button data-testid="cancel-action" onClick={() => onOpenChange(false)}>{cancelLabel}</button>
    </div>
  ) : null,
  SimplePagination: ({ currentPage, totalPages, onPageChange }: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
  }) => (
    <div data-testid="pagination">
      <span data-testid="current-page">Pagina {currentPage} de {totalPages}</span>
      <button data-testid="prev-page" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>Anterior</button>
      <button data-testid="next-page" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Siguiente</button>
    </div>
  ),
  InfiniteScrollLoader: ({ isLoading, hasMore }: {
    isLoading: boolean;
    hasMore: boolean;
    loadMoreRef: React.RefObject<HTMLDivElement>;
  }) => (
    <div data-testid="infinite-scroll">
      {isLoading && <span>Cargando mas...</span>}
      {!hasMore && <span>No hay mas elementos</span>}
    </div>
  ),
}));

// Import mocked hooks for dynamic returns
import { usePatients, useResponsive } from '@/lib/hooks';
import { useSessionStore } from '@/lib/stores/sessionStore';

const mockedUsePatients = vi.mocked(usePatients);
const mockedUseResponsive = vi.mocked(useResponsive);
const mockedUseSessionStore = vi.mocked(useSessionStore);

// ============================================================================
// HELPER
// ============================================================================

const renderPacientes = async () => {
  const result = render(<Pacientes />);
  // Wait for component to settle
  await waitFor(() => {
    expect(screen.queryByTestId('skeleton-card')).not.toBeInTheDocument();
  }, { timeout: 1000 }).catch(() => {});
  return result;
};

// ============================================================================
// TESTS
// ============================================================================

describe('Pacientes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockFetchPatients.mockImplementation(() => Promise.resolve(undefined));
    mockFetchPatientById.mockImplementation(() => Promise.resolve(undefined));
    mockCreatePatient.mockImplementation(() => Promise.resolve(undefined));
    mockUpdatePatient.mockImplementation(() => Promise.resolve(undefined));
    mockDeletePatient.mockImplementation(() => Promise.resolve(undefined));
    mockFetchUpcoming.mockImplementation(() => Promise.resolve(undefined));
    
    // Reset default mocks
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
      createPatient: mockCreatePatient as unknown as ReturnType<typeof mockedUsePatients>['createPatient'],
      updatePatient: mockUpdatePatient as unknown as ReturnType<typeof mockedUsePatients>['updatePatient'],
      deletePatient: mockDeletePatient,
      searchPatients: vi.fn(() => Promise.resolve([])),
      clearError: mockClearError,
    });

    mockedUseSessionStore.mockReturnValue({
      sessions: [],
      fetchUpcoming: mockFetchUpcoming,
    } as ReturnType<typeof useSessionStore>);

    mockedUseResponsive.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isMobileOrTablet: false,
    });
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders page title', async () => {
      await renderPacientes();
      expect(screen.getByRole('heading', { name: 'Pacientes' })).toBeInTheDocument();
    });

    it('renders patient count subtitle', async () => {
      await renderPacientes();
      expect(screen.getByText(/3 pacientes/)).toBeInTheDocument();
    });

    it('renders "Nuevo Paciente" button', async () => {
      await renderPacientes();
      expect(screen.getByRole('button', { name: /nuevo paciente/i })).toBeInTheDocument();
    });

    it('renders search input', async () => {
      await renderPacientes();
      expect(screen.getByPlaceholderText('Buscar paciente...')).toBeInTheDocument();
    });

    it('renders modality filter dropdown', async () => {
      await renderPacientes();
      expect(screen.getByLabelText('Modalidad')).toBeInTheDocument();
    });

    it('renders frequency filter dropdown', async () => {
      await renderPacientes();
      expect(screen.getByLabelText('Frecuencia')).toBeInTheDocument();
    });

    it('renders "this week sessions" checkbox', async () => {
      await renderPacientes();
      expect(screen.getByText('Solo con turnos esta semana')).toBeInTheDocument();
    });

    it('renders sort dropdown', async () => {
      await renderPacientes();
      expect(screen.getByRole('combobox', { name: '' })).toBeInTheDocument();
    });

    it('renders view mode toggle on desktop', async () => {
      await renderPacientes();
      expect(screen.getByRole('button', { name: /tarjetas/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /tabla/i })).toBeInTheDocument();
    });

    it('fetches patients and sessions on mount', async () => {
      await renderPacientes();
      expect(mockFetchPatients).toHaveBeenCalled();
      expect(mockFetchUpcoming).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // PATIENT LIST TESTS
  // ==========================================================================

  describe('Patient List', () => {
    it('displays patient cards in cards view', async () => {
      await renderPacientes();
      
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
      expect(screen.getByText('Maria Garcia')).toBeInTheDocument();
      expect(screen.getByText('Carlos Lopez')).toBeInTheDocument();
    });

    it('displays patient health insurance', async () => {
      await renderPacientes();
      
      expect(screen.getByText('OSDE')).toBeInTheDocument();
      expect(screen.getByText('Swiss Medical')).toBeInTheDocument();
    });

    it('displays modality badges', async () => {
      await renderPacientes();
      
      expect(screen.getAllByText('Presencial').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Remoto').length).toBeGreaterThan(0);
    });

    it('displays frequency badges', async () => {
      await renderPacientes();
      
      // Use getAllByText since frequency values appear in both options and badges
      expect(screen.getAllByText('Semanal').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Quincenal').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Mensual').length).toBeGreaterThan(0);
    });

    it('shows edit and delete buttons for each patient', async () => {
      await renderPacientes();
      
      const editButtons = screen.getAllByTitle('Editar paciente');
      const deleteButtons = screen.getAllByTitle('Eliminar paciente');
      
      expect(editButtons.length).toBe(3);
      expect(deleteButtons.length).toBe(3);
    });
  });

  // ==========================================================================
  // LOADING STATE TESTS
  // ==========================================================================

  describe('Loading State', () => {
    it('shows skeleton cards when loading', () => {
      mockedUsePatients.mockReturnValue({
        patients: [],
        activePatients: [],
        inactivePatients: [],
        selectedPatient: null,
        isLoading: true,
        error: null,
        fetchPatients: mockFetchPatients,
        fetchPatientById: mockFetchPatientById,
        setSelectedPatient: mockSetSelectedPatient,
        createPatient: mockCreatePatient as unknown as ReturnType<typeof mockedUsePatients>['createPatient'],
        updatePatient: mockUpdatePatient as unknown as ReturnType<typeof mockedUsePatients>['updatePatient'],
        deletePatient: mockDeletePatient,
        searchPatients: vi.fn(() => Promise.resolve([])),
        clearError: mockClearError,
      });

      render(<Pacientes />);
      
      expect(screen.getAllByTestId('skeleton-card').length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // EMPTY STATE TESTS
  // ==========================================================================

  describe('Empty State', () => {
    it('shows empty state when no patients exist', async () => {
      mockedUsePatients.mockReturnValue({
        patients: [],
        activePatients: [],
        inactivePatients: [],
        selectedPatient: null,
        isLoading: false,
        error: null,
        fetchPatients: mockFetchPatients,
        fetchPatientById: mockFetchPatientById,
        setSelectedPatient: mockSetSelectedPatient,
        createPatient: mockCreatePatient as unknown as ReturnType<typeof mockedUsePatients>['createPatient'],
        updatePatient: mockUpdatePatient as unknown as ReturnType<typeof mockedUsePatients>['updatePatient'],
        deletePatient: mockDeletePatient,
        searchPatients: vi.fn(() => Promise.resolve([])),
        clearError: mockClearError,
      });

      await renderPacientes();
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No hay pacientes registrados')).toBeInTheDocument();
    });

    it('shows action button on empty state', async () => {
      mockedUsePatients.mockReturnValue({
        patients: [],
        activePatients: [],
        inactivePatients: [],
        selectedPatient: null,
        isLoading: false,
        error: null,
        fetchPatients: mockFetchPatients,
        fetchPatientById: mockFetchPatientById,
        setSelectedPatient: mockSetSelectedPatient,
        createPatient: mockCreatePatient as unknown as ReturnType<typeof mockedUsePatients>['createPatient'],
        updatePatient: mockUpdatePatient as unknown as ReturnType<typeof mockedUsePatients>['updatePatient'],
        deletePatient: mockDeletePatient,
        searchPatients: vi.fn(() => Promise.resolve([])),
        clearError: mockClearError,
      });

      await renderPacientes();
      
      expect(screen.getByTestId('empty-action')).toBeInTheDocument();
      expect(screen.getByText('Agregar primer paciente')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SEARCH TESTS
  // ==========================================================================

  describe('Search', () => {
    it('allows typing in search input', async () => {
      const user = userEvent.setup();
      await renderPacientes();
      
      const searchInput = screen.getByPlaceholderText('Buscar paciente...');
      await user.type(searchInput, 'Juan');
      
      expect(searchInput).toHaveValue('Juan');
    });

    it('shows clear button when search has value', async () => {
      const user = userEvent.setup();
      await renderPacientes();
      
      const searchInput = screen.getByPlaceholderText('Buscar paciente...');
      await user.type(searchInput, 'Test');
      
      // Clear button should appear (X icon)
      const clearButton = searchInput.parentElement?.querySelector('button');
      expect(clearButton).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // DRAWER TESTS
  // ==========================================================================

  describe('Patient Drawer', () => {
    it('opens drawer when clicking "Nuevo Paciente"', async () => {
      const user = userEvent.setup();
      await renderPacientes();
      
      await user.click(screen.getByRole('button', { name: /nuevo paciente/i }));
      
      expect(screen.getByTestId('paciente-drawer')).toBeInTheDocument();
      // The drawer mock displays "Nuevo Paciente" text - check for the drawer indicator
      expect(screen.getByText('Nuevo Paciente', { selector: 'span' })).toBeInTheDocument();
    });

    it('closes drawer when close button is clicked', async () => {
      const user = userEvent.setup();
      await renderPacientes();
      
      await user.click(screen.getByRole('button', { name: /nuevo paciente/i }));
      expect(screen.getByTestId('paciente-drawer')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('close-drawer'));
      expect(screen.queryByTestId('paciente-drawer')).not.toBeInTheDocument();
    });

    it('opens drawer for editing when edit button is clicked', async () => {
      const user = userEvent.setup();
      await renderPacientes();
      
      const editButtons = screen.getAllByTitle('Editar paciente');
      await user.click(editButtons[0]);
      
      expect(screen.getByTestId('paciente-drawer')).toBeInTheDocument();
      expect(screen.getByText('Editar Paciente')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // DELETE TESTS
  // ==========================================================================

  describe('Delete Patient', () => {
    it('shows confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup();
      await renderPacientes();
      
      const deleteButtons = screen.getAllByTitle('Eliminar paciente');
      await user.click(deleteButtons[0]);
      
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      expect(screen.getByText('Eliminar paciente')).toBeInTheDocument();
    });

    it('closes confirmation dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      await renderPacientes();
      
      const deleteButtons = screen.getAllByTitle('Eliminar paciente');
      await user.click(deleteButtons[0]);
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('cancel-action'));
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });

    it('calls deletePatient when confirm is clicked', async () => {
      const user = userEvent.setup();
      await renderPacientes();
      
      const deleteButtons = screen.getAllByTitle('Eliminar paciente');
      await user.click(deleteButtons[0]);
      await user.click(screen.getByTestId('confirm-action'));
      
      await waitFor(() => {
        // The first patient in alphabetical order (name-asc default) is Carlos Lopez (patient-3)
        expect(mockDeletePatient).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // VIEW MODE TESTS
  // ==========================================================================

  describe('View Mode', () => {
    it('switches to table view when table button is clicked', async () => {
      const user = userEvent.setup();
      await renderPacientes();
      
      await user.click(screen.getByRole('button', { name: /tabla/i }));
      
      // Table should be rendered
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('table view shows correct headers', async () => {
      const user = userEvent.setup();
      await renderPacientes();
      
      await user.click(screen.getByRole('button', { name: /tabla/i }));
      
      expect(screen.getByText('Paciente')).toBeInTheDocument();
      expect(screen.getByText('Edad')).toBeInTheDocument();
      expect(screen.getByText('Cobertura')).toBeInTheDocument();
    });

    it('hides view toggle on mobile', async () => {
      mockedUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isMobileOrTablet: true,
      });

      await renderPacientes();
      
      expect(screen.queryByRole('button', { name: /tarjetas/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /tabla/i })).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // MOBILE RESPONSIVENESS TESTS
  // ==========================================================================

  describe('Mobile Responsiveness', () => {
    it('uses infinite scroll on mobile', async () => {
      mockedUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isMobileOrTablet: true,
      });

      await renderPacientes();
      
      expect(screen.getByTestId('infinite-scroll')).toBeInTheDocument();
      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('shows pagination on desktop', async () => {
      await renderPacientes();
      
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // FILTER TESTS
  // ==========================================================================

  describe('Filters', () => {
    it('shows clear filters button when filters are active', async () => {
      const user = userEvent.setup();
      await renderPacientes();
      
      const searchInput = screen.getByPlaceholderText('Buscar paciente...');
      await user.type(searchInput, 'Test');
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /limpiar filtros/i })).toBeInTheDocument();
      });
    });

    it('can select modality filter', async () => {
      const user = userEvent.setup();
      await renderPacientes();
      
      const modalitySelect = screen.getByLabelText('Modalidad');
      await user.selectOptions(modalitySelect, 'remoto');
      
      expect(modalitySelect).toHaveValue('remoto');
    });

    it('can select frequency filter', async () => {
      const user = userEvent.setup();
      await renderPacientes();
      
      const frequencySelect = screen.getByLabelText('Frecuencia');
      await user.selectOptions(frequencySelect, 'semanal');
      
      expect(frequencySelect).toHaveValue('semanal');
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('has accessible heading structure', async () => {
      await renderPacientes();
      
      expect(screen.getByRole('heading', { name: 'Pacientes', level: 1 })).toBeInTheDocument();
    });

    it('filter dropdowns have accessible labels', async () => {
      await renderPacientes();
      
      expect(screen.getByLabelText('Modalidad')).toBeInTheDocument();
      expect(screen.getByLabelText('Frecuencia')).toBeInTheDocument();
    });

    it('action buttons have aria-labels', async () => {
      await renderPacientes();
      
      const editButtons = screen.getAllByRole('button', { name: /editar paciente/i });
      const deleteButtons = screen.getAllByRole('button', { name: /eliminar paciente/i });
      
      expect(editButtons.length).toBe(3);
      expect(deleteButtons.length).toBe(3);
    });
  });
});
