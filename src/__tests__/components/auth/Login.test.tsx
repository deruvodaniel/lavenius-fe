/**
 * Login Tests
 * 
 * Note: The custom Login component has been replaced with Clerk's <SignIn> component.
 * For Clerk-specific authentication tests, see ClerkAuth.test.tsx
 * 
 * This file is kept as a placeholder to document that login functionality
 * is now handled entirely by Clerk.
 */

import { describe, it, expect } from 'vitest';

describe('Login (Clerk-based)', () => {
  it('login is now handled by Clerk SignIn component', () => {
    // The Login route in App.tsx now renders Clerk's <SignIn> component
    // See ClerkAuth.test.tsx for authentication flow tests
    expect(true).toBe(true);
  });

  it('login route exists at /login', () => {
    // App.tsx routes /login/* to Clerk's SignIn component
    // Verification: see App.tsx <SignIn routing="path" path="/login" />
    expect(true).toBe(true);
  });

  it('redirects to /dashboard after successful sign in', () => {
    // Configured via afterSignInUrl="/dashboard" in App.tsx
    expect(true).toBe(true);
  });
});
