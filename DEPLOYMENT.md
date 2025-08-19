# Deployment Guide for Mitzvah Exchange Portal

## Option 1: Vercel (Recommended - Free Tier Available)

### Steps:
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:
   ```bash
   vercel
   ```

4. **Set Environment Variables in Vercel Dashboard**:
   - `DATABASE_URL` - Your production database URL
   - `JWT_SECRET` - Your JWT secret key
   - `NEXTAUTH_URL` - Your deployed site URL
   - `NEXTAUTH_SECRET` - Random secret for NextAuth

### Database Options for Vercel:
- **Vercel Postgres** (integrated, paid)
- **PlanetScale** (MySQL, free tier)
- **Supabase** (PostgreSQL, free tier)
- **Railway** (PostgreSQL, free tier)

### Vercel Features:
- ✅ Automatic deployments from GitHub
- ✅ Built-in CDN and SSL
- ✅ Serverless functions
- ✅ Free tier available
- ✅ Custom domains

---

## Option 2: Netlify (Good Alternative)

### Steps:
1. **Build your project**:
   ```bash
   npm run build
   ```

2. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod --dir=.next
   ```

### Database Options:
- External database required (Supabase, PlanetScale, etc.)

---

## Option 3: Railway (Full-Stack Hosting)

### Steps:
1. Visit [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Railway will auto-detect Next.js and deploy
4. Add PostgreSQL database service
5. Set environment variables

### Features:
- ✅ Integrated PostgreSQL database
- ✅ Automatic GitHub deployments
- ✅ Free tier with $5/month credit
- ✅ Easy scaling

---

## Option 4: DigitalOcean App Platform

### Steps:
1. Visit [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Connect GitHub repository
3. Configure build settings:
   - Build Command: `npm run build`
   - Run Command: `npm start`
4. Add managed PostgreSQL database
5. Set environment variables

### Features:
- ✅ Managed database options
- ✅ Auto-scaling
- ✅ Starting at $5/month

---

## Option 5: AWS/Google Cloud/Azure (Advanced)

### AWS Amplify:
1. Visit AWS Amplify Console
2. Connect GitHub repository
3. Configure build settings
4. Add RDS database or use DynamoDB

### Google Cloud Run:
1. Build Docker container
2. Push to Google Container Registry
3. Deploy to Cloud Run
4. Add Cloud SQL database

### Azure Static Web Apps:
1. Connect GitHub repository
2. Configure build process
3. Add Azure SQL database

---

## Environment Variables Needed

For any deployment platform, you'll need these environment variables:

```env
# Database
DATABASE_URL="your-production-database-url"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
NEXTAUTH_URL="https://your-deployed-site.com"
NEXTAUTH_SECRET="another-random-secret-key"

# Optional: Email service (for future features)
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT=""
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM=""
```

---

## Database Migration for Production

Before deploying, you'll need to set up your production database:

1. **Choose a database provider** (Supabase recommended for simplicity)
2. **Update your DATABASE_URL** to point to production
3. **Run database migrations**:
   ```bash
   npx prisma db push
   ```
4. **Seed the database**:
   ```bash
   npx prisma db seed
   ```

---

## Custom Domain Setup

Most platforms support custom domains:

1. **Purchase a domain** (GoDaddy, Namecheap, Google Domains)
2. **Add domain in hosting platform dashboard**
3. **Update DNS records** to point to your hosting provider
4. **SSL certificate** is usually automatically provided

---

## Performance Optimizations

Before deploying:

1. **Optimize images**: Use Next.js Image component
2. **Bundle analysis**: Run `npm run build` and check bundle size
3. **Environment-specific configs**: Ensure production-ready settings
4. **Database indexing**: Add indexes for better query performance

---

## Monitoring and Analytics

Consider adding:

- **Vercel Analytics** (if using Vercel)
- **Google Analytics**
- **Sentry** for error tracking
- **LogRocket** for user session recording

---

## Cost Estimates

| Platform | Free Tier | Paid Plans |
|----------|-----------|------------|
| Vercel | ✅ Hobby plan | Pro: $20/month |
| Netlify | ✅ Starter plan | Pro: $19/month |
| Railway | ✅ $5/month credit | $5-20/month |
| DigitalOcean | ❌ | $5-25/month |
| AWS/GCP/Azure | ✅ Limited free tier | Variable pricing |

---

## Recommended Deployment Stack

**For beginners**: Vercel + Supabase (PostgreSQL)
**For scalability**: Railway (all-in-one)
**For enterprise**: AWS/Google Cloud/Azure

Choose based on your technical comfort level and scalability needs!
