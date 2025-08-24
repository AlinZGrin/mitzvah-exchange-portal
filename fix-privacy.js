const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPrivacySettings() {
  try {
    console.log('🔧 Fixing privacy settings for test requests...\n');
    
    // Get the requests with complete addresses
    const requests = await prisma.mitzvahRequest.findMany({
      where: {
        location: { not: null }
      },
      include: {
        owner: {
          include: {
            profile: true
          }
        }
      }
    });
    
    console.log(`Found ${requests.length} requests with complete addresses`);
    
    for (const request of requests) {
      if (request.owner?.profile) {
        const currentPrivacy = request.owner.profile.privacy ? 
          JSON.parse(request.owner.profile.privacy) : {};
        
        const updatedPrivacy = {
          ...currentPrivacy,
          showExactLocation: true  // Enable exact location display
        };
        
        await prisma.profile.update({
          where: { userId: request.owner.id },
          data: {
            privacy: JSON.stringify(updatedPrivacy)
          }
        });
        
        console.log(`✅ Updated privacy for: ${request.title}`);
        console.log(`   Owner: ${request.owner.email}`);
        console.log(`   Privacy: ${JSON.stringify(updatedPrivacy)}`);
      }
    }
    
    console.log('\n🎉 Privacy settings updated! Now the map should show exact addresses.');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPrivacySettings();
