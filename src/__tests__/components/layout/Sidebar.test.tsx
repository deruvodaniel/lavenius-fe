import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../../../components/layout/Sidebar';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'landing.brand': 'Lavenius',
        'landing.tagline': 'Tu asistente de terapia',
        'navigation.agenda': 'Agenda',
        'navigation.patients': 'Pacientes',
        'navigation.payments': 'Cobros',
        'navigation.analytics': 'Analítica',
        'navigation.settings': 'Configuración',
        'navigation.help': 'Ayuda',
        'navigation.logout': 'Cerrar sesión',
        'logout.confirmTitle': '¿Cerrar sesión?',
        'logout.confirmDescription': '¿Estás seguro que deseas cerrar sesión?',
        'common.cancel': 'Cancelar',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock useAuth hook
const mockUser = {
  id: '1',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
};

const mockUseAuth = vi.fn(() => ({
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  clearError: vi.fn(),
}));

vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock ConfirmDialog
vi.mock('@/components/shared', () => ({
  ConfirmDialog: ({ 
    open, 
    onConfirm, 
    onOpenChange,
    title,
    description,
    confirmLabel,
    cancelLabel,
  }: {
    open: boolean;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
  }) => {
    if (!open) return null;
    return (
      <div role="alertdialog" aria-modal="true" data-testid="confirm-dialog">
        <h2>{title}</h2>
        <p>{description}</p>
        <button onClick={() => onOpenChange(false)}>{cancelLabel}</button>
        <button onClick={onConfirm}>{confirmLabel}</button>
      </div>
    );
  },
}));

interface RenderSidebarOptions {
  currentPath?: string;
  onLogout?: () => void;
  showHeader?: boolean;
  onNavigate?: () => void;
  initialEntries?: string[];
}

const renderSidebar = ({
  currentPath = '/dashboard/agenda',
  onLogout = vi.fn(),
  showHeader = true,
  onNavigate,
  initialEntries = ['/dashboard/agenda'],
}: RenderSidebarOptions = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Sidebar
        currentPath={currentPath}
        onLogout={onLogout}
        showHeader={showHeader}
        onNavigate={onNavigate}
      />
    </MemoryRouter>
  );
};

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      clearError: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the sidebar with brand and tagline when showHeader is true', () => {
      renderSidebar({ showHeader: true });

      expect(screen.getByText('Lavenius')).toBeInTheDocument();
      expect(screen.getByText('Tu asistente de terapia')).toBeInTheDocument();
    });

    it('hides header when showHeader is false', () => {
      renderSidebar({ showHeader: false });

      expect(screen.queryByText('Lavenius')).not.toBeInTheDocument();
      expect(screen.queryByText('Tu asistente de terapia')).not.toBeInTheDocument();
    });

    it('renders all main navigation items', () => {
      renderSidebar();

      expect(screen.getByText('Agenda')).toBeInTheDocument();
      expect(screen.getByText('Pacientes')).toBeInTheDocument();
      expect(screen.getByText('Cobros')).toBeInTheDocument();
      expect(screen.getByText('Analítica')).toBeInTheDocument();
    });

    it('renders settings and help links', () => {
      renderSidebar();

      expect(screen.getByText('Configuración')).toBeInTheDocument();
      expect(screen.getByText('Ayuda')).toBeInTheDocument();
    });

    it('renders logout button', () => {
      renderSidebar();

      expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
    });
  });

  describe('User Profile', () => {
    it('displays user initials in avatar', () => {
      renderSidebar();

      // User initials should be TU (Test User)
      expect(screen.getByText('TU')).toBeInTheDocument();
    });

    it('displays user full name', () => {
      renderSidebar();

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('displays user email', () => {
      renderSidebar();

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('does not render user section when user is null', () => {
      mockUseAuth.mockReturnValue({
        user: null as unknown as { id: string; firstName: string; lastName: string; email: string },
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        clearError: vi.fn(),
      });

      renderSidebar();

      expect(screen.queryByText('TU')).not.toBeInTheDocument();
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('all navigation items are links', () => {
      renderSidebar();

      const navLinks = screen.getAllByRole('link');
      // 4 main items + settings + help + profile = 7 links
      expect(navLinks.length).toBe(7);
    });

    it('agenda link navigates to correct path', () => {
      renderSidebar();

      const agendaLink = screen.getByRole('link', { name: /agenda/i });
      expect(agendaLink).toHaveAttribute('href', '/dashboard/agenda');
    });

    it('patients link navigates to correct path', () => {
      renderSidebar();

      const patientsLink = screen.getByRole('link', { name: /pacientes/i });
      expect(patientsLink).toHaveAttribute('href', '/dashboard/pacientes');
    });

    it('payments link navigates to correct path', () => {
      renderSidebar();

      const paymentsLink = screen.getByRole('link', { name: /cobros/i });
      expect(paymentsLink).toHaveAttribute('href', '/dashboard/cobros');
    });

    it('analytics link navigates to correct path', () => {
      renderSidebar();

      const analyticsLink = screen.getByRole('link', { name: /analítica/i });
      expect(analyticsLink).toHaveAttribute('href', '/dashboard/analitica');
    });

    it('settings link navigates to correct path', () => {
      renderSidebar();

      const settingsLink = screen.getByRole('link', { name: /configuración/i });
      expect(settingsLink).toHaveAttribute('href', '/dashboard/configuracion');
    });

    it('help link navigates to correct path', () => {
      renderSidebar();

      const helpLink = screen.getByRole('link', { name: /ayuda/i });
      expect(helpLink).toHaveAttribute('href', '/dashboard/ayuda');
    });

    it('profile link navigates to correct path', () => {
      renderSidebar();

      const profileLink = screen.getByRole('link', { name: /test user/i });
      expect(profileLink).toHaveAttribute('href', '/dashboard/perfil');
    });

    it('calls onNavigate callback when navigation item is clicked', async () => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();

      renderSidebar({ onNavigate });

      await user.click(screen.getByRole('link', { name: /agenda/i }));

      expect(onNavigate).toHaveBeenCalledTimes(1);
    });

    it('calls onNavigate for each navigation item clicked', async () => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();

      renderSidebar({ onNavigate });

      await user.click(screen.getByRole('link', { name: /pacientes/i }));
      expect(onNavigate).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('link', { name: /cobros/i }));
      expect(onNavigate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Active State', () => {
    it('highlights active navigation item when on agenda route', () => {
      renderSidebar({ initialEntries: ['/dashboard/agenda'] });

      const agendaLink = screen.getByRole('link', { name: /agenda/i });
      expect(agendaLink).toHaveClass('bg-indigo-700');
    });

    it('highlights active navigation item when on patients route', () => {
      renderSidebar({ initialEntries: ['/dashboard/pacientes'] });

      const patientsLink = screen.getByRole('link', { name: /pacientes/i });
      expect(patientsLink).toHaveClass('bg-indigo-700');
    });

    it('highlights active navigation item when on payments route', () => {
      renderSidebar({ initialEntries: ['/dashboard/cobros'] });

      const paymentsLink = screen.getByRole('link', { name: /cobros/i });
      expect(paymentsLink).toHaveClass('bg-indigo-700');
    });
  });

  describe('Logout Flow', () => {
    it('shows confirmation dialog when logout button is clicked', async () => {
      const user = userEvent.setup();

      renderSidebar();

      await user.click(screen.getByRole('button', { name: /cerrar sesión/i }));

      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      expect(screen.getByText('¿Cerrar sesión?')).toBeInTheDocument();
    });

    it('calls onLogout when logout is confirmed', async () => {
      const onLogout = vi.fn();
      const user = userEvent.setup();

      renderSidebar({ onLogout });

      // Click logout button to open dialog
      await user.click(screen.getByRole('button', { name: /cerrar sesión/i }));

      // Confirm logout
      const dialog = screen.getByTestId('confirm-dialog');
      const confirmButton = within(dialog).getByRole('button', { name: /cerrar sesión/i });
      await user.click(confirmButton);

      expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it('closes dialog when cancel is clicked', async () => {
      const user = userEvent.setup();

      renderSidebar();

      // Click logout button to open dialog
      await user.click(screen.getByRole('button', { name: /cerrar sesión/i }));
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();

      // Click cancel
      const dialog = screen.getByTestId('confirm-dialog');
      const cancelButton = within(dialog).getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
      });
    });

    it('does not call onLogout when cancel is clicked', async () => {
      const onLogout = vi.fn();
      const user = userEvent.setup();

      renderSidebar({ onLogout });

      // Click logout button to open dialog
      await user.click(screen.getByRole('button', { name: /cerrar sesión/i }));

      // Click cancel
      const dialog = screen.getByTestId('confirm-dialog');
      const cancelButton = within(dialog).getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(onLogout).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('navigation section uses nav element', () => {
      renderSidebar();

      const nav = document.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('all navigation links are accessible by role', () => {
      renderSidebar();

      expect(screen.getByRole('link', { name: /agenda/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /pacientes/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /cobros/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /analítica/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /configuración/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /ayuda/i })).toBeInTheDocument();
    });

    it('logout button is accessible by role', () => {
      renderSidebar();

      expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
    });

    it('user profile link is accessible', () => {
      renderSidebar();

      const profileLink = screen.getByRole('link', { name: /test user/i });
      expect(profileLink).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigation links are focusable', async () => {
      const user = userEvent.setup();
      renderSidebar();

      const agendaLink = screen.getByRole('link', { name: /agenda/i });
      agendaLink.focus();
      expect(agendaLink).toHaveFocus();

      await user.tab();
      const patientsLink = screen.getByRole('link', { name: /pacientes/i });
      expect(patientsLink).toHaveFocus();
    });

    it('logout button is focusable', () => {
      renderSidebar();

      const logoutButton = screen.getByRole('button', { name: /cerrar sesión/i });
      logoutButton.focus();
      expect(logoutButton).toHaveFocus();
    });

    it('can activate navigation link with Enter key', async () => {
      const onNavigate = vi.fn();
      const user = userEvent.setup();

      renderSidebar({ onNavigate });

      const agendaLink = screen.getByRole('link', { name: /agenda/i });
      agendaLink.focus();

      await user.keyboard('{Enter}');

      expect(onNavigate).toHaveBeenCalled();
    });

    it('can activate logout button with Enter key', async () => {
      const user = userEvent.setup();

      renderSidebar();

      const logoutButton = screen.getByRole('button', { name: /cerrar sesión/i });
      logoutButton.focus();

      await user.keyboard('{Enter}');

      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles user with single character names', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          firstName: 'A',
          lastName: 'B',
          email: 'ab@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        clearError: vi.fn(),
      });

      renderSidebar();

      expect(screen.getByText('AB')).toBeInTheDocument();
      expect(screen.getByText('A B')).toBeInTheDocument();
    });

    it('handles user with lowercase names', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: '1',
          firstName: 'john',
          lastName: 'doe',
          email: 'john@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        register: vi.fn(),
        clearError: vi.fn(),
      });

      renderSidebar();

      // Initials should be uppercase
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('renders correctly without onLogout callback', async () => {
      const user = userEvent.setup();

      renderSidebar({ onLogout: undefined });

      // Should still open dialog
      await user.click(screen.getByRole('button', { name: /cerrar sesión/i }));
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();

      // Confirm should not throw when onLogout is undefined
      const dialog = screen.getByTestId('confirm-dialog');
      const confirmButton = within(dialog).getByRole('button', { name: /cerrar sesión/i });
      await user.click(confirmButton);

      // Dialog should close without error
      await waitFor(() => {
        expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
      });
    });

    it('renders correctly without onNavigate callback', async () => {
      const user = userEvent.setup();

      renderSidebar({ onNavigate: undefined });

      // Navigation should work without error
      await user.click(screen.getByRole('link', { name: /agenda/i }));
      // No error means test passes
    });
  });
});
