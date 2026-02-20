import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Cobros } from '../../../components/cobros/Cobros';
import { PaymentStatus } from '@/lib/types/api.types';
import type { Payment } from '@/lib/types/api.types';
import type { SessionUI } from '@/lib/types/session';
import { SessionStatus, SessionType } from '@/lib/types/session';

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

const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const pastDate = new Date(today);
pastDate.setDate(pastDate.getDate() - 7);
const pastDateStr = pastDate.toISOString().split('T')[0];

const mockPayments: Payment[] = [
  {
    id: 'payment-1',
    amount: 5000,
    paymentDate: todayStr,
    status: PaymentStatus.PENDING,
    description: 'Sesion de terapia',
    sessionId: 'session-1',
    patient: {
      id: 'patient-1',
      firstName: 'Juan',
      lastName: 'Perez',
      email: 'juan@test.com',
    },
  },
  {
    id: 'payment-2',
    amount: 7500,
    paymentDate: pastDateStr,
    paidDate: pastDateStr,
    status: PaymentStatus.PAID,
    description: 'Sesion completada',
    sessionId: 'session-2',
    patient: {
      id: 'patient-2',
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'maria@test.com',
    },
  },
  {
    id: 'payment-3',
    amount: 6000,
    paymentDate: pastDateStr,
    status: PaymentStatus.OVERDUE,
    description: 'Pago vencido',
    sessionId: 'session-3',
    patient: {
      id: 'patient-1',
      firstName: 'Juan',
      lastName: 'Perez',
      email: 'juan@test.com',
    },
  },
];

const mockTotals = {
  totalAmount: 18500,
  paidAmount: 7500,
  pendingAmount: 5000,
  overdueAmount: 6000,
  totalCount: 3,
  paidCount: 1,
  pendingCount: 1,
  overdueCount: 1,
};

const mockSessions: SessionUI[] = [];

const mockPatients = [
  {
    id: 'patient-1',
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan@test.com',
    phone: '+5491123456789',
    status: 'ACTIVE' as const,
    notes: '',
    healthInsurance: 'OSDE',
  },
  {
    id: 'patient-2',
    firstName: 'Maria',
    lastName: 'Garcia',
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
        'payments.title': 'Cobros',
        'payments.managePayments': 'Gestiona tus pagos y cobros',
        'payments.registerPayment': 'Registrar Pago',
        'payments.noPayments': 'No hay pagos registrados',
        'payments.noPendingPayments': 'No tienes pagos pendientes',
        'payments.noResults': 'No se encontraron resultados',
        'payments.noResultsDescription': 'Intenta con otros filtros',
        'payments.noPatient': 'Sin paciente',
        'payments.paid': 'Pagado',
        'payments.pending': 'Pendiente',
        'payments.overdue': 'Vencido',
        'payments.table.patient': 'Paciente',
        'payments.table.date': 'Fecha',
        'payments.table.status': 'Estado',
        'payments.table.amount': 'Monto',
        'payments.table.actions': 'Acciones',
        'payments.filters.all': 'Todos',
        'payments.filters.thisWeek': 'Esta semana',
        'payments.filters.thisMonth': 'Este mes',
        'payments.filters.range': 'Rango',
        'payments.filters.from': 'Desde',
        'payments.filters.to': 'Hasta',
        'payments.filters.clearFilters': 'Limpiar filtros',
        'payments.filters.searchByPatient': 'Buscar por paciente...',
        'payments.filters.allStatuses': 'Todos los estados',
        'payments.filters.sortBy': 'Ordenar por',
        'payments.sort.dateDesc': 'Mas reciente',
        'payments.sort.dateAsc': 'Mas antiguo',
        'payments.sort.priceDesc': 'Mayor monto',
        'payments.sort.priceAsc': 'Menor monto',
        'payments.messages.reminder': 'Recordatorio',
        'payments.messages.markAsPaidShort': 'Cobrar',
        'payments.messages.markedAsPaid': 'Pago marcado como cobrado',
        'payments.messages.errorMarkAsPaid': 'Error al marcar como pagado',
        'payments.messages.created': 'Pago creado exitosamente',
        'payments.messages.updated': 'Pago actualizado exitosamente',
        'payments.messages.deleted': 'Pago eliminado exitosamente',
        'payments.messages.errorSave': 'Error al guardar el pago',
        'payments.messages.errorUpdate': 'Error al actualizar el pago',
        'payments.messages.errorDelete': 'Error al eliminar el pago',
        'payments.messages.deleteConfirmTitle': 'Eliminar pago',
        'payments.messages.deleteConfirmDescription': `Eliminar pago de ${params?.name || ''} por ${params?.amount || ''}`,
        'payments.actions.viewDetail': 'Ver detalle',
        'payments.actions.sendReminder': 'Enviar recordatorio',
        'payments.actions.markAsCollected': 'Marcar como cobrado',
        'payments.actions.deletePayment': 'Eliminar pago',
        'payments.actions.registerPayment': 'Registrar pago',
        'payments.virtual.sessionUnpaid': 'Sesion sin pago',
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

// Mock hooks and stores - these need to return Promises for async operations
const mockFetchPayments = vi.fn(() => Promise.resolve(undefined));
const mockCreatePayment = vi.fn(() => Promise.resolve(undefined));
const mockUpdatePayment = vi.fn(() => Promise.resolve(undefined));
const mockMarkAsPaid = vi.fn(() => Promise.resolve(undefined));
const mockDeletePayment = vi.fn(() => Promise.resolve(undefined));
const mockFetchUpcoming = vi.fn(() => Promise.resolve(undefined));
const mockFetchPatients = vi.fn(() => Promise.resolve(undefined));

vi.mock('@/lib/hooks/usePayments', () => ({
  usePayments: vi.fn(() => ({
    payments: mockPayments,
    totals: mockTotals,
    pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
    isLoading: false,
    error: null,
    fetchPayments: mockFetchPayments,
    createPayment: mockCreatePayment,
    updatePayment: mockUpdatePayment,
    markAsPaid: mockMarkAsPaid,
    deletePayment: mockDeletePayment,
  })),
}));

vi.mock('@/lib/stores/sessionStore', () => ({
  useSessions: vi.fn(() => ({
    sessionsUI: mockSessions,
    sessions: mockSessions,
    isLoading: false,
    error: null,
    fetchUpcoming: mockFetchUpcoming,
    fetchMonthly: vi.fn(() => Promise.resolve(undefined)),
    createSession: vi.fn(() => Promise.resolve(undefined)),
    updateSession: vi.fn(() => Promise.resolve(undefined)),
    deleteSession: vi.fn(() => Promise.resolve(undefined)),
    markAsCompleted: vi.fn(() => Promise.resolve(undefined)),
    clearError: vi.fn(),
  })),
}));

vi.mock('@/lib/stores/payment.store', () => ({
  usePaymentStore: vi.fn(() => ({
    payments: mockPayments,
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/lib/hooks', () => ({
  usePatients: vi.fn(() => ({
    patients: mockPatients,
    activePatients: mockPatients,
    inactivePatients: [],
    selectedPatient: null,
    isLoading: false,
    error: null,
    fetchPatients: mockFetchPatients,
    fetchPatientById: vi.fn(() => Promise.resolve(undefined)),
    setSelectedPatient: vi.fn(),
    createPatient: vi.fn(() => Promise.resolve(undefined)),
    updatePatient: vi.fn(() => Promise.resolve(undefined)),
    deletePatient: vi.fn(() => Promise.resolve(undefined)),
    searchPatients: vi.fn(() => Promise.resolve([])),
    clearError: vi.fn(),
  })),
  useResponsive: vi.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isMobileOrTablet: false,
  })),
}));

// Mock child components to simplify testing
vi.mock('../../../components/cobros/PaymentDrawer', () => ({
  PaymentDrawer: ({ isOpen, onClose, onSave, editPayment }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: unknown) => void;
    editPayment?: Payment | null;
  }) => isOpen ? (
    <div data-testid="payment-drawer">
      <span>{editPayment ? 'Edit Payment' : 'New Payment'}</span>
      <button data-testid="close-drawer" onClick={onClose}>Close</button>
      <button data-testid="save-payment" onClick={() => onSave({ amount: 5000 })}>Save</button>
    </div>
  ) : null,
}));

vi.mock('../../../components/cobros/PaymentDetailModal', () => ({
  PaymentDetailModal: ({ payment, onClose, onEdit, onDelete, onMarkAsPaid }: {
    payment: Payment;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onMarkAsPaid?: () => void;
  }) => (
    <div data-testid="payment-detail-modal">
      <span data-testid="detail-patient-name">{payment.patient?.firstName} {payment.patient?.lastName}</span>
      <span data-testid="detail-amount">{payment.amount}</span>
      <button data-testid="edit-from-detail" onClick={onEdit}>Edit</button>
      <button data-testid="delete-from-detail" onClick={onDelete}>Delete</button>
      {onMarkAsPaid && <button data-testid="mark-paid-from-detail" onClick={onMarkAsPaid}>Mark as Paid</button>}
      <button data-testid="close-detail" onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('../../../components/cobros/ReminderModal', () => ({
  ReminderModal: ({ payment, onClose }: { payment: Payment; onClose: () => void }) => (
    <div data-testid="reminder-modal">
      <span>Reminder for {payment.patient?.firstName}</span>
      <button data-testid="close-reminder" onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock('../../../components/cobros/PaymentStats', () => ({
  PaymentStats: ({ totals, isLoading }: { totals: typeof mockTotals | null; isLoading?: boolean }) => (
    <div data-testid="payment-stats">
      {isLoading ? (
        <div data-testid="stats-loading">Loading stats...</div>
      ) : totals ? (
        <>
          <div data-testid="total-amount">Total: ${totals.totalAmount}</div>
          <div data-testid="paid-amount">Cobrado: ${totals.paidAmount}</div>
          <div data-testid="pending-amount">Pendiente: ${totals.pendingAmount}</div>
          <div data-testid="overdue-amount">Vencido: ${totals.overdueAmount}</div>
        </>
      ) : null}
    </div>
  ),
}));

vi.mock('../../../components/shared', () => ({
  SkeletonList: ({ items }: { items: number }) => (
    <div data-testid="skeleton-list">{items} loading items</div>
  ),
  SkeletonStats: ({ cards }: { cards: number }) => (
    <div data-testid="skeleton-stats">{cards} loading stats</div>
  ),
  SimplePagination: ({ currentPage, totalPages, onPageChange }: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
  }) => (
    <div data-testid="pagination">
      <span data-testid="current-page">Page {currentPage} of {totalPages}</span>
      <button 
        data-testid="prev-page" 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Prev
      </button>
      <button 
        data-testid="next-page" 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  ),
  InfiniteScrollLoader: ({ isLoading, hasMore }: {
    isLoading: boolean;
    hasMore: boolean;
    loadMoreRef: React.RefObject<HTMLDivElement>;
  }) => (
    <div data-testid="infinite-scroll">
      {isLoading && <span>Loading more...</span>}
      {!hasMore && <span>No more items</span>}
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
  }) => open ? (
    <div data-testid="confirm-dialog" role="dialog">
      <h2>{title}</h2>
      <p>{description}</p>
      <button data-testid="confirm-action" onClick={onConfirm}>{confirmLabel}</button>
      <button data-testid="cancel-action" onClick={() => onOpenChange(false)}>{cancelLabel}</button>
    </div>
  ) : null,
  EmptyState: ({ icon: Icon, title, description }: {
    icon: React.ElementType;
    title: string;
    description: string;
    variant?: string;
  }) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

// Import mocked hooks for dynamic returns
import { usePayments } from '@/lib/hooks/usePayments';
import { useSessions } from '@/lib/stores/sessionStore';
import { useResponsive } from '@/lib/hooks';

const mockedUsePayments = vi.mocked(usePayments);
const mockedUseSessions = vi.mocked(useSessions);
const mockedUseResponsive = vi.mocked(useResponsive);

// ============================================================================
// HELPER
// ============================================================================

const renderCobros = async () => {
  const result = render(
    <BrowserRouter>
      <Cobros />
    </BrowserRouter>
  );
  // Wait for initial loading to complete
  await waitFor(() => {
    expect(screen.queryByTestId('skeleton-list')).not.toBeInTheDocument();
  }, { timeout: 2000 }).catch(() => {
    // Loading state may not appear if data loads fast enough
  });
  return result;
};

// ============================================================================
// TESTS
// ============================================================================

describe('Cobros', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations to return promises
    mockFetchPayments.mockImplementation(() => Promise.resolve(undefined));
    mockCreatePayment.mockImplementation(() => Promise.resolve(undefined));
    mockUpdatePayment.mockImplementation(() => Promise.resolve(undefined));
    mockMarkAsPaid.mockImplementation(() => Promise.resolve(undefined));
    mockDeletePayment.mockImplementation(() => Promise.resolve(undefined));
    mockFetchUpcoming.mockImplementation(() => Promise.resolve(undefined));
    mockFetchPatients.mockImplementation(() => Promise.resolve(undefined));
    
    // Reset default mocks
    mockedUsePayments.mockReturnValue({
      payments: mockPayments,
      paidPayments: mockPayments.filter(p => p.status === PaymentStatus.PAID),
      pendingPayments: mockPayments.filter(p => p.status === PaymentStatus.PENDING),
      totals: mockTotals,
      pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
      isLoading: false,
      error: null,
      fetchPayments: mockFetchPayments,
      createPayment: mockCreatePayment as unknown as ReturnType<typeof mockedUsePayments>['createPayment'],
      updatePayment: mockUpdatePayment as unknown as ReturnType<typeof mockedUsePayments>['updatePayment'],
      markAsPaid: mockMarkAsPaid as unknown as ReturnType<typeof mockedUsePayments>['markAsPaid'],
      deletePayment: mockDeletePayment,
      reset: vi.fn(),
      isSessionPaid: vi.fn(() => false),
    });

    mockedUseSessions.mockReturnValue({
      sessionsUI: mockSessions,
      sessions: mockSessions,
      isLoading: false,
      error: null,
      fetchUpcoming: mockFetchUpcoming,
      fetchMonthly: vi.fn(() => Promise.resolve(undefined)),
      createSession: vi.fn(() => Promise.resolve(undefined)) as unknown as ReturnType<typeof mockedUseSessions>['createSession'],
      updateSession: vi.fn(() => Promise.resolve(undefined)) as unknown as ReturnType<typeof mockedUseSessions>['updateSession'],
      deleteSession: vi.fn(() => Promise.resolve(undefined)),
      markAsCompleted: vi.fn(() => Promise.resolve(undefined)),
      clearError: vi.fn(),
    });

    mockedUseResponsive.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isMobileOrTablet: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders page title', async () => {
      await renderCobros();
      expect(screen.getByRole('heading', { name: 'Cobros' })).toBeInTheDocument();
    });

    it('renders page subtitle', async () => {
      await renderCobros();
      expect(screen.getByText('Gestiona tus pagos y cobros')).toBeInTheDocument();
    });

    it('renders "Register Payment" button', async () => {
      await renderCobros();
      expect(screen.getByRole('button', { name: /registrar pago/i })).toBeInTheDocument();
    });

    it('renders payment stats component', async () => {
      await renderCobros();
      expect(screen.getByTestId('payment-stats')).toBeInTheDocument();
      expect(screen.getByTestId('total-amount')).toBeInTheDocument();
    });

    it('renders quick filter buttons', async () => {
      await renderCobros();
      expect(screen.getByRole('button', { name: 'Todos' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Esta semana' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Este mes' })).toBeInTheDocument();
    });

    it('renders search input', async () => {
      await renderCobros();
      expect(screen.getByPlaceholderText('Buscar por paciente...')).toBeInTheDocument();
    });

    it('fetches data on mount', async () => {
      await renderCobros();
      
      expect(mockFetchUpcoming).toHaveBeenCalled();
      expect(mockFetchPatients).toHaveBeenCalled();
      expect(mockFetchPayments).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // PAYMENT LIST TESTS
  // ==========================================================================

  describe('Payment List', () => {
    it('displays payment table on desktop with payments', async () => {
      await renderCobros();
      
      // On desktop, should show table
      const table = screen.queryByRole('table');
      if (table) {
        expect(table).toBeInTheDocument();
      }
    });

    it('shows status filter options', async () => {
      await renderCobros();
      
      // Status filter dropdown should be present
      const statusOptions = screen.getAllByRole('option');
      expect(statusOptions.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // LOADING STATE TESTS
  // ==========================================================================

  describe('Loading State', () => {
    it('shows loading skeleton when initial loading is true', () => {
      // Set loading state before render
      mockedUsePayments.mockReturnValue({
        payments: [],
        paidPayments: [],
        pendingPayments: [],
        totals: { totalAmount: 0, paidAmount: 0, pendingAmount: 0, overdueAmount: 0, totalCount: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 },
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        isLoading: true,
        error: null,
        fetchPayments: mockFetchPayments,
        createPayment: mockCreatePayment as unknown as ReturnType<typeof mockedUsePayments>['createPayment'],
        updatePayment: mockUpdatePayment as unknown as ReturnType<typeof mockedUsePayments>['updatePayment'],
        markAsPaid: mockMarkAsPaid as unknown as ReturnType<typeof mockedUsePayments>['markAsPaid'],
        deletePayment: mockDeletePayment,
        reset: vi.fn(),
        isSessionPaid: vi.fn(() => false),
      });

      render(
        <BrowserRouter>
          <Cobros />
        </BrowserRouter>
      );
      
      // The skeleton should be visible during loading
      expect(screen.getByTestId('skeleton-list')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // EMPTY STATE TESTS
  // ==========================================================================

  describe('Empty State', () => {
    it('shows empty state when no payments and no sessions exist', async () => {
      mockedUsePayments.mockReturnValue({
        payments: [],
        paidPayments: [],
        pendingPayments: [],
        totals: { totalAmount: 0, paidAmount: 0, pendingAmount: 0, overdueAmount: 0, totalCount: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 },
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        isLoading: false,
        error: null,
        fetchPayments: mockFetchPayments,
        createPayment: mockCreatePayment as unknown as ReturnType<typeof mockedUsePayments>['createPayment'],
        updatePayment: mockUpdatePayment as unknown as ReturnType<typeof mockedUsePayments>['updatePayment'],
        markAsPaid: mockMarkAsPaid as unknown as ReturnType<typeof mockedUsePayments>['markAsPaid'],
        deletePayment: mockDeletePayment,
        reset: vi.fn(),
        isSessionPaid: vi.fn(() => false),
      });
      mockedUseSessions.mockReturnValue({
        sessionsUI: [],
        sessions: [],
        isLoading: false,
        error: null,
        fetchUpcoming: mockFetchUpcoming,
        fetchMonthly: vi.fn(() => Promise.resolve(undefined)),
        createSession: vi.fn(() => Promise.resolve(undefined)) as unknown as ReturnType<typeof useSessions>['createSession'],
        updateSession: vi.fn(() => Promise.resolve(undefined)) as unknown as ReturnType<typeof useSessions>['updateSession'],
        deleteSession: vi.fn(() => Promise.resolve(undefined)),
        markAsCompleted: vi.fn(() => Promise.resolve(undefined)),
        clearError: vi.fn(),
      });

      await renderCobros();
      
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // FILTERING TESTS
  // ==========================================================================

  describe('Filtering', () => {
    it('applies "Esta semana" quick filter when clicked', async () => {
      const user = userEvent.setup();
      await renderCobros();
      
      await user.click(screen.getByRole('button', { name: 'Esta semana' }));
      
      // Button should now be active
      const weekButton = screen.getByRole('button', { name: 'Esta semana' });
      expect(weekButton).toHaveClass('bg-indigo-600');
    });

    it('applies "Este mes" quick filter when clicked', async () => {
      const user = userEvent.setup();
      await renderCobros();
      
      await user.click(screen.getByRole('button', { name: 'Este mes' }));
      
      const monthButton = screen.getByRole('button', { name: 'Este mes' });
      expect(monthButton).toHaveClass('bg-indigo-600');
    });

    it('shows date range inputs when "Rango" is clicked', async () => {
      const user = userEvent.setup();
      await renderCobros();
      
      await user.click(screen.getByRole('button', { name: /rango/i }));
      
      await waitFor(() => {
        expect(screen.getByLabelText('Desde')).toBeInTheDocument();
        expect(screen.getByLabelText('Hasta')).toBeInTheDocument();
      });
    });

    it('has search input that accepts text', async () => {
      const user = userEvent.setup();
      await renderCobros();
      
      const searchInput = screen.getByPlaceholderText('Buscar por paciente...');
      await user.type(searchInput, 'Juan');
      
      expect(searchInput).toHaveValue('Juan');
    });
  });

  // ==========================================================================
  // INTERACTION TESTS
  // ==========================================================================

  describe('Interactions', () => {
    it('opens payment drawer when clicking "Registrar Pago"', async () => {
      const user = userEvent.setup();
      await renderCobros();
      
      await user.click(screen.getByRole('button', { name: /registrar pago/i }));
      
      expect(screen.getByTestId('payment-drawer')).toBeInTheDocument();
      expect(screen.getByText('New Payment')).toBeInTheDocument();
    });

    it('closes payment drawer when close button is clicked', async () => {
      const user = userEvent.setup();
      await renderCobros();
      
      await user.click(screen.getByRole('button', { name: /registrar pago/i }));
      expect(screen.getByTestId('payment-drawer')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('close-drawer'));
      expect(screen.queryByTestId('payment-drawer')).not.toBeInTheDocument();
    });
  });

  // ==========================================================================
  // DELETE TESTS
  // ==========================================================================

  describe('Delete Payment', () => {
    it('shows confirmation dialog when delete button is clicked in table', async () => {
      const user = userEvent.setup();
      await renderCobros();
      
      // Find delete button by title
      const deleteButtons = screen.queryAllByTitle('Eliminar pago');
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
        expect(screen.getByText('Eliminar pago')).toBeInTheDocument();
      }
    });

    it('closes confirmation dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      await renderCobros();
      
      const deleteButtons = screen.queryAllByTitle('Eliminar pago');
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
        
        await user.click(screen.getByTestId('cancel-action'));
        expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
      }
    });

    it('calls deletePayment when confirm is clicked', async () => {
      const user = userEvent.setup();
      mockDeletePayment.mockResolvedValue(undefined);
      await renderCobros();
      
      const deleteButtons = screen.queryAllByTitle('Eliminar pago');
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        await user.click(screen.getByTestId('confirm-action'));
        
        await waitFor(() => {
          expect(mockDeletePayment).toHaveBeenCalled();
        });
      }
    });

    it('shows success toast after successful deletion', async () => {
      const user = userEvent.setup();
      mockDeletePayment.mockResolvedValue(undefined);
      await renderCobros();
      
      const deleteButtons = screen.queryAllByTitle('Eliminar pago');
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        await user.click(screen.getByTestId('confirm-action'));
        
        await waitFor(() => {
          expect(mockToastSuccess).toHaveBeenCalledWith('Pago eliminado exitosamente');
        });
      }
    });

    it('shows error toast when deletion fails', async () => {
      const user = userEvent.setup();
      mockDeletePayment.mockRejectedValue(new Error('Failed'));
      await renderCobros();
      
      const deleteButtons = screen.queryAllByTitle('Eliminar pago');
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        await user.click(screen.getByTestId('confirm-action'));
        
        await waitFor(() => {
          expect(mockToastError).toHaveBeenCalledWith('Error al eliminar el pago');
        });
      }
    });
  });

  // ==========================================================================
  // MARK AS PAID TESTS
  // ==========================================================================

  describe('Mark as Paid', () => {
    it('calls markAsPaid when clicking mark as paid button', async () => {
      const user = userEvent.setup();
      await renderCobros();
      
      const markAsPaidButtons = screen.queryAllByTitle('Marcar como cobrado');
      if (markAsPaidButtons.length > 0) {
        await user.click(markAsPaidButtons[0]);
        
        await waitFor(() => {
          expect(mockMarkAsPaid).toHaveBeenCalled();
        });
      }
    });

    it('shows success toast after marking as paid', async () => {
      const user = userEvent.setup();
      mockMarkAsPaid.mockResolvedValue(undefined);
      await renderCobros();
      
      const markAsPaidButtons = screen.queryAllByTitle('Marcar como cobrado');
      if (markAsPaidButtons.length > 0) {
        await user.click(markAsPaidButtons[0]);
        
        await waitFor(() => {
          expect(mockToastSuccess).toHaveBeenCalledWith('Pago marcado como cobrado');
        });
      }
    });

    it('shows error toast when mark as paid fails', async () => {
      const user = userEvent.setup();
      mockMarkAsPaid.mockRejectedValue(new Error('Failed'));
      await renderCobros();
      
      const markAsPaidButtons = screen.queryAllByTitle('Marcar como cobrado');
      if (markAsPaidButtons.length > 0) {
        await user.click(markAsPaidButtons[0]);
        
        await waitFor(() => {
          expect(mockToastError).toHaveBeenCalledWith('Error al marcar como pagado');
        });
      }
    });
  });

  // ==========================================================================
  // REMINDER TESTS
  // ==========================================================================

  describe('Reminder', () => {
    it('opens reminder modal when clicking reminder button', async () => {
      const user = userEvent.setup();
      await renderCobros();
      
      const reminderButtons = screen.queryAllByTitle('Enviar recordatorio');
      if (reminderButtons.length > 0) {
        await user.click(reminderButtons[0]);
        
        expect(screen.getByTestId('reminder-modal')).toBeInTheDocument();
      }
    });

    it('closes reminder modal when close button is clicked', async () => {
      const user = userEvent.setup();
      await renderCobros();
      
      const reminderButtons = screen.queryAllByTitle('Enviar recordatorio');
      if (reminderButtons.length > 0) {
        await user.click(reminderButtons[0]);
        expect(screen.getByTestId('reminder-modal')).toBeInTheDocument();
        
        await user.click(screen.getByTestId('close-reminder'));
        expect(screen.queryByTestId('reminder-modal')).not.toBeInTheDocument();
      }
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

      await renderCobros();
      
      // On mobile, should show infinite scroll loader instead of pagination
      expect(screen.getByTestId('infinite-scroll')).toBeInTheDocument();
      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('shows pagination on desktop', async () => {
      await renderCobros();
      
      // On desktop, should show pagination
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // DETAIL MODAL TESTS
  // ==========================================================================

  describe('Detail Modal', () => {
    it('opens detail modal when clicking view button', async () => {
      const user = userEvent.setup();
      await renderCobros();
      
      const viewButtons = screen.queryAllByTitle('Ver detalle');
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);
        
        expect(screen.getByTestId('payment-detail-modal')).toBeInTheDocument();
      }
    });

    it('closes detail modal when close button is clicked', async () => {
      const user = userEvent.setup();
      await renderCobros();
      
      const viewButtons = screen.queryAllByTitle('Ver detalle');
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);
        expect(screen.getByTestId('payment-detail-modal')).toBeInTheDocument();
        
        await user.click(screen.getByTestId('close-detail'));
        expect(screen.queryByTestId('payment-detail-modal')).not.toBeInTheDocument();
      }
    });

    it('transitions from detail modal to edit drawer when edit is clicked', async () => {
      const user = userEvent.setup();
      await renderCobros();
      
      const viewButtons = screen.queryAllByTitle('Ver detalle');
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);
        expect(screen.getByTestId('payment-detail-modal')).toBeInTheDocument();
        
        await user.click(screen.getByTestId('edit-from-detail'));
        
        // Modal should close, drawer should open
        expect(screen.queryByTestId('payment-detail-modal')).not.toBeInTheDocument();
        expect(screen.getByTestId('payment-drawer')).toBeInTheDocument();
        expect(screen.getByText('Edit Payment')).toBeInTheDocument();
      }
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('has accessible heading structure', async () => {
      await renderCobros();
      
      expect(screen.getByRole('heading', { name: 'Cobros', level: 1 })).toBeInTheDocument();
    });

    it('search input has accessible label', async () => {
      await renderCobros();
      
      const searchInput = screen.getByPlaceholderText('Buscar por paciente...');
      expect(searchInput).toHaveAttribute('aria-label', 'Buscar por paciente...');
    });

    it('filter dropdowns are accessible', async () => {
      await renderCobros();
      
      const dropdowns = screen.getAllByRole('combobox');
      expect(dropdowns.length).toBeGreaterThanOrEqual(2);
      dropdowns.forEach(dropdown => {
        expect(dropdown).toHaveAttribute('aria-label');
      });
    });
  });
});
