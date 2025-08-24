const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLocationData() {
  try {
    const requests = await prisma.mitzvahRequest.findMany({
      select: {
        id: true,
        title: true,
        location: true,
        locationDisplay: true,
        owner: {
          select: {
            profile: {
              select: {
                privacy: true,
                displayName: true
              }
            }
          }
        }
      },
      take: 5
    });
    
    console.log('📋 Current location data in database:');
    requests.forEach(req => {
      console.log(`\n🔹 Request: ${req.title}`);
      console.log(`   location: ${req.location || 'NULL'}`);
      console.log(`   locationDisplay: ${req.locationDisplay || 'NULL'}`);
      const privacy = req.owner?.profile?.privacy;
      if (privacy) {
        try {
          const privacyObj = typeof privacy === 'string' ? JSON.parse(privacy) : privacy;
          console.log(`   showExactLocation: ${privacyObj.showExactLocation || false}`);
        } catch (e) {
          console.log('   privacy: Invalid JSON');
        }
      } else {
        console.log('   privacy: None set');
      }
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLocationData();
