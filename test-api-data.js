const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApiData() {
  try {
    console.log('🔍 Testing API data for map...\n');
    
    // Simulate what the API returns for the map
    const requests = await prisma.mitzvahRequest.findMany({
      where: {
        status: 'OPEN'
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                displayName: true,
                city: true,
                privacy: true
              }
            }
          }
        }
      },
      take: 5
    });
    
    console.log('📋 Raw data from database:');
    requests.forEach(req => {
      console.log(`\n🔹 ${req.title}`);
      console.log(`   📍 locationDisplay: ${req.locationDisplay}`);
      console.log(`   🏠 location: ${req.location || 'NULL'}`);
      console.log(`   👤 owner privacy: ${req.owner?.profile?.privacy || 'NULL'}`);
    });
    
    // Simulate the API transformation logic
    console.log('\n🔄 API transformation:');
    const transformedRequests = requests.map((request) => {
      // This simulates the API logic from route.ts
      const locationValue = (() => {
        if (!request.owner?.profile?.privacy) return null;
        try {
          const privacy = typeof request.owner.profile.privacy === 'string' ? 
            JSON.parse(request.owner.profile.privacy) : 
            request.owner.profile.privacy;
          const isOwnRequest = false; // Simulating non-owner view
          return (privacy.showExactLocation || isOwnRequest) ? request.location : null;
        } catch (e) {
          return null;
        }
      })();
      
      return {
        id: request.id,
        title: request.title,
        location: locationValue,
        locationDisplay: request.locationDisplay,
        owner: request.owner
      };
    });
    
    transformedRequests.forEach(req => {
      console.log(`\n🔹 ${req.title}`);
      console.log(`   📍 API locationDisplay: ${req.locationDisplay}`);
      console.log(`   🏠 API location: ${req.location || 'NULL (filtered by privacy)'}`);
      console.log(`   🗺️  Map would use: ${req.location || req.locationDisplay}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testApiData();
