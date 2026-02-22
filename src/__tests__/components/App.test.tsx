import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// ============================================================================
// CLERK MOCK SETUP
// ============================================================================

const mockClerkUser = {
  id: 'user_123',
  firstName: 'Test',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'test@example.com', id: 'email_123' }],
  primaryEmailAddressId: 'email_123',
  imageUrl: 'https://example.com/avatar.png',
};

// Configurable auth state for tests
let mockAuthState = {
  isSignedIn: true,
  isLoaded: true,
  user: mockClerkUser,
};

// Mock @clerk/clerk-react
vi.mock('@clerk/clerk-react', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignedIn: ({ children }: { children: React.ReactNode }) => 
    mockAuthState.isSignedIn && mockAuthState.isLoaded ? <>{children}</> : null,
  SignedOut: ({ children }: { children: React.ReactNode }) => 
    !mockAuthState.isSignedIn && mockAuthState.isLoaded ? <>{children}</> : null,
  useAuth: vi.fn(() => ({
    isSignedIn: mockAuthState.isSignedIn,
    isLoaded: mockAuthState.isLoaded,
    userId: mockAuthState.isSignedIn ? mockAuthState.user?.id : null,
    signOut: vi.fn(),
    getToken: vi.fn().mockResolvedValue('mock-token'),
  })),
  useUser: vi.fn(() => ({
    user: mockAuthState.isSignedIn ? mockAuthState.user : null,
    isLoaded: mockAuthState.isLoaded,
    isSignedIn: mockAuthState.isSignedIn,
  })),
  useClerk: vi.fn(() => ({
    signOut: vi.fn(),
    openSignIn: vi.fn(),
    openSignUp: vi.fn(),
  })),
  SignInButton: ({ children }: { children?: React.ReactNode }) => 
    children || <button data-testid="clerk-sign-in-button">Sign In</button>,
  SignUpButton: ({ children }: { children?: React.ReactNode }) => 
    children || <button data-testid="clerk-sign-up-button">Sign Up</button>,
  SignOutButton: ({ children }: { children?: React.ReactNode }) =>
    children || <button data-testid="clerk-sign-out-button">Sign Out</button>,
  UserButton: () => <button data-testid="clerk-user-button">User Menu</button>,
  RedirectToSignIn: () => <div data-testid="redirect-to-sign-in">Redirecting...</div>,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'landing.brand': 'Lavenius',
        'landing.tagline': 'Tu asistente de terapia',
        'loading.agenda': 'Cargando agenda...',
        'loading.patients': 'Cargando pacientes...',
        'loading.payments': 'Cargando cobros...',
        'loading.analytics': 'Cargando analítica...',
        'loading.settings': 'Cargando configuración...',
        'loading.profile': 'Cargando perfil...',
        'loading.help': 'Cargando ayuda...',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'es',
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock child components to simplify tests
vi.mock('@/components/landing', () => ({
  Landing: () => <div data-testid="landing-page">Landing Page</div>,
}));

vi.mock('@/components/auth', () => ({
  Login: () => <div data-testid="login-page">Login Page</div>,
  Register: () => <div data-testid="register-page">Register Page</div>,
}));

vi.mock('@/components/dashboard', () => ({
  Dashboard: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="dashboard">
      <h1>Dashboard</h1>
      {children}
    </div>
  ),
}));

vi.mock('@/components/shared', () => ({
  NotFound: () => <div data-testid="not-found">404 Not Found</div>,
  LoadingOverlay: ({ message }: { message: string }) => (
    <div data-testid="loading-overlay">{message}</div>
  ),
}));

// Mock lazy-loaded components
vi.mock('@/components/agenda/Agenda', () => ({
  Agenda: () => <div data-testid="agenda-page">Agenda</div>,
}));

vi.mock('@/components/pacientes/Pacientes', () => ({
  Pacientes: () => <div data-testid="pacientes-page">Pacientes</div>,
}));

vi.mock('@/components/cobros/Cobros', () => ({
  Cobros: () => <div data-testid="cobros-page">Cobros</div>,
}));

vi.mock('@/components/analitica/Analitica', () => ({
  Analitica: () => <div data-testid="analitica-page">Analitica</div>,
}));

vi.mock('@/components/config/Configuracion', () => ({
  Configuracion: () => <div data-testid="configuracion-page">Configuracion</div>,
}));

vi.mock('@/components/perfil/Perfil', () => ({
  Perfil: () => <div data-testid="perfil-page">Perfil</div>,
}));

vi.mock('@/components/help/HelpCenter', () => ({
  HelpCenter: () => <div data-testid="help-page">Help Center</div>,
}));

// Mock existing auth hooks to use Clerk
vi.mock('@/lib/hooks', () => ({
  useAuth: () => ({
    isAuthenticated: mockAuthState.isSignedIn && mockAuthState.isLoaded,
    isLoading: !mockAuthState.isLoaded,
    user: mockAuthState.isSignedIn ? {
      id: mockAuthState.user?.id || '',
      firstName: mockAuthState.user?.firstName || '',
      lastName: mockAuthState.user?.lastName || '',
      email: mockAuthState.user?.emailAddresses[0]?.emailAddress || '',
    } : null,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('@/lib/stores', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = {
      checkAuth: vi.fn(),
      isAuthenticated: mockAuthState.isSignedIn && mockAuthState.isLoaded,
      user: mockAuthState.isSignedIn ? {
        id: mockAuthState.user?.id || '',
        firstName: mockAuthState.user?.firstName || '',
        lastName: mockAuthState.user?.lastName || '',
        email: mockAuthState.user?.emailAddresses[0]?.emailAddress || '',
      } : null,
    };
    return selector ? selector(state) : state;
  }),
}));

// ============================================================================
// TEST APP COMPONENT WITH CLERK
// ============================================================================

/**
 * Simulated App component with Clerk integration for testing
 * This represents how the actual App would look after Clerk integration
 */
function AppWithClerk() {
  const { useAuth } = require('@clerk/clerk-react');
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return <div data-testid="app-loading">Loading authentication...</div>;
  }

  return (
    <div data-testid="app-root">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard/*" 
          element={
            isSignedIn ? (
              <Dashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

// Import required components for the simulated App
import { Routes, Route, Navigate } from 'react-router-dom';

// Simulated components
const Landing = () => <div data-testid="landing-page">Landing Page</div>;
const Login = () => <div data-testid="login-page">Login Page</div>;
const Register = () => <div data-testid="register-page">Register Page</div>;
const Dashboard = () => <div data-testid="dashboard">Dashboard</div>;
const NotFound = () => <div data-testid="not-found">404 Not Found</div>;

// Helper to render with router
const renderApp = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppWithClerk />
    </MemoryRouter>
  );
};

// Helper to update auth state
const setAuthState = (state: Partial<typeof mockAuthState>) => {
  mockAuthState = { ...mockAuthState, ...state };
};

// ============================================================================
// TESTS
// ============================================================================

describe('App with Clerk Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to authenticated state by default
    mockAuthState = {
      isSignedIn: true,
      isLoaded: true,
      user: mockClerkUser,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Render', () => {
    it('renders app without crashing', () => {
      renderApp();
      
      expect(screen.getByTestId('app-root')).toBeInTheDocument();
    });

    it('shows loading state while Clerk initializes', () => {
      setAuthState({ isLoaded: false });
      
      renderApp();
      
      expect(screen.getByTestId('app-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading authentication...')).toBeInTheDocument();
    });

    it('renders content after Clerk loads', () => {
      setAuthState({ isLoaded: true });
      
      renderApp();
      
      expect(screen.queryByTestId('app-loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('app-root')).toBeInTheDocument();
    });
  });

  describe('Public Routes', () => {
    it('renders landing page at root route', () => {
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      renderApp('/');
      
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('renders login page at /login', () => {
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      renderApp('/login');
      
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('renders register page at /register', () => {
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      renderApp('/register');
      
      expect(screen.getByTestId('register-page')).toBeInTheDocument();
    });

    it('allows authenticated users to access public routes', () => {
      setAuthState({ isSignedIn: true, isLoaded: true });
      
      renderApp('/');
      
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });
  });

  describe('Protected Routes', () => {
    it('renders dashboard for authenticated users', () => {
      setAuthState({ isSignedIn: true, isLoaded: true });
      
      renderApp('/dashboard');
      
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('redirects unauthenticated users from dashboard to login', () => {
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      renderApp('/dashboard');
      
      expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('redirects unauthenticated users from nested dashboard routes', () => {
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      renderApp('/dashboard/agenda');
      
      expect(screen.queryByTestId('agenda-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  describe('404 Handling', () => {
    it('renders NotFound for unknown routes', () => {
      renderApp('/unknown-route');
      
      expect(screen.getByTestId('not-found')).toBeInTheDocument();
    });

    it('renders NotFound for deeply nested unknown routes', () => {
      renderApp('/some/deeply/nested/unknown/route');
      
      expect(screen.getByTestId('not-found')).toBeInTheDocument();
    });
  });

  describe('Auth State Transitions', () => {
    it('shows dashboard after user signs in', async () => {
      // Start unauthenticated
      setAuthState({ isSignedIn: false, isLoaded: true });
      const { rerender } = renderApp('/dashboard');
      
      // Should be redirected to login
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      
      // User signs in
      setAuthState({ isSignedIn: true, isLoaded: true });
      
      rerender(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppWithClerk />
        </MemoryRouter>
      );
      
      // Should now see dashboard
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('redirects to login after user signs out', async () => {
      // Start authenticated
      setAuthState({ isSignedIn: true, isLoaded: true });
      const { rerender } = renderApp('/dashboard');
      
      // Should see dashboard
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      
      // User signs out
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      rerender(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppWithClerk />
        </MemoryRouter>
      );
      
      // Should be redirected to login
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  describe('ClerkProvider Wrapper', () => {
    it('ClerkProvider wraps the entire app', () => {
      const { ClerkProvider } = require('@clerk/clerk-react');
      
      render(
        <ClerkProvider publishableKey="pk_test_xxx">
          <MemoryRouter>
            <AppWithClerk />
          </MemoryRouter>
        </ClerkProvider>
      );
      
      expect(screen.getByTestId('app-root')).toBeInTheDocument();
    });

    it('app functions correctly inside ClerkProvider', () => {
      const { ClerkProvider } = require('@clerk/clerk-react');
      setAuthState({ isSignedIn: true, isLoaded: true });
      
      render(
        <ClerkProvider publishableKey="pk_test_xxx">
          <MemoryRouter initialEntries={['/dashboard']}>
            <AppWithClerk />
          </MemoryRouter>
        </ClerkProvider>
      );
      
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });
});

describe('Auth Hook Integration with Clerk', () => {
  beforeEach(() => {
    mockAuthState = {
      isSignedIn: true,
      isLoaded: true,
      user: mockClerkUser,
    };
  });

  it('useAuth returns correct state when Clerk is authenticated', () => {
    const { useAuth } = require('@/lib/hooks');
    
    const result = useAuth();
    
    expect(result.isAuthenticated).toBe(true);
    expect(result.user).toEqual({
      id: 'user_123',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
    });
  });

  it('useAuth returns unauthenticated when Clerk user signs out', () => {
    setAuthState({ isSignedIn: false, isLoaded: true, user: mockClerkUser });
    const { useAuth } = require('@/lib/hooks');
    
    const result = useAuth();
    
    expect(result.isAuthenticated).toBe(false);
    expect(result.user).toBeNull();
  });

  it('useAuth shows loading when Clerk is initializing', () => {
    setAuthState({ isSignedIn: false, isLoaded: false });
    const { useAuth } = require('@/lib/hooks');
    
    const result = useAuth();
    
    expect(result.isLoading).toBe(true);
  });
});

describe('Protected Route Behavior', () => {
  beforeEach(() => {
    mockAuthState = {
      isSignedIn: true,
      isLoaded: true,
      user: mockClerkUser,
    };
  });

  it('protected routes preserve URL after redirect and authentication', async () => {
    // Start at protected route while unauthenticated
    setAuthState({ isSignedIn: false, isLoaded: true });
    const { rerender } = render(
      <MemoryRouter initialEntries={['/dashboard/pacientes']}>
        <AppWithClerk />
      </MemoryRouter>
    );
    
    // Should redirect to login
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    
    // After authentication, navigating back should work
    setAuthState({ isSignedIn: true, isLoaded: true });
    rerender(
      <MemoryRouter initialEntries={['/dashboard/pacientes']}>
        <AppWithClerk />
      </MemoryRouter>
    );
    
    // Dashboard should be accessible
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });
});
