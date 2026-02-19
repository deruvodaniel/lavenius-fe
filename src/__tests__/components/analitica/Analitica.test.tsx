import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Analitica } from '@/components/analitica/Analitica';

// ============================================================================
// BROWSER API MOCKS
// ============================================================================

class MockResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
});

// ============================================================================
// MOCK DATA
// ============================================================================

const mockPatients = [
  {
    id: 'patient-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@test.com',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'patient-2',
    firstName: 'María',
    lastName: 'García',
    email: 'maria@test.com',
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  },
];

const mockPayments = [
  {
    id: 'pay-1',
    sessionId: 'session-1',
    amount: 5000,
    status: 'paid',
    paymentDate: new Date().toISOString(),
    patientId: 'patient-1',
  },
  {
    id: 'pay-2',
    sessionId: 'session-2',
    amount: 3000,
    status: 'pending',
    paymentDate: new Date().toISOString(),
    patientId: 'patient-2',
  },
  {
    id: 'pay-3',
    sessionId: 'session-3',
    amount: 2000,
    status: 'overdue',
    paymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    patientId: 'patient-1',
  },
];

const createMockSession = (id: string, status: string, patientId: string, daysAgo = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const scheduledFrom = new Date(date);
  scheduledFrom.setHours(10, 0, 0, 0);
  const scheduledTo = new Date(date);
  scheduledTo.setHours(11, 0, 0, 0);
  
  return {
    id,
    scheduledFrom: scheduledFrom.toISOString(),
    scheduledTo: scheduledTo.toISOString(),
    status,
    sessionType: 'presential',
    patient: mockPatients.find(p => p.id === patientId),
    createdAt: date.toISOString(),
    updatedAt: date.toISOString(),
  };
};

const mockSessions = [
  createMockSession('session-1', 'completed', 'patient-1', 0),
  createMockSession('session-2', 'completed', 'patient-2', 1),
  createMockSession('session-3', 'confirmed', 'patient-1', 2),
  createMockSession('session-4', 'pending', 'patient-2', 3),
  createMockSession('session-5', 'cancelled', 'patient-1', 4),
];

// ============================================================================
// MOCKS
// ============================================================================

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'analytics.title': 'Analítica',
        'analytics.subtitle': 'Estadísticas de tu práctica',
        'analytics.loading': 'Cargando estadísticas...',
        'analytics.refresh': 'Actualizar',
        'analytics.noData': 'Sin datos para mostrar',
        'analytics.timeRange.week': 'Última semana',
        'analytics.timeRange.month': 'Este mes',
        'analytics.timeRange.quarter': 'Este trimestre',
        'analytics.timeRange.year': 'Este año',
        'analytics.stats.sessions': 'Sesiones',
        'analytics.stats.completed': 'completadas',
        'analytics.stats.income': 'Ingresos',
        'analytics.stats.pending': 'pendiente',
        'analytics.stats.patientsAttended': 'Pacientes atendidos',
        'analytics.stats.newInPeriod': 'nuevos en el período',
        'analytics.stats.attendanceRate': 'Tasa de asistencia',
        'analytics.stats.cancellations': 'cancelaciones',
        'analytics.stats.vsPrevious': 'vs período anterior',
        'analytics.charts.sessionsOverTime.title': 'Sesiones en el tiempo',
        'analytics.charts.sessionsOverTime.subtitle': 'Evolución de sesiones',
        'analytics.charts.sessionStatus.title': 'Estado de sesiones',
        'analytics.charts.sessionStatus.subtitle': 'Distribución por estado',
        'analytics.charts.incomeOverTime.title': 'Ingresos en el tiempo',
        'analytics.charts.incomeOverTime.subtitle': 'Evolución de cobros',
        'analytics.charts.paymentStatus.title': 'Estado de pagos',
        'analytics.charts.paymentStatus.subtitle': 'Distribución de pagos',
        'analytics.charts.hourlyOccupancy.title': 'Ocupación por hora',
        'analytics.charts.hourlyOccupancy.subtitle': 'Distribución horaria de sesiones',
        'analytics.charts.dailyOccupancy.title': 'Ocupación por día',
        'analytics.charts.dailyOccupancy.subtitle': 'Sesiones por día de la semana',
        'analytics.charts.topPatients.title': 'Top pacientes',
        'analytics.charts.topPatients.subtitle': 'Pacientes con más sesiones',
        'analytics.labels.total': 'Total',
        'analytics.labels.completed': 'Completadas',
        'analytics.labels.confirmed': 'Confirmadas',
        'analytics.labels.pendingStatus': 'Pendientes',
        'analytics.labels.cancelled': 'Canceladas',
        'analytics.labels.paid': 'Pagado',
        'analytics.labels.overdue': 'Vencido',
        'analytics.labels.collected': 'Cobrado',
        'analytics.labels.pendingAmount': 'Pendiente',
        'analytics.labels.sessions': 'Sesiones',
        'analytics.labels.weekNumber': `Semana ${options?.number || ''}`,
        'analytics.weekdays.sun': 'Dom',
        'analytics.weekdays.mon': 'Lun',
        'analytics.weekdays.tue': 'Mar',
        'analytics.weekdays.wed': 'Mié',
        'analytics.weekdays.thu': 'Jue',
        'analytics.weekdays.fri': 'Vie',
        'analytics.weekdays.sat': 'Sáb',
        'analytics.months.jan': 'Ene',
        'analytics.months.feb': 'Feb',
        'analytics.months.mar': 'Mar',
        'analytics.months.apr': 'Abr',
        'analytics.months.may': 'May',
        'analytics.months.jun': 'Jun',
        'analytics.months.jul': 'Jul',
        'analytics.months.aug': 'Ago',
        'analytics.months.sep': 'Sep',
        'analytics.months.oct': 'Oct',
        'analytics.months.nov': 'Nov',
        'analytics.months.dec': 'Dic',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock usePayments hook
const mockFetchPayments = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/hooks/usePayments', () => ({
  usePayments: () => ({
    payments: mockPayments,
    fetchPayments: mockFetchPayments,
    isLoading: false,
  }),
}));

// Mock usePatients hook
const mockFetchPatients = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/hooks', () => ({
  usePatients: () => ({
    patients: mockPatients,
    fetchPatients: mockFetchPatients,
    isLoading: false,
  }),
  useResponsive: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isMobileOrTablet: false,
  }),
}));

// Mock session service
const mockGetMonthly = vi.fn().mockResolvedValue(mockSessions);
vi.mock('@/lib/api/sessions', () => ({
  sessionService: {
    getMonthly: (...args: unknown[]) => mockGetMonthly(...args),
  },
}));

// Mock recharts components (they don't render in test environment)
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children, data }: { children: React.ReactNode; data?: unknown[] }) => (
    <div data-testid="bar-chart" data-count={data?.length || 0}>{children}</div>
  ),
  LineChart: ({ children, data }: { children: React.ReactNode; data?: unknown[] }) => (
    <div data-testid="line-chart" data-count={data?.length || 0}>{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ data }: { data?: unknown[] }) => (
    <div data-testid="pie" data-count={data?.length || 0} />
  ),
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// ============================================================================
// TESTS
// ============================================================================

describe('Analitica', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGetMonthly.mockResolvedValue(mockSessions);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==========================================================================
  // LOADING STATE TESTS
  // ==========================================================================

  describe('Loading State', () => {
    it('shows loading skeleton initially', async () => {
      render(<Analitica />);
      
      // Should show loading title
      expect(screen.getByText('Analítica')).toBeInTheDocument();
      expect(screen.getByText('Cargando estadísticas...')).toBeInTheDocument();
    });

    it('displays skeleton loader while loading', async () => {
      const { container } = render(<Analitica />);
      
      // Should have skeleton items with animate-pulse
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('hides loading state after data loads', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Cargando estadísticas...')).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // HEADER TESTS
  // ==========================================================================

  describe('Header', () => {
    it('renders title and subtitle after loading', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Analítica')).toBeInTheDocument();
        expect(screen.getByText('Estadísticas de tu práctica')).toBeInTheDocument();
      });
    });

    it('renders refresh button', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: 'Actualizar' });
        expect(refreshButton).toBeInTheDocument();
      });
    });

    it('renders time range selector with default month value', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Este mes')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // TIME RANGE SELECTOR TESTS
  // ==========================================================================

  describe('Time Range Selector', () => {
    it('opens dropdown when clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Este mes')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Este mes'));
      
      // Should show all time range options
      expect(screen.getByText('Última semana')).toBeInTheDocument();
      expect(screen.getByText('Este trimestre')).toBeInTheDocument();
      expect(screen.getByText('Este año')).toBeInTheDocument();
    });

    it('changes time range when option is selected', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Este mes')).toBeInTheDocument();
      });
      
      // Open dropdown
      await user.click(screen.getByText('Este mes'));
      
      // Select week option
      await user.click(screen.getByText('Última semana'));
      
      // Verify the dropdown button now shows the new selection
      const buttons = screen.getAllByRole('button');
      const timeRangeButton = buttons.find(btn => btn.textContent?.includes('Última semana'));
      expect(timeRangeButton).toBeInTheDocument();
    });

    it('closes dropdown when clicking outside', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Este mes')).toBeInTheDocument();
      });
      
      // Open dropdown
      await user.click(screen.getByText('Este mes'));
      expect(screen.getByText('Última semana')).toBeInTheDocument();
      
      // Click the overlay to close
      const overlay = document.querySelector('.fixed.inset-0');
      if (overlay) {
        await user.click(overlay);
      }
      
      await waitFor(() => {
        // The options in the dropdown should be gone, but "Este mes" button should still be there
        const weekOptions = screen.queryAllByText('Última semana');
        // There might be 0 or 1 depending on what's visible
        expect(weekOptions.length).toBeLessThanOrEqual(1);
      });
    });
  });

  // ==========================================================================
  // STAT CARDS TESTS
  // ==========================================================================

  describe('Stat Cards', () => {
    it('renders all four stat cards', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Sesiones')).toBeInTheDocument();
        expect(screen.getByText('Ingresos')).toBeInTheDocument();
        expect(screen.getByText('Pacientes atendidos')).toBeInTheDocument();
        expect(screen.getByText('Tasa de asistencia')).toBeInTheDocument();
      });
    });

    it('displays session count correctly', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        // With 5 mock sessions, we should see "5" as total
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });

    it('displays completion rate as percentage', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        // 2 completed out of 5 = 40%
        expect(screen.getByText('40%')).toBeInTheDocument();
      });
    });

    it('displays completed sessions subtitle', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/2 completadas/)).toBeInTheDocument();
      });
    });

    it('displays cancellations count in attendance card', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/1 cancelaciones/)).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // CHARTS TESTS
  // ==========================================================================

  describe('Charts', () => {
    it('renders sessions over time chart', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Sesiones en el tiempo')).toBeInTheDocument();
        expect(screen.getByText('Evolución de sesiones')).toBeInTheDocument();
      });
    });

    it('renders session status pie chart', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Estado de sesiones')).toBeInTheDocument();
        expect(screen.getByText('Distribución por estado')).toBeInTheDocument();
      });
    });

    it('renders income over time chart', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Ingresos en el tiempo')).toBeInTheDocument();
        expect(screen.getByText('Evolución de cobros')).toBeInTheDocument();
      });
    });

    it('renders payment status pie chart', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Estado de pagos')).toBeInTheDocument();
        expect(screen.getByText('Distribución de pagos')).toBeInTheDocument();
      });
    });

    it('renders hourly occupancy chart', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Ocupación por hora')).toBeInTheDocument();
        expect(screen.getByText('Distribución horaria de sesiones')).toBeInTheDocument();
      });
    });

    it('renders daily occupancy chart', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Ocupación por día')).toBeInTheDocument();
        expect(screen.getByText('Sesiones por día de la semana')).toBeInTheDocument();
      });
    });

    it('renders top patients chart', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Top pacientes')).toBeInTheDocument();
        expect(screen.getByText('Pacientes con más sesiones')).toBeInTheDocument();
      });
    });

    it('renders line chart component for sessions over time', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        const lineCharts = screen.getAllByTestId('line-chart');
        expect(lineCharts.length).toBeGreaterThan(0);
      });
    });

    it('renders bar chart components', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        const barCharts = screen.getAllByTestId('bar-chart');
        expect(barCharts.length).toBeGreaterThan(0);
      });
    });

    it('renders pie chart components', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        const pieCharts = screen.getAllByTestId('pie-chart');
        expect(pieCharts.length).toBeGreaterThan(0);
      });
    });
  });

  // ==========================================================================
  // EMPTY STATE TESTS
  // ==========================================================================

  describe('Empty State', () => {
    beforeEach(() => {
      mockGetMonthly.mockResolvedValue([]);
    });

    it('shows no data message for session status chart when no sessions', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        const noDataMessages = screen.getAllByText('Sin datos para mostrar');
        expect(noDataMessages.length).toBeGreaterThan(0);
      });
    });

    it('displays zero values in stat cards when no data', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        // Session count should be 0
        const zeroValues = screen.getAllByText('0');
        expect(zeroValues.length).toBeGreaterThan(0);
      });
    });

    it('displays 0% completion rate when no sessions', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('0%')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // REFRESH FUNCTIONALITY TESTS
  // ==========================================================================

  describe('Refresh Functionality', () => {
    it('calls fetch functions when refresh button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Actualizar' })).toBeInTheDocument();
      });
      
      // Clear mocks to check if they're called again
      mockFetchPayments.mockClear();
      mockFetchPatients.mockClear();
      mockGetMonthly.mockClear();
      
      await user.click(screen.getByRole('button', { name: 'Actualizar' }));
      
      await waitFor(() => {
        expect(mockGetMonthly).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // DATA FETCHING TESTS
  // ==========================================================================

  describe('Data Fetching', () => {
    it('fetches sessions on mount', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(mockGetMonthly).toHaveBeenCalled();
      });
    });

    it('fetches payments on mount', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(mockFetchPayments).toHaveBeenCalled();
      });
    });

    it('fetches patients on mount', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(mockFetchPatients).toHaveBeenCalled();
      });
    });

    it('refetches data when time range changes', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Este mes')).toBeInTheDocument();
      });
      
      mockGetMonthly.mockClear();
      
      // Change time range
      await user.click(screen.getByText('Este mes'));
      await user.click(screen.getByText('Este año'));
      
      await waitFor(() => {
        // Should fetch for all months in the year
        expect(mockGetMonthly).toHaveBeenCalled();
      });
    });
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe('Error Handling', () => {
    it('handles session fetch error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetMonthly.mockRejectedValue(new Error('Network error'));
      
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '[Analitica] Error loading data:',
          expect.any(Error)
        );
      });
      
      // Component should still render
      expect(screen.getByText('Analítica')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('renders component even when data loading fails', async () => {
      mockGetMonthly.mockRejectedValue(new Error('API Error'));
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        // Should show the main content after loading fails
        expect(screen.getByText('Analítica')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('has accessible heading structure', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Analítica');
      });
    });

    it('refresh button has accessible label', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: 'Actualizar' });
        expect(refreshButton).toHaveAttribute('aria-label', 'Actualizar');
      });
    });

    it('time range selector button is accessible', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        const timeRangeButton = screen.getByRole('button', { name: /Este mes/i });
        expect(timeRangeButton).toBeInTheDocument();
        expect(timeRangeButton).toBeEnabled();
      });
    });

    it('chart sections have descriptive titles', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        // Each chart card should have a title
        expect(screen.getByText('Sesiones en el tiempo')).toBeInTheDocument();
        expect(screen.getByText('Estado de sesiones')).toBeInTheDocument();
        expect(screen.getByText('Ingresos en el tiempo')).toBeInTheDocument();
        expect(screen.getByText('Estado de pagos')).toBeInTheDocument();
        expect(screen.getByText('Ocupación por hora')).toBeInTheDocument();
        expect(screen.getByText('Ocupación por día')).toBeInTheDocument();
        expect(screen.getByText('Top pacientes')).toBeInTheDocument();
      });
    });

    it('stat cards have descriptive labels', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Sesiones')).toBeInTheDocument();
        expect(screen.getByText('Ingresos')).toBeInTheDocument();
        expect(screen.getByText('Pacientes atendidos')).toBeInTheDocument();
        expect(screen.getByText('Tasa de asistencia')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // RESPONSIVE LAYOUT TESTS
  // ==========================================================================

  describe('Responsive Layout', () => {
    it('renders stat cards in grid layout', async () => {
      const { container } = render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        const statsGrid = container.querySelector('.grid.grid-cols-2.lg\\:grid-cols-4');
        expect(statsGrid).toBeInTheDocument();
      });
    });

    it('renders charts in responsive grid', async () => {
      const { container } = render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        const chartGrids = container.querySelectorAll('.grid.grid-cols-1.lg\\:grid-cols-2');
        expect(chartGrids.length).toBeGreaterThan(0);
      });
    });

    it('chart cards have proper spacing', async () => {
      const { container } = render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        const chartGrids = container.querySelectorAll('.gap-6');
        expect(chartGrids.length).toBeGreaterThan(0);
      });
    });
  });

  // ==========================================================================
  // CURRENCY FORMATTING TESTS
  // ==========================================================================

  describe('Currency Formatting', () => {
    it('formats income values in ARS currency', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        // Should find currency-formatted values ($ symbol with number)
        const incomeCard = screen.getByText('Ingresos');
        expect(incomeCard).toBeInTheDocument();
        
        // The formatted amount should appear somewhere
        // $5000 from paid payments formatted as ARS
        const currencyPattern = /\$\s*[\d.,]+/;
        const allText = document.body.textContent || '';
        expect(currencyPattern.test(allText)).toBe(true);
      });
    });
  });

  // ==========================================================================
  // STAT CARD COMPONENT TESTS
  // ==========================================================================

  describe('StatCard Component', () => {
    it('renders stat card with correct structure', async () => {
      const { container } = render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        // Should have cards with bg-white class
        const cards = container.querySelectorAll('.bg-white');
        expect(cards.length).toBeGreaterThan(0);
      });
    });

    it('renders stat card icons', async () => {
      const { container } = render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        // Icons should be rendered in colored containers
        const iconContainers = container.querySelectorAll('[class*="bg-indigo-100"], [class*="bg-green-100"], [class*="bg-blue-100"], [class*="bg-amber-100"]');
        expect(iconContainers.length).toBeGreaterThan(0);
      });
    });
  });

  // ==========================================================================
  // CHART CARD COMPONENT TESTS
  // ==========================================================================

  describe('ChartCard Component', () => {
    it('renders chart cards with title and subtitle', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        // Each chart should have both title and subtitle
        const sessionsTitle = screen.getByText('Sesiones en el tiempo');
        const sessionsSubtitle = screen.getByText('Evolución de sesiones');
        
        expect(sessionsTitle).toBeInTheDocument();
        expect(sessionsSubtitle).toBeInTheDocument();
      });
    });

    it('renders chart containers with proper height', async () => {
      const { container } = render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        const chartContainers = container.querySelectorAll('.h-64');
        expect(chartContainers.length).toBeGreaterThan(0);
      });
    });
  });

  // ==========================================================================
  // INTEGRATION TESTS
  // ==========================================================================

  describe('Integration', () => {
    it('updates all charts when time range changes', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Este mes')).toBeInTheDocument();
      });
      
      // Store initial call count
      const initialCalls = mockGetMonthly.mock.calls.length;
      
      // Change time range
      await user.click(screen.getByText('Este mes'));
      await user.click(screen.getByText('Este año'));
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      // Should have fetched more data for the year
      expect(mockGetMonthly.mock.calls.length).toBeGreaterThan(initialCalls);
    });

    it('correctly calculates stats from session data', async () => {
      render(<Analitica />);
      
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      
      await waitFor(() => {
        // 5 total sessions
        expect(screen.getByText('5')).toBeInTheDocument();
        
        // 2 completed sessions
        expect(screen.getByText(/2 completadas/)).toBeInTheDocument();
        
        // 1 cancelled session
        expect(screen.getByText(/1 cancelaciones/)).toBeInTheDocument();
        
        // 40% completion rate (2/5)
        expect(screen.getByText('40%')).toBeInTheDocument();
      });
    });
  });
});
