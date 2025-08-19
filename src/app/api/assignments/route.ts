import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeConsoleError } from '@/lib/error-utils';

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    // Get assignments where user is either the performer or the requester
    const assignments = await prisma.assignment.findMany({
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

    return NextResponse.json({ assignments });
  } catch (error) {
    safeConsoleError("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
});
