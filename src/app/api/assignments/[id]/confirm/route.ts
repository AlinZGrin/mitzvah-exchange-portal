import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { PointsUtils, JSONUtils } from '@/lib/types';
import { safeConsoleError } from '@/lib/error-utils';

// POST /api/assignments/[id]/confirm - Confirm assignment completion
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const assignmentId = request.url.split('/').slice(-2)[0]; // Extract ID from URL
    const { rating = 5, review } = await request.json();
    
    // Check if assignment exists and user is the request owner
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        request: {
          include: {
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
        },
        performer: {
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
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (assignment.request.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to confirm this assignment' },
        { status: 403 }
      );
    }

    if (assignment.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Assignment must be completed before confirmation' },
        { status: 400 }
      );
    }

    // Calculate points to award
    const points = PointsUtils.calculatePoints(
      assignment.request.category as any,
      assignment.request.urgency as any
    );

    // Confirm assignment, award points, and create review in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Update assignment status
      const confirmedAssignment = await tx.assignment.update({
        where: { id: assignmentId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date()
        }
      });

      // Update request status
      await tx.mitzvahRequest.update({
        where: { id: assignment.requestId },
        data: { status: 'CONFIRMED' }
      });

      // Award points to performer
      await tx.pointsLedger.create({
        data: {
          userId: assignment.performerId,
          requestId: assignment.requestId,
          delta: points,
          reason: `Completed mitzvah: ${assignment.request.title}`
        }
      });

      // Create review if provided
      if (review && rating) {
        await tx.review.create({
          data: {
            requestId: assignment.requestId,
            reviewerId: user.id,
            revieweeId: assignment.performerId,
            stars: Math.min(Math.max(rating, 1), 5), // Ensure rating is between 1-5
            comment: review,
            visibility: 'PUBLIC'
          }
        });
      }

      return {
        assignment: confirmedAssignment,
        pointsAwarded: points
      };
    });

    // TODO: Send notification to performer about confirmation and points

    return NextResponse.json({
      message: `Assignment confirmed! ${points} points awarded.`,
      assignment: {
        ...result.assignment,
        proofPhotos: JSONUtils.parseArray(result.assignment.proofPhotos)
      },
      pointsAwarded: result.pointsAwarded
    });

  } catch (error) {
    safeConsoleError('Error confirming assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
