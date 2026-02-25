import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

/**
 * Social media links stored in onboarding metadata
 */
export interface SocialMediaLinks {
  instagram?: string;
  linkedin?: string;
}

/**
 * User type compatible with existing components
 * Maps Clerk user data to our app's user shape
 */
export interface User {
  id: string;
  therapistId?: string; // Database ID from backend
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  alternativePhone?: string;
  licenseNumber?: string;
  specialty?: string;
  officeAddress?: string;
  website?: string;
  socialMedia?: SocialMediaLinks;
  bio?: string;
  imageUrl?: string;
}

/**
 * Onboarding metadata stored in Clerk's unsafeMetadata
 */
export interface OnboardingMetadata {
  licenseNumber?: string;
  specialty?: string;
  phone?: string;
  alternativePhone?: string;
  officeAddress?: string;
  website?: string;
  socialMedia?: SocialMediaLinks;
  bio?: string;
  onboardingComplete?: boolean;
  onboardingCompletedAt?: string;
}

/**
 * Custom hook for authentication using Clerk
 * Provides a simplified interface matching the previous auth implementation
 * Automatically fetches therapist ID from backend after user signs in
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, isLoading, signOut, hasCompletedOnboarding } = useAuth();
 *
 * if (!isAuthenticated) return <Navigate to="/login" />;
 * if (!hasCompletedOnboarding) return <Navigate to="/onboarding" />;
 *
 * // Access the database therapist ID
 * if (user?.therapistId) {
 *   // Use therapistId for API calls
 * }
 * ```
 */
export const useAuth = () => {
  const { isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [therapistId, setTherapistId] = useState<string | undefined>();
  const [loadingTherapistId, setLoadingTherapistId] = useState(false);

  // Get onboarding metadata from Clerk
  const onboardingMetadata = clerkUser?.unsafeMetadata as OnboardingMetadata | undefined;

  // Check if user has completed onboarding
  const hasCompletedOnboarding = onboardingMetadata?.onboardingComplete === true;

  // Map Clerk user to our app's user shape
  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    therapistId, // Add therapist ID from backend
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    // Phone from Clerk or from onboarding metadata
    phone: clerkUser.primaryPhoneNumber?.phoneNumber || onboardingMetadata?.phone,
    // Alternative phone from onboarding metadata
    alternativePhone: onboardingMetadata?.alternativePhone,
    // licenseNumber from unsafeMetadata (set during onboarding)
    licenseNumber: onboardingMetadata?.licenseNumber,
    // specialty from unsafeMetadata (set during onboarding)
    specialty: onboardingMetadata?.specialty,
    // Office address from onboarding metadata
    officeAddress: onboardingMetadata?.officeAddress,
    // Website from onboarding metadata
    website: onboardingMetadata?.website,
    // Social media links from onboarding metadata
    socialMedia: onboardingMetadata?.socialMedia,
    // Bio from onboarding metadata
    bio: onboardingMetadata?.bio,
    // Avatar from Clerk (Google, GitHub, or uploaded)
    imageUrl: clerkUser.imageUrl,
  } : null;

  // Fetch therapist ID from backend when user signs in
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !clerkUser?.id) {
      setTherapistId(undefined);
      return;
    }

    // Skip if we already have the therapist ID
    if (therapistId) {
      return;
    }

    const fetchTherapistId = async () => {
      setLoadingTherapistId(true);
      try {
        const therapistData = await apiClient.get<{ id: string }>('/therapists');
        if (therapistData?.id) {
          setTherapistId(therapistData.id);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to fetch therapist ID:', error);
        }
        // Don't throw - allow app to continue without therapist ID
        // This might happen during onboarding before therapist is created
      } finally {
        setLoadingTherapistId(false);
      }
    };

    void fetchTherapistId();
  }, [isLoaded, isSignedIn, clerkUser?.id, therapistId]);

  return {
    user,
    isAuthenticated: isSignedIn ?? false,
    isLoading: !isLoaded || loadingTherapistId,
    // Onboarding status
    hasCompletedOnboarding,
    onboardingMetadata,
    // Keep logout as an alias for backward compatibility
    logout: signOut,
    signOut,
  };
};
