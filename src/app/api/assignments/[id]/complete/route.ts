import { NextRequest, NextResponse } from 'next/server';
import { withPrisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { PointsUtils, JSONUtils } from '@/lib/types';
import { safeConsoleError } from '@/lib/error-utils';

// Helper function to create the next recurring request
async function createNextRecurringRequest(tx: any, originalRequest: any) {
  // Check if we should create another instance
  if (originalRequest.recurrenceEndDate) {
    const endDate = new Date(originalRequest.recurrenceEndDate);
    if (new Date() >= endDate) {
      return; // Don't create if we've reached the end date
    }
  }

  // Calculate next time window if the original had one
  let nextTimeWindowStart = null;
  let nextTimeWindowEnd = null;
  
  if (originalRequest.timeWindowStart) {
    const originalStart = new Date(originalRequest.timeWindowStart);
    const originalEnd = originalRequest.timeWindowEnd ? new Date(originalRequest.timeWindowEnd) : null;
    
    // Calculate interval in days
    let intervalDays = 7; // Default to weekly
    switch (originalRequest.recurrenceType) {
      case 'WEEKLY':
        intervalDays = 7;
        break;
      case 'BIWEEKLY':
        intervalDays = 14;
        break;
      case 'MONTHLY':
        intervalDays = 30;
        break;
      case 'CUSTOM':
        intervalDays = originalRequest.recurrenceInterval || 7;
        break;
    }
    
    // Add interval to get next occurrence
    nextTimeWindowStart = new Date(originalStart);
    nextTimeWindowStart.setDate(nextTimeWindowStart.getDate() + intervalDays);
    
    if (originalEnd) {
      nextTimeWindowEnd = new Date(originalEnd);
      nextTimeWindowEnd.setDate(nextTimeWindowEnd.getDate() + intervalDays);
    }
  }

  // Create the new recurring request
  await tx.mitzvahRequest.create({
    data: {
      ownerId: originalRequest.ownerId,
      title: originalRequest.title,
      description: originalRequest.description,
      category: originalRequest.category,
      urgency: originalRequest.urgency,
      locationDisplay: originalRequest.locationDisplay,
      timeWindowStart: nextTimeWindowStart,
      timeWindowEnd: nextTimeWindowEnd,
      requirements: originalRequest.requirements,
      attachments: originalRequest.attachments,
      estimatedDuration: originalRequest.estimatedDuration,
      maxPerformers: originalRequest.maxPerformers,
      pointValue: originalRequest.pointValue,
      isRecurring: true,
      recurrenceType: originalRequest.recurrenceType,
      recurrenceInterval: originalRequest.recurrenceInterval,
      recurrenceEndDate: originalRequest.recurrenceEndDate,
      parentRequestId: originalRequest.parentRequestId || originalRequest.id,
      status: 'OPEN'
    }
  });
}

// POST /api/assignments/[id]/complete - Mark assignment as complete
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const assignmentId = request.url.split('/').slice(-2)[0]; // Extract ID from URL
    const { notes, proofPhotos = [] } = await request.json();
    
    // Check if assignment exists and belongs to user
    const assignment = await withPrisma(async (prisma) => {
      return await prisma.assignment.findUnique({
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
          }
        }
      });
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (assignment.performerId !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to complete this assignment' },
        { status: 403 }
      );
    }

    if (!['CLAIMED', 'IN_PROGRESS'].includes(assignment.status)) {
      return NextResponse.json(
        { error: 'Assignment cannot be completed in current status' },
        { status: 400 }
      );
    }

    // Calculate points to award
    const points = PointsUtils.calculatePoints(
      assignment.request.category as any,
      assignment.request.urgency as any
    );

    // Update assignment, award points, and update status in a transaction
    const result = await withPrisma(async (prisma) => {
      return await prisma.$transaction(async (tx: any) => {
        // Update assignment to confirmed (skip waiting for owner confirmation)
        const updatedAssignment = await tx.assignment.update({
          where: { id: assignmentId },
          data: {
            status: 'CONFIRMED',
            completedAt: new Date(),
            confirmedAt: new Date(),
            notes: notes || null,
            proofPhotos: JSONUtils.stringify(proofPhotos)
          },
          include: {
            request: true,
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

        // Update request status to confirmed
        await tx.mitzvahRequest.update({
          where: { id: assignment.requestId },
          data: { status: 'CONFIRMED' }
        });

        // Award points to performer immediately
        await tx.pointsLedger.create({
          data: {
            userId: assignment.performerId,
            requestId: assignment.requestId,
            delta: points,
            reason: `Completed mitzvah: ${assignment.request.title}`
          }
        });

        // Check if this is a recurring request and create next instance
        const fullRequest = await tx.mitzvahRequest.findUnique({
          where: { id: assignment.requestId }
        });
        
        if (fullRequest && (fullRequest as any).isRecurring) {
          // Import the helper function from confirm route
          await createNextRecurringRequest(tx, fullRequest);
        }

        return { assignment: updatedAssignment, pointsAwarded: points };
      });
    });

    // TODO: Send notification to request owner about completion
    // TODO: Send notification to performer about points awarded

    return NextResponse.json({
      message: `Assignment completed! ${points} points awarded.`,
      assignment: {
        ...result.assignment,
        proofPhotos: JSONUtils.parseArray(result.assignment.proofPhotos)
      },
      pointsAwarded: result.pointsAwarded
    });

  } catch (error) {
    safeConsoleError('Error completing assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
