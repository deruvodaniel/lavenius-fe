import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';

/**
 * User type compatible with existing components
 * Maps Clerk user data to our app's user shape
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  licenseNumber?: string;
  imageUrl?: string;
}

/**
 * Custom hook for authentication using Clerk
 * Provides a simplified interface matching the previous auth implementation
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, isLoading, signOut } = useAuth();
 * 
 * if (!isAuthenticated) return <Navigate to="/login" />;
 * ```
 */
export const useAuth = () => {
  const { isLoaded, isSignedIn, signOut } = useClerkAuth();
  const { user: clerkUser } = useUser();

  // Map Clerk user to our app's user shape
  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    firstName: clerkUser.firstName || '',
    lastName: clerkUser.lastName || '',
    phone: clerkUser.primaryPhoneNumber?.phoneNumber,
    // licenseNumber can be stored in Clerk's publicMetadata
    licenseNumber: clerkUser.publicMetadata?.licenseNumber as string | undefined,
    // Avatar from Clerk (Google, GitHub, or uploaded)
    imageUrl: clerkUser.imageUrl,
  } : null;

  return {
    user,
    isAuthenticated: isSignedIn ?? false,
    isLoading: !isLoaded,
    // Keep logout as an alias for backward compatibility
    logout: signOut,
    signOut,
  };
};
