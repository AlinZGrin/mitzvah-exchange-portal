import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { JSONUtils } from '@/lib/types';

// GET /api/users/me - Get current user profile and stats
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
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

    // Prepare response
    const { password: _, emailVerificationToken: __, ...userWithoutSensitiveData } = userWithProfile;
    
    const responseData = {
      ...userWithoutSensitiveData,
      profile: userWithProfile.profile ? {
        ...userWithProfile.profile,
        languages: JSONUtils.parseArray(userWithProfile.profile.languages),
        skills: JSONUtils.parseArray(userWithProfile.profile.skills),
        privacy: JSONUtils.parseObject(userWithProfile.profile.privacy, {}),
        availability: JSONUtils.parseObject(userWithProfile.profile.availability, {})
      } : null,
      stats: {
        totalPoints: totalPoints._sum.delta || 0,
        completedMitzvahs: completedAssignments,
        completionRate,
        currentRank,
        totalRequests: userWithProfile.ownedRequests.length,
        activeAssignments: userWithProfile.assignments.length
      },
      recentActivity: userWithProfile.pointsEntries,
      activeRequests: userWithProfile.ownedRequests.map((req: any) => ({
        ...req,
        requirements: JSONUtils.parseArray(req.requirements),
        attachments: JSONUtils.parseArray(req.attachments)
      })),
      activeAssignments: userWithProfile.assignments.map((assignment: any) => ({
        ...assignment,
        proofPhotos: JSONUtils.parseArray(assignment.proofPhotos)
      }))
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching user profile:', error);
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
    const { displayName, bio, city, languages, skills, privacy } = body;

    // Update or create profile
    const updatedProfile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        displayName: displayName || null,
        bio: bio || null,
        city: city || null,
        languages: JSON.stringify(languages || []),
        skills: JSON.stringify(skills || []),
        privacy: JSON.stringify(privacy || {}),
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        displayName: displayName || null,
        bio: bio || null,
        city: city || null,
        languages: JSON.stringify(languages || []),
        skills: JSON.stringify(skills || []),
        privacy: JSON.stringify(privacy || {}),
      }
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
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
});
