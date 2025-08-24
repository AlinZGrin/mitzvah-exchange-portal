const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNewRequests() {
  try {
    const requests = await prisma.mitzvahRequest.findMany({
      where: {
        location: { not: null }
      },
      select: {
        id: true,
        title: true,
        location: true,
        locationDisplay: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('📋 Requests with complete addresses:');
    if (requests.length === 0) {
      console.log('❌ No requests found with complete addresses.');
    } else {
      requests.forEach(req => {
        console.log(`\n🔹 ${req.title}`);
        console.log(`   📍 General: ${req.locationDisplay}`);
        console.log(`   🏠 Complete: ${req.location}`);
        console.log(`   📅 Created: ${req.createdAt.toISOString()}`);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkNewRequests();
