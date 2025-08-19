# Email Configuration Setup

The Mitzvah Exchange platform uses email for user verification and notifications. This guide shows how to configure email services for production deployment.

## Current Status

The application is currently configured to fall back to console logging when email services are not configured. This means:

- ✅ **Registration works** - users can register accounts
- ✅ **Email verification works** - verification tokens are generated and logged
- ⚠️ **Emails are logged to console** - instead of being sent to users
- ✅ **Manual verification works** - users can enter tokens manually

## Email Providers

You can use any SMTP email provider. Here are popular options:

### 1. Gmail (Free)

**Pros:** Free, reliable, easy to set up
**Cons:** Limited sending volume, requires app passwords

```bash
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"  # Not your regular password!
EMAIL_FROM="noreply@yourdomain.com"
```

**Setup Steps:**
1. Enable 2-factor authentication on your Gmail account
2. Go to Account Settings > Security > App Passwords
3. Generate a new app password for "Mail"
4. Use this app password (not your regular password)

### 2. SendGrid (Recommended for Production)

**Pros:** High deliverability, generous free tier, designed for applications
**Cons:** Requires signup and verification

```bash
EMAIL_SERVER_HOST="smtp.sendgrid.net"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="apikey"
EMAIL_SERVER_PASSWORD="your-sendgrid-api-key"
EMAIL_FROM="noreply@yourdomain.com"
```

**Setup Steps:**
1. Sign up at [SendGrid](https://sendgrid.com)
2. Verify your email and account
3. Create an API key in Settings > API Keys
4. Use "apikey" as the username and your API key as the password

### 3. Amazon SES

**Pros:** Very reliable, pay-as-you-go pricing
**Cons:** More complex setup, requires AWS account

```bash
EMAIL_SERVER_HOST="email-smtp.us-east-1.amazonaws.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-aws-access-key-id"
EMAIL_SERVER_PASSWORD="your-aws-secret-access-key"
EMAIL_FROM="noreply@yourdomain.com"
```

## Setting Up in Vercel

1. Go to your Vercel project dashboard
2. Click on Settings > Environment Variables
3. Add the email configuration variables:
   - `EMAIL_SERVER_HOST`
   - `EMAIL_SERVER_PORT`
   - `EMAIL_SERVER_USER`
   - `EMAIL_SERVER_PASSWORD`
   - `EMAIL_FROM`

4. Redeploy your application

## Testing Email Setup

After configuration, test the email setup by:

1. Registering a new user account
2. Check that you receive the verification email
3. Click the verification link or copy the token
4. Verify that the account is activated

## Troubleshooting

### Common Issues

1. **"Authentication failed"** - Check username/password
2. **"Connection refused"** - Check host and port
3. **"Emails not sending"** - Check provider limits and quotas

### Development Mode

For development, emails are automatically logged to the console instead of being sent. Look for log messages like:

```
📧 Email Verification (Email Service Not Configured)
To: user@example.com
Verification URL: http://localhost:3000/auth/verify-email?token=...
```

## Current Fallback Behavior

When email is not configured:
- Registration still works normally
- Verification tokens are generated and logged to server console
- Users can use manual verification on the verification page
- The application remains fully functional

This allows the platform to work immediately without email setup, while providing a path to full email functionality when needed.
