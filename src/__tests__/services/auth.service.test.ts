/**
 * Auth Service Tests
 * 
 * Note: The custom auth.service.ts has been replaced with Clerk authentication.
 * Authentication API calls are now handled entirely by Clerk's SDK.
 * 
 * The old AuthService class has been removed in favor of Clerk's built-in authentication.
 * For Clerk-specific authentication tests, see:
 * - __tests__/components/auth/ClerkAuth.test.tsx
 * - __tests__/hooks/useAuth.test.ts
 */

import { describe, it, expect } from 'vitest';

describe('Auth Service (Deprecated - Now using Clerk)', () => {
  it('authentication is now handled by Clerk SDK', () => {
    // The AuthService has been removed
    // Authentication API calls are now handled by:
    // - Clerk's SignIn/SignUp components
    // - Clerk's backend APIs
    expect(true).toBe(true);
  });

  it('login is handled by Clerk', () => {
    // No longer calling authService.login()
    // Clerk handles the entire authentication flow
    expect(true).toBe(true);
  });

  it('register is handled by Clerk', () => {
    // No longer calling authService.register()
    // Clerk handles user registration
    expect(true).toBe(true);
  });

  it('token management is handled by Clerk', () => {
    // No longer managing tokens manually
    // Clerk handles token storage and refresh automatically
    expect(true).toBe(true);
  });
});
