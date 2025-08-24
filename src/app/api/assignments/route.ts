import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { withPrisma } from "@/lib/prisma";
import { safeConsoleError } from '@/lib/error-utils';
import { getPrivacyAwareUserInfo, shouldShowPhone } from '@/lib/privacy-utils';
import { JSONUtils } from '@/lib/types';

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    // Get assignments where user is either the performer or the requester
    const assignments = await withPrisma(async (prisma) => {
      return await prisma.assignment.findMany({
        where: {
          OR: [
            { performerId: user.id }, // Assignments the user is performing
            { request: { ownerId: user.id } } // Assignments for requests the user posted
          ]
        },
        include: {
          request: {
            include: {
              owner: {
                include: {
                  profile: true
                }
              }
            }
          },
          performer: {
            include: {
              profile: true
            }
          }
        },
        orderBy: {
          claimedAt: 'desc'
        }
      });
    });

    // Transform assignments to apply privacy rules and include phone when appropriate
    const transformedAssignments = assignments.map((assignment) => {
      // For assignments, phone should be visible when there's an active relationship
      const hasActiveAssignment = true; // This IS an active assignment context
      
      // Apply privacy to request owner
      let ownerInfo = null;
      if (assignment.request.owner) {
        const profile = assignment.request.owner.profile;
        const privacyData = profile?.privacy ? JSONUtils.parseObject(profile.privacy, {}) : {};
        
        // Create user object for privacy utility with proper typing
        const ownerForPrivacy = {
          id: assignment.request.owner.id,
          email: assignment.request.owner.email,
          profile: {
            displayName: profile?.displayName || null,
            bio: profile?.bio || null,
            city: profile?.city || null,
            phone: (profile as any)?.phone || null,
            privacy: {
              showEmail: (privacyData as any).showEmail || false,
              showPhone: (privacyData as any).showPhone || false,
              showExactLocation: (privacyData as any).showExactLocation || false
            }
          }
        };
        
        const privacyAwareInfo = getPrivacyAwareUserInfo(ownerForPrivacy, user.id);
        const showPhone = shouldShowPhone(ownerForPrivacy, user.id, hasActiveAssignment);
        
        ownerInfo = {
          id: assignment.request.owner.id,
          profile: {
            displayName: privacyAwareInfo.displayName,
            email: privacyAwareInfo.email,
            location: privacyAwareInfo.location,
            phone: showPhone ? (profile as any)?.phone : null,
            showEmail: privacyAwareInfo.showEmail,
            showLocation: privacyAwareInfo.showLocation,
            showPhone: showPhone
          }
        };
      }

      // Apply privacy to performer
      let performerInfo = null;
      if (assignment.performer) {
        const profile = assignment.performer.profile;
        const privacyData = profile?.privacy ? JSONUtils.parseObject(profile.privacy, {}) : {};
        
        // Create user object for privacy utility with proper typing
        const performerForPrivacy = {
          id: assignment.performer.id,
          email: assignment.performer.email,
          profile: {
            displayName: profile?.displayName || null,
            bio: profile?.bio || null,
            city: profile?.city || null,
            phone: (profile as any)?.phone || null,
            privacy: {
              showEmail: (privacyData as any).showEmail || false,
              showPhone: (privacyData as any).showPhone || false,
              showExactLocation: (privacyData as any).showExactLocation || false
            }
          }
        };
        
        const privacyAwareInfo = getPrivacyAwareUserInfo(performerForPrivacy, user.id);
        const showPhone = shouldShowPhone(performerForPrivacy, user.id, hasActiveAssignment);
        
        performerInfo = {
          id: assignment.performer.id,
          profile: {
            displayName: privacyAwareInfo.displayName,
            email: privacyAwareInfo.email,
            location: privacyAwareInfo.location,
            phone: showPhone ? (profile as any)?.phone : null,
            showEmail: privacyAwareInfo.showEmail,
            showLocation: privacyAwareInfo.showLocation,
            showPhone: showPhone
          }
        };
      }

      return {
        ...assignment,
        proofPhotos: JSONUtils.parseArray(assignment.proofPhotos || '[]'),
        request: {
          ...assignment.request,
          requirements: JSONUtils.parseArray(assignment.request.requirements || '[]'),
          attachments: JSONUtils.parseArray(assignment.request.attachments || '[]'),
          owner: ownerInfo
        },
        performer: performerInfo
      };
    });

    return NextResponse.json({ assignments: transformedAssignments });
  } catch (error) {
    safeConsoleError("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
});
