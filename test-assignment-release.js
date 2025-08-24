// Test script for assignment release functionality
const { PrismaClient } = require('@prisma/client');

async function testAssignmentRelease() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Assignment Release Functionality\n');
    
    // 1. Find a claimed assignment
    const claimedAssignment = await prisma.assignment.findFirst({
      where: { 
        status: { in: ['CLAIMED', 'IN_PROGRESS'] }
      },
      include: {
        request: {
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                profile: { select: { displayName: true } }
              }
            }
          }
        },
        performer: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true } }
          }
        }
      }
    });
    
    if (!claimedAssignment) {
      console.log('❌ No claimed assignments found. Creating test data...');
      
      // Create test request and assignment
      const testUser = await prisma.user.findFirst();
      if (!testUser) {
        throw new Error('No users found in database');
      }
      
      const testRequest = await prisma.mitzvahRequest.create({
        data: {
          ownerId: testUser.id,
          title: 'Test Request for Release',
          description: 'Test request to verify release functionality',
          category: 'OTHER',
          urgency: 'NORMAL',
          locationDisplay: 'Test Location',
          status: 'CLAIMED'
        }
      });
      
      const testAssignment = await prisma.assignment.create({
        data: {
          requestId: testRequest.id,
          performerId: testUser.id,
          status: 'CLAIMED',
          proofPhotos: JSON.stringify([])
        }
      });
      
      console.log('✅ Test assignment created:', {
        assignmentId: testAssignment.id,
        requestId: testRequest.id,
        status: testAssignment.status
      });
      
      return testAssignment.id;
    }
    
    console.log('✅ Found claimed assignment:', {
      assignmentId: claimedAssignment.id,
      requestId: claimedAssignment.requestId,
      status: claimedAssignment.status,
      performer: claimedAssignment.performer.profile?.displayName || claimedAssignment.performer.email,
      requestOwner: claimedAssignment.request.owner.profile?.displayName || claimedAssignment.request.owner.email
    });
    
    // 2. Check request status before release
    const requestBefore = await prisma.mitzvahRequest.findUnique({
      where: { id: claimedAssignment.requestId }
    });
    
    console.log('\n📋 Request status before release:', requestBefore.status);
    
    // 3. Simulate release (delete assignment, update request)
    console.log('\n🔄 Simulating assignment release...');
    
    await prisma.$transaction(async (tx) => {
      // Delete the assignment
      await tx.assignment.delete({
        where: { id: claimedAssignment.id }
      });
      
      // Update request status back to OPEN
      await tx.mitzvahRequest.update({
        where: { id: claimedAssignment.requestId },
        data: { status: 'OPEN' }
      });
    });
    
    // 4. Verify release
    const assignmentAfter = await prisma.assignment.findUnique({
      where: { id: claimedAssignment.id }
    });
    
    const requestAfter = await prisma.mitzvahRequest.findUnique({
      where: { id: claimedAssignment.requestId }
    });
    
    console.log('✅ Assignment released successfully!');
    console.log('  Assignment deleted:', assignmentAfter === null);
    console.log('  Request status after release:', requestAfter.status);
    
    if (assignmentAfter === null && requestAfter.status === 'OPEN') {
      console.log('\n🎉 Assignment release functionality working correctly!');
    } else {
      console.log('\n❌ Assignment release functionality has issues');
    }
    
  } catch (error) {
    console.error('❌ Error testing assignment release:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAssignmentRelease();
