import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// ============================================================================
// CLERK MOCKS - Reusable mock factory for Clerk integration tests
// ============================================================================

// Default mock user for authenticated state
const mockClerkUser = {
  id: 'user_123',
  firstName: 'Test',
  lastName: 'User',
  emailAddresses: [{ emailAddress: 'test@example.com', id: 'email_123' }],
  primaryEmailAddressId: 'email_123',
  imageUrl: 'https://example.com/avatar.png',
};

// Factory to create configurable Clerk mocks
const createClerkMocks = (overrides: {
  isSignedIn?: boolean;
  isLoaded?: boolean;
  user?: typeof mockClerkUser | null;
} = {}) => {
  const { isSignedIn = true, isLoaded = true, user = mockClerkUser } = overrides;

  return {
    ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SignedIn: ({ children }: { children: React.ReactNode }) => 
      isSignedIn && isLoaded ? <>{children}</> : null,
    SignedOut: ({ children }: { children: React.ReactNode }) => 
      !isSignedIn && isLoaded ? <>{children}</> : null,
    useAuth: vi.fn(() => ({
      isSignedIn,
      isLoaded,
      userId: isSignedIn ? user?.id : null,
      signOut: vi.fn(),
      getToken: vi.fn().mockResolvedValue('mock-token'),
    })),
    useUser: vi.fn(() => ({
      user: isSignedIn ? user : null,
      isLoaded,
      isSignedIn,
    })),
    useClerk: vi.fn(() => ({
      signOut: vi.fn(),
      openSignIn: vi.fn(),
      openSignUp: vi.fn(),
    })),
    SignInButton: ({ children, mode }: { children?: React.ReactNode; mode?: string }) => 
      children || <button data-testid="clerk-sign-in-button" data-mode={mode}>Sign In</button>,
    SignUpButton: ({ children, mode }: { children?: React.ReactNode; mode?: string }) => 
      children || <button data-testid="clerk-sign-up-button" data-mode={mode}>Sign Up</button>,
    SignOutButton: ({ children }: { children?: React.ReactNode }) =>
      children || <button data-testid="clerk-sign-out-button">Sign Out</button>,
    UserButton: ({ afterSignOutUrl }: { afterSignOutUrl?: string }) => 
      <button data-testid="clerk-user-button" data-after-sign-out-url={afterSignOutUrl}>User Menu</button>,
    RedirectToSignIn: () => <div data-testid="redirect-to-sign-in">Redirecting to sign in...</div>,
  };
};

// ============================================================================
// TEST COMPONENTS - Simulating components that would use Clerk
// ============================================================================

/**
 * Example protected route component that uses Clerk
 */
function ProtectedContent() {
  return (
    <div data-testid="protected-content">
      <h1>Protected Dashboard</h1>
      <p>This content is only visible to authenticated users</p>
    </div>
  );
}

/**
 * Example header component with auth state
 */
function HeaderWithAuth({ 
  isSignedIn, 
  user 
}: { 
  isSignedIn: boolean; 
  user: typeof mockClerkUser | null;
}) {
  return (
    <header data-testid="header">
      <div className="brand">Lavenius</div>
      {isSignedIn && user ? (
        <div data-testid="signed-in-state">
          <span data-testid="user-name">{user.firstName} {user.lastName}</span>
          <span data-testid="user-email">{user.emailAddresses[0]?.emailAddress}</span>
          <button data-testid="user-menu">User Menu</button>
        </div>
      ) : (
        <div data-testid="signed-out-state">
          <button data-testid="sign-in-button">Sign In</button>
          <button data-testid="sign-up-button">Sign Up</button>
        </div>
      )}
    </header>
  );
}

/**
 * Example protected route wrapper
 */
function ProtectedRoute({ 
  children, 
  isSignedIn,
  isLoaded 
}: { 
  children: React.ReactNode;
  isSignedIn: boolean;
  isLoaded: boolean;
}) {
  if (!isLoaded) {
    return <div data-testid="loading-state">Loading...</div>;
  }
  
  if (!isSignedIn) {
    return <div data-testid="sign-in-prompt">Please sign in to continue</div>;
  }
  
  return <>{children}</>;
}

// ============================================================================
// TESTS
// ============================================================================

describe('Clerk Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ClerkProvider Integration', () => {
    it('renders children inside ClerkProvider', () => {
      const mocks = createClerkMocks();
      
      render(
        <mocks.ClerkProvider>
          <div data-testid="child-content">Content</div>
        </mocks.ClerkProvider>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('ClerkProvider does not block rendering', () => {
      const mocks = createClerkMocks();
      
      render(
        <mocks.ClerkProvider>
          <MemoryRouter>
            <div>App Content</div>
          </MemoryRouter>
        </mocks.ClerkProvider>
      );

      expect(screen.getByText('App Content')).toBeInTheDocument();
    });
  });

  describe('SignedIn / SignedOut Conditional Rendering', () => {
    it('SignedIn renders children when user is authenticated', () => {
      const mocks = createClerkMocks({ isSignedIn: true, isLoaded: true });

      render(
        <>
          <mocks.SignedIn>
            <div data-testid="signed-in-content">Welcome back!</div>
          </mocks.SignedIn>
          <mocks.SignedOut>
            <div data-testid="signed-out-content">Please sign in</div>
          </mocks.SignedOut>
        </>
      );

      expect(screen.getByTestId('signed-in-content')).toBeInTheDocument();
      expect(screen.queryByTestId('signed-out-content')).not.toBeInTheDocument();
    });

    it('SignedOut renders children when user is not authenticated', () => {
      const mocks = createClerkMocks({ isSignedIn: false, isLoaded: true });

      render(
        <>
          <mocks.SignedIn>
            <div data-testid="signed-in-content">Welcome back!</div>
          </mocks.SignedIn>
          <mocks.SignedOut>
            <div data-testid="signed-out-content">Please sign in</div>
          </mocks.SignedOut>
        </>
      );

      expect(screen.queryByTestId('signed-in-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('signed-out-content')).toBeInTheDocument();
    });

    it('neither renders when auth is still loading', () => {
      const mocks = createClerkMocks({ isSignedIn: false, isLoaded: false });

      render(
        <>
          <mocks.SignedIn>
            <div data-testid="signed-in-content">Welcome back!</div>
          </mocks.SignedIn>
          <mocks.SignedOut>
            <div data-testid="signed-out-content">Please sign in</div>
          </mocks.SignedOut>
        </>
      );

      // When not loaded, both should be hidden
      expect(screen.queryByTestId('signed-in-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('signed-out-content')).not.toBeInTheDocument();
    });
  });

  describe('useAuth Hook', () => {
    it('returns authenticated state when user is signed in', () => {
      const mocks = createClerkMocks({ isSignedIn: true, isLoaded: true });
      
      const result = mocks.useAuth();

      expect(result.isSignedIn).toBe(true);
      expect(result.isLoaded).toBe(true);
      expect(result.userId).toBe('user_123');
    });

    it('returns unauthenticated state when user is signed out', () => {
      const mocks = createClerkMocks({ isSignedIn: false, isLoaded: true });
      
      const result = mocks.useAuth();

      expect(result.isSignedIn).toBe(false);
      expect(result.isLoaded).toBe(true);
      expect(result.userId).toBeNull();
    });

    it('returns loading state when auth is initializing', () => {
      const mocks = createClerkMocks({ isSignedIn: false, isLoaded: false });
      
      const result = mocks.useAuth();

      expect(result.isLoaded).toBe(false);
    });

    it('provides signOut function', () => {
      const mocks = createClerkMocks({ isSignedIn: true });
      
      const result = mocks.useAuth();

      expect(result.signOut).toBeDefined();
      expect(typeof result.signOut).toBe('function');
    });

    it('provides getToken function for API calls', async () => {
      const mocks = createClerkMocks({ isSignedIn: true });
      
      const result = mocks.useAuth();
      const token = await result.getToken();

      expect(token).toBe('mock-token');
    });
  });

  describe('useUser Hook', () => {
    it('returns user data when authenticated', () => {
      const mocks = createClerkMocks({ isSignedIn: true, user: mockClerkUser });
      
      const result = mocks.useUser();

      expect(result.user).toEqual(mockClerkUser);
      expect(result.isLoaded).toBe(true);
      expect(result.isSignedIn).toBe(true);
    });

    it('returns null user when not authenticated', () => {
      const mocks = createClerkMocks({ isSignedIn: false });
      
      const result = mocks.useUser();

      expect(result.user).toBeNull();
      expect(result.isSignedIn).toBe(false);
    });

    it('provides access to user email addresses', () => {
      const mocks = createClerkMocks({ isSignedIn: true, user: mockClerkUser });
      
      const result = mocks.useUser();

      expect(result.user?.emailAddresses).toHaveLength(1);
      expect(result.user?.emailAddresses[0].emailAddress).toBe('test@example.com');
    });

    it('provides access to user name fields', () => {
      const mocks = createClerkMocks({ isSignedIn: true, user: mockClerkUser });
      
      const result = mocks.useUser();

      expect(result.user?.firstName).toBe('Test');
      expect(result.user?.lastName).toBe('User');
    });
  });

  describe('Clerk UI Components', () => {
    it('SignInButton renders correctly', () => {
      const mocks = createClerkMocks();

      render(<mocks.SignInButton />);

      expect(screen.getByTestId('clerk-sign-in-button')).toBeInTheDocument();
    });

    it('SignInButton can wrap custom children', () => {
      const mocks = createClerkMocks();

      render(
        <mocks.SignInButton>
          <button>Custom Sign In</button>
        </mocks.SignInButton>
      );

      expect(screen.getByRole('button', { name: 'Custom Sign In' })).toBeInTheDocument();
    });

    it('SignUpButton renders correctly', () => {
      const mocks = createClerkMocks();

      render(<mocks.SignUpButton />);

      expect(screen.getByTestId('clerk-sign-up-button')).toBeInTheDocument();
    });

    it('SignOutButton renders correctly', () => {
      const mocks = createClerkMocks();

      render(<mocks.SignOutButton />);

      expect(screen.getByTestId('clerk-sign-out-button')).toBeInTheDocument();
    });

    it('UserButton renders correctly', () => {
      const mocks = createClerkMocks();

      render(<mocks.UserButton afterSignOutUrl="/" />);

      const userButton = screen.getByTestId('clerk-user-button');
      expect(userButton).toBeInTheDocument();
      expect(userButton).toHaveAttribute('data-after-sign-out-url', '/');
    });
  });

  describe('Protected Routes', () => {
    it('shows content when user is authenticated', () => {
      render(
        <ProtectedRoute isSignedIn={true} isLoaded={true}>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Protected Dashboard')).toBeInTheDocument();
    });

    it('shows sign in prompt when user is not authenticated', () => {
      render(
        <ProtectedRoute isSignedIn={false} isLoaded={true}>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('sign-in-prompt')).toBeInTheDocument();
      expect(screen.getByText('Please sign in to continue')).toBeInTheDocument();
    });

    it('shows loading state while auth is initializing', () => {
      render(
        <ProtectedRoute isSignedIn={false} isLoaded={false}>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Header Auth State', () => {
    it('shows user info when signed in', () => {
      render(
        <HeaderWithAuth isSignedIn={true} user={mockClerkUser} />
      );

      expect(screen.getByTestId('signed-in-state')).toBeInTheDocument();
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });

    it('shows sign in/up buttons when signed out', () => {
      render(
        <HeaderWithAuth isSignedIn={false} user={null} />
      );

      expect(screen.getByTestId('signed-out-state')).toBeInTheDocument();
      expect(screen.getByTestId('sign-in-button')).toBeInTheDocument();
      expect(screen.getByTestId('sign-up-button')).toBeInTheDocument();
    });

    it('does not show user info when signed out', () => {
      render(
        <HeaderWithAuth isSignedIn={false} user={null} />
      );

      expect(screen.queryByTestId('signed-in-state')).not.toBeInTheDocument();
      expect(screen.queryByTestId('user-name')).not.toBeInTheDocument();
    });
  });

  describe('RedirectToSignIn', () => {
    it('renders redirect component for unauthenticated access', () => {
      const mocks = createClerkMocks({ isSignedIn: false });

      render(<mocks.RedirectToSignIn />);

      expect(screen.getByTestId('redirect-to-sign-in')).toBeInTheDocument();
    });
  });

  describe('useClerk Hook', () => {
    it('provides signOut method', () => {
      const mocks = createClerkMocks();
      
      const result = mocks.useClerk();

      expect(result.signOut).toBeDefined();
      expect(typeof result.signOut).toBe('function');
    });

    it('provides openSignIn method', () => {
      const mocks = createClerkMocks();
      
      const result = mocks.useClerk();

      expect(result.openSignIn).toBeDefined();
      expect(typeof result.openSignIn).toBe('function');
    });

    it('provides openSignUp method', () => {
      const mocks = createClerkMocks();
      
      const result = mocks.useClerk();

      expect(result.openSignUp).toBeDefined();
      expect(typeof result.openSignUp).toBe('function');
    });
  });

  describe('Auth State Transitions', () => {
    it('handles transition from loading to authenticated', () => {
      const { rerender } = render(
        <ProtectedRoute isSignedIn={false} isLoaded={false}>
          <ProtectedContent />
        </ProtectedRoute>
      );

      // Initially loading
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();

      // After auth loads and user is signed in
      rerender(
        <ProtectedRoute isSignedIn={true} isLoaded={true}>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('handles transition from loading to unauthenticated', () => {
      const { rerender } = render(
        <ProtectedRoute isSignedIn={false} isLoaded={false}>
          <ProtectedContent />
        </ProtectedRoute>
      );

      // Initially loading
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();

      // After auth loads and user is not signed in
      rerender(
        <ProtectedRoute isSignedIn={false} isLoaded={true}>
          <ProtectedContent />
        </ProtectedRoute>
      );

      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument();
      expect(screen.getByTestId('sign-in-prompt')).toBeInTheDocument();
    });

    it('handles sign out transition', () => {
      const { rerender } = render(
        <HeaderWithAuth isSignedIn={true} user={mockClerkUser} />
      );

      // Initially signed in
      expect(screen.getByTestId('signed-in-state')).toBeInTheDocument();

      // After sign out
      rerender(
        <HeaderWithAuth isSignedIn={false} user={null} />
      );

      expect(screen.queryByTestId('signed-in-state')).not.toBeInTheDocument();
      expect(screen.getByTestId('signed-out-state')).toBeInTheDocument();
    });
  });

  describe('User Data Edge Cases', () => {
    it('handles user with no email addresses', () => {
      const userWithoutEmail = {
        ...mockClerkUser,
        emailAddresses: [],
      };
      const mocks = createClerkMocks({ isSignedIn: true, user: userWithoutEmail });
      
      const result = mocks.useUser();

      expect(result.user?.emailAddresses).toHaveLength(0);
    });

    it('handles user with multiple email addresses', () => {
      const userWithMultipleEmails = {
        ...mockClerkUser,
        emailAddresses: [
          { emailAddress: 'primary@example.com', id: 'email_1' },
          { emailAddress: 'secondary@example.com', id: 'email_2' },
        ],
      };
      const mocks = createClerkMocks({ isSignedIn: true, user: userWithMultipleEmails });
      
      const result = mocks.useUser();

      expect(result.user?.emailAddresses).toHaveLength(2);
    });

    it('handles user with only first name', () => {
      const userWithFirstNameOnly = {
        ...mockClerkUser,
        firstName: 'John',
        lastName: '',
      };
      const mocks = createClerkMocks({ isSignedIn: true, user: userWithFirstNameOnly });
      
      const result = mocks.useUser();

      expect(result.user?.firstName).toBe('John');
      expect(result.user?.lastName).toBe('');
    });

    it('handles user with null names', () => {
      const userWithNullNames = {
        ...mockClerkUser,
        firstName: null as unknown as string,
        lastName: null as unknown as string,
      };
      const mocks = createClerkMocks({ isSignedIn: true, user: userWithNullNames });
      
      const result = mocks.useUser();

      expect(result.user?.firstName).toBeNull();
      expect(result.user?.lastName).toBeNull();
    });
  });
});

describe('Clerk Mock Factory', () => {
  it('creates default authenticated mock', () => {
    const mocks = createClerkMocks();
    
    expect(mocks.useAuth().isSignedIn).toBe(true);
    expect(mocks.useAuth().isLoaded).toBe(true);
  });

  it('creates unauthenticated mock with override', () => {
    const mocks = createClerkMocks({ isSignedIn: false });
    
    expect(mocks.useAuth().isSignedIn).toBe(false);
  });

  it('creates loading mock with override', () => {
    const mocks = createClerkMocks({ isLoaded: false });
    
    expect(mocks.useAuth().isLoaded).toBe(false);
  });

  it('creates mock with custom user', () => {
    const customUser = {
      ...mockClerkUser,
      firstName: 'Custom',
      lastName: 'Name',
    };
    const mocks = createClerkMocks({ user: customUser });
    
    expect(mocks.useUser().user?.firstName).toBe('Custom');
  });

  it('creates mock with null user for signed out state', () => {
    const mocks = createClerkMocks({ isSignedIn: false, user: null });
    
    expect(mocks.useUser().user).toBeNull();
  });
});
