import nodemailer from 'nodemailer';

// Email transporter configuration
const createTransporter = () => {
  // Force console logging in production until proper email is configured
  const forceConsoleLogging = process.env.FORCE_EMAIL_CONSOLE_LOGGING === 'true';
  
  // Check if email is properly configured
  const emailHost = process.env.EMAIL_SERVER_HOST;
  const emailUser = process.env.EMAIL_SERVER_USER;
  const emailPass = process.env.EMAIL_SERVER_PASSWORD;
  
  // Debug logging to see what environment variables are loaded
  console.log('🔍 Email Environment Debug:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   EMAIL_SERVER_HOST: ${emailHost ? 'SET' : 'NOT SET'}`);
  console.log(`   EMAIL_SERVER_USER: ${emailUser ? 'SET' : 'NOT SET'}`);
  console.log(`   EMAIL_SERVER_PASSWORD: ${emailPass ? 'SET' : 'NOT SET'}`);
  console.log(`   FORCE_EMAIL_CONSOLE_LOGGING: ${forceConsoleLogging}`);
  console.log('---');
  
  // If email is not configured, has placeholder values, or forced console logging
  if (forceConsoleLogging || 
      !emailHost || 
      !emailUser || 
      !emailPass ||
      emailUser.includes('example.com') ||
      emailUser === 'your-email@example.com' ||
      emailPass === 'your-password' ||
      emailPass.includes('your-') ||
      emailPass.includes('password-here')) {
    console.log('⚠️  Email service not configured or disabled - falling back to console logging');
    console.log('📧 To enable email: Configure EMAIL_SERVER_HOST, EMAIL_SERVER_USER, and EMAIL_SERVER_PASSWORD');
    return null;
  }

  console.log(`📧 Email service configured with ${emailHost} for user ${emailUser}`);
  
  return nodemailer.createTransport({
    host: emailHost,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

export async function sendVerificationEmail(
  email: string, 
  token: string, 
  displayName: string
) {
  const transporter = createTransporter();
  
  // Use production URL for Vercel, localhost for development
  let appUrl;
  if (process.env.NODE_ENV === 'production') {
    appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'https://mitzvah-exchange-portal.vercel.app';
  } else {
    appUrl = 'http://localhost:3000';
  }
  
  const verificationUrl = `${appUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  
  console.log(`🔗 Verification URL: ${verificationUrl}`);

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email - Mitzvah Exchange</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          background: #2563eb; 
          color: white !important; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0;
          font-weight: bold;
        }
        .button:visited { color: white !important; }
        .button:hover { color: white !important; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Mitzvah Exchange!</h1>
        </div>
        <div class="content">
          <h2>Hello ${displayName}!</h2>
          <p>Thank you for joining the Mitzvah Exchange community. To complete your registration, please verify your email address by clicking the button below:</p>
          
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          
          <p>This verification link will expire in 24 hours for security reasons.</p>
          
          <p>If you didn't create an account with Mitzvah Exchange, please ignore this email.</p>
          
          <p>Best regards,<br>The Mitzvah Exchange Team</p>
        </div>
        <div class="footer">
          <p>© 2025 Mitzvah Exchange. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailText = `
    Welcome to Mitzvah Exchange!
    
    Hello ${displayName}!
    
    Thank you for joining the Mitzvah Exchange community. To complete your registration, please verify your email address by visiting this link:
    
    ${verificationUrl}
    
    This verification link will expire in 24 hours for security reasons.
    
    If you didn't create an account with Mitzvah Exchange, please ignore this email.
    
    Best regards,
    The Mitzvah Exchange Team
  `;

  if (!transporter) {
    // Email not configured - log to console instead
    console.log('📧 Email Verification (Email Service Not Configured)');
    console.log('To:', email);
    console.log('Subject: Verify Your Email - Mitzvah Exchange');
    console.log('Verification URL:', verificationUrl);
    console.log('Token:', token);
    console.log('Note: Configure EMAIL_SERVER_HOST, EMAIL_SERVER_USER, and EMAIL_SERVER_PASSWORD to send real emails');
    console.log('---');
    return { success: true, message: 'Email logged to console (email service not configured)' };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify Your Email - Mitzvah Exchange',
      text: emailText,
      html: emailHtml,
    });

    console.log(`✅ Verification email sent to ${email}`);
    return { success: true, message: 'Verification email sent successfully' };
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    return { success: false, message: 'Failed to send verification email' };
  }
}

export async function sendWelcomeEmail(email: string, displayName: string) {
  const transporter = createTransporter();
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Mitzvah Exchange!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          background: #10b981; 
          color: white !important; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0;
          font-weight: bold;
        }
        .button:visited { color: white !important; }
        .button:hover { color: white !important; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to Mitzvah Exchange!</h1>
        </div>
        <div class="content">
          <h2>Hello ${displayName}!</h2>
          <p>Your email has been verified and your account is now active! Welcome to our community of kindness.</p>
          
          <p>Here's what you can do now:</p>
          <ul>
            <li>🔍 <strong>Discover Mitzvahs:</strong> Find opportunities to help in your community</li>
            <li>📝 <strong>Create Requests:</strong> Post your own requests for help</li>
            <li>📊 <strong>Track Your Impact:</strong> See your points and contributions</li>
            <li>👥 <strong>Connect:</strong> Build meaningful relationships through acts of kindness</li>
          </ul>
          
          <a href="${appUrl}/dashboard" class="button">Get Started</a>
          
          <p>Thank you for joining our mission to make the world a little bit brighter, one mitzvah at a time.</p>
          
          <p>Best regards,<br>The Mitzvah Exchange Team</p>
        </div>
        <div class="footer">
          <p>© 2025 Mitzvah Exchange. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log('📧 Welcome Email (Email Service Not Configured)');
    console.log('To:', email);
    console.log('Subject: Welcome to Mitzvah Exchange!');
    console.log('Note: Configure EMAIL_SERVER_HOST, EMAIL_SERVER_USER, and EMAIL_SERVER_PASSWORD to send real emails');
    return { success: true, message: 'Welcome email logged to console (email service not configured)' };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to Mitzvah Exchange!',
      html: emailHtml,
    });

    console.log(`✅ Welcome email sent to ${email}`);
    return { success: true, message: 'Welcome email sent successfully' };
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    return { success: false, message: 'Failed to send welcome email' };
  }
}

export async function sendPasswordResetEmail(
  email: string, 
  token: string, 
  displayName: string
) {
  const transporter = createTransporter();
  
  // Use production URL for Vercel, localhost for development
  let appUrl;
  if (process.env.NODE_ENV === 'production') {
    appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'https://mitzvah-exchange-portal.vercel.app';
  } else {
    appUrl = 'http://localhost:3000';
  }
  
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  
  console.log(`🔗 Password Reset URL: ${resetUrl}`);

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password - Mitzvah Exchange</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          background: #dc2626; 
          color: white !important; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0;
          font-weight: bold;
        }
        .button:visited { color: white !important; }
        .button:hover { color: white !important; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .warning { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Hello ${displayName}!</h2>
          <p>We received a request to reset the password for your Mitzvah Exchange account.</p>
          
          <a href="${resetUrl}" class="button">Reset Password</a>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          
          <div class="warning">
            <strong>⚠️ Important Security Information:</strong>
            <ul>
              <li>This link will expire in 1 hour for security reasons</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>
          
          <p>If you continue to have problems, please contact our support team.</p>
          
          <p>Best regards,<br>The Mitzvah Exchange Team</p>
        </div>
        <div class="footer">
          <p>© 2025 Mitzvah Exchange. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailText = `
    Reset Your Password - Mitzvah Exchange
    
    Hello ${displayName}!
    
    We received a request to reset the password for your Mitzvah Exchange account.
    
    Click this link to reset your password:
    ${resetUrl}
    
    This link will expire in 1 hour for security reasons.
    
    If you didn't request this reset, please ignore this email.
    
    Best regards,
    The Mitzvah Exchange Team
  `;

  if (!transporter) {
    // Email not configured - log to console instead
    console.log('📧 Password Reset Email (Email Service Not Configured)');
    console.log('To:', email);
    console.log('Subject: Reset Your Password - Mitzvah Exchange');
    console.log('Reset URL:', resetUrl);
    console.log('Token:', token);
    console.log('Note: Configure EMAIL_SERVER_HOST, EMAIL_SERVER_USER, and EMAIL_SERVER_PASSWORD to send real emails');
    console.log('---');
    return { success: true, message: 'Password reset email logged to console (email service not configured)' };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset Your Password - Mitzvah Exchange',
      text: emailText,
      html: emailHtml,
    });

    console.log(`✅ Password reset email sent to ${email}`);
    return { success: true, message: 'Password reset email sent successfully' };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    return { success: false, message: 'Failed to send password reset email' };
  }
}

export async function sendUsernameReminderEmail(
  email: string, 
  displayName: string,
  username: string
) {
  const transporter = createTransporter();
  
  // Use production URL for Vercel, localhost for development
  let appUrl;
  if (process.env.NODE_ENV === 'production') {
    appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'https://mitzvah-exchange-portal.vercel.app';
  } else {
    appUrl = 'http://localhost:3000';
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Username - Mitzvah Exchange</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          background: #3b82f6; 
          color: white !important; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0;
          font-weight: bold;
        }
        .button:visited { color: white !important; }
        .button:hover { color: white !important; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .username-box { background: #e0f2fe; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👤 Your Username</h1>
        </div>
        <div class="content">
          <h2>Hello ${displayName}!</h2>
          <p>You requested a reminder of your username for Mitzvah Exchange.</p>
          
          <div class="username-box">
            <h3 style="margin: 0; color: #1976d2;">Your Username (Email):</h3>
            <p style="font-size: 18px; font-weight: bold; margin: 10px 0; color: #1976d2;">${username}</p>
          </div>
          
          <p>You can use this email address to sign in to your account.</p>
          
          <a href="${appUrl}/auth/login" class="button">Sign In Now</a>
          
          <p>If you also forgot your password, you can <a href="${appUrl}/auth/forgot-password">reset it here</a>.</p>
          
          <p>If you didn't request this reminder, please ignore this email.</p>
          
          <p>Best regards,<br>The Mitzvah Exchange Team</p>
        </div>
        <div class="footer">
          <p>© 2025 Mitzvah Exchange. All rights reserved.</p>
          <p>This email was sent to ${email}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailText = `
    Your Username - Mitzvah Exchange
    
    Hello ${displayName}!
    
    You requested a reminder of your username for Mitzvah Exchange.
    
    Your Username (Email): ${username}
    
    You can use this email address to sign in to your account.
    
    Sign in: ${appUrl}/auth/login
    
    If you also forgot your password, you can reset it here: ${appUrl}/auth/forgot-password
    
    If you didn't request this reminder, please ignore this email.
    
    Best regards,
    The Mitzvah Exchange Team
  `;

  if (!transporter) {
    // Email not configured - log to console instead
    console.log('📧 Username Reminder Email (Email Service Not Configured)');
    console.log('To:', email);
    console.log('Subject: Your Username - Mitzvah Exchange');
    console.log('Username:', username);
    console.log('Note: Configure EMAIL_SERVER_HOST, EMAIL_SERVER_USER, and EMAIL_SERVER_PASSWORD to send real emails');
    console.log('---');
    return { success: true, message: 'Username reminder email logged to console (email service not configured)' };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your Username - Mitzvah Exchange',
      text: emailText,
      html: emailHtml,
    });

    console.log(`✅ Username reminder email sent to ${email}`);
    return { success: true, message: 'Username reminder email sent successfully' };
  } catch (error) {
    console.error('❌ Failed to send username reminder email:', error);
    return { success: false, message: 'Failed to send username reminder email' };
  }
}
