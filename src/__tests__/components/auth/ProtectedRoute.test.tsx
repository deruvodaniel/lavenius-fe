import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React from 'react';

// ============================================================================
// CLERK MOCK SETUP
// ============================================================================

const mockClerkUser = {
  id: 'user_123',
  firstName: 'Test',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'test@example.com', id: 'email_123' }],
};

let mockAuthState = {
  isSignedIn: true,
  isLoaded: true,
  user: mockClerkUser,
};

vi.mock('@clerk/clerk-react', () => ({
  useAuth: vi.fn(() => ({
    isSignedIn: mockAuthState.isSignedIn,
    isLoaded: mockAuthState.isLoaded,
    userId: mockAuthState.isSignedIn ? mockAuthState.user?.id : null,
  })),
  useUser: vi.fn(() => ({
    user: mockAuthState.isSignedIn ? mockAuthState.user : null,
    isLoaded: mockAuthState.isLoaded,
  })),
  SignedIn: ({ children }: { children: React.ReactNode }) => 
    mockAuthState.isSignedIn && mockAuthState.isLoaded ? <>{children}</> : null,
  SignedOut: ({ children }: { children: React.ReactNode }) => 
    !mockAuthState.isSignedIn && mockAuthState.isLoaded ? <>{children}</> : null,
  RedirectToSignIn: () => <div data-testid="redirect-to-sign-in">Redirecting to sign in...</div>,
}));

// Helper to update auth state
const setAuthState = (state: Partial<typeof mockAuthState>) => {
  mockAuthState = { ...mockAuthState, ...state };
};

// ============================================================================
// PROTECTED ROUTE COMPONENT - Example implementation with Clerk
// ============================================================================

/**
 * Protected Route wrapper using Clerk authentication
 * This is an example of how protected routes would work with Clerk
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

function ProtectedRouteWithClerk({ 
  children, 
  fallback = null,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { useAuth } = require('@clerk/clerk-react');
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  // Show fallback while loading
  if (!isLoaded) {
    return fallback ? <>{fallback}</> : <div data-testid="auth-loading">Checking authentication...</div>;
  }

  // Redirect if not signed in
  if (!isSignedIn) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * Alternative: Protected Route using Clerk's SignedIn/SignedOut components
 */
function ProtectedRouteWithSignedIn({ children }: { children: React.ReactNode }) {
  const { SignedIn, SignedOut, RedirectToSignIn } = require('@clerk/clerk-react');

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

// ============================================================================
// TEST COMPONENTS
// ============================================================================

const ProtectedPage = () => (
  <div data-testid="protected-page">
    <h1>Protected Content</h1>
    <p>This page requires authentication</p>
  </div>
);

const PublicPage = () => (
  <div data-testid="public-page">
    <h1>Public Content</h1>
    <p>Anyone can see this</p>
  </div>
);

const LoginPage = () => (
  <div data-testid="login-page">
    <h1>Login</h1>
    <p>Please sign in to continue</p>
  </div>
);

const LoadingFallback = () => (
  <div data-testid="loading-fallback">
    <p>Loading your session...</p>
  </div>
);

// Helper to render with router
const renderWithRouter = (initialRoute: string, component: React.ReactNode) => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/public" element={<PublicPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/protected" element={component} />
        <Route path="/protected-with-fallback" element={
          <ProtectedRouteWithClerk fallback={<LoadingFallback />}>
            <ProtectedPage />
          </ProtectedRouteWithClerk>
        } />
        <Route path="/protected-with-signed-in" element={
          <ProtectedRouteWithSignedIn>
            <ProtectedPage />
          </ProtectedRouteWithSignedIn>
        } />
      </Routes>
    </MemoryRouter>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('ProtectedRoute with Clerk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      isSignedIn: true,
      isLoaded: true,
      user: mockClerkUser,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication Check', () => {
    it('renders protected content when user is authenticated', () => {
      setAuthState({ isSignedIn: true, isLoaded: true });
      
      renderWithRouter('/protected', 
        <ProtectedRouteWithClerk>
          <ProtectedPage />
        </ProtectedRouteWithClerk>
      );

      expect(screen.getByTestId('protected-page')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects to login when user is not authenticated', () => {
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      renderWithRouter('/protected',
        <ProtectedRouteWithClerk>
          <ProtectedPage />
        </ProtectedRouteWithClerk>
      );

      expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('shows loading state while Clerk is initializing', () => {
      setAuthState({ isSignedIn: false, isLoaded: false });
      
      renderWithRouter('/protected',
        <ProtectedRouteWithClerk>
          <ProtectedPage />
        </ProtectedRouteWithClerk>
      );

      expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    it('renders custom fallback while loading', () => {
      setAuthState({ isSignedIn: false, isLoaded: false });
      
      renderWithRouter('/protected-with-fallback', null);

      expect(screen.getByTestId('loading-fallback')).toBeInTheDocument();
      expect(screen.getByText('Loading your session...')).toBeInTheDocument();
    });

    it('replaces fallback with content when loaded and authenticated', () => {
      setAuthState({ isSignedIn: true, isLoaded: true });
      
      renderWithRouter('/protected-with-fallback', null);

      expect(screen.queryByTestId('loading-fallback')).not.toBeInTheDocument();
      expect(screen.getByTestId('protected-page')).toBeInTheDocument();
    });
  });

  describe('Custom Redirect Path', () => {
    it('redirects to custom path when specified', () => {
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/custom-login" element={<div data-testid="custom-login">Custom Login</div>} />
            <Route path="/protected" element={
              <ProtectedRouteWithClerk redirectTo="/custom-login">
                <ProtectedPage />
              </ProtectedRouteWithClerk>
            } />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('custom-login')).toBeInTheDocument();
    });
  });

  describe('Using SignedIn/SignedOut Components', () => {
    it('renders protected content with SignedIn wrapper', () => {
      setAuthState({ isSignedIn: true, isLoaded: true });
      
      renderWithRouter('/protected-with-signed-in', null);

      expect(screen.getByTestId('protected-page')).toBeInTheDocument();
    });

    it('renders RedirectToSignIn with SignedOut wrapper', () => {
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      renderWithRouter('/protected-with-signed-in', null);

      expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('redirect-to-sign-in')).toBeInTheDocument();
    });
  });

  describe('Location State Preservation', () => {
    it('preserves the original location in redirect state', () => {
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      let capturedState: unknown;
      
      render(
        <MemoryRouter initialEntries={['/protected/deep/path']}>
          <Routes>
            <Route path="/login" element={
              <LocationCapture onCapture={(state) => { capturedState = state; }} />
            } />
            <Route path="/protected/*" element={
              <ProtectedRouteWithClerk>
                <ProtectedPage />
              </ProtectedRouteWithClerk>
            } />
          </Routes>
        </MemoryRouter>
      );

      expect(capturedState).toBeDefined();
    });
  });

  describe('Auth State Transitions', () => {
    it('shows content when transitioning from loading to authenticated', () => {
      // Start loading
      setAuthState({ isSignedIn: false, isLoaded: false });
      
      const { rerender } = render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/protected" element={
              <ProtectedRouteWithClerk>
                <ProtectedPage />
              </ProtectedRouteWithClerk>
            } />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('auth-loading')).toBeInTheDocument();

      // Finish loading as authenticated
      setAuthState({ isSignedIn: true, isLoaded: true });
      
      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/protected" element={
              <ProtectedRouteWithClerk>
                <ProtectedPage />
              </ProtectedRouteWithClerk>
            } />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-page')).toBeInTheDocument();
    });

    it('redirects when transitioning from loading to unauthenticated', () => {
      // Start loading
      setAuthState({ isSignedIn: false, isLoaded: false });
      
      const { rerender } = render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/protected" element={
              <ProtectedRouteWithClerk>
                <ProtectedPage />
              </ProtectedRouteWithClerk>
            } />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('auth-loading')).toBeInTheDocument();

      // Finish loading as unauthenticated
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/protected" element={
              <ProtectedRouteWithClerk>
                <ProtectedPage />
              </ProtectedRouteWithClerk>
            } />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('redirects when user signs out', () => {
      // Start authenticated
      setAuthState({ isSignedIn: true, isLoaded: true });
      
      const { rerender } = render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/protected" element={
              <ProtectedRouteWithClerk>
                <ProtectedPage />
              </ProtectedRouteWithClerk>
            } />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('protected-page')).toBeInTheDocument();

      // User signs out
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/protected" element={
              <ProtectedRouteWithClerk>
                <ProtectedPage />
              </ProtectedRouteWithClerk>
            } />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  describe('Nested Protected Routes', () => {
    it('protects nested routes', () => {
      setAuthState({ isSignedIn: true, isLoaded: true });
      
      render(
        <MemoryRouter initialEntries={['/dashboard/settings']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard/*" element={
              <ProtectedRouteWithClerk>
                <Routes>
                  <Route path="/" element={<div data-testid="dashboard-home">Dashboard Home</div>} />
                  <Route path="settings" element={<div data-testid="dashboard-settings">Settings</div>} />
                </Routes>
              </ProtectedRouteWithClerk>
            } />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('dashboard-settings')).toBeInTheDocument();
    });

    it('redirects from nested routes when unauthenticated', () => {
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      render(
        <MemoryRouter initialEntries={['/dashboard/settings']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard/*" element={
              <ProtectedRouteWithClerk>
                <Routes>
                  <Route path="/" element={<div data-testid="dashboard-home">Dashboard Home</div>} />
                  <Route path="settings" element={<div data-testid="dashboard-settings">Settings</div>} />
                </Routes>
              </ProtectedRouteWithClerk>
            } />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid auth state changes', () => {
      // Start authenticated
      setAuthState({ isSignedIn: true, isLoaded: true });
      
      const { rerender } = render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/protected" element={
              <ProtectedRouteWithClerk>
                <ProtectedPage />
              </ProtectedRouteWithClerk>
            } />
          </Routes>
        </MemoryRouter>
      );

      // Rapid changes
      setAuthState({ isSignedIn: false, isLoaded: true });
      setAuthState({ isSignedIn: true, isLoaded: true });
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/protected" element={
              <ProtectedRouteWithClerk>
                <ProtectedPage />
              </ProtectedRouteWithClerk>
            } />
          </Routes>
        </MemoryRouter>
      );

      // Final state should be unauthenticated
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('handles component with no children gracefully', () => {
      setAuthState({ isSignedIn: true, isLoaded: true });
      
      render(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/protected" element={
              <ProtectedRouteWithClerk>
                {null}
              </ProtectedRouteWithClerk>
            } />
          </Routes>
        </MemoryRouter>
      );

      // Should not crash
      expect(screen.queryByTestId('protected-page')).not.toBeInTheDocument();
    });
  });
});

// Helper component to capture location state
function LocationCapture({ onCapture }: { onCapture: (state: unknown) => void }) {
  const location = useLocation();
  React.useEffect(() => {
    onCapture(location.state);
  }, [location.state, onCapture]);
  return <div data-testid="location-capture">Captured</div>;
}
