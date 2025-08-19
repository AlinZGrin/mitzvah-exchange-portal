import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { user } = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

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
        },
        reviews: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}
