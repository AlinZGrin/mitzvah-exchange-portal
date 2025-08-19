# Production Database Setup

## After setting up Supabase and updating environment variables in Vercel:

## 1. Install dependencies locally (if needed)
npm install

## 2. Set your production DATABASE_URL locally for migration
# Create a .env file with your Supabase URL:
# DATABASE_URL="postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres"

## 3. Generate Prisma client
npx prisma generate

## 4. Push database schema to production
npx prisma db push

## 5. Seed the production database
npx prisma db seed

## 6. Redeploy Vercel (will happen automatically when you push to GitHub)

## Environment Variables for Vercel:
# DATABASE_URL=postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres
# JWT_SECRET=bf3137be8d47f9e33f2cc623248e08501dad4c71711cd920aff7da1c14ba9698
# NEXTAUTH_SECRET=1aab0dbe2c60c985d4ebf31a1ecd6588e1e0eb052e38d0be046fc696188307cf
# NEXTAUTH_URL=https://your-vercel-app.vercel.app

## Note: After updating schema, Vercel will automatically redeploy
