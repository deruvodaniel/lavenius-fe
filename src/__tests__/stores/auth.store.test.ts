import { act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from '@/lib/stores/auth.store';
import { authService } from '@/lib/services/auth.service';
import { ApiClientError } from '@/lib/api/client';
import type { User, LoginDto, RegisterDto, ChangePassphraseDto, AuthResponse } from '@/lib/types/api.types';

// Mock the auth service
vi.mock('@/lib/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    changePassphrase: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}));

// Mock localStorage and sessionStorage for persist middleware
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test fixtures
const mockUser: User = {
  id: '123',
  email: 'test@example.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockLoginDto: LoginDto = {
  email: 'test@example.com',
  password: 'password123',
  passphrase: 'mysecretphrase',
};

const mockRegisterDto: RegisterDto = {
  email: 'new@example.com',
  password: 'password123',
  passphrase: 'mysecretphrase',
  firstName: 'Maria',
  lastName: 'García',
};

const mockChangePassphraseDto: ChangePassphraseDto = {
  currentPassphrase: 'oldpassphrase',
  newPassphrase: 'newpassphrase',
};

const mockAuthResponse: AuthResponse = {
  access_token: 'mock-token-123',
  user: mockUser,
  userKey: 'mock-user-key-base64',
};

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    // Reset store to initial state
    useAuthStore.setState(initialState);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==================== Initial State Tests ====================
  describe('Initial State', () => {
    it('has correct default values', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  // ==================== Login Flow Tests ====================
  describe('login', () => {
    it('calls authService.login with credentials', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);

      await act(async () => {
        await useAuthStore.getState().login(mockLoginDto);
      });

      expect(authService.login).toHaveBeenCalledWith(mockLoginDto);
      expect(authService.login).toHaveBeenCalledTimes(1);
    });

    it('sets isLoading to true during request', async () => {
      let loadingDuringRequest = false;
      
      vi.mocked(authService.login).mockImplementation(async () => {
        loadingDuringRequest = useAuthStore.getState().isLoading;
        return mockAuthResponse;
      });

      await act(async () => {
        await useAuthStore.getState().login(mockLoginDto);
      });

      expect(loadingDuringRequest).toBe(true);
    });

    it('sets user and isAuthenticated on success', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);

      await act(async () => {
        await useAuthStore.getState().login(mockLoginDto);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    it('sets error on failure with ApiClientError', async () => {
      const apiError = new ApiClientError(401, 'Unauthorized', 'Credenciales inválidas');
      vi.mocked(authService.login).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await useAuthStore.getState().login(mockLoginDto);
        } catch {
          // Expected to throw
        }
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe('Credenciales inválidas');
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('sets generic error message on unknown error', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        try {
          await useAuthStore.getState().login(mockLoginDto);
        } catch {
          // Expected to throw
        }
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe('Error al iniciar sesión');
    });

    it('resets isLoading after completion on success', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);

      await act(async () => {
        await useAuthStore.getState().login(mockLoginDto);
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('resets isLoading after completion on failure', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('Failed'));

      await act(async () => {
        try {
          await useAuthStore.getState().login(mockLoginDto);
        } catch {
          // Expected to throw
        }
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('clears previous error before login attempt', async () => {
      // Set an existing error
      useAuthStore.setState({ error: 'Previous error' });
      
      vi.mocked(authService.login).mockResolvedValue(mockAuthResponse);

      let errorDuringRequest: string | null = 'not-checked';
      vi.mocked(authService.login).mockImplementation(async () => {
        errorDuringRequest = useAuthStore.getState().error;
        return mockAuthResponse;
      });

      await act(async () => {
        await useAuthStore.getState().login(mockLoginDto);
      });

      expect(errorDuringRequest).toBeNull();
    });

    it('throws the error after setting state', async () => {
      const apiError = new ApiClientError(401, 'Unauthorized', 'Invalid');
      vi.mocked(authService.login).mockRejectedValue(apiError);

      await expect(
        act(async () => {
          await useAuthStore.getState().login(mockLoginDto);
        })
      ).rejects.toThrow(apiError);
    });
  });

  // ==================== Register Flow Tests ====================
  describe('register', () => {
    it('calls authService.register with data', async () => {
      vi.mocked(authService.register).mockResolvedValue(mockAuthResponse);

      await act(async () => {
        await useAuthStore.getState().register(mockRegisterDto);
      });

      expect(authService.register).toHaveBeenCalledWith(mockRegisterDto);
      expect(authService.register).toHaveBeenCalledTimes(1);
    });

    it('sets isLoading to true during request', async () => {
      let loadingDuringRequest = false;
      
      vi.mocked(authService.register).mockImplementation(async () => {
        loadingDuringRequest = useAuthStore.getState().isLoading;
        return mockAuthResponse;
      });

      await act(async () => {
        await useAuthStore.getState().register(mockRegisterDto);
      });

      expect(loadingDuringRequest).toBe(true);
    });

    it('does NOT set user or isAuthenticated on success (requires explicit login)', async () => {
      vi.mocked(authService.register).mockResolvedValue(mockAuthResponse);

      await act(async () => {
        await useAuthStore.getState().register(mockRegisterDto);
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error on failure with ApiClientError', async () => {
      const apiError = new ApiClientError(409, 'Conflict', 'Email ya registrado');
      vi.mocked(authService.register).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await useAuthStore.getState().register(mockRegisterDto);
        } catch {
          // Expected to throw
        }
      });

      const state = useAuthStore.getState();
      expect(state.error).toBe('Email ya registrado');
    });

    it('sets generic error message on unknown error', async () => {
      vi.mocked(authService.register).mockRejectedValue(new Error('Network error'));

      await act(async () => {
        try {
          await useAuthStore.getState().register(mockRegisterDto);
        } catch {
          // Expected to throw
        }
      });

      expect(useAuthStore.getState().error).toBe('Error al registrar usuario');
    });

    it('resets isLoading after completion', async () => {
      vi.mocked(authService.register).mockResolvedValue(mockAuthResponse);

      await act(async () => {
        await useAuthStore.getState().register(mockRegisterDto);
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('throws the error after setting state', async () => {
      const apiError = new ApiClientError(409, 'Conflict', 'Email exists');
      vi.mocked(authService.register).mockRejectedValue(apiError);

      await expect(
        act(async () => {
          await useAuthStore.getState().register(mockRegisterDto);
        })
      ).rejects.toThrow(apiError);
    });
  });

  // ==================== Logout Flow Tests ====================
  describe('logout', () => {
    it('calls authService.logout', () => {
      // Setup authenticated state
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      act(() => {
        useAuthStore.getState().logout();
      });

      expect(authService.logout).toHaveBeenCalledTimes(1);
    });

    it('clears user and sets isAuthenticated to false', () => {
      // Setup authenticated state
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
        error: 'some error',
      });

      act(() => {
        useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('resets to initial state', () => {
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        isLoading: true,
        error: 'some error',
      });

      act(() => {
        useAuthStore.getState().logout();
      });

      const state = useAuthStore.getState();
      expect(state).toMatchObject(initialState);
    });
  });

  // ==================== Change Passphrase Flow Tests ====================
  describe('changePassphrase', () => {
    it('calls authService.changePassphrase with data', async () => {
      vi.mocked(authService.changePassphrase).mockResolvedValue(undefined);

      await act(async () => {
        await useAuthStore.getState().changePassphrase(mockChangePassphraseDto);
      });

      expect(authService.changePassphrase).toHaveBeenCalledWith(mockChangePassphraseDto);
    });

    it('sets isLoading to true during request', async () => {
      let loadingDuringRequest = false;
      
      vi.mocked(authService.changePassphrase).mockImplementation(async () => {
        loadingDuringRequest = useAuthStore.getState().isLoading;
        return undefined;
      });

      await act(async () => {
        await useAuthStore.getState().changePassphrase(mockChangePassphraseDto);
      });

      expect(loadingDuringRequest).toBe(true);
    });

    it('resets isLoading on success', async () => {
      vi.mocked(authService.changePassphrase).mockResolvedValue(undefined);

      await act(async () => {
        await useAuthStore.getState().changePassphrase(mockChangePassphraseDto);
      });

      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('sets error on failure', async () => {
      const apiError = new ApiClientError(400, 'Bad Request', 'Passphrase incorrecta');
      vi.mocked(authService.changePassphrase).mockRejectedValue(apiError);

      await act(async () => {
        try {
          await useAuthStore.getState().changePassphrase(mockChangePassphraseDto);
        } catch {
          // Expected to throw
        }
      });

      expect(useAuthStore.getState().error).toBe('Passphrase incorrecta');
    });

    it('sets generic error on unknown error', async () => {
      vi.mocked(authService.changePassphrase).mockRejectedValue(new Error('Network'));

      await act(async () => {
        try {
          await useAuthStore.getState().changePassphrase(mockChangePassphraseDto);
        } catch {
          // Expected to throw
        }
      });

      expect(useAuthStore.getState().error).toBe('Error al cambiar la passphrase');
    });

    it('throws the error after setting state', async () => {
      const apiError = new ApiClientError(400, 'Bad Request', 'Invalid');
      vi.mocked(authService.changePassphrase).mockRejectedValue(apiError);

      await expect(
        act(async () => {
          await useAuthStore.getState().changePassphrase(mockChangePassphraseDto);
        })
      ).rejects.toThrow(apiError);
    });
  });

  // ==================== Check Auth Flow Tests ====================
  describe('checkAuth', () => {
    it('returns true when authService.isAuthenticated returns true', () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      useAuthStore.setState({ user: mockUser });

      let result: boolean;
      act(() => {
        result = useAuthStore.getState().checkAuth();
      });

      expect(result!).toBe(true);
      expect(authService.isAuthenticated).toHaveBeenCalled();
    });

    it('returns false when authService.isAuthenticated returns false', () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(false);

      let result: boolean;
      act(() => {
        result = useAuthStore.getState().checkAuth();
      });

      expect(result!).toBe(false);
    });

    it('clears state when not authenticated but user exists in store', () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(false);
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      let result: boolean;
      act(() => {
        result = useAuthStore.getState().checkAuth();
      });

      expect(result!).toBe(false);
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('does not clear state when authenticated and user exists', () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      let result: boolean;
      act(() => {
        result = useAuthStore.getState().checkAuth();
      });

      expect(result!).toBe(true);
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('returns false when no user and not authenticated', () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(false);
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
      });

      let result: boolean;
      act(() => {
        result = useAuthStore.getState().checkAuth();
      });

      expect(result!).toBe(false);
    });
  });

  // ==================== setUser Tests ====================
  describe('setUser', () => {
    it('sets user and isAuthenticated to true when user provided', () => {
      act(() => {
        useAuthStore.getState().setUser(mockUser);
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('sets user to null and isAuthenticated to false when null provided', () => {
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
      });

      act(() => {
        useAuthStore.getState().setUser(null);
      });

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  // ==================== setError Tests ====================
  describe('setError', () => {
    it('sets error message', () => {
      act(() => {
        useAuthStore.getState().setError('Test error message');
      });

      expect(useAuthStore.getState().error).toBe('Test error message');
    });

    it('sets error to null', () => {
      useAuthStore.setState({ error: 'Existing error' });

      act(() => {
        useAuthStore.getState().setError(null);
      });

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  // ==================== clearError Tests ====================
  describe('clearError', () => {
    it('resets error state to null', () => {
      useAuthStore.setState({ error: 'Some error message' });

      act(() => {
        useAuthStore.getState().clearError();
      });

      expect(useAuthStore.getState().error).toBeNull();
    });

    it('does nothing when error is already null', () => {
      useAuthStore.setState({ error: null });

      act(() => {
        useAuthStore.getState().clearError();
      });

      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  // ==================== Selectors Tests ====================
  describe('Selectors', () => {
    it('selectUser returns user from state', async () => {
      const { selectUser } = await import('@/lib/stores/auth.store');
      
      useAuthStore.setState({ user: mockUser });
      
      expect(selectUser(useAuthStore.getState())).toEqual(mockUser);
    });

    it('selectIsAuthenticated returns isAuthenticated from state', async () => {
      const { selectIsAuthenticated } = await import('@/lib/stores/auth.store');
      
      useAuthStore.setState({ isAuthenticated: true });
      
      expect(selectIsAuthenticated(useAuthStore.getState())).toBe(true);
    });

    it('selectIsLoading returns isLoading from state', async () => {
      const { selectIsLoading } = await import('@/lib/stores/auth.store');
      
      useAuthStore.setState({ isLoading: true });
      
      expect(selectIsLoading(useAuthStore.getState())).toBe(true);
    });

    it('selectError returns error from state', async () => {
      const { selectError } = await import('@/lib/stores/auth.store');
      
      useAuthStore.setState({ error: 'Test error' });
      
      expect(selectError(useAuthStore.getState())).toBe('Test error');
    });
  });
});
