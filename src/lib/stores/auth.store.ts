/**
 * @deprecated This store has been replaced with Clerk authentication.
 * 
 * Authentication state is now managed by Clerk's hooks:
 * - useAuth() from @clerk/clerk-react for authentication state
 * - useUser() from @clerk/clerk-react for user data
 * - useClerk() from @clerk/clerk-react for sign out and other operations
 * 
 * The custom useAuth hook in lib/hooks/useAuth.ts wraps these Clerk hooks
 * and provides a simplified interface compatible with existing components.
 * 
 * This file is kept as a placeholder for documentation purposes.
 * It will be removed in a future release.
 */

export const useAuthStore = () => {
  throw new Error(
    'useAuthStore is deprecated. Use useAuth() from lib/hooks/useAuth.ts instead, ' +
    'which wraps Clerk\'s authentication hooks.'
  );
};
