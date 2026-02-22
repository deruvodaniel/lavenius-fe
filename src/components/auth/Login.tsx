/**
 * @deprecated This component has been replaced with Clerk's <SignIn> component.
 * 
 * The login functionality is now handled by Clerk at the /login route in App.tsx.
 * 
 * For the new implementation, see:
 * - App.tsx: <SignIn routing="path" path="/login" ... />
 * - main.tsx: <ClerkProvider publishableKey={...}>
 * 
 * This file is kept as a placeholder for documentation purposes.
 * It will be removed in a future release.
 */

export function Login() {
  throw new Error(
    'Login component is deprecated. Use Clerk\'s <SignIn> component instead. ' +
    'See App.tsx for the route configuration.'
  );
}
