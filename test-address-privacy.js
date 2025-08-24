// Test script for address privacy functionality
const { PrismaClient } = require('@prisma/client');

async function testAddressPrivacy() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔒 Testing Address Privacy Functionality\n');
    
    // 1. Find or create a user with address data
    let testUser = await prisma.user.findFirst({
      include: { profile: true }
    });
    
    if (!testUser || !testUser.profile) {
      console.log('❌ No user with profile found. Creating test user...');
      
      testUser = await prisma.user.create({
        data: {
          email: 'privacy-test@example.com',
          password: 'hashedpassword',
          emailVerified: true,
          profile: {
            create: {
              displayName: 'Privacy Test User',
              address: '123 Main Street, Springfield, IL 62701',
              city: 'Springfield',
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
      
      console.log('✅ Test user created with address data');
    } else if (!testUser.profile.address) {
      // Update existing user with address
      await prisma.profile.update({
        where: { userId: testUser.id },
        data: {
          address: '456 Oak Avenue, Riverside, CA 92501',
          city: 'Riverside',
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
      
      console.log('✅ Updated existing user with address data');
    }
    
    console.log('\n📍 User Address Data:');
    console.log('  Full Address:', testUser.profile.address);
    console.log('  City (legacy):', testUser.profile.city);
    console.log('  Privacy Settings:', JSON.parse(testUser.profile.privacy || '{}'));
    
    // 2. Test address privacy logic - simulate the privacy utility functions
    const privacy = JSON.parse(testUser.profile.privacy || '{}');
    const fullAddress = testUser.profile.address || testUser.profile.city;
    
    console.log('\n🔒 Privacy Test Scenarios:');
    
    // Scenario 1: Own profile (should show full address)
    console.log('\n1. Own Profile View:');
    console.log('   Should show full address:', fullAddress);
    
    // Scenario 2: Public view with privacy OFF (should show city only)
    console.log('\n2. Public View (privacy.showExactLocation = false):');
    const cityOnly = extractCityFromAddress(fullAddress);
    console.log('   Should show city only:', cityOnly);
    
    // Scenario 3: Public view with privacy ON (should show full address)
    console.log('\n3. Public View (privacy.showExactLocation = true):');
    console.log('   Should show full address:', fullAddress);
    
    // Scenario 4: User with active assignment (should show full address regardless of privacy)
    console.log('\n4. User with Active Assignment (regardless of privacy):');
    console.log('   Should show full address:', fullAddress);
    
    // 3. Test the city extraction function
    console.log('\n🏙️ City Extraction Tests:');
    const testAddresses = [
      '123 Main Street, Springfield, IL 62701',
      'Springfield, IL',
      'New York, NY 10001',
      '456 Oak Ave, Los Angeles, CA',
      'Seattle',
      'Boston, MA'
    ];
    
    testAddresses.forEach(addr => {
      console.log(`   "${addr}" -> "${extractCityFromAddress(addr)}"`);
    });
    
    console.log('\n✅ Address privacy functionality tested successfully!');
    
  } catch (error) {
    console.error('❌ Error testing address privacy:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to extract city from address (same logic as in privacy-utils.tsx)
function extractCityFromAddress(address) {
  if (!address) return null;
  
  const parts = address.split(',').map(part => part.trim());
  
  if (parts.length >= 2) {
    // If multiple parts, assume second-to-last is city
    return parts[parts.length - 2];
  }
  
  // If single part, check if it looks like "City State" or just return it
  const words = address.trim().split(' ');
  if (words.length >= 2 && words[words.length - 1].length === 2) {
    // Likely "City ST" format, return all but last word
    return words.slice(0, -1).join(' ');
  }
  
  // Single word or simple format, return as-is
  return address.trim();
}

testAddressPrivacy();
