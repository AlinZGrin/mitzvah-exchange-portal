import { NextRequest, NextResponse } from 'next/server';
import { prisma, withPrisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { JSONUtils, PointsUtils } from '@/lib/types';
import { safeConsoleError } from '@/lib/error-utils';

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
      status: 'OPEN' // Only show open requests for general listing
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

    const result = await withPrisma(async (prisma) => {
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

      const total = await prisma.mitzvahRequest.count({ where });

      return { requests, total };
    });

    // Transform the data to parse JSON fields
    const transformedRequests = result.requests.map((request: any) => ({
      ...request,
      requirements: JSONUtils.parseArray(request.requirements),
      attachments: JSONUtils.parseArray(request.attachments)
    }));

    return NextResponse.json({
      requests: transformedRequests,
      total: result.total
    });

  } catch (error) {
    safeConsoleError('Error fetching requests:', error);
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
      requirements = [],
      language,
      isRecurring = false,
      recurrenceType,
      recurrenceInterval,
      recurrenceEndDate
    } = data;

    // Validate required fields
    if (!title || !description || !category || !locationDisplay) {
      return NextResponse.json(
        { error: 'Title, description, category, and location are required' },
        { status: 400 }
      );
    }

    // Validate recurring fields if isRecurring is true
    if (isRecurring) {
      if (!recurrenceType || !['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM'].includes(recurrenceType)) {
        return NextResponse.json(
          { error: 'Valid recurrenceType is required for recurring requests' },
          { status: 400 }
        );
      }
      
      if (recurrenceType === 'CUSTOM' && (!recurrenceInterval || recurrenceInterval < 1)) {
        return NextResponse.json(
          { error: 'Valid recurrenceInterval is required for custom recurring requests' },
          { status: 400 }
        );
      }
    }

    const newRequest = await withPrisma(async (prisma) => {
      // Create the request
      return await prisma.mitzvahRequest.create({
        data: {
          ownerId: user.id,
          title,
          description,
          category,
          locationDisplay,
          timeWindowStart: timeWindowStart ? new Date(timeWindowStart) : null,
          timeWindowEnd: timeWindowEnd ? new Date(timeWindowEnd) : null,
          urgency,
          requirements: JSONUtils.stringify(requirements),
          attachments: JSONUtils.stringify([]),
          isRecurring,
          recurrenceType: isRecurring ? recurrenceType : null,
          recurrenceInterval: isRecurring && recurrenceType === 'CUSTOM' ? recurrenceInterval : null,
          recurrenceEndDate: isRecurring && recurrenceEndDate ? new Date(recurrenceEndDate) : null
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
    });

    // Transform response
    const transformedRequest = {
      ...newRequest,
      requirements: JSONUtils.parseArray(newRequest.requirements),
      attachments: JSONUtils.parseArray(newRequest.attachments)
    };

    return NextResponse.json({
      message: 'Request created successfully',
      request: transformedRequest
    }, { status: 201 });

  } catch (error) {
    safeConsoleError('Error creating request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
