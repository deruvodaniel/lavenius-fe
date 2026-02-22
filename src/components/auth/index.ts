/**
 * Auth Components Index
 * 
 * Note: Custom Login and Register components have been replaced with Clerk's
 * built-in SignIn and SignUp components. See App.tsx for the route configuration.
 * 
 * Clerk components used:
 * - <SignIn> at /login route
 * - <SignUp> at /register route
 * - <SignedIn>, <SignedOut> for conditional rendering
 * - <RedirectToSignIn> for protected route redirects
 */

// Re-export Clerk components for convenience if needed
export { 
  SignIn, 
  SignUp, 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  SignUpButton, 
  SignOutButton, 
  UserButton,
  RedirectToSignIn,
} from '@clerk/clerk-react';
