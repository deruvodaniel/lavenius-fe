import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/lib/stores';
import type { User, LoginDto, RegisterDto } from '@/lib/types/api.types';

// Mock the auth store
vi.mock('@/lib/stores', () => ({
  useAuthStore: vi.fn(),
}));

// Mock user for testing
const mockUser: User = {
  id: '123',
  email: 'test@example.com',
  firstName: 'Juan',
  lastName: 'Perez',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Mock credentials
const mockLoginCredentials: LoginDto = {
  email: 'test@example.com',
  password: 'password123',
  passphrase: 'my-secret-passphrase',
};

// Mock registration data
const mockRegisterData: RegisterDto = {
  email: 'new@example.com',
  password: 'password123',
  passphrase: 'my-secret-passphrase',
  firstName: 'Maria',
  lastName: 'Garcia',
};

describe('useAuth', () => {
  // Default mock implementation
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockLogout = vi.fn();
  const mockClearError = vi.fn();

  const defaultMockState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout,
    clearError: mockClearError,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock - useAuthStore is called multiple times with selectors
    (useAuthStore as unknown as Mock).mockImplementation((selector: (state: typeof defaultMockState) => unknown) => {
      if (typeof selector === 'function') {
        return selector(defaultMockState);
      }
      return defaultMockState;
    });
  });

  // ==================== Hook Return Values ====================

  describe('Hook Return Values', () => {
    it('returns user from store', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.user).toBeNull();
    });

    it('returns authenticated user when logged in', () => {
      const authenticatedState = {
        ...defaultMockState,
        user: mockUser,
        isAuthenticated: true,
      };

      (useAuthStore as unknown as Mock).mockImplementation((selector: (state: typeof authenticatedState) => unknown) => {
        if (typeof selector === 'function') {
          return selector(authenticatedState);
        }
        return authenticatedState;
      });

      const { result } = renderHook(() => useAuth());
      
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.user?.firstName).toBe('Juan');
    });

    it('returns isAuthenticated from store', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('returns isAuthenticated as true when user is logged in', () => {
      const authenticatedState = {
        ...defaultMockState,
        user: mockUser,
        isAuthenticated: true,
      };

      (useAuthStore as unknown as Mock).mockImplementation((selector: (state: typeof authenticatedState) => unknown) => {
        if (typeof selector === 'function') {
          return selector(authenticatedState);
        }
        return authenticatedState;
      });

      const { result } = renderHook(() => useAuth());
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('returns isLoading from store', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    it('returns isLoading as true during async operations', () => {
      const loadingState = {
        ...defaultMockState,
        isLoading: true,
      };

      (useAuthStore as unknown as Mock).mockImplementation((selector: (state: typeof loadingState) => unknown) => {
        if (typeof selector === 'function') {
          return selector(loadingState);
        }
        return loadingState;
      });

      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(true);
    });

    it('returns error from store', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.error).toBeNull();
    });

    it('returns error message when present', () => {
      const errorState = {
        ...defaultMockState,
        error: 'Invalid credentials',
      };

      (useAuthStore as unknown as Mock).mockImplementation((selector: (state: typeof errorState) => unknown) => {
        if (typeof selector === 'function') {
          return selector(errorState);
        }
        return errorState;
      });

      const { result } = renderHook(() => useAuth());
      expect(result.current.error).toBe('Invalid credentials');
    });
  });

  // ==================== Login Function ====================

  describe('Login Function', () => {
    it('returns login function from store', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.login).toBeDefined();
      expect(typeof result.current.login).toBe('function');
    });

    it('calls store login action with credentials', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login(mockLoginCredentials);
      });

      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith(mockLoginCredentials);
    });

    it('passes email correctly to login', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login(mockLoginCredentials);
      });

      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' })
      );
    });

    it('passes password correctly to login', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login(mockLoginCredentials);
      });

      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'password123' })
      );
    });

    it('passes passphrase correctly to login', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login(mockLoginCredentials);
      });

      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ passphrase: 'my-secret-passphrase' })
      );
    });
  });

  // ==================== Logout Function ====================

  describe('Logout Function', () => {
    it('returns logout function from store', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.logout).toBeDefined();
      expect(typeof result.current.logout).toBe('function');
    });

    it('calls store logout action', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('calls logout without arguments', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalledWith();
    });
  });

  // ==================== Register Function ====================

  describe('Register Function', () => {
    it('returns register function from store', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.register).toBeDefined();
      expect(typeof result.current.register).toBe('function');
    });

    it('calls store register action with registration data', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.register(mockRegisterData);
      });

      expect(mockRegister).toHaveBeenCalledTimes(1);
      expect(mockRegister).toHaveBeenCalledWith(mockRegisterData);
    });

    it('passes all required fields to register', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.register(mockRegisterData);
      });

      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          password: 'password123',
          passphrase: 'my-secret-passphrase',
          firstName: 'Maria',
          lastName: 'Garcia',
        })
      );
    });

    it('passes optional fields to register when provided', async () => {
      const registerDataWithOptional: RegisterDto = {
        ...mockRegisterData,
        phone: '+1234567890',
        licenseNumber: 'LIC-123456',
      };

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.register(registerDataWithOptional);
      });

      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+1234567890',
          licenseNumber: 'LIC-123456',
        })
      );
    });
  });

  // ==================== Clear Error Function ====================

  describe('clearError Function', () => {
    it('returns clearError function from store', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.clearError).toBeDefined();
      expect(typeof result.current.clearError).toBe('function');
    });

    it('calls store clearError action', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.clearError();
      });

      expect(mockClearError).toHaveBeenCalledTimes(1);
    });

    it('calls clearError without arguments', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.clearError();
      });

      expect(mockClearError).toHaveBeenCalledWith();
    });
  });

  // ==================== Combined State Scenarios ====================

  describe('Combined State Scenarios', () => {
    it('returns complete state for unauthenticated user', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toEqual(
        expect.objectContaining({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
      );
    });

    it('returns complete state for authenticated user', () => {
      const authenticatedState = {
        ...defaultMockState,
        user: mockUser,
        isAuthenticated: true,
      };

      (useAuthStore as unknown as Mock).mockImplementation((selector: (state: typeof authenticatedState) => unknown) => {
        if (typeof selector === 'function') {
          return selector(authenticatedState);
        }
        return authenticatedState;
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current).toEqual(
        expect.objectContaining({
          user: mockUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
      );
    });

    it('returns state during login process', () => {
      const loadingState = {
        ...defaultMockState,
        isLoading: true,
      };

      (useAuthStore as unknown as Mock).mockImplementation((selector: (state: typeof loadingState) => unknown) => {
        if (typeof selector === 'function') {
          return selector(loadingState);
        }
        return loadingState;
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current).toEqual(
        expect.objectContaining({
          user: null,
          isAuthenticated: false,
          isLoading: true,
          error: null,
        })
      );
    });

    it('returns state after failed login', () => {
      const errorState = {
        ...defaultMockState,
        error: 'Credenciales invalidas',
        isLoading: false,
      };

      (useAuthStore as unknown as Mock).mockImplementation((selector: (state: typeof errorState) => unknown) => {
        if (typeof selector === 'function') {
          return selector(errorState);
        }
        return errorState;
      });

      const { result } = renderHook(() => useAuth());

      expect(result.current).toEqual(
        expect.objectContaining({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Credenciales invalidas',
        })
      );
    });
  });

  // ==================== Hook Returns All Functions ====================

  describe('Hook Returns All Required Properties', () => {
    it('returns all state properties', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
    });

    it('returns all action functions', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('register');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('clearError');
    });

    it('returns exactly 8 properties', () => {
      const { result } = renderHook(() => useAuth());
      const keys = Object.keys(result.current);
      
      expect(keys).toHaveLength(8);
      expect(keys).toEqual(
        expect.arrayContaining([
          'user',
          'isAuthenticated',
          'isLoading',
          'error',
          'login',
          'register',
          'logout',
          'clearError',
        ])
      );
    });
  });
});
