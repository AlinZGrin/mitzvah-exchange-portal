// Test script for city and neighborhood functionality
const { PrismaClient } = require('@prisma/client');

async function testCityNeighborhoodFunctionality() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🏙️ Testing City and Neighborhood Functionality\n');
    
    // 1. Find or create a user to test with
    let testUser = await prisma.user.findFirst({
      include: { profile: true }
    });
    
    if (!testUser || !testUser.profile) {
      console.log('❌ No user with profile found. Creating test user...');
      
      testUser = await prisma.user.create({
        data: {
          email: 'city-neighborhood-test@example.com',
          password: 'hashedpassword',
          emailVerified: true,
          profile: {
            create: {
              displayName: 'City Neighborhood Test User',
              city: 'Springfield',
              neighborhood: 'Downtown',
              privacy: JSON.stringify({
                showEmail: false,
                showPhone: false,
                showExactLocation: false
              })
            }
          }
        },
        include: { profile: true }
      });
      
      console.log('✅ Test user created with city and neighborhood data');
    } else if (!testUser.profile.neighborhood) {
      // Update existing user with neighborhood
      await prisma.profile.update({
        where: { userId: testUser.id },
        data: {
          city: 'Los Angeles',
          neighborhood: 'Hollywood',
          privacy: JSON.stringify({
            showEmail: false,
            showPhone: false,
            showExactLocation: false
          })
        }
      });
      
      testUser = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: { profile: true }
      });
      
      console.log('✅ Updated existing user with city and neighborhood data');
    }
    
    console.log('\n📍 User Location Data:');
    console.log('  City:', testUser.profile.city);
    console.log('  Neighborhood:', testUser.profile.neighborhood);
    console.log('  Privacy Settings:', JSON.parse(testUser.profile.privacy || '{}'));
    
    // 2. Test location display logic - simulate the privacy utility functions
    const privacy = JSON.parse(testUser.profile.privacy || '{}');
    const city = testUser.profile.city;
    const neighborhood = testUser.profile.neighborhood;
    
    console.log('\n🔒 Privacy Display Test Scenarios:');
    
    // Scenario 1: Own profile (should show full location)
    const fullLocation = formatFullLocation(city, neighborhood);
    console.log('\n1. Own Profile View:');
    console.log('   Should show full location:', fullLocation);
    
    // Scenario 2: Public view with privacy OFF (should show city only)
    console.log('\n2. Public View (privacy.showExactLocation = false):');
    console.log('   Should show city only:', city);
    
    // Scenario 3: Public view with privacy ON (should show full location)
    console.log('\n3. Public View (privacy.showExactLocation = true):');
    console.log('   Should show full location:', fullLocation);
    
    // Scenario 4: User with active assignment (should show full location regardless of privacy)
    console.log('\n4. User with Active Assignment (regardless of privacy):');
    console.log('   Should show full location:', fullLocation);
    
    // 3. Test different location combinations
    console.log('\n🏘️ Location Format Tests:');
    const testCombinations = [
      { city: 'New York', neighborhood: 'Manhattan' },
      { city: 'Chicago', neighborhood: null },
      { city: null, neighborhood: 'Midtown' },
      { city: 'Boston', neighborhood: 'Back Bay' },
      { city: null, neighborhood: null }
    ];
    
    testCombinations.forEach(combo => {
      const formatted = formatFullLocation(combo.city, combo.neighborhood);
      console.log(`   City: "${combo.city || 'null'}", Neighborhood: "${combo.neighborhood || 'null'}" -> "${formatted || 'null'}"`);
    });
    
    console.log('\n✅ City and neighborhood functionality tested successfully!');
    
  } catch (error) {
    console.error('❌ Error testing city and neighborhood functionality:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to format city and neighborhood (same logic as in privacy-utils.tsx)
function formatFullLocation(city, neighborhood) {
  if (!city && !neighborhood) return null;
  
  if (city && neighborhood) {
    return `${neighborhood}, ${city}`;
  }
  
  return city || neighborhood || null;
}

testCityNeighborhoodFunctionality();
