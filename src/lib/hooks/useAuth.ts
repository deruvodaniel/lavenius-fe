import { useAuthStore } from '@/lib/stores';

/**
 * Custom hook for authentication
 * Provides simplified interface to auth store for components
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 * 
 * if (!isAuthenticated) return <Navigate to="/login" />;
 * ```
 */
export const useAuth = () => {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  
  const login = useAuthStore(state => state.login);
  const register = useAuthStore(state => state.register);
  const logout = useAuthStore(state => state.logout);
  const clearError = useAuthStore(state => state.clearError);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };
};
