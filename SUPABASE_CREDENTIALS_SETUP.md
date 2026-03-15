# Supabase Credentials Setup Guide

## Why You're Seeing "Supabase not configured"

The app requires real Supabase credentials to work. Currently, `.env.local` has placeholder values like `your_supabase_url` which are invalid.

## How to Get Your Supabase Credentials

### Step 1: Go to Supabase Dashboard
1. Visit https://app.supabase.com
2. Sign in to your account
3. Select your project (or create a new one if you don't have one)

### Step 2: Find Your Credentials
1. Click on **Settings** (gear icon) in the left sidebar
2. Click on **API** in the submenu
3. You'll see:
   - **Project URL** - Copy this value
   - **anon public** - Copy this value (this is your ANON_KEY)
   - **service_role secret** - Copy this value (this is your SERVICE_ROLE_KEY)

### Step 3: Update .env.local

Replace the placeholder values in `.env.local` with your actual credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Restart the Dev Server

After updating `.env.local`:
1. Stop the dev server (Ctrl+C)
2. Run `npm run dev` again
3. The app should now connect to Supabase

## What Happens After Setup

Once Supabase is configured:
- ✅ Sign up/Sign in will work
- ✅ Featured braiders will display on the homepage
- ✅ All database operations will function
- ✅ Real-time features will work

## If You Don't Have a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in the project details
4. Wait for the project to be created (2-3 minutes)
5. Then follow the steps above to get your credentials

## Database Schema

Make sure your Supabase project has the required tables. You can find the schema in:
- `COMPLETE_DATABASE_SCHEMA.sql` - Run this in your Supabase SQL editor

## Troubleshooting

**Still seeing "Supabase not configured"?**
- Make sure you copied the FULL URL (including https://)
- Make sure you copied the FULL API keys (they're long strings)
- Restart the dev server after updating `.env.local`
- Check that `.env.local` is in the root directory of the project

**Braiders not showing on homepage?**
- Make sure the `braider_profiles` table exists in Supabase
- Make sure there are braiders registered in the database
- Check the browser console for any errors
