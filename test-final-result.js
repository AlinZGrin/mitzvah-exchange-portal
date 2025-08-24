const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFinalApiResult() {
  try {
    console.log('🎯 Testing final API result for map...\n');
    
    // Get requests with complete addresses and updated privacy
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
    
    console.log('🔄 Simulating API transformation with updated privacy:');
    
    const transformedRequests = requests.map((request) => {
      // Simulate API logic from route.ts
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
        locationDisplay: request.locationDisplay
      };
    });
    
    transformedRequests.forEach(req => {
      const mapLocation = req.location || req.locationDisplay;
      console.log(`\n🔹 ${req.title}`);
      console.log(`   📍 locationDisplay: ${req.locationDisplay}`);
      console.log(`   🏠 location (API): ${req.location || 'NULL'}`);
      console.log(`   🗺️  Map will use: ${mapLocation}`);
      console.log(`   ✅ Status: ${req.location ? 'EXACT ADDRESS' : 'GENERAL AREA'}`);
    });
    
    const exactAddressCount = transformedRequests.filter(r => r.location).length;
    console.log(`\n📊 Result: ${exactAddressCount}/${transformedRequests.length} requests will show exact addresses on map!`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testFinalApiResult();
