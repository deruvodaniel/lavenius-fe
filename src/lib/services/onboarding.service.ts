/**
 * Onboarding Service
 * Handles onboarding-related API operations and data persistence
 */

import { apiClient, ApiClientError } from '../api/client';
import type { ClerkUserSyncDto, OnboardingExtraData } from '../types/api.types';

/**
 * LocalStorage key prefix for storing onboarding data not accepted by the backend
 * User ID is appended to make it user-scoped
 */
const ONBOARDING_EXTRA_DATA_KEY_PREFIX = 'lavenius_onboarding_extra';
const BACKEND_PASSPHRASE_KEY_PREFIX = 'lavenius_backend_passphrase';

/**
 * Result of a backend sync attempt
 */
export interface SyncResult {
  success: boolean;
  alreadyExists?: boolean;
  therapistId?: string;
  error?: string;
}

/**
 * Onboarding Service Class
 * Following the established service pattern in the codebase
 */
class OnboardingService {
  private readonly basePath = '/auth';

  /**
   * Get the localStorage key for a specific user
   * @param userId - Clerk user ID
   */
  private getExtraDataKey(userId: string): string {
    return `${ONBOARDING_EXTRA_DATA_KEY_PREFIX}_${userId}`;
  }

  /**
   * Get the localStorage key for backend passphrase (therapist.id) for a Clerk user
   */
  private getBackendPassphraseKey(clerkUserId: string): string {
    return `${BACKEND_PASSPHRASE_KEY_PREFIX}_${clerkUserId}`;
  }

  /**
   * Sync user data with the backend
   * This is called during onboarding to register the Clerk user with our backend
   *
   * @param data - User data to sync (from Clerk + onboarding form)
   * @returns SyncResult indicating success/failure with details
   */
  async syncUserWithBackend(data: ClerkUserSyncDto): Promise<SyncResult> {
    const externalId = data.externalId || data.clerkUserId;
    if (!externalId) {
      return { success: false, error: 'missing_external_id' };
    }
    const payload = {
      clerkUserId: externalId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      licenseNumber: data.licenseNumber ?? '',
    };

    try {
      const response = await apiClient.post<{ user?: { id?: string } }, typeof payload>(
        `${this.basePath}/register`,
        payload
      );

      const backendUserId = response?.user?.id;
      if (backendUserId) {
        this.saveBackendPassphrase(externalId, backendUserId);
        return { success: true, therapistId: backendUserId };
      }
      return { success: true };
    } catch (error) {
      if (error instanceof ApiClientError) {
        // 409 Conflict - User already exists (likely from webhook)
        if (error.statusCode === 409) {
          console.log('User already exists in backend (via webhook or previous registration)');
          return { success: true, alreadyExists: true };
        }

        // 5xx Server errors - Backend unavailable
        if (error.statusCode >= 500) {
          console.warn('Backend unavailable, sync will happen later via webhook:', error.message);
          return { success: false, error: 'backend_unavailable' };
        }

        // 4xx Client errors (400 validation, 401 auth, etc.)
        console.warn('Backend registration validation failed:', error.message);
        return { success: false, error: error.message };
      }

      // Unknown error type
      console.warn('Unknown error during backend sync:', error);
      return { success: false, error: 'unknown_error' };
    }
  }

  /**
   * Save extra onboarding data to localStorage
   * These are fields the backend doesn't currently accept
   *
   * @param userId - Clerk user ID (for scoping the data)
   * @param data - Extra data to save
   */
  saveExtraData(userId: string, data: OnboardingExtraData): void {
    // Clean up the object - only include non-empty values
    const cleanedData: OnboardingExtraData = {};

    if (data.specialty) cleanedData.specialty = data.specialty;
    if (data.alternativePhone) cleanedData.alternativePhone = data.alternativePhone;
    if (data.officeAddress) cleanedData.officeAddress = data.officeAddress;
    if (data.website) cleanedData.website = data.website;
    if (data.bio) cleanedData.bio = data.bio;

    // Only add socialMedia if at least one value exists
    if (data.socialMedia?.instagram || data.socialMedia?.linkedin) {
      cleanedData.socialMedia = {};
      if (data.socialMedia.instagram) cleanedData.socialMedia.instagram = data.socialMedia.instagram;
      if (data.socialMedia.linkedin) cleanedData.socialMedia.linkedin = data.socialMedia.linkedin;
    }

    // Only save if there's actual data
    if (Object.keys(cleanedData).length > 0) {
      const key = this.getExtraDataKey(userId);
      localStorage.setItem(key, JSON.stringify(cleanedData));
      if (import.meta.env.DEV) {
        console.log('Extra onboarding data saved to localStorage:', key);
      }
    }
  }

  /**
   * Get extra onboarding data from localStorage
   *
   * @param userId - Clerk user ID
   * @returns The extra data or null if not found
   */
  getExtraData(userId: string): OnboardingExtraData | null {
    const key = this.getExtraDataKey(userId);
    const data = localStorage.getItem(key);

    if (!data) return null;

    try {
      return JSON.parse(data) as OnboardingExtraData;
    } catch {
      console.warn('Failed to parse onboarding extra data from localStorage');
      return null;
    }
  }

  /**
   * Clear extra onboarding data from localStorage
   * Call this after the data has been synced to the backend
   *
   * @param userId - Clerk user ID
   */
  clearExtraData(userId: string): void {
    const key = this.getExtraDataKey(userId);
    localStorage.removeItem(key);
  }

  /**
   * Store backend passphrase (currently therapist.id) associated with Clerk user ID
   */
  saveBackendPassphrase(clerkUserId: string, passphrase: string): void {
    const key = this.getBackendPassphraseKey(clerkUserId);
    localStorage.setItem(key, passphrase);
  }

  /**
   * Get backend passphrase for a Clerk user ID
   */
  getBackendPassphrase(clerkUserId: string): string | null {
    const key = this.getBackendPassphraseKey(clerkUserId);
    return localStorage.getItem(key);
  }
}

/**
 * Export singleton instance
 */
export const onboardingService = new OnboardingService();

/**
 * Export class for testing
 */
export { OnboardingService };
