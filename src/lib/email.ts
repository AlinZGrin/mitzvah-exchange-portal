import nodemailer from 'nodemailer';

// Email transporter configuration
const createTransporter = () => {
  if (process.env.NODE_ENV === 'development') {
    // For development, log to console instead of sending real emails
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
};

export async function sendVerificationEmail(
  email: string, 
  token: string, 
  displayName: string
) {
  const transporter = createTransporter();
  const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const verificationUrl = `${appUrl}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

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
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0; 
        }
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
    // Development mode - log to console
    console.log('📧 Email Verification (Development Mode)');
    console.log('To:', email);
    console.log('Subject: Verify Your Email - Mitzvah Exchange');
    console.log('Verification URL:', verificationUrl);
    console.log('Token:', token);
    console.log('---');
    return { success: true, message: 'Email logged to console (development mode)' };
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
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0; 
        }
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
    console.log('📧 Welcome Email (Development Mode)');
    console.log('To:', email);
    console.log('Subject: Welcome to Mitzvah Exchange!');
    return { success: true, message: 'Welcome email logged to console (development mode)' };
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
