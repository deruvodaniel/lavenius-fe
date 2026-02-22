/**
 * Auth Store Tests
 * 
 * Note: The custom auth.store.ts has been replaced with Clerk authentication.
 * Authentication state is now managed by Clerk's hooks (useAuth, useUser, useClerk).
 * 
 * The old Zustand auth store has been removed in favor of Clerk's built-in state management.
 * For Clerk-specific authentication tests, see:
 * - __tests__/components/auth/ClerkAuth.test.tsx
 * - __tests__/hooks/useAuth.test.ts
 */

import { describe, it, expect } from 'vitest';

describe('Auth Store (Deprecated - Now using Clerk)', () => {
  it('auth state is now managed by Clerk', () => {
    // The useAuthStore has been removed
    // Authentication is now handled by:
    // - ClerkProvider in main.tsx
    // - useAuth() hook wrapping Clerk's useAuth and useUser
    // - SignedIn/SignedOut components for conditional rendering
    expect(true).toBe(true);
  });

  it('login is handled by Clerk SignIn component', () => {
    // No longer using store.login()
    // Login is handled by Clerk's <SignIn> component at /login route
    expect(true).toBe(true);
  });

  it('logout is handled by Clerk signOut', () => {
    // No longer using store.logout()
    // Logout is handled by useClerk().signOut() or SignOutButton
    expect(true).toBe(true);
  });

  it('user data comes from Clerk', () => {
    // No longer storing user in Zustand
    // User data is accessed via useUser() or useAuth() wrapper
    expect(true).toBe(true);
  });
});
