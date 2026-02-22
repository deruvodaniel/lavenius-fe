import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '@/lib/hooks/useAuth';

// Mock Clerk hooks
const mockSignOut = vi.fn();
const mockClerkUser = {
  id: 'user_123',
  firstName: 'Test',
  lastName: 'User',
  primaryEmailAddress: { emailAddress: 'test@example.com' },
  primaryPhoneNumber: { phoneNumber: '+1234567890' },
  publicMetadata: { licenseNumber: 'LIC-001' },
};

vi.mock('@clerk/clerk-react', () => ({
  useAuth: vi.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    signOut: mockSignOut,
  })),
  useUser: vi.fn(() => ({
    user: mockClerkUser,
  })),
}));

// Import mocks after setting up vi.mock
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';

describe('useAuth (Clerk-based)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to default authenticated state
    vi.mocked(useClerkAuth).mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      signOut: mockSignOut,
    } as unknown as ReturnType<typeof useClerkAuth>);
    vi.mocked(useUser).mockReturnValue({
      user: mockClerkUser,
    } as unknown as ReturnType<typeof useUser>);
  });

  describe('authenticated state', () => {
    it('returns user data when authenticated', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '+1234567890',
        licenseNumber: 'LIC-001',
      });
    });

    it('returns isAuthenticated as true when signed in', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('returns isLoading as false when loaded', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
    });

    it('provides signOut function from Clerk', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.signOut).toBe(mockSignOut);
      expect(result.current.logout).toBe(mockSignOut);
    });
  });

  describe('unauthenticated state', () => {
    beforeEach(() => {
      vi.mocked(useClerkAuth).mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        signOut: mockSignOut,
      } as unknown as ReturnType<typeof useClerkAuth>);
      vi.mocked(useUser).mockReturnValue({
        user: null,
      } as unknown as ReturnType<typeof useUser>);
    });

    it('returns null user when not authenticated', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
    });

    it('returns isAuthenticated as false when not signed in', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('loading state', () => {
    beforeEach(() => {
      vi.mocked(useClerkAuth).mockReturnValue({
        isLoaded: false,
        isSignedIn: false,
        signOut: mockSignOut,
      } as unknown as ReturnType<typeof useClerkAuth>);
      vi.mocked(useUser).mockReturnValue({
        user: null,
      } as unknown as ReturnType<typeof useUser>);
    });

    it('returns isLoading as true when not loaded', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);
    });

    it('returns isAuthenticated as false while loading', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles user without email', () => {
      vi.mocked(useUser).mockReturnValue({
        user: {
          ...mockClerkUser,
          primaryEmailAddress: null,
        },
      } as unknown as ReturnType<typeof useUser>);

      const { result } = renderHook(() => useAuth());

      expect(result.current.user?.email).toBe('');
    });

    it('handles user without phone', () => {
      vi.mocked(useUser).mockReturnValue({
        user: {
          ...mockClerkUser,
          primaryPhoneNumber: null,
        },
      } as unknown as ReturnType<typeof useUser>);

      const { result } = renderHook(() => useAuth());

      expect(result.current.user?.phone).toBeUndefined();
    });

    it('handles user without license number in metadata', () => {
      vi.mocked(useUser).mockReturnValue({
        user: {
          ...mockClerkUser,
          publicMetadata: {},
        },
      } as unknown as ReturnType<typeof useUser>);

      const { result } = renderHook(() => useAuth());

      expect(result.current.user?.licenseNumber).toBeUndefined();
    });

    it('handles user with null names', () => {
      vi.mocked(useUser).mockReturnValue({
        user: {
          ...mockClerkUser,
          firstName: null,
          lastName: null,
        },
      } as unknown as ReturnType<typeof useUser>);

      const { result } = renderHook(() => useAuth());

      expect(result.current.user?.firstName).toBe('');
      expect(result.current.user?.lastName).toBe('');
    });
  });
});
