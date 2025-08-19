import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { PointsUtils, JSONUtils } from '@/lib/types';
import { safeConsoleError } from '@/lib/error-utils';

// POST /api/requests/[id]/claim - Claim a request
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const requestId = request.url.split('/').slice(-2)[0]; // Extract ID from URL
    
    // Check if request exists and is claimable
    const mitzvahRequest = await prisma.mitzvahRequest.findUnique({
      where: { id: requestId },
      include: { assignment: true }
    });

    if (!mitzvahRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    if (mitzvahRequest.ownerId === user.id) {
      return NextResponse.json(
        { error: 'Cannot claim your own request' },
        { status: 400 }
      );
    }

    if (mitzvahRequest.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Request is not available for claiming' },
        { status: 400 }
      );
    }

    if (mitzvahRequest.assignment) {
      return NextResponse.json(
        { error: 'Request is already claimed' },
        { status: 400 }
      );
    }

    // Create assignment and update request status in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create assignment
      const assignment = await tx.assignment.create({
        data: {
          requestId: requestId,
          performerId: user.id,
          status: 'CLAIMED',
          proofPhotos: JSONUtils.stringify([])
        },
        include: {
          performer: {
            select: {
              id: true,
              profile: {
                select: {
                  displayName: true
                }
              }
            }
          },
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

      // Update request status
      await tx.mitzvahRequest.update({
        where: { id: requestId },
        data: { status: 'CLAIMED' }
      });

      return assignment;
    });

    // TODO: Send notification to request owner

    return NextResponse.json({
      message: 'Request claimed successfully',
      assignment: {
        ...result,
        proofPhotos: JSONUtils.parseArray(result.proofPhotos)
      }
    });

  } catch (error) {
    safeConsoleError('Error claiming request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
