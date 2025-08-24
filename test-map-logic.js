const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMapLocationLogic() {
  try {
    console.log('🗺️ Testing MapView location logic...\n');
    
    // Get requests with both location types
    const requests = await prisma.mitzvahRequest.findMany({
      select: {
        id: true,
        title: true,
        location: true,
        locationDisplay: true
      },
      orderBy: { createdAt: 'desc' },
      take: 8
    });
    
    console.log('📍 Location data for MapView:');
    console.log('==========================================');
    
    requests.forEach(request => {
      // Simulate the MapView logic: request.location || request.locationDisplay
      const locationForMap = request.location || request.locationDisplay;
      
      console.log(`\n🔹 ${request.title}`);
      console.log(`   📍 General area: ${request.locationDisplay || 'NULL'}`);
      console.log(`   🏠 Complete address: ${request.location || 'NULL'}`);
      console.log(`   🗺️  Map will use: ${locationForMap}`);
      console.log(`   ✅ Using: ${request.location ? 'COMPLETE ADDRESS' : 'GENERAL AREA'}`);
    });
    
    console.log('\n==========================================');
    console.log('📊 Summary:');
    
    const withCompleteAddress = requests.filter(r => r.location).length;
    const withOnlyGeneral = requests.filter(r => !r.location).length;
    
    console.log(`   🏠 Requests with complete address: ${withCompleteAddress}`);
    console.log(`   📍 Requests with only general area: ${withOnlyGeneral}`);
    console.log(`   📈 Map accuracy improvement: ${withCompleteAddress > 0 ? 'YES' : 'NO'}`);
    
    if (withCompleteAddress > 0) {
      console.log(`\n🎉 SUCCESS! Map will now show precise locations for ${withCompleteAddress} requests!`);
    } else {
      console.log(`\n⚠️  No requests have complete addresses yet. Create new requests with the updated form.`);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testMapLocationLogic();
