# Supabase Setup - Final Configuration

## Quick Setup (5 minutes)

### Step 1: Enable Realtime for braider_profiles Table

1. Go to Supabase Dashboard
2. Navigate to **Database** → **Tables**
3. Find `braider_profiles` table
4. Click on **Realtime** tab
5. Toggle **Realtime** ON
6. Select events: INSERT, UPDATE, DELETE

### Step 2: Create Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Click **Create new bucket**
3. Name: `braider-avatars`
   - Make it **Public**
   - Click **Create bucket**

4. Click **Create new bucket** again
5. Name: `portfolio-images`
   - Make it **Public**
   - Click **Create bucket**

### Step 3: Set Bucket Policies

For each bucket (`braider-avatars` and `portfolio-images`):

1. Click on bucket name
2. Go to **Policies** tab
3. Click **New Policy**
4. Select **For public access**
5. Click **Review**
6. Click **Save policy**

### Step 4: Verify Environment Variables

Check `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Step 5: Test the Setup

1. Start the app: `npm run dev`
2. Sign up as braider
3. Check homepage - braider should appear within 2 seconds
4. Add portfolio item with multiple images
5. Verify images upload and display

---

## Database Schema (If Not Exists)

Run these SQL commands in Supabase SQL Editor:

```sql
-- Create braider_profiles table
CREATE TABLE IF NOT EXISTS braider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  rating_avg DECIMAL(3,2) DEFAULT 5.0,
  rating_count INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'unverified',
  travel_radius_miles INTEGER DEFAULT 10,
  is_mobile BOOLEAN DEFAULT false,
  salon_address TEXT,
  specialties TEXT[] DEFAULT '{}',
  total_earnings DECIMAL(10,2) DEFAULT 0,
  available_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create portfolio table
CREATE TABLE IF NOT EXISTS portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  style TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_braider_profiles_user_id ON braider_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_braider_profiles_email ON braider_profiles(email);
CREATE INDEX IF NOT EXISTS idx_portfolio_braider_id ON portfolio(braider_id);
CREATE INDEX IF NOT EXISTS idx_services_braider_id ON services(braider_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE braider_profiles;
```

---

## Verify Everything Works

### Checklist

- [ ] Supabase URL and keys in `.env.local`
- [ ] `braider-avatars` bucket created and public
- [ ] `portfolio-images` bucket created and public
- [ ] Realtime enabled for `braider_profiles` table
- [ ] Database tables created
- [ ] App starts without errors: `npm run dev`
- [ ] Can sign up as braider
- [ ] Braider appears on homepage within 2 seconds
- [ ] Can add portfolio items with multiple images
- [ ] Images upload and display correctly
- [ ] Real-time sync works across browsers

---

## Troubleshooting

### Braiders Not Showing
```
1. Check Supabase connection
2. Verify braider_profiles table has data
3. Check browser console for errors
4. Verify Realtime is enabled
```

### Images Not Uploading
```
1. Check storage buckets exist
2. Verify buckets are public
3. Check file size (should work with any size)
4. Check browser console for errors
```

### Real-Time Not Working
```
1. Verify Realtime is enabled for braider_profiles
2. Check subscription is active in browser DevTools
3. Verify database changes are being made
4. Check network connection
```

---

## Production Deployment

### Before Deploying

1. Update environment variables with production keys
2. Test all features in staging environment
3. Verify Supabase backups are enabled
4. Set up monitoring and error tracking

### Deployment Steps

1. Push code to production branch
2. Deploy to production environment
3. Verify environment variables are set
4. Test all features in production
5. Monitor error logs

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Check Supabase logs
3. Verify environment variables
4. Verify database schema
5. Verify storage buckets
6. Verify Realtime is enabled

---

## Summary

Your Braidly app is now fully configured with:
- ✅ Complete Supabase integration
- ✅ Real-time braider sync
- ✅ Cloud image storage
- ✅ Multi-image portfolio support
- ✅ Unlimited file sizes
- ✅ Production-ready setup

The app is ready to use!
