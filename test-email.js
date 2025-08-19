// Email test script for Next.js environment
// Run with: node test-email.js your-email@example.com

require('dotenv').config({ path: '.env.local' });

async function testEmail() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('Usage: node test-email.js <email>');
    console.log('Example: node test-email.js test@example.com');
    process.exit(1);
  }

  console.log(`🧪 Testing email configuration...`);
  console.log(`📧 Target email: ${email}`);
  
  // Check environment variables
  const emailHost = process.env.EMAIL_SERVER_HOST;
  const emailUser = process.env.EMAIL_SERVER_USER;
  const emailPass = process.env.EMAIL_SERVER_PASSWORD;
  const emailPort = process.env.EMAIL_SERVER_PORT;
  const emailFrom = process.env.EMAIL_FROM;
  
  console.log('\n📋 Configuration:');
  console.log(`   Host: ${emailHost || 'NOT SET'}`);
  console.log(`   Port: ${emailPort || 'NOT SET'}`);
  console.log(`   User: ${emailUser || 'NOT SET'}`);
  console.log(`   Pass: ${emailPass ? '***configured***' : 'NOT SET'}`);
  console.log(`   From: ${emailFrom || 'NOT SET'}`);
  
  if (!emailHost || !emailUser || !emailPass) {
    console.log('\n❌ Email not configured. Will use console logging.');
    return;
  }
  
  // Test SMTP connection
  console.log('\n🔌 Testing SMTP connection...');
  
  try {
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort || '587'),
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Send test email
    console.log('� Sending test email...');
    
    const result = await transporter.sendMail({
      from: emailFrom,
      to: email,
      subject: 'Test Email from Mitzvah Exchange',
      text: 'This is a test email to verify your email configuration is working!',
      html: `
        <h2>🎉 Email Configuration Test</h2>
        <p>Congratulations! Your email configuration is working correctly.</p>
        <p>This test email was sent from your Mitzvah Exchange application.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
          <li>SMTP Host: ${emailHost}</li>
          <li>Port: ${emailPort}</li>
          <li>From: ${emailFrom}</li>
        </ul>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`📬 Message ID: ${result.messageId}`);
    console.log('📧 Check your inbox for the test email');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n💡 Gmail Setup Help:');
      console.log('   1. Enable 2-factor authentication on your Gmail account');
      console.log('   2. Go to Google Account > Security > App Passwords');
      console.log('   3. Generate an app password for "Mail"');
      console.log('   4. Use the 16-character app password (not your regular password)');
    }
  }
}

testEmail();
