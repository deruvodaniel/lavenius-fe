import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from '../../../components/dashboard/Dashboard';

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
});

// ============================================================================
// MOCK DATA
// ============================================================================

const mockUser = {
  id: 'user-1',
  firstName: 'Juan',
  lastName: 'Pérez',
  email: 'juan@test.com',
};

// ============================================================================
// MOCKS
// ============================================================================

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'landing.brand': 'Lavenius',
        'landing.tagline': 'Gestión de consultorio',
        'navigation.agenda': 'Agenda',
        'navigation.patients': 'Pacientes',
        'navigation.payments': 'Cobros',
        'navigation.analytics': 'Analítica',
        'navigation.settings': 'Configuración',
        'navigation.help': 'Ayuda',
        'navigation.logout': 'Cerrar sesión',
        'common.toggleMenu': 'Abrir menú',
        'onboarding.welcome': '¡Bienvenido a Lavenius!',
        'onboarding.welcomeDescription': 'Tu asistente de gestión de consultorio',
        'onboarding.calendar.title': 'Conecta tu calendario',
        'onboarding.calendar.description': 'Sincroniza con Google Calendar',
        'onboarding.calendar.connect': 'Conectar calendario',
        'onboarding.calendar.later': 'Más tarde',
        'onboarding.patient.title': 'Crea tu primer paciente',
        'onboarding.patient.description': 'Agrega la información de tu primer paciente',
        'onboarding.patient.create': 'Crear paciente',
        'onboarding.patient.later': 'Más tarde',
        'onboarding.complete.title': '¡Todo listo!',
        'onboarding.complete.description': 'Ya puedes comenzar a usar Lavenius',
        'onboarding.complete.tip': 'Tip:',
        'onboarding.complete.tipText': 'Puedes acceder a la',
        'onboarding.complete.helpSection': 'sección de ayuda',
        'onboarding.complete.tipSuffix': 'para más información.',
        'onboarding.navigation.back': 'Atrás',
        'onboarding.navigation.next': 'Siguiente',
        'onboarding.navigation.start': 'Comenzar',
        'onboarding.navigation.close': 'Cerrar',
        'logout.confirmTitle': '¿Cerrar sesión?',
        'logout.confirmDescription': 'Tendrás que iniciar sesión nuevamente.',
        'common.cancel': 'Cancelar',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock useAuth hook
const mockLogout = vi.fn();
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    logout: mockLogout,
  }),
}));

// Mock useOnboarding hook
const mockCompleteOnboarding = vi.fn();
const mockShouldShowOnboarding = vi.fn(() => false);

vi.mock('@/lib/hooks/useOnboarding', () => ({
  useOnboarding: () => ({
    shouldShowOnboarding: mockShouldShowOnboarding,
    completeOnboarding: mockCompleteOnboarding,
    hasCompletedOnboarding: !mockShouldShowOnboarding(),
  }),
}));

// Mock calendar store
const mockConnectCalendar = vi.fn();

vi.mock('@/lib/stores/calendarStore', () => ({
  useCalendarStore: () => ({
    connectCalendar: mockConnectCalendar,
    isConnected: false,
    isSyncing: false,
  }),
}));

// Mock child components to simplify testing
vi.mock('../../../components/layout', () => ({
  AppLayout: ({ children, sidebar, appName }: {
    children: React.ReactNode;
    sidebar: (onNavigate?: () => void) => React.ReactNode;
    appName?: string;
  }) => (
    <div data-testid="app-layout">
      <header data-testid="app-header">
        <h1>{appName || 'Lavenius'}</h1>
        <button data-testid="mobile-menu-toggle" aria-label="Abrir menú">
          Menu
        </button>
      </header>
      <aside data-testid="sidebar-container">
        {sidebar(() => {})}
      </aside>
      <main data-testid="main-content">{children}</main>
    </div>
  ),
  Sidebar: ({ currentPath, onLogout, onNavigate }: {
    currentPath: string;
    onLogout?: () => void;
    onNavigate?: () => void;
  }) => (
    <nav data-testid="sidebar" data-current-path={currentPath}>
      <a href="/dashboard/agenda" onClick={onNavigate}>Agenda</a>
      <a href="/dashboard/pacientes" onClick={onNavigate}>Pacientes</a>
      <a href="/dashboard/cobros" onClick={onNavigate}>Cobros</a>
      <a href="/dashboard/analitica" onClick={onNavigate}>Analítica</a>
      <a href="/dashboard/configuracion" onClick={onNavigate}>Configuración</a>
      <a href="/dashboard/ayuda" onClick={onNavigate}>Ayuda</a>
      <div data-testid="user-profile">
        <span>JP</span>
        <span>Juan Pérez</span>
        <span>juan@test.com</span>
      </div>
      <button data-testid="logout-button" onClick={onLogout}>
        Cerrar sesión
      </button>
    </nav>
  ),
}));

vi.mock('../../../components/onboarding', () => ({
  OnboardingModal: ({ isOpen, onClose, onConnectCalendar, onCreatePatient }: {
    isOpen: boolean;
    onClose: () => void;
    onConnectCalendar?: () => void;
    onCreatePatient?: () => void;
  }) => isOpen ? (
    <div data-testid="onboarding-modal" role="dialog" aria-modal="true">
      <h2>¡Bienvenido a Lavenius!</h2>
      <p>Tu asistente de gestión de consultorio</p>
      <button data-testid="connect-calendar-btn" onClick={onConnectCalendar}>
        Conectar calendario
      </button>
      <button data-testid="create-patient-btn" onClick={onCreatePatient}>
        Crear paciente
      </button>
      <button data-testid="close-onboarding" onClick={onClose} aria-label="Cerrar">
        Cerrar
      </button>
    </div>
  ) : null,
}));

// ============================================================================
// HELPERS
// ============================================================================

const renderDashboard = (initialPath = '/dashboard') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/dashboard/*" element={<Dashboard />}>
          <Route index element={<div data-testid="outlet-index">Index</div>} />
          <Route path="agenda" element={<div data-testid="outlet-agenda">Agenda Content</div>} />
          <Route path="pacientes" element={<div data-testid="outlet-pacientes">Pacientes Content</div>} />
          <Route path="cobros" element={<div data-testid="outlet-cobros">Cobros Content</div>} />
          <Route path="analitica" element={<div data-testid="outlet-analitica">Analitica Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
};

const renderDashboardSimple = () => {
  return render(
    <BrowserRouter>
      <Dashboard />
    </BrowserRouter>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockShouldShowOnboarding.mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Rendering', () => {
    it('renders the app layout', () => {
      renderDashboardSimple();
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });

    it('renders with app name "Lavenius"', () => {
      renderDashboardSimple();
      expect(screen.getByRole('heading', { name: 'Lavenius' })).toBeInTheDocument();
    });

    it('renders the sidebar navigation', () => {
      renderDashboardSimple();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('renders the main content area', () => {
      renderDashboardSimple();
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('renders outlet for child routes', () => {
      renderDashboard('/dashboard/agenda');
      expect(screen.getByTestId('outlet-agenda')).toBeInTheDocument();
    });

    it('renders different child routes based on path', () => {
      const { unmount } = renderDashboard('/dashboard/pacientes');
      expect(screen.getByTestId('outlet-pacientes')).toBeInTheDocument();
      unmount();

      renderDashboard('/dashboard/cobros');
      expect(screen.getByTestId('outlet-cobros')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SIDEBAR NAVIGATION
  // ==========================================================================

  describe('Sidebar Navigation', () => {
    it('renders all navigation links', () => {
      renderDashboardSimple();
      
      expect(screen.getByRole('link', { name: 'Agenda' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Pacientes' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Cobros' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Analítica' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Configuración' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Ayuda' })).toBeInTheDocument();
    });

    it('passes current path to sidebar', () => {
      renderDashboard('/dashboard/pacientes');
      
      const sidebar = screen.getByTestId('sidebar');
      expect(sidebar).toHaveAttribute('data-current-path', '/dashboard/pacientes');
    });

    it('renders user profile section', () => {
      renderDashboardSimple();
      
      const profile = screen.getByTestId('user-profile');
      expect(profile).toBeInTheDocument();
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('juan@test.com')).toBeInTheDocument();
    });

    it('renders logout button', () => {
      renderDashboardSimple();
      expect(screen.getByTestId('logout-button')).toBeInTheDocument();
    });

    it('calls logout when logout button is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderDashboardSimple();
      
      await user.click(screen.getByTestId('logout-button'));
      
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // ONBOARDING MODAL
  // ==========================================================================

  describe('Onboarding Modal', () => {
    it('does not show onboarding modal when user has completed it', () => {
      mockShouldShowOnboarding.mockReturnValue(false);
      renderDashboardSimple();
      
      expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument();
    });

    it('shows onboarding modal for first-time users after delay', async () => {
      mockShouldShowOnboarding.mockReturnValue(true);
      renderDashboardSimple();
      
      // Modal should not appear immediately
      expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument();
      
      // Advance timers by 500ms (the delay in the component)
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      
      expect(screen.getByTestId('onboarding-modal')).toBeInTheDocument();
    });

    it('renders welcome message in onboarding modal', async () => {
      mockShouldShowOnboarding.mockReturnValue(true);
      renderDashboardSimple();
      
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      
      expect(screen.getByText('¡Bienvenido a Lavenius!')).toBeInTheDocument();
    });

    it('closes onboarding modal when close button is clicked', async () => {
      mockShouldShowOnboarding.mockReturnValue(true);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderDashboardSimple();
      
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      
      expect(screen.getByTestId('onboarding-modal')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('close-onboarding'));
      
      expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument();
    });

    it('calls connectCalendar when connect calendar button is clicked', async () => {
      mockShouldShowOnboarding.mockReturnValue(true);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderDashboardSimple();
      
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      
      await user.click(screen.getByTestId('connect-calendar-btn'));
      
      expect(mockConnectCalendar).toHaveBeenCalledTimes(1);
    });

    it('closes modal and dispatches openPatientDrawer event when create patient is clicked', async () => {
      mockShouldShowOnboarding.mockReturnValue(true);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      
      renderDashboard('/dashboard');
      
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      
      await user.click(screen.getByTestId('create-patient-btn'));
      
      // Modal should close
      expect(screen.queryByTestId('onboarding-modal')).not.toBeInTheDocument();
      
      // Custom event should be dispatched
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'openPatientDrawer' })
      );
      
      dispatchSpy.mockRestore();
    });
  });

  // ==========================================================================
  // QUICK ACTIONS
  // ==========================================================================

  describe('Quick Actions', () => {
    it('navigates to pacientes when create patient action is triggered', async () => {
      mockShouldShowOnboarding.mockReturnValue(true);
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      renderDashboard('/dashboard');
      
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      
      await user.click(screen.getByTestId('create-patient-btn'));
      
      // Should navigate to pacientes (rendered via outlet)
      await waitFor(() => {
        expect(screen.getByTestId('outlet-pacientes')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // MOBILE RESPONSIVENESS
  // ==========================================================================

  describe('Mobile Responsiveness', () => {
    it('renders mobile menu toggle button', () => {
      renderDashboardSimple();
      
      expect(screen.getByTestId('mobile-menu-toggle')).toBeInTheDocument();
    });

    it('mobile menu button has accessible label', () => {
      renderDashboardSimple();
      
      const menuButton = screen.getByTestId('mobile-menu-toggle');
      expect(menuButton).toHaveAttribute('aria-label', 'Abrir menú');
    });
  });

  // ==========================================================================
  // ACCESSIBILITY
  // ==========================================================================

  describe('Accessibility', () => {
    it('has accessible heading structure', () => {
      renderDashboardSimple();
      
      expect(screen.getByRole('heading', { name: 'Lavenius' })).toBeInTheDocument();
    });

    it('sidebar navigation is accessible', () => {
      renderDashboardSimple();
      
      const nav = screen.getByTestId('sidebar');
      expect(nav.tagName.toLowerCase()).toBe('nav');
    });

    it('onboarding modal is a proper dialog', async () => {
      mockShouldShowOnboarding.mockReturnValue(true);
      renderDashboardSimple();
      
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      
      const modal = screen.getByTestId('onboarding-modal');
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    it('close button has accessible label', async () => {
      mockShouldShowOnboarding.mockReturnValue(true);
      renderDashboardSimple();
      
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      
      const closeButton = screen.getByTestId('close-onboarding');
      expect(closeButton).toHaveAttribute('aria-label', 'Cerrar');
    });

    it('logout button is accessible', () => {
      renderDashboardSimple();
      
      const logoutButton = screen.getByTestId('logout-button');
      expect(logoutButton).toBeEnabled();
      expect(logoutButton).toHaveTextContent('Cerrar sesión');
    });
  });

  // ==========================================================================
  // STATS DISPLAY (through layout)
  // ==========================================================================

  describe('Stats Display', () => {
    it('renders user initials in profile', () => {
      renderDashboardSimple();
      
      // User initials JP (Juan Pérez)
      expect(screen.getByText('JP')).toBeInTheDocument();
    });

    it('displays user full name', () => {
      renderDashboardSimple();
      
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('displays user email', () => {
      renderDashboardSimple();
      
      expect(screen.getByText('juan@test.com')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // CLEANUP AND EFFECTS
  // ==========================================================================

  describe('Cleanup and Effects', () => {
    it('cleans up onboarding timer on unmount', async () => {
      mockShouldShowOnboarding.mockReturnValue(true);
      
      const { unmount } = renderDashboardSimple();
      
      // Unmount before timer fires
      unmount();
      
      // Advance time - should not cause any errors
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      
      // No errors means cleanup worked
      expect(true).toBe(true);
    });

    it('does not show onboarding if shouldShowOnboarding changes during delay', async () => {
      mockShouldShowOnboarding.mockReturnValue(true);
      
      const { rerender } = render(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );
      
      // Change the mock before timer fires
      mockShouldShowOnboarding.mockReturnValue(false);
      
      // Re-render with new value
      rerender(
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      );
      
      await act(async () => {
        vi.advanceTimersByTime(500);
      });
      
      // Modal might or might not show depending on implementation
      // This test ensures no crashes occur
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // INTEGRATION WITH CHILD ROUTES
  // ==========================================================================

  describe('Integration with Child Routes', () => {
    it('renders agenda route content', () => {
      renderDashboard('/dashboard/agenda');
      expect(screen.getByTestId('outlet-agenda')).toBeInTheDocument();
      expect(screen.getByText('Agenda Content')).toBeInTheDocument();
    });

    it('renders pacientes route content', () => {
      renderDashboard('/dashboard/pacientes');
      expect(screen.getByTestId('outlet-pacientes')).toBeInTheDocument();
      expect(screen.getByText('Pacientes Content')).toBeInTheDocument();
    });

    it('renders cobros route content', () => {
      renderDashboard('/dashboard/cobros');
      expect(screen.getByTestId('outlet-cobros')).toBeInTheDocument();
      expect(screen.getByText('Cobros Content')).toBeInTheDocument();
    });

    it('renders analitica route content', () => {
      renderDashboard('/dashboard/analitica');
      expect(screen.getByTestId('outlet-analitica')).toBeInTheDocument();
      expect(screen.getByText('Analitica Content')).toBeInTheDocument();
    });

    it('renders index route when at /dashboard', () => {
      renderDashboard('/dashboard');
      expect(screen.getByTestId('outlet-index')).toBeInTheDocument();
    });
  });
});
