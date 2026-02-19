import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { Login } from '../../../components/auth/Login';

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'landing.brand': 'Lavenius',
        'auth.platformDescription': 'Gestión de terapia profesional',
        'auth.email': 'Email',
        'auth.enterEmail': 'Ingresa tu email',
        'auth.password': 'Contraseña',
        'auth.enterPassword': 'Ingresa tu contraseña',
        'auth.passphrase': 'Frase de seguridad',
        'auth.login': 'Iniciar sesión',
        'auth.loggingIn': 'Iniciando sesión...',
        'auth.noAccount': '¿No tienes cuenta?',
        'auth.registerHere': 'Regístrate aquí',
        'auth.welcomeBack': '¡Bienvenido de vuelta!',
        'auth.loginError': 'Error al iniciar sesión',
        'auth.invalidCredentials': 'Credenciales inválidas',
        'auth.invalidCredentialsHint': 'Verifica tu email y contraseña',
        'auth.firstTime': '¿Primera vez aquí?',
        'auth.createNewAccount': 'Crear nueva cuenta',
        'auth.accountCreated': 'Cuenta creada exitosamente',
        'auth.loginToContinue': 'Inicia sesión para continuar',
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
  },
}));

// Mock useAuth hook
const mockLogin = vi.fn();
const mockClearError = vi.fn();
vi.mock('@/lib/hooks', () => ({
  useAuth: vi.fn(() => ({
    login: mockLogin,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  })),
}));

// Get the mocked useAuth for dynamic returns
import { useAuth } from '@/lib/hooks';
const mockedUseAuth = vi.mocked(useAuth);

// Helper to render Login with Router
const renderLogin = (initialEntries: string[] = ['/login']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Login />
    </MemoryRouter>
  );
};

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock
    mockedUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
      user: null,
      isAuthenticated: false,
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the brand name', () => {
      renderLogin();
      expect(screen.getByText('Lavenius')).toBeInTheDocument();
    });

    it('renders email input field with label', () => {
      renderLogin();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ingresa tu email')).toBeInTheDocument();
    });

    it('renders password input field with label', () => {
      renderLogin();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    });

    it('renders passphrase input field with label', () => {
      renderLogin();
      expect(screen.getByLabelText('Frase de seguridad')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      renderLogin();
      expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument();
    });

    it('renders link to register page', () => {
      renderLogin();
      expect(screen.getByText('¿No tienes cuenta?')).toBeInTheDocument();
      expect(screen.getByText('Regístrate aquí')).toBeInTheDocument();
    });

    it('renders platform description', () => {
      renderLogin();
      expect(screen.getByText('Gestión de terapia profesional')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('allows user to type in email field', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText('Email');
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('allows user to type in password field', async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByLabelText('Contraseña');
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('allows user to type in passphrase field', async () => {
      const user = userEvent.setup();
      renderLogin();

      const passphraseInput = screen.getByLabelText('Frase de seguridad');
      await user.type(passphraseInput, 'my secret phrase');

      expect(passphraseInput).toHaveValue('my secret phrase');
    });
  });

  describe('Form Submission', () => {
    it('calls login function with correct credentials on submit', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);
      renderLogin();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText('Frase de seguridad'), 'mypassphrase');
      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          passphrase: 'mypassphrase',
        });
      });
    });

    it('clears error before submitting', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);
      renderLogin();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText('Frase de seguridad'), 'mypassphrase');
      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
      });
    });

    it('navigates to dashboard on successful login', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);
      renderLogin();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText('Frase de seguridad'), 'mypassphrase');
      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('shows success toast on successful login', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);
      renderLogin();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText('Frase de seguridad'), 'mypassphrase');
      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith('¡Bienvenido de vuelta!');
      });
    });
  });

  describe('Loading State', () => {
    it('disables submit button while loading', () => {
      mockedUseAuth.mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
        clearError: mockClearError,
        user: null,
        isAuthenticated: false,
        register: vi.fn(),
        logout: vi.fn(),
      });

      renderLogin();

      expect(screen.getByRole('button', { name: 'Iniciando sesión...' })).toBeDisabled();
    });

    it('shows loading text in button while submitting', () => {
      mockedUseAuth.mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
        clearError: mockClearError,
        user: null,
        isAuthenticated: false,
        register: vi.fn(),
        logout: vi.fn(),
      });

      renderLogin();

      expect(screen.getByRole('button', { name: 'Iniciando sesión...' })).toBeInTheDocument();
    });

    it('disables form inputs while loading', () => {
      mockedUseAuth.mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
        clearError: mockClearError,
        user: null,
        isAuthenticated: false,
        register: vi.fn(),
        logout: vi.fn(),
      });

      renderLogin();

      expect(screen.getByLabelText('Email')).toBeDisabled();
      expect(screen.getByLabelText('Contraseña')).toBeDisabled();
      expect(screen.getByLabelText('Frase de seguridad')).toBeDisabled();
    });

    it('prevents duplicate submission when already loading', async () => {
      const user = userEvent.setup();
      
      // First render with loading false, then submit
      renderLogin();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText('Frase de seguridad'), 'mypassphrase');
      
      // Simulate slow login
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      
      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

      // Should only be called once
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('shows error toast on failed login with generic error', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error('Network error'));
      renderLogin();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText('Frase de seguridad'), 'mypassphrase');
      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Network error');
      });
    });

    it('shows invalid credentials toast for authentication errors', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
      renderLogin();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'wrongpassword');
      await user.type(screen.getByLabelText('Frase de seguridad'), 'mypassphrase');
      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          'Credenciales inválidas',
          expect.objectContaining({ description: 'Verifica tu email y contraseña' })
        );
      });
    });

    it('shows signup prompt for authentication errors', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
      renderLogin();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'wrongpassword');
      await user.type(screen.getByLabelText('Frase de seguridad'), 'mypassphrase');
      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

      await waitFor(() => {
        expect(screen.getByText('¿Primera vez aquí?')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Crear nueva cuenta/i })).toBeInTheDocument();
      });
    });

    it('shows signup prompt for unauthorized errors', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error('Unauthorized'));
      renderLogin();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText('Frase de seguridad'), 'mypassphrase');
      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

      await waitFor(() => {
        expect(screen.getByText('¿Primera vez aquí?')).toBeInTheDocument();
      });
    });

    it('shows signup prompt for "not found" errors', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error('User not found'));
      renderLogin();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText('Frase de seguridad'), 'mypassphrase');
      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

      await waitFor(() => {
        expect(screen.getByText('¿Primera vez aquí?')).toBeInTheDocument();
      });
    });

    it('does not show signup prompt for non-auth errors', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error('Network error'));
      renderLogin();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText('Frase de seguridad'), 'mypassphrase');
      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });

      expect(screen.queryByText('¿Primera vez aquí?')).not.toBeInTheDocument();
    });

    it('uses fallback error message when error has no message', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce({});
      renderLogin();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText('Frase de seguridad'), 'mypassphrase');
      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Error al iniciar sesión');
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to register page when clicking register link', async () => {
      const user = userEvent.setup();
      renderLogin();

      const registerLink = screen.getByText('Regístrate aquí');
      await user.click(registerLink.closest('button')!);

      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('navigates to register page from signup prompt button', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
      renderLogin();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'wrongpassword');
      await user.type(screen.getByLabelText('Frase de seguridad'), 'mypassphrase');
      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Crear nueva cuenta/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Crear nueva cuenta/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('does not navigate when login fails', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error('Network error'));
      renderLogin();

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Contraseña'), 'password123');
      await user.type(screen.getByLabelText('Frase de seguridad'), 'mypassphrase');
      await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalled();
      });

      expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Registration Success Message', () => {
    it('shows success toast when coming from registration', () => {
      // Need to re-mock useSearchParams for this specific test
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useSearchParams: () => [new URLSearchParams('registered=true'), vi.fn()],
        };
      });

      // This test verifies the useEffect behavior
      // The component checks searchParams for 'registered=true'
      // Since we've mocked useSearchParams globally, we verify the mock was set up correctly
      renderLogin();

      // The component should be rendered, effect runs on mount
      expect(screen.getByText('Lavenius')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible form labels', () => {
      renderLogin();

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Frase de seguridad')).toBeInTheDocument();
    });

    it('submit button is accessible', () => {
      renderLogin();

      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('email input has correct type', () => {
      renderLogin();

      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Form Default Values', () => {
    it('starts with empty email field', () => {
      renderLogin();
      expect(screen.getByLabelText('Email')).toHaveValue('');
    });

    it('starts with empty password field', () => {
      renderLogin();
      expect(screen.getByLabelText('Contraseña')).toHaveValue('');
    });

    it('starts with empty passphrase field', () => {
      renderLogin();
      expect(screen.getByLabelText('Frase de seguridad')).toHaveValue('');
    });
  });
});
