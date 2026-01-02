import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService } from '../services/auth.service';
import type { User, LoginDto, RegisterDto, ChangePassphraseDto } from '../types/api.types';
import { ApiClientError } from '../api/client';

/**
 * Auth Store State
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Auth Store Actions
 */
interface AuthActions {
  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
  changePassphrase: (data: ChangePassphraseDto) => Promise<void>;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  checkAuth: () => boolean;
}

/**
 * Auth Store Type
 */
type AuthStore = AuthState & AuthActions;

/**
 * Initial State
 */
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

/**
 * Auth Store
 * Maneja el estado de autenticación global con persistencia
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Login user with credentials and passphrase
       */
      login: async (data: LoginDto) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.login(data);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof ApiClientError
            ? error.message
            : 'Error al iniciar sesión';
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          
          throw error;
        }
      },

      /**
       * Register new therapist user
       */
      register: async (data: RegisterDto) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.register(data);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof ApiClientError
            ? error.message
            : 'Error al registrar usuario';
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          
          throw error;
        }
      },

      /**
       * Logout user and clear all data
       */
      logout: () => {
        authService.logout();
        set(initialState);
      },

      /**
       * Change user's passphrase
       */
      changePassphrase: async (data: ChangePassphraseDto) => {
        set({ isLoading: true, error: null });
        
        try {
          await authService.changePassphrase(data);
          set({ isLoading: false, error: null });
        } catch (error) {
          const errorMessage = error instanceof ApiClientError
            ? error.message
            : 'Error al cambiar la passphrase';
          
          set({ isLoading: false, error: errorMessage });
          throw error;
        }
      },

      /**
       * Set user manually (useful for token refresh)
       */
      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      /**
       * Set error message
       */
      setError: (error: string | null) => {
        set({ error });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Check if user is authenticated
       */
      checkAuth: () => {
        const isAuth = authService.isAuthenticated();
        const { user } = get();
        
        if (!isAuth && user) {
          // Token expirado pero hay usuario en store
          set(initialState);
          return false;
        }
        
        return isAuth;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Selectors for common use cases
 */
export const selectUser = (state: AuthStore) => state.user;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectError = (state: AuthStore) => state.error;
