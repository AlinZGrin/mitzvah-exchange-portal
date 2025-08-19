import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { PointsUtils, JSONUtils } from '@/lib/types';
import { safeConsoleError } from '@/lib/error-utils';

// POST /api/assignments/[id]/complete - Mark assignment as complete
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const assignmentId = request.url.split('/').slice(-2)[0]; // Extract ID from URL
    const { notes, proofPhotos = [] } = await request.json();
    
    // Check if assignment exists and belongs to user
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
        }
      }
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

    // Update assignment and request status in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Update assignment
      const updatedAssignment = await tx.assignment.update({
        where: { id: assignmentId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
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

      // Update request status
      await tx.mitzvahRequest.update({
        where: { id: assignment.requestId },
        data: { status: 'COMPLETED' }
      });

      return updatedAssignment;
    });

    // TODO: Send notification to request owner for confirmation
    // TODO: Set up auto-confirmation timer

    return NextResponse.json({
      message: 'Assignment marked as complete. Waiting for owner confirmation.',
      assignment: {
        ...result,
        proofPhotos: JSONUtils.parseArray(result.proofPhotos)
      }
    });

  } catch (error) {
    safeConsoleError('Error completing assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
