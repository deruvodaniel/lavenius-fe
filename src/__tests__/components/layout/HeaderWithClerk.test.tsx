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
  fullName: 'Test User',
};

let mockAuthState = {
  isSignedIn: true,
  isLoaded: true,
  user: mockClerkUser,
};

const mockSignOut = vi.fn();
const mockOpenSignIn = vi.fn();
const mockOpenSignUp = vi.fn();

vi.mock('@clerk/clerk-react', () => ({
  useAuth: vi.fn(() => ({
    isSignedIn: mockAuthState.isSignedIn,
    isLoaded: mockAuthState.isLoaded,
    userId: mockAuthState.isSignedIn ? mockAuthState.user?.id : null,
    signOut: mockSignOut,
  })),
  useUser: vi.fn(() => ({
    user: mockAuthState.isSignedIn ? mockAuthState.user : null,
    isLoaded: mockAuthState.isLoaded,
    isSignedIn: mockAuthState.isSignedIn,
  })),
  useClerk: vi.fn(() => ({
    signOut: mockSignOut,
    openSignIn: mockOpenSignIn,
    openSignUp: mockOpenSignUp,
  })),
  SignedIn: ({ children }: { children: React.ReactNode }) => 
    mockAuthState.isSignedIn && mockAuthState.isLoaded ? <>{children}</> : null,
  SignedOut: ({ children }: { children: React.ReactNode }) => 
    !mockAuthState.isSignedIn && mockAuthState.isLoaded ? <>{children}</> : null,
  SignInButton: ({ children, mode }: { children?: React.ReactNode; mode?: string }) => 
    children || (
      <button 
        data-testid="clerk-sign-in-button" 
        data-mode={mode}
        onClick={mockOpenSignIn}
      >
        Sign In
      </button>
    ),
  SignUpButton: ({ children, mode }: { children?: React.ReactNode; mode?: string }) => 
    children || (
      <button 
        data-testid="clerk-sign-up-button"
        data-mode={mode}
        onClick={mockOpenSignUp}
      >
        Sign Up
      </button>
    ),
  SignOutButton: ({ children, signOutCallback }: { children?: React.ReactNode; signOutCallback?: () => void }) => {
    const handleClick = () => {
      mockSignOut();
      signOutCallback?.();
    };
    return children ? (
      <div onClick={handleClick}>{children}</div>
    ) : (
      <button data-testid="clerk-sign-out-button" onClick={handleClick}>Sign Out</button>
    );
  },
  UserButton: ({ 
    afterSignOutUrl,
    appearance,
    showName 
  }: { 
    afterSignOutUrl?: string; 
    appearance?: object;
    showName?: boolean;
  }) => (
    <div data-testid="clerk-user-button" data-after-sign-out-url={afterSignOutUrl}>
      <button aria-label="User menu">
        {mockAuthState.user?.imageUrl ? (
          <img src={mockAuthState.user.imageUrl} alt="User avatar" data-testid="user-avatar" />
        ) : (
          <span data-testid="user-initials">
            {mockAuthState.user?.firstName?.[0]}{mockAuthState.user?.lastName?.[0]}
          </span>
        )}
        {showName && <span data-testid="user-display-name">{mockAuthState.user?.fullName}</span>}
      </button>
    </div>
  ),
}));

const setAuthState = (state: Partial<typeof mockAuthState>) => {
  mockAuthState = { ...mockAuthState, ...state };
};

// ============================================================================
// EXAMPLE HEADER COMPONENT WITH CLERK
// ============================================================================

/**
 * Example Header/Navbar component using Clerk for auth
 * This demonstrates how the real header would integrate with Clerk
 */
function HeaderWithClerk() {
  const { useAuth, useUser, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } = require('@clerk/clerk-react');
  const { isLoaded } = useAuth();
  const { user } = useUser();

  return (
    <header className="header" data-testid="header">
      <nav className="nav">
        {/* Brand */}
        <div className="brand" data-testid="brand">
          <a href="/">Lavenius</a>
        </div>

        {/* Auth state */}
        <div className="auth-section" data-testid="auth-section">
          {!isLoaded ? (
            <div data-testid="auth-loading-skeleton" className="skeleton">
              Loading...
            </div>
          ) : (
            <>
              <SignedIn>
                <div data-testid="signed-in-section" className="signed-in">
                  <span data-testid="welcome-message">
                    Welcome, {user?.firstName || 'User'}
                  </span>
                  <UserButton afterSignOutUrl="/" showName />
                </div>
              </SignedIn>
              
              <SignedOut>
                <div data-testid="signed-out-section" className="signed-out">
                  <SignInButton mode="modal">
                    <button data-testid="header-sign-in-btn" className="btn-secondary">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button data-testid="header-sign-up-btn" className="btn-primary">
                      Get Started
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

/**
 * Alternative header with conditional rendering based on useAuth
 */
function HeaderWithUseAuth() {
  const { useAuth, useUser } = require('@clerk/clerk-react');
  const { isSignedIn, isLoaded, signOut } = useAuth();
  const { user } = useUser();

  const handleSignOut = async () => {
    await signOut();
  };

  if (!isLoaded) {
    return (
      <header data-testid="header-loading">
        <div className="skeleton">Loading authentication...</div>
      </header>
    );
  }

  return (
    <header data-testid="header-loaded">
      <nav>
        <div className="brand">Lavenius</div>
        
        {isSignedIn && user ? (
          <div data-testid="user-section">
            <img 
              src={user.imageUrl} 
              alt={`${user.firstName}'s avatar`}
              data-testid="user-avatar-img"
            />
            <span data-testid="user-name-display">{user.firstName} {user.lastName}</span>
            <span data-testid="user-email-display">{user.emailAddresses[0]?.emailAddress}</span>
            <button 
              data-testid="sign-out-btn"
              onClick={handleSignOut}
              aria-label="Sign out"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div data-testid="guest-section">
            <button data-testid="sign-in-btn">Sign In</button>
            <button data-testid="sign-up-btn">Sign Up</button>
          </div>
        )}
      </nav>
    </header>
  );
}

// Helper to render with router
const renderHeader = (HeaderComponent: React.ComponentType) => {
  return render(
    <MemoryRouter>
      <HeaderComponent />
    </MemoryRouter>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('Header with Clerk Auth', () => {
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

  describe('HeaderWithClerk - Using SignedIn/SignedOut', () => {
    describe('Loading State', () => {
      it('shows loading skeleton while Clerk initializes', () => {
        setAuthState({ isLoaded: false });
        
        renderHeader(HeaderWithClerk);

        expect(screen.getByTestId('auth-loading-skeleton')).toBeInTheDocument();
      });

      it('hides loading skeleton after Clerk loads', () => {
        setAuthState({ isLoaded: true });
        
        renderHeader(HeaderWithClerk);

        expect(screen.queryByTestId('auth-loading-skeleton')).not.toBeInTheDocument();
      });
    });

    describe('Signed In State', () => {
      it('shows signed in section when authenticated', () => {
        setAuthState({ isSignedIn: true, isLoaded: true });
        
        renderHeader(HeaderWithClerk);

        expect(screen.getByTestId('signed-in-section')).toBeInTheDocument();
        expect(screen.queryByTestId('signed-out-section')).not.toBeInTheDocument();
      });

      it('displays welcome message with user name', () => {
        setAuthState({ isSignedIn: true, isLoaded: true, user: mockClerkUser });
        
        renderHeader(HeaderWithClerk);

        expect(screen.getByTestId('welcome-message')).toHaveTextContent('Welcome, Test');
      });

      it('renders UserButton component', () => {
        setAuthState({ isSignedIn: true, isLoaded: true });
        
        renderHeader(HeaderWithClerk);

        expect(screen.getByTestId('clerk-user-button')).toBeInTheDocument();
      });

      it('UserButton has correct afterSignOutUrl', () => {
        setAuthState({ isSignedIn: true, isLoaded: true });
        
        renderHeader(HeaderWithClerk);

        const userButton = screen.getByTestId('clerk-user-button');
        expect(userButton).toHaveAttribute('data-after-sign-out-url', '/');
      });
    });

    describe('Signed Out State', () => {
      it('shows signed out section when not authenticated', () => {
        setAuthState({ isSignedIn: false, isLoaded: true });
        
        renderHeader(HeaderWithClerk);

        expect(screen.getByTestId('signed-out-section')).toBeInTheDocument();
        expect(screen.queryByTestId('signed-in-section')).not.toBeInTheDocument();
      });

      it('renders Sign In button', () => {
        setAuthState({ isSignedIn: false, isLoaded: true });
        
        renderHeader(HeaderWithClerk);

        expect(screen.getByTestId('header-sign-in-btn')).toBeInTheDocument();
      });

      it('renders Sign Up button', () => {
        setAuthState({ isSignedIn: false, isLoaded: true });
        
        renderHeader(HeaderWithClerk);

        expect(screen.getByTestId('header-sign-up-btn')).toBeInTheDocument();
      });

      it('Sign In button has correct text', () => {
        setAuthState({ isSignedIn: false, isLoaded: true });
        
        renderHeader(HeaderWithClerk);

        expect(screen.getByTestId('header-sign-in-btn')).toHaveTextContent('Sign In');
      });

      it('Sign Up button has correct text', () => {
        setAuthState({ isSignedIn: false, isLoaded: true });
        
        renderHeader(HeaderWithClerk);

        expect(screen.getByTestId('header-sign-up-btn')).toHaveTextContent('Get Started');
      });
    });

    describe('Brand', () => {
      it('always renders brand regardless of auth state', () => {
        setAuthState({ isSignedIn: false, isLoaded: true });
        
        renderHeader(HeaderWithClerk);

        expect(screen.getByTestId('brand')).toBeInTheDocument();
        expect(screen.getByText('Lavenius')).toBeInTheDocument();
      });
    });
  });

  describe('HeaderWithUseAuth - Using useAuth hook', () => {
    describe('Loading State', () => {
      it('shows loading header while Clerk initializes', () => {
        setAuthState({ isLoaded: false });
        
        renderHeader(HeaderWithUseAuth);

        expect(screen.getByTestId('header-loading')).toBeInTheDocument();
      });

      it('shows loaded header after Clerk initializes', () => {
        setAuthState({ isLoaded: true });
        
        renderHeader(HeaderWithUseAuth);

        expect(screen.getByTestId('header-loaded')).toBeInTheDocument();
      });
    });

    describe('User Section (Authenticated)', () => {
      it('displays user avatar', () => {
        setAuthState({ isSignedIn: true, isLoaded: true, user: mockClerkUser });
        
        renderHeader(HeaderWithUseAuth);

        const avatar = screen.getByTestId('user-avatar-img');
        expect(avatar).toBeInTheDocument();
        expect(avatar).toHaveAttribute('src', mockClerkUser.imageUrl);
      });

      it('displays user full name', () => {
        setAuthState({ isSignedIn: true, isLoaded: true, user: mockClerkUser });
        
        renderHeader(HeaderWithUseAuth);

        expect(screen.getByTestId('user-name-display')).toHaveTextContent('Test User');
      });

      it('displays user email', () => {
        setAuthState({ isSignedIn: true, isLoaded: true, user: mockClerkUser });
        
        renderHeader(HeaderWithUseAuth);

        expect(screen.getByTestId('user-email-display')).toHaveTextContent('test@example.com');
      });

      it('renders sign out button', () => {
        setAuthState({ isSignedIn: true, isLoaded: true });
        
        renderHeader(HeaderWithUseAuth);

        expect(screen.getByTestId('sign-out-btn')).toBeInTheDocument();
      });

      it('calls signOut when sign out button is clicked', async () => {
        const user = userEvent.setup();
        setAuthState({ isSignedIn: true, isLoaded: true });
        
        renderHeader(HeaderWithUseAuth);

        await user.click(screen.getByTestId('sign-out-btn'));

        expect(mockSignOut).toHaveBeenCalled();
      });
    });

    describe('Guest Section (Unauthenticated)', () => {
      it('shows guest section when not signed in', () => {
        setAuthState({ isSignedIn: false, isLoaded: true });
        
        renderHeader(HeaderWithUseAuth);

        expect(screen.getByTestId('guest-section')).toBeInTheDocument();
      });

      it('does not show user section when not signed in', () => {
        setAuthState({ isSignedIn: false, isLoaded: true });
        
        renderHeader(HeaderWithUseAuth);

        expect(screen.queryByTestId('user-section')).not.toBeInTheDocument();
      });

      it('renders sign in and sign up buttons', () => {
        setAuthState({ isSignedIn: false, isLoaded: true });
        
        renderHeader(HeaderWithUseAuth);

        expect(screen.getByTestId('sign-in-btn')).toBeInTheDocument();
        expect(screen.getByTestId('sign-up-btn')).toBeInTheDocument();
      });
    });
  });

  describe('Auth State Transitions', () => {
    it('updates header when user signs in', () => {
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      const { rerender } = renderHeader(HeaderWithClerk);
      expect(screen.getByTestId('signed-out-section')).toBeInTheDocument();

      setAuthState({ isSignedIn: true, isLoaded: true });
      rerender(
        <MemoryRouter>
          <HeaderWithClerk />
        </MemoryRouter>
      );

      expect(screen.getByTestId('signed-in-section')).toBeInTheDocument();
    });

    it('updates header when user signs out', () => {
      setAuthState({ isSignedIn: true, isLoaded: true });
      
      const { rerender } = renderHeader(HeaderWithClerk);
      expect(screen.getByTestId('signed-in-section')).toBeInTheDocument();

      setAuthState({ isSignedIn: false, isLoaded: true });
      rerender(
        <MemoryRouter>
          <HeaderWithClerk />
        </MemoryRouter>
      );

      expect(screen.getByTestId('signed-out-section')).toBeInTheDocument();
    });
  });

  describe('User Data Variations', () => {
    it('handles user with missing firstName gracefully', () => {
      const userWithoutFirstName = { ...mockClerkUser, firstName: null };
      setAuthState({ isSignedIn: true, isLoaded: true, user: userWithoutFirstName as unknown as typeof mockClerkUser });
      
      renderHeader(HeaderWithClerk);

      // Should show default "User" when firstName is missing
      expect(screen.getByTestId('welcome-message')).toHaveTextContent('Welcome, User');
    });

    it('handles user with empty emailAddresses', () => {
      const userWithoutEmail = { ...mockClerkUser, emailAddresses: [] };
      setAuthState({ isSignedIn: true, isLoaded: true, user: userWithoutEmail });
      
      renderHeader(HeaderWithUseAuth);

      // Should render without crashing
      expect(screen.getByTestId('user-section')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('header has proper semantic structure', () => {
      renderHeader(HeaderWithClerk);

      expect(screen.getByTestId('header').tagName).toBe('HEADER');
      expect(document.querySelector('nav')).toBeInTheDocument();
    });

    it('sign out button has aria-label', () => {
      setAuthState({ isSignedIn: true, isLoaded: true });
      
      renderHeader(HeaderWithUseAuth);

      expect(screen.getByTestId('sign-out-btn')).toHaveAttribute('aria-label', 'Sign out');
    });

    it('user avatar has alt text', () => {
      setAuthState({ isSignedIn: true, isLoaded: true, user: mockClerkUser });
      
      renderHeader(HeaderWithUseAuth);

      const avatar = screen.getByTestId('user-avatar-img');
      expect(avatar).toHaveAttribute('alt', "Test's avatar");
    });
  });

  describe('Button Interactions', () => {
    it('Sign In button can be clicked', async () => {
      const user = userEvent.setup();
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      renderHeader(HeaderWithClerk);

      const signInBtn = screen.getByTestId('header-sign-in-btn');
      await user.click(signInBtn);

      // Should trigger modal open
      expect(mockOpenSignIn).toHaveBeenCalled();
    });

    it('Sign Up button can be clicked', async () => {
      const user = userEvent.setup();
      setAuthState({ isSignedIn: false, isLoaded: true });
      
      renderHeader(HeaderWithClerk);

      const signUpBtn = screen.getByTestId('header-sign-up-btn');
      await user.click(signUpBtn);

      // Should trigger modal open
      expect(mockOpenSignUp).toHaveBeenCalled();
    });
  });
});

describe('UserButton Component Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      isSignedIn: true,
      isLoaded: true,
      user: mockClerkUser,
    };
  });

  it('shows user avatar when imageUrl is available', () => {
    renderHeader(HeaderWithClerk);

    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  it('shows user initials when no imageUrl', () => {
    const userWithoutImage = { ...mockClerkUser, imageUrl: '' };
    setAuthState({ isSignedIn: true, isLoaded: true, user: userWithoutImage });
    
    renderHeader(HeaderWithClerk);

    expect(screen.getByTestId('user-initials')).toHaveTextContent('TU');
  });

  it('shows user display name when showName is true', () => {
    renderHeader(HeaderWithClerk);

    expect(screen.getByTestId('user-display-name')).toHaveTextContent('Test User');
  });
});
