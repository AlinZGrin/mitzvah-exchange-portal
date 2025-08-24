// Utility functions for handling privacy-aware user information display

export interface UserWithPrivacy {
  id: string;
  email: string;
  profile?: {
    displayName?: string | null;
    bio?: string | null;
    city?: string | null;
    address?: string | null;
    phone?: string | null;
    privacy?: {
      showEmail?: boolean;
      showPhone?: boolean;
      showExactLocation?: boolean;
    };
  };
}

/**
 * Determine if phone number should be visible based on relationship between users
 * @param user - User whose phone number we're checking
 * @param currentUserId - ID of user requesting to see the phone
 * @param hasActiveAssignment - Whether current user has an active assignment with this user
 * @returns boolean indicating if phone should be visible
 */
export function shouldShowPhone(user: UserWithPrivacy, currentUserId?: string, hasActiveAssignment: boolean = false): boolean {
  // Always show to self
  if (currentUserId && user.id === currentUserId) {
    return true;
  }
  
  // Show to users who have an active assignment (claimed a mitzvah from this user)
  if (hasActiveAssignment) {
    return true;
  }
  
  // Otherwise hide phone number
  return false;
}

/**
 * Determine if address should be visible based on relationship between users
 * @param user - User whose address we're checking  
 * @param currentUserId - ID of user requesting to see the address
 * @param hasActiveAssignment - Whether current user has an active assignment with this user
 * @returns boolean indicating if full address should be visible
 */
export function shouldShowAddress(user: UserWithPrivacy, currentUserId?: string, hasActiveAssignment: boolean = false): boolean {
  // Always show to self
  if (currentUserId && user.id === currentUserId) {
    return true;
  }
  
  // Show to users who have an active assignment (claimed a mitzvah from this user)
  if (hasActiveAssignment) {
    return true;
  }
  
  // Otherwise show only city portion
  return false;
}

/**
 * Extract city portion from a full address
 * @param address - Full address string
 * @returns City portion only
 */
function extractCityFromAddress(address: string | null): string | null {
  if (!address) return null;
  
  // Try to extract city from common address formats
  // Example: "123 Main St, Springfield, IL 62701" -> "Springfield"
  // Example: "Springfield, IL" -> "Springfield" 
  // Example: "Springfield" -> "Springfield"
  
  const parts = address.split(',').map(part => part.trim());
  
  if (parts.length >= 2) {
    // If multiple parts, assume second-to-last is city
    return parts[parts.length - 2];
  }
  
  // If single part, check if it looks like "City State" or just return it
  const words = address.trim().split(' ');
  if (words.length >= 2 && words[words.length - 1].length === 2) {
    // Likely "City ST" format, return all but last word
    return words.slice(0, -1).join(' ');
  }
  
  // Single word or simple format, return as-is
  return address.trim();
}

/**
 * Get appropriate location display based on privacy and relationship
 * @param user - User whose location we're displaying
 * @param currentUserId - ID of user viewing the information
 * @param hasActiveAssignment - Whether current user has an active assignment
 * @returns Location string to display
 */
export function getLocationDisplay(user: UserWithPrivacy, currentUserId?: string, hasActiveAssignment: boolean = false): string | null {
  const isOwnProfile = currentUserId && user.id === currentUserId;
  const privacy = user.profile?.privacy || { showExactLocation: false };
  
  // For own profile, always show what they have
  if (isOwnProfile) {
    return user.profile?.address || user.profile?.city || null;
  }
  
  // If user has active assignment, show full address regardless of privacy settings
  if (hasActiveAssignment) {
    return user.profile?.address || user.profile?.city || null;
  }
  
  // If user allows exact location to be shown, show full address
  if (privacy.showExactLocation) {
    return user.profile?.address || user.profile?.city || null;
  }
  
  // Otherwise, extract and show only city portion
  return extractCityFromAddress(user.profile?.address || user.profile?.city || null);
}

/**
 * Get user display information respecting privacy settings
 * @param user - User object with profile and privacy settings
 * @param currentUserId - ID of the user viewing the information (to show full info to self)
 * @param hasActiveAssignment - Whether current user has an active assignment
 * @returns Privacy-aware user display information
 */
export function getPrivacyAwareUserInfo(user: UserWithPrivacy, currentUserId?: string, hasActiveAssignment: boolean = false) {
  // Always show full information to the user themselves
  const isOwnProfile = currentUserId && user.id === currentUserId;
  
  if (isOwnProfile) {
    return {
      displayName: user.profile?.displayName || 'Anonymous User',
      email: user.email,
      location: user.profile?.address || user.profile?.city || null,
      showEmail: true,
      showLocation: true,
      showFullAddress: true,
      isOwnProfile: true
    };
  }

  // For other users, respect privacy settings
  const privacy = user.profile?.privacy || {
    showEmail: false,
    showExactLocation: false
  };

  return {
    displayName: user.profile?.displayName || 'Community Member',
    email: privacy.showEmail ? user.email : null,
    location: getLocationDisplay(user, currentUserId, hasActiveAssignment),
    showEmail: privacy.showEmail,
    showLocation: privacy.showExactLocation || hasActiveAssignment,
    showFullAddress: hasActiveAssignment || privacy.showExactLocation,
    isOwnProfile: false
  };
}

/**
 * Hook for getting privacy-aware user information
 */
export function usePrivacyAwareUserInfo(user: UserWithPrivacy, currentUserId?: string, hasActiveAssignment: boolean = false) {
  return getPrivacyAwareUserInfo(user, currentUserId, hasActiveAssignment);
}
