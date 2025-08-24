const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestRequestsWithAddresses() {
  try {
    console.log('🧪 Creating test requests with complete addresses...');
    
    // Get the first user to create requests for
    const user = await prisma.user.findFirst({
      include: { profile: true }
    });
    
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }
    
    console.log(`✅ Found user: ${user.email}`);
    
    // Test requests with both general area and complete address
    const testRequests = [
      {
        title: "Help with Grocery Shopping",
        description: "Need assistance with weekly grocery shopping. Have a list ready.",
        category: "ERRANDS",
        urgency: "NORMAL",
        locationDisplay: "Downtown Miami area",
        location: "123 Biscayne Blvd, Miami, FL 33132",
        ownerId: user.id
      },
      {
        title: "Computer Setup Assistance",
        description: "Need help setting up a new computer and installing software.",
        category: "TECHNOLOGY", 
        urgency: "LOW",
        locationDisplay: "Coral Gables neighborhood",
        location: "456 Miracle Mile, Coral Gables, FL 33134",
        ownerId: user.id
      },
      {
        title: "Medical Appointment Transportation",
        description: "Need a ride to doctor's appointment next week.",
        category: "TRANSPORTATION",
        urgency: "HIGH", 
        locationDisplay: "Aventura area",
        location: "789 Aventura Blvd, Aventura, FL 33180",
        ownerId: user.id
      },
      {
        title: "Meal Delivery",
        description: "Could use help with meal preparation and delivery.",
        category: "MEALS",
        urgency: "NORMAL",
        locationDisplay: "South Beach", 
        location: "321 Ocean Drive, Miami Beach, FL 33139",
        ownerId: user.id
      }
    ];
    
    // Create the requests
    for (const requestData of testRequests) {
      const newRequest = await prisma.mitzvahRequest.create({
        data: {
          ...requestData,
          requirements: JSON.stringify([]),
          attachments: JSON.stringify([])
        }
      });
      
      console.log(`✅ Created: "${newRequest.title}"`);
      console.log(`   📍 General: ${newRequest.locationDisplay}`);
      console.log(`   🏠 Complete: ${newRequest.location}`);
    }
    
    console.log(`\\n🎉 Successfully created ${testRequests.length} test requests with addresses!`);
    console.log('\\n🗺️ Now check the map to see if it shows the complete addresses instead of general areas.');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error creating test requests:', error);
    process.exit(1);
  }
}

createTestRequestsWithAddresses();
