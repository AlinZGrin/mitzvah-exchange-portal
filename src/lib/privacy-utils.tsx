// Utility functions for handling privacy-aware user information display

export interface UserWithPrivacy {
  id: string;
  email: string;
  profile?: {
    displayName?: string | null;
    bio?: string | null;
    city?: string | null;
    neighborhood?: string | null;
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
    return formatFullLocation(user.profile?.city, user.profile?.neighborhood);
  }
  
  // If user has active assignment, show full location regardless of privacy settings
  if (hasActiveAssignment) {
    return formatFullLocation(user.profile?.city, user.profile?.neighborhood);
  }
  
  // If user allows exact location to be shown, show full location
  if (privacy.showExactLocation) {
    return formatFullLocation(user.profile?.city, user.profile?.neighborhood);
  }
  
  // Otherwise, show only city
  return user.profile?.city || null;
}

/**
 * Format city and neighborhood into a full location string
 * @param city - City name
 * @param neighborhood - Neighborhood name
 * @returns Formatted location string
 */
function formatFullLocation(city?: string | null, neighborhood?: string | null): string | null {
  if (!city && !neighborhood) return null;
  
  if (city && neighborhood) {
    return `${neighborhood}, ${city}`;
  }
  
  return city || neighborhood || null;
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
      location: formatFullLocation(user.profile?.city, user.profile?.neighborhood),
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
 * Component for displaying user contact information with privacy awareness
 */
export interface ContactInfoProps {
  user: UserWithPrivacy;
  currentUserId?: string;
  hasActiveAssignment?: boolean;
  showCompactView?: boolean;
  className?: string;
}

export function UserContactInfo({ user, currentUserId, hasActiveAssignment = false, showCompactView = false, className = '' }: ContactInfoProps) {
  const info = getPrivacyAwareUserInfo(user, currentUserId, hasActiveAssignment);
  
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="font-medium text-gray-900">
        {info.displayName}
      </div>
      
      {!showCompactView && (
        <>
          {info.email && (
            <div className="text-sm text-gray-600">
              📧 {info.email}
            </div>
          )}
          
          {info.location && (
            <div className="text-sm text-gray-600">
              📍 {info.location}
            </div>
          )}
          
          {!info.showEmail && !info.isOwnProfile && (
            <div className="text-xs text-gray-400 italic">
              Contact details private
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Hook for getting privacy-aware user information
 */
export function usePrivacyAwareUserInfo(user: UserWithPrivacy, currentUserId?: string, hasActiveAssignment: boolean = false) {
  return getPrivacyAwareUserInfo(user, currentUserId, hasActiveAssignment);
}
