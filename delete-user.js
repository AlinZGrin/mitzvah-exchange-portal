// Quick script to delete a user by email
// Run with: node delete-user.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteUser() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('Usage: node delete-user.js <email>');
    console.log('Example: node delete-user.js user@example.com');
    process.exit(1);
  }

  try {
    // First, let's see if the user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        ownedRequests: true,
        assignments: true
      }
    });

    if (!user) {
      console.log(`❌ User with email ${email} not found.`);
      return;
    }

    console.log(`📧 Found user: ${user.email}`);
    console.log(`👤 ID: ${user.id}`);
    console.log(`✅ Verified: ${user.emailVerified}`);
    console.log(`📝 Profile: ${user.profile ? 'Yes' : 'No'}`);
    console.log(`📋 Requests: ${user.ownedRequests.length}`);
    console.log(`📌 Assignments: ${user.assignments.length}`);

    // Delete the user (cascade will handle related records)
    await prisma.user.delete({
      where: { email }
    });

    console.log(`✅ Successfully deleted user: ${email}`);
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();
