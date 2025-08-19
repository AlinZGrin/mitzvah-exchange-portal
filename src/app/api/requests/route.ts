import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { JSONUtils, PointsUtils } from '@/lib/types';

// GET /api/requests - Get all requests with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const urgency = searchParams.get('urgency');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      visibility: 'PUBLIC', // Only show public requests for general listing
    };

    if (category && category !== 'All') {
      where.category = category;
    }

    if (urgency && urgency !== 'All') {
      where.urgency = urgency;
    }

    if (status && status !== 'All') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { locationDisplay: { contains: search } }
      ];
    }

    const requests = await prisma.mitzvahRequest.findMany({
      where,
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
        },
        assignment: {
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
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Transform the data to parse JSON fields
    const transformedRequests = requests.map((request: any) => ({
      ...request,
      locationGeo: JSONUtils.parseObject(request.locationGeo, {}),
      requirements: JSONUtils.parseArray(request.requirements),
      attachments: JSONUtils.parseArray(request.attachments)
    }));

    return NextResponse.json({
      requests: transformedRequests,
      total: await prisma.mitzvahRequest.count({ where })
    });

  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/requests - Create new request
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const data = await request.json();
    
    const {
      title,
      description,
      category,
      locationDisplay,
      timeWindowStart,
      timeWindowEnd,
      urgency = 'NORMAL',
      visibility = 'PUBLIC',
      requirements = [],
      language,
      isRecurring = false
    } = data;

    // Validate required fields
    if (!title || !description || !category || !locationDisplay) {
      return NextResponse.json(
        { error: 'Title, description, category, and location are required' },
        { status: 400 }
      );
    }

    // Create the request
    const newRequest = await prisma.mitzvahRequest.create({
      data: {
        ownerId: user.id,
        title,
        description,
        category,
        locationDisplay,
        timeWindowStart: timeWindowStart ? new Date(timeWindowStart) : null,
        timeWindowEnd: timeWindowEnd ? new Date(timeWindowEnd) : null,
        urgency,
        visibility,
        requirements: JSONUtils.stringify(requirements),
        attachments: JSONUtils.stringify([])
      },
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
    });

    // Transform response
    const transformedRequest = {
      ...newRequest,
      locationGeo: JSONUtils.parseObject(newRequest.locationGeo, {}),
      requirements: JSONUtils.parseArray(newRequest.requirements),
      attachments: JSONUtils.parseArray(newRequest.attachments)
    };

    return NextResponse.json({
      message: 'Request created successfully',
      request: transformedRequest
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
