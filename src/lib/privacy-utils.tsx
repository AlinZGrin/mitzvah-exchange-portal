// Utility functions for handling privacy-aware user information display

export interface UserWithPrivacy {
  id: string;
  email: string;
  profile?: {
    displayName?: string | null;
    bio?: string | null;
    city?: string | null;
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
 * Get user display information respecting privacy settings
 * @param user - User object with profile and privacy settings
 * @param currentUserId - ID of the user viewing the information (to show full info to self)
 * @returns Privacy-aware user display information
 */
export function getPrivacyAwareUserInfo(user: UserWithPrivacy, currentUserId?: string) {
  // Always show full information to the user themselves
  const isOwnProfile = currentUserId && user.id === currentUserId;
  
  if (isOwnProfile) {
    return {
      displayName: user.profile?.displayName || 'Anonymous User',
      email: user.email,
      city: user.profile?.city || null,
      showEmail: true,
      showLocation: true,
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
    city: privacy.showExactLocation ? (user.profile?.city || null) : getGeneralLocation(user.profile?.city || undefined),
    showEmail: privacy.showEmail,
    showLocation: privacy.showExactLocation,
    isOwnProfile: false
  };
}

/**
 * Get a generalized location when exact location is private
 * @param city - Original city string
 * @returns Generalized location or null
 */
function getGeneralLocation(city?: string): string | null {
  if (!city) return null;
  
  // Extract general area from city (remove specific details)
  // Example: "123 Main St, Springfield, IL" -> "Springfield area"
  const parts = city.split(',');
  if (parts.length > 1) {
    // Take the last meaningful part (usually city/state)
    const lastPart = parts[parts.length - 1].trim();
    const secondLastPart = parts[parts.length - 2]?.trim();
    
    if (secondLastPart && !secondLastPart.match(/^\d+/)) {
      return `${secondLastPart} area`;
    }
    return `${lastPart} area`;
  }
  
  // For simple city names, add "area"
  if (city.length > 0) {
    return `${city} area`;
  }
  
  return null;
}

/**
 * Component for displaying user contact information with privacy awareness
 */
export interface ContactInfoProps {
  user: UserWithPrivacy;
  currentUserId?: string;
  showCompactView?: boolean;
  className?: string;
}

export function UserContactInfo({ user, currentUserId, showCompactView = false, className = '' }: ContactInfoProps) {
  const info = getPrivacyAwareUserInfo(user, currentUserId);
  
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
          
          {info.city && (
            <div className="text-sm text-gray-600">
              📍 {info.city}
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
export function usePrivacyAwareUserInfo(user: UserWithPrivacy, currentUserId?: string) {
  return getPrivacyAwareUserInfo(user, currentUserId);
}
