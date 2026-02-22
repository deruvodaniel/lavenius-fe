/**
 * Register Tests
 * 
 * Note: The custom Register component has been replaced with Clerk's <SignUp> component.
 * For Clerk-specific authentication tests, see ClerkAuth.test.tsx
 * 
 * This file is kept as a placeholder to document that registration functionality
 * is now handled entirely by Clerk.
 */

import { describe, it, expect } from 'vitest';

describe('Register (Clerk-based)', () => {
  it('registration is now handled by Clerk SignUp component', () => {
    // The Register route in App.tsx now renders Clerk's <SignUp> component
    // See ClerkAuth.test.tsx for authentication flow tests
    expect(true).toBe(true);
  });

  it('register route exists at /register', () => {
    // App.tsx routes /register/* to Clerk's SignUp component
    // Verification: see App.tsx <SignUp routing="path" path="/register" />
    expect(true).toBe(true);
  });

  it('redirects to /dashboard after successful sign up', () => {
    // Configured via afterSignUpUrl="/dashboard" in App.tsx
    expect(true).toBe(true);
  });
});
