# Custom Domain Setup Guide

## Step 1: Purchase Domain
1. Go to your preferred domain registrar (Namecheap, Google Domains, etc.)
2. Search for your desired domain name
3. Purchase the domain (usually $10-20/year)

## Step 2: Add Domain to Vercel
1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Click "Add Domain"
4. Enter your domain (e.g., `mitzvahexchange.org`)
5. Click "Add"

## Step 3: Configure DNS
Vercel will show you DNS records to add. You'll need to add these in your domain registrar's DNS settings:

### For Root Domain (mitzvahexchange.org):
```
Type: A
Name: @
Value: 76.76.19.61
```

### For WWW Subdomain (www.mitzvahexchange.org):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## Step 4: Verify Domain
- Vercel will automatically verify the domain once DNS propagates (5-60 minutes)
- You'll get automatic HTTPS/SSL certificates
- Both www and non-www versions will work

## Alternative: Vercel-managed Domain
If you want Vercel to handle everything:
1. In Vercel dashboard → "Domains"
2. Click "Buy Domain"
3. Purchase directly through Vercel (slightly more expensive but zero setup)

## Recommended Domain Names Available:
- mitzvahexchange.org
- mitzvahportal.com
- communityhelpers.org
- mitzvahconnect.net
- helpingcommunity.org

## Cost Breakdown:
- **Free Vercel subdomain**: $0/year (e.g., mitzvah-exchange.vercel.app)
- **Custom domain**: $10-20/year + easy setup
- **Vercel-managed domain**: $15-25/year + zero setup

## Update Environment Variables:
After setting up your domain, update the NEXTAUTH_URL environment variable in Vercel:
```
NEXTAUTH_URL=https://yourdomain.com
```
