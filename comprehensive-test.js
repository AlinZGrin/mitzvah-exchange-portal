const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function comprehensiveMapTest() {
  try {
    console.log('🎯 COMPREHENSIVE MAP TEST');
    console.log('========================\n');
    
    // 1. Check database state
    console.log('1️⃣ DATABASE STATE:');
    const requestsWithAddress = await prisma.mitzvahRequest.findMany({
      where: {
        status: 'OPEN',
        location: { not: null }
      },
      include: {
        owner: {
          select: {
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
    
    console.log(`   ✅ Found ${requestsWithAddress.length} OPEN requests with exact addresses`);
    
    // 2. Test API logic
    console.log('\n2️⃣ API TRANSFORMATION:');
    const apiResults = requestsWithAddress.map(request => {
      const privacy = request.owner?.profile?.privacy ? 
        JSON.parse(request.owner.profile.privacy) : { showExactLocation: false };
      
      const locationForAPI = privacy.showExactLocation ? request.location : null;
      
      return {
        title: request.title,
        locationDisplay: request.locationDisplay,
        location: locationForAPI,
        showsExactLocation: !!locationForAPI
      };
    });
    
    const exactLocationCount = apiResults.filter(r => r.showsExactLocation).length;
    console.log(`   ✅ API will return ${exactLocationCount}/${apiResults.length} exact addresses`);
    
    // 3. Test MapView logic
    console.log('\n3️⃣ MAPVIEW LOGIC:');
    apiResults.forEach(req => {
      const mapLocation = req.location || req.locationDisplay;
      console.log(`   🔹 ${req.title}`);
      console.log(`      Map uses: ${mapLocation}`);
      console.log(`      Type: ${req.location ? 'EXACT ADDRESS' : 'GENERAL AREA'}`);
    });
    
    // 4. Test coordinate mapping
    console.log('\n4️⃣ COORDINATE MAPPING:');
    const testCoordinateMapping = (location) => {
      const lowerLocation = location.toLowerCase();
      if (lowerLocation.includes('biscayne')) return [25.7850, -80.1900];
      if (lowerLocation.includes('ocean drive')) return [25.7850, -80.1300];
      if (lowerLocation.includes('miracle mile')) return [25.7217, -80.2685];
      if (lowerLocation.includes('aventura')) return [25.9565, -80.1393];
      return [25.7617, -80.1918]; // Default Miami
    };
    
    apiResults.forEach(req => {
      const mapLocation = req.location || req.locationDisplay;
      const coords = testCoordinateMapping(mapLocation);
      const isSpecific = coords[0] !== 25.7617 || coords[1] !== -80.1918;
      console.log(`   📍 ${req.title}: [${coords[0]}, ${coords[1]}] ${isSpecific ? '✅' : '⚠️'}`);
    });
    
    // 5. Final summary
    console.log('\n🎯 FINAL RESULT:');
    console.log('================');
    console.log(`📊 Database: ${requestsWithAddress.length} requests with exact addresses`);
    console.log(`🔄 API: ${exactLocationCount} exact addresses will be returned`);
    console.log(`🗺️  Map: Will show precise locations for ${exactLocationCount} mitzvahs`);
    
    if (exactLocationCount > 0) {
      console.log('\n🎉 SUCCESS! The map should now show exact addresses for mitzvahs!');
      console.log('   • Users with showExactLocation=true will see precise map markers');
      console.log('   • Coordinate mapping enhanced for Miami area addresses');
      console.log('   • Map will use exact addresses when available, fall back to general areas');
    } else {
      console.log('\n⚠️  No exact addresses will be shown due to privacy settings');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

comprehensiveMapTest();
