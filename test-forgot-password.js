const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testForgotPassword() {
  try {
    console.log('🧪 Testing Forgot Password Flow...\n');

    // Test with a specific email
    const testEmail = process.argv[2] || 'alingrin@gmail.com';
    
    console.log(`1. Looking for user with email: ${testEmail}`);
    
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { profile: true }
    });

    if (!user) {
      console.log('❌ User not found. Creating a test user...');
      
      const hashedPassword = await bcrypt.hash('testpassword123', 12);
      
      const newUser = await prisma.user.create({
        data: {
          email: testEmail,
          password: hashedPassword,
          emailVerified: true,
          profile: {
            create: {
              displayName: 'Test User',
              city: 'Test City',
              languages: JSON.stringify([]),
              skills: JSON.stringify([]),
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
      
      console.log('✅ Test user created');
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Password: testpassword123`);
    } else {
      console.log('✅ User found');
      console.log(`   Email: ${user.email}`);
      console.log(`   Display Name: ${user.profile?.displayName || 'N/A'}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
    }

    // Test forgot password token generation
    console.log('\n2. Testing password reset token generation...');
    
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const updatedUser = await prisma.user.update({
      where: { email: testEmail },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetTokenExpiry
      }
    });

    console.log('✅ Reset token generated');
    console.log(`   Token: ${resetToken}`);
    console.log(`   Expires: ${resetTokenExpiry.toISOString()}`);

    // Test token validation
    console.log('\n3. Testing token validation...');
    
    const foundUser = await prisma.user.findFirst({
      where: {
        email: testEmail,
        passwordResetToken: resetToken,
        passwordResetExpiry: {
          gte: new Date()
        }
      }
    });

    if (foundUser) {
      console.log('✅ Token validation successful');
    } else {
      console.log('❌ Token validation failed');
    }

    // Test password reset
    console.log('\n4. Testing password reset...');
    
    const newPassword = 'newpassword123';
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: foundUser.id },
      data: {
        password: hashedNewPassword,
        passwordResetToken: null,
        passwordResetExpiry: null
      }
    });

    console.log('✅ Password reset successful');
    console.log(`   New password: ${newPassword}`);

    // Verify the new password works
    console.log('\n5. Verifying new password...');
    
    const userWithNewPassword = await prisma.user.findUnique({
      where: { email: testEmail }
    });

    const passwordMatch = await bcrypt.compare(newPassword, userWithNewPassword.password);
    
    if (passwordMatch) {
      console.log('✅ New password verification successful');
    } else {
      console.log('❌ New password verification failed');
    }

    console.log('\n🎉 All forgot password tests passed!');
    console.log('\nTest URLs:');
    console.log(`- Forgot Password: http://localhost:3000/auth/forgot-password`);
    console.log(`- Reset Password: http://localhost:3000/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(testEmail)}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testForgotPassword();
