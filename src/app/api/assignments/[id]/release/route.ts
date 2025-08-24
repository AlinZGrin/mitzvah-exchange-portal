import { NextRequest, NextResponse } from 'next/server';
import { withPrisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { safeConsoleError } from '@/lib/error-utils';

// POST /api/assignments/[id]/release - Release a claimed assignment
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const assignmentId = request.url.split('/').slice(-2)[0]; // Extract ID from URL
    const { reason } = await request.json();
    
    // Check if assignment exists and user is the performer
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
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (assignment.performerId !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to release this assignment' },
        { status: 403 }
      );
    }

    if (assignment.status !== 'CLAIMED' && assignment.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Assignment cannot be released in current status' },
        { status: 400 }
      );
    }

    // Release assignment and update request status in a transaction
    const result = await withPrisma(async (prisma) => {
      return await prisma.$transaction(async (tx: any) => {
        // Delete the assignment
        await tx.assignment.delete({
          where: { id: assignmentId }
        });

        // Update request status back to OPEN
        const updatedRequest = await tx.mitzvahRequest.update({
          where: { id: assignment.requestId },
          data: { status: 'OPEN' }
        });

        return updatedRequest;
      });
    });

    // TODO: Send notification to request owner about release
    // TODO: Log the release reason for analytics

    return NextResponse.json({
      message: 'Assignment released successfully. The mitzvah is now available for others to claim.',
      request: result
    });

  } catch (error) {
    safeConsoleError('Error releasing assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
