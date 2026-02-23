import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onboardingService, OnboardingService } from '../../lib/services/onboarding.service';
import { apiClient, ApiClientError } from '../../lib/api/client';
import type { ClerkUserSyncDto, OnboardingExtraData } from '../../lib/types/api.types';

// Mock only the apiClient methods, preserve ApiClientError class for instanceof checks
vi.mock('../../lib/api/client', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../lib/api/client')>();
  return {
    ...original,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe('OnboardingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== syncUserWithBackend Tests ====================
  describe('syncUserWithBackend', () => {
    const mockUserData: ClerkUserSyncDto = {
      clerkUserId: 'user_abc123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      licenseNumber: 'LIC-001',
    };

    it('should call /auth/register with user data', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(undefined);

      await onboardingService.syncUserWithBackend(mockUserData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', mockUserData);
      expect(apiClient.post).toHaveBeenCalledTimes(1);
    });

    it('should return success when registration succeeds', async () => {
      vi.mocked(apiClient.post).mockResolvedValue(undefined);

      const result = await onboardingService.syncUserWithBackend(mockUserData);

      expect(result).toEqual({ success: true });
    });

    it('should return success with alreadyExists when user already exists (409)', async () => {
      const conflictError = new ApiClientError(409, 'Conflict', 'User already exists');
      vi.mocked(apiClient.post).mockRejectedValue(conflictError);

      const result = await onboardingService.syncUserWithBackend(mockUserData);

      expect(result).toEqual({ success: true, alreadyExists: true });
    });

    it('should return error for backend unavailable (5xx errors)', async () => {
      const serverError = new ApiClientError(500, 'Internal Server Error', 'Server unavailable');
      vi.mocked(apiClient.post).mockRejectedValue(serverError);

      const result = await onboardingService.syncUserWithBackend(mockUserData);

      expect(result).toEqual({ success: false, error: 'backend_unavailable' });
    });

    it('should return error for 503 Service Unavailable', async () => {
      const serviceUnavailable = new ApiClientError(503, 'Service Unavailable', 'Try again later');
      vi.mocked(apiClient.post).mockRejectedValue(serviceUnavailable);

      const result = await onboardingService.syncUserWithBackend(mockUserData);

      expect(result).toEqual({ success: false, error: 'backend_unavailable' });
    });

    it('should return error message for client errors (4xx)', async () => {
      const validationError = new ApiClientError(400, 'Bad Request', 'Invalid email format');
      vi.mocked(apiClient.post).mockRejectedValue(validationError);

      const result = await onboardingService.syncUserWithBackend(mockUserData);

      expect(result).toEqual({ success: false, error: 'Invalid email format' });
    });

    it('should return error message for 401 Unauthorized', async () => {
      const authError = new ApiClientError(401, 'Unauthorized', 'Authentication required');
      vi.mocked(apiClient.post).mockRejectedValue(authError);

      const result = await onboardingService.syncUserWithBackend(mockUserData);

      expect(result).toEqual({ success: false, error: 'Authentication required' });
    });

    it('should return unknown_error for non-ApiClientError exceptions', async () => {
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

      const result = await onboardingService.syncUserWithBackend(mockUserData);

      expect(result).toEqual({ success: false, error: 'unknown_error' });
    });

    it('should handle minimal user data (only required fields)', async () => {
      const minimalData: ClerkUserSyncDto = {
        clerkUserId: 'user_minimal123',
        email: 'minimal@example.com',
        firstName: 'Minimal',
        lastName: 'User',
      };
      vi.mocked(apiClient.post).mockResolvedValue(undefined);

      await onboardingService.syncUserWithBackend(minimalData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', minimalData);
    });

    it('should include optional fields when provided', async () => {
      const fullData: ClerkUserSyncDto = {
        clerkUserId: 'user_full123',
        email: 'full@example.com',
        firstName: 'Full',
        lastName: 'User',
        phone: '+0987654321',
        licenseNumber: 'LIC-999',
      };
      vi.mocked(apiClient.post).mockResolvedValue(undefined);

      await onboardingService.syncUserWithBackend(fullData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', fullData);
    });
  });

  // ==================== Extra Data LocalStorage Tests ====================
  describe('saveExtraData', () => {
    const userId = 'user_123';

    it('should save extra data to localStorage with user-scoped key', () => {
      const extraData: OnboardingExtraData = {
        specialty: 'Cognitive Therapy',
        officeAddress: '123 Main St',
      };

      onboardingService.saveExtraData(userId, extraData);

      const savedData = localStorage.getItem(`lavenius_onboarding_extra_${userId}`);
      expect(savedData).toBeTruthy();
      expect(JSON.parse(savedData!)).toEqual(extraData);
    });

    it('should only save non-empty values', () => {
      const extraData: OnboardingExtraData = {
        specialty: 'CBT',
        alternativePhone: '',
        officeAddress: undefined,
        website: '',
      };

      onboardingService.saveExtraData(userId, extraData);

      const savedData = localStorage.getItem(`lavenius_onboarding_extra_${userId}`);
      expect(JSON.parse(savedData!)).toEqual({ specialty: 'CBT' });
    });

    it('should save social media only if at least one value exists', () => {
      const extraData: OnboardingExtraData = {
        socialMedia: {
          instagram: '@therapist',
          linkedin: '',
        },
      };

      onboardingService.saveExtraData(userId, extraData);

      const savedData = localStorage.getItem(`lavenius_onboarding_extra_${userId}`);
      expect(JSON.parse(savedData!)).toEqual({
        socialMedia: { instagram: '@therapist' },
      });
    });

    it('should not save to localStorage if all values are empty', () => {
      const extraData: OnboardingExtraData = {
        specialty: '',
        alternativePhone: undefined,
        socialMedia: { instagram: '', linkedin: '' },
      };

      onboardingService.saveExtraData(userId, extraData);

      const savedData = localStorage.getItem(`lavenius_onboarding_extra_${userId}`);
      expect(savedData).toBeNull();
    });

    it('should save complete extra data', () => {
      const extraData: OnboardingExtraData = {
        specialty: 'Family Therapy',
        alternativePhone: '+1111111111',
        officeAddress: '456 Oak Ave',
        website: 'https://example.com',
        socialMedia: {
          instagram: '@therapist',
          linkedin: 'therapist-linkedin',
        },
        bio: 'Experienced therapist',
      };

      onboardingService.saveExtraData(userId, extraData);

      const savedData = localStorage.getItem(`lavenius_onboarding_extra_${userId}`);
      expect(JSON.parse(savedData!)).toEqual(extraData);
    });
  });

  describe('getExtraData', () => {
    const userId = 'user_456';

    it('should retrieve extra data from localStorage', () => {
      const extraData: OnboardingExtraData = {
        specialty: 'Art Therapy',
        website: 'https://art-therapy.com',
      };
      localStorage.setItem(
        `lavenius_onboarding_extra_${userId}`,
        JSON.stringify(extraData)
      );

      const result = onboardingService.getExtraData(userId);

      expect(result).toEqual(extraData);
    });

    it('should return null if no data exists', () => {
      const result = onboardingService.getExtraData('non-existent-user');

      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem(`lavenius_onboarding_extra_${userId}`, 'invalid-json{');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = onboardingService.getExtraData(userId);

      expect(result).toBeNull();
      consoleSpy.mockRestore();
    });
  });

  describe('clearExtraData', () => {
    const userId = 'user_789';

    it('should remove extra data from localStorage', () => {
      localStorage.setItem(
        `lavenius_onboarding_extra_${userId}`,
        JSON.stringify({ specialty: 'Test' })
      );

      onboardingService.clearExtraData(userId);

      expect(localStorage.getItem(`lavenius_onboarding_extra_${userId}`)).toBeNull();
    });

    it('should not throw when clearing non-existent data', () => {
      expect(() => {
        onboardingService.clearExtraData('non-existent-user');
      }).not.toThrow();
    });
  });

  // ==================== Integration Tests ====================
  describe('Integration scenarios', () => {
    const userId = 'user_integration';

    it('should handle full registration flow: sync, save extra, retrieve', async () => {
      const userData: ClerkUserSyncDto = {
        clerkUserId: 'user_integration123',
        email: 'integration@test.com',
        firstName: 'Integration',
        lastName: 'Test',
        phone: '+1234567890',
      };
      const extraData: OnboardingExtraData = {
        specialty: 'Integration Testing',
        bio: 'Test bio',
      };

      vi.mocked(apiClient.post).mockResolvedValue(undefined);

      // 1. Sync with backend
      const syncResult = await onboardingService.syncUserWithBackend(userData);
      expect(syncResult.success).toBe(true);

      // 2. Save extra data
      onboardingService.saveExtraData(userId, extraData);

      // 3. Retrieve extra data
      const retrieved = onboardingService.getExtraData(userId);
      expect(retrieved).toEqual(extraData);
    });

    it('should handle registration when user already exists via webhook', async () => {
      const userData: ClerkUserSyncDto = {
        clerkUserId: 'user_existing123',
        email: 'existing@test.com',
        firstName: 'Existing',
        lastName: 'User',
      };

      // Simulate 409 Conflict (user created via webhook)
      const conflictError = new ApiClientError(409, 'Conflict', 'User already exists');
      vi.mocked(apiClient.post).mockRejectedValue(conflictError);

      const result = await onboardingService.syncUserWithBackend(userData);

      // Should still be considered successful
      expect(result.success).toBe(true);
      expect(result.alreadyExists).toBe(true);
    });

    it('should gracefully handle backend downtime during registration', async () => {
      const userData: ClerkUserSyncDto = {
        clerkUserId: 'user_offline123',
        email: 'offline@test.com',
        firstName: 'Offline',
        lastName: 'User',
      };

      vi.mocked(apiClient.post).mockRejectedValue(
        new ApiClientError(502, 'Bad Gateway', 'Backend unavailable')
      );

      const result = await onboardingService.syncUserWithBackend(userData);

      // Should indicate failure but not throw
      expect(result.success).toBe(false);
      expect(result.error).toBe('backend_unavailable');
    });
  });
});
