/**
 * @deprecated This service has been replaced with Clerk authentication.
 * 
 * Authentication API calls are now handled by Clerk's SDK:
 * - Login: Clerk's <SignIn> component
 * - Register: Clerk's <SignUp> component
 * - Logout: useClerk().signOut() or <SignOutButton>
 * - Token management: Handled automatically by Clerk
 * 
 * This file is kept as a placeholder for documentation purposes.
 * It will be removed in a future release.
 */

export const authService = {
  login: () => {
    throw new Error('authService.login is deprecated. Use Clerk\'s <SignIn> component instead.');
  },
  register: () => {
    throw new Error('authService.register is deprecated. Use Clerk\'s <SignUp> component instead.');
  },
  logout: () => {
    throw new Error('authService.logout is deprecated. Use useClerk().signOut() instead.');
  },
  isAuthenticated: () => {
    throw new Error('authService.isAuthenticated is deprecated. Use useAuth().isAuthenticated instead.');
  },
};

export class AuthService {
  constructor() {
    throw new Error('AuthService is deprecated. Use Clerk authentication instead.');
  }
}
