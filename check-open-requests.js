const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkApiWithNewRequests() {
  try {
    // Get all OPEN requests with complete addresses
    const requests = await prisma.mitzvahRequest.findMany({
      where: {
        status: 'OPEN',
        location: { not: null }
      },
      include: {
        owner: {
          select: {
            id: true,
            profile: {
              select: {
                privacy: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('📋 OPEN requests with complete addresses:');
    console.log('Found:', requests.length, 'requests');
    
    requests.forEach(req => {
      console.log(`\n🔹 ${req.title}`);
      console.log(`   Status: ${req.status}`);
      console.log(`   📍 locationDisplay: ${req.locationDisplay}`);
      console.log(`   🏠 location: ${req.location}`);
      console.log(`   👤 owner privacy: ${req.owner?.profile?.privacy || 'NULL'}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkApiWithNewRequests();
