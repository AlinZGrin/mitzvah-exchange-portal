// Type definitions for our application
export interface User {
  id: string;
  email: string;
  role: 'MEMBER' | 'MODERATOR' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  emailVerified: boolean;
  createdAt: Date;
  lastLogin?: Date;
  profile?: Profile;
}

export interface Profile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  languages: string[]; // Will be stored as JSON string in DB
  city?: string;
  neighborhood?: string;
  phone?: string;
  zip?: string;
  photoUrl?: string;
  skills: string[]; // Will be stored as JSON string in DB
  availability?: Record<string, any>; // Will be stored as JSON string in DB
  travelRadiusKm?: number;
  privacy?: Record<string, any>; // Will be stored as JSON string in DB
  createdAt: Date;
  updatedAt: Date;
}

export interface MitzvahRequest {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: MitzvahCategory;
  location?: string; // Encrypted/hashed location data
  locationDisplay: string;
  timeWindowStart?: Date;
  timeWindowEnd?: Date;
  urgency: UrgencyLevel;
  visibility: Visibility;
  requirements: string[]; // Will be stored as JSON string in DB
  attachments: string[]; // Will be stored as JSON string in DB
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  owner?: User;
  assignment?: Assignment;
}

// Extended type for API responses that includes relationships
export interface MitzvahRequestWithRelations extends Omit<MitzvahRequest, 'owner' | 'assignment'> {
  owner?: {
    id: string;
    profile?: {
      displayName: string;
    };
  };
  assignment?: Assignment;
}

export interface Assignment {
  id: string;
  requestId: string;
  performerId: string;
  status: AssignmentStatus;
  claimedAt: Date;
  completedAt?: Date;
  confirmedAt?: Date;
  notes?: string;
  proofPhotos: string[]; // Will be stored as JSON string in DB
  request?: MitzvahRequest;
  performer?: User;
}

export interface PointsLedgerEntry {
  id: string;
  userId: string;
  requestId?: string;
  delta: number;
  reason: string;
  createdAt: Date;
}

export interface UserStats {
  totalPoints: number;
  requestsPosted: number;
  requestsCompleted: number;
  averageRating?: number;
  totalReviews: number;
  currentRank?: number;
  completionRate?: number;
  totalRequests?: number;
  activeAssignments?: number;
}

// Enums
export type MitzvahCategory = 
  | 'VISITS' 
  | 'TRANSPORTATION' 
  | 'ERRANDS' 
  | 'TUTORING' 
  | 'MEALS' 
  | 'HOUSEHOLD' 
  | 'TECHNOLOGY' 
  | 'OTHER';

export type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type Visibility = 'PUBLIC' | 'INVITE_ONLY';
export type RequestStatus = 'OPEN' | 'CLAIMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CONFIRMED' | 'CANCELLED' | 'DISPUTED';
export type AssignmentStatus = 'CLAIMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CONFIRMED';

// Utility functions for JSON field handling
export class JSONUtils {
  static stringify<T>(value: T): string {
    return JSON.stringify(value);
  }

  static parse<T>(value: string | null, defaultValue: T): T {
    if (!value) return defaultValue;
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }

  static parseArray(value: string | null): string[] {
    return this.parse(value, []);
  }

  static parseObject<T extends Record<string, any>>(value: string | null, defaultValue: T): T {
    return this.parse(value, defaultValue);
  }
}

// Points calculation utilities
export class PointsUtils {
  static calculatePoints(category: MitzvahCategory, urgency: UrgencyLevel, modifiers?: Record<string, number>): number {
    const basePoints: Record<MitzvahCategory, number> = {
      VISITS: 10,
      TRANSPORTATION: 15,
      ERRANDS: 8,
      TUTORING: 12,
      MEALS: 10,
      HOUSEHOLD: 10,
      TECHNOLOGY: 12,
      OTHER: 8,
    };

    const urgencyModifiers: Record<UrgencyLevel, number> = {
      LOW: 0,
      NORMAL: 0,
      HIGH: 5,
      URGENT: 10,
    };

    let points = basePoints[category] + urgencyModifiers[urgency];

    // Apply additional modifiers if provided
    if (modifiers) {
      Object.values(modifiers).forEach(modifier => {
        points += modifier;
      });
    }

    return Math.max(points, 1); // Minimum 1 point
  }
}

// User role and permission utilities
export class UserUtils {
  static canModerate(user: User): boolean {
    return user.role === 'MODERATOR' || user.role === 'ADMIN';
  }

  static canAdminister(user: User): boolean {
    return user.role === 'ADMIN';
  }

  static isActive(user: User): boolean {
    return user.status === 'ACTIVE';
  }

  static canCreateRequest(user: User): boolean {
    return this.isActive(user);
  }

  static canClaimRequest(user: User, request: MitzvahRequest): boolean {
    return this.isActive(user) && 
           user.id !== request.ownerId && 
           request.status === 'OPEN';
  }
}
