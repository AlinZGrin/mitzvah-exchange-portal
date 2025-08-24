import { NextRequest, NextResponse } from 'next/server';
import { prisma, withPrisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { JSONUtils } from '@/lib/types';
import { safeConsoleError } from '@/lib/error-utils';

// GET /api/users/me - Get current user profile and stats
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const result = await withPrisma(async (prisma) => {
      // Get user with profile and calculate stats
      const userWithProfile = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          profile: true,
          pointsEntries: {
            orderBy: { createdAt: 'desc' },
            take: 10 // Recent 10 entries
          },
          ownedRequests: {
            where: { status: { in: ['OPEN', 'CLAIMED', 'IN_PROGRESS'] } },
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          assignments: {
            where: { status: { in: ['CLAIMED', 'IN_PROGRESS', 'COMPLETED'] } },
            take: 5,
            orderBy: { claimedAt: 'desc' },
            include: {
              request: {
                select: {
                  id: true,
                  title: true,
                  category: true,
                  urgency: true,
                  owner: {
                    select: {
                      id: true,
                      profile: {
                        select: {
                          displayName: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!userWithProfile) {
        throw new Error('User not found');
      }

      // Calculate statistics
      const totalPoints = await prisma.pointsLedger.aggregate({
        where: { userId: user.id },
        _sum: { delta: true }
      });

      const completedAssignments = await prisma.assignment.count({
        where: {
          performerId: user.id,
          status: 'CONFIRMED'
        }
      });

      const totalAssignments = await prisma.assignment.count({
        where: { performerId: user.id }
      });

      const completionRate = totalAssignments > 0 
        ? Math.round((completedAssignments / totalAssignments) * 100)
        : 0;

      // Get user rank based on points
      const usersWithMorePoints = await prisma.pointsLedger.groupBy({
        by: ['userId'],
        _sum: { delta: true },
        having: {
          delta: {
            _sum: {
              gt: totalPoints._sum.delta || 0
            }
          }
        }
      });

      const currentRank = usersWithMorePoints.length + 1;

      return {
        userWithProfile,
        totalPoints,
        completedAssignments,
        currentRank,
        completionRate
      };
    });

    // Prepare response
    const { password: _, emailVerificationToken: __, pointsEntries, ownedRequests, assignments, ...userWithoutSensitiveData } = result.userWithProfile;
    
    const userData = {
      ...userWithoutSensitiveData,
      profile: result.userWithProfile.profile ? {
        ...result.userWithProfile.profile,
        languages: JSONUtils.parseArray(result.userWithProfile.profile.languages),
        skills: JSONUtils.parseArray(result.userWithProfile.profile.skills),
        privacy: JSONUtils.parseObject(result.userWithProfile.profile.privacy, {}),
        availability: JSONUtils.parseObject(result.userWithProfile.profile.availability, {})
      } : null,
    };

    const userStats = {
      totalPoints: result.totalPoints._sum.delta || 0,
      requestsPosted: result.userWithProfile.ownedRequests.length,
      requestsCompleted: result.completedAssignments,
      averageRating: 4.5, // TODO: Calculate from reviews when implemented
      totalReviews: 0, // TODO: Count from reviews when implemented
      currentRank: result.currentRank,
      completionRate: result.completionRate,
      activeAssignments: result.userWithProfile.assignments.length
    };

    const responseData = {
      user: userData,
      stats: userStats,
      recentActivity: result.userWithProfile.pointsEntries,
      activeRequests: result.userWithProfile.ownedRequests.map((req: any) => ({
        ...req,
        requirements: JSONUtils.parseArray(req.requirements),
        attachments: JSONUtils.parseArray(req.attachments)
      })),
      activeAssignments: result.userWithProfile.assignments.map((assignment: any) => ({
        ...assignment,
        proofPhotos: JSONUtils.parseArray(assignment.proofPhotos)
      }))
    };

    return NextResponse.json(responseData);

  } catch (error) {
    safeConsoleError('Error fetching user profile:', error);
    
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// PATCH /api/users/me - Update current user profile
export const PATCH = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    const { displayName, bio, city, neighborhood, phone, languages, skills, privacy } = body;

    const updatedProfile = await withPrisma(async (prisma) => {
      // Update or create profile
      return await prisma.profile.upsert({
        where: { userId: user.id },
        update: {
          displayName: displayName || null,
          bio: bio || null,
          city: city || null,
          neighborhood: neighborhood || null,
          phone: phone || null,
          languages: JSON.stringify(languages || []),
          skills: JSON.stringify(skills || []),
          privacy: JSON.stringify(privacy || {}),
          updatedAt: new Date()
        } as any,
        create: {
          userId: user.id,
          displayName: displayName || null,
          bio: bio || null,
          city: city || null,
          neighborhood: neighborhood || null,
          phone: phone || null,
          languages: JSON.stringify(languages || []),
          skills: JSON.stringify(skills || []),
          privacy: JSON.stringify(privacy || {}),
        } as any
      });
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        ...updatedProfile,
        languages: JSONUtils.parseArray(updatedProfile.languages),
        skills: JSONUtils.parseArray(updatedProfile.skills),
        privacy: JSONUtils.parseObject(updatedProfile.privacy, {})
      }
    });

  } catch (error) {
    safeConsoleError('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
});
