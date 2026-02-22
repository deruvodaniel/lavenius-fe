/**
 * @deprecated This component has been replaced with Clerk's <SignUp> component.
 * 
 * The registration functionality is now handled by Clerk at the /register route in App.tsx.
 * 
 * For the new implementation, see:
 * - App.tsx: <SignUp routing="path" path="/register" ... />
 * - main.tsx: <ClerkProvider publishableKey={...}>
 * 
 * This file is kept as a placeholder for documentation purposes.
 * It will be removed in a future release.
 */

export function Register() {
  throw new Error(
    'Register component is deprecated. Use Clerk\'s <SignUp> component instead. ' +
    'See App.tsx for the route configuration.'
  );
}
