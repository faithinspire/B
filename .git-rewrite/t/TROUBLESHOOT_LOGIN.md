# Troubleshooting Login Issues

## Problem: Not signing in after signup

If you're getting a 400 error on the token endpoint after signup, follow these steps:

## Solution 1: Clear Browser Cache & Cookies (Most Common Fix)

1. **Close the app** - Stop the dev server
2. **Clear browser data:**
   - Press **Ctrl+Shift+Delete** (Windows/Linux)
   - Or **Cmd+Shift+Delete** (Mac)
3. **Select:**
   - ✅ Cookies and other site data
   - ✅ Cached images and files
4. **Click "Clear data"**
5. **Restart the app** - Run `npm run dev`
6. **Try signup again**

## Solution 2: Verify Supabase Settings

### Check Email Confirmation is OFF

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Authentication** → **Providers** → **Email**
4. Verify **"Confirm email"** toggle is **OFF** (gray)
5. If it's ON, click to turn it OFF
6. Click **Save**

### Check Auto-Confirm is ON (Alternative)

If you want to keep email confirmation:

1. Go to **Authentication** → **Providers** → **Email**
2. Find **"Auto-confirm users"** toggle
3. Turn it **ON**
4. Click **Save**

## Solution 3: Check Supabase Project Status

1. Go to https://app.supabase.com
2. Check your project status (should be "Active")
3. If paused, click to resume
4. Wait 30 seconds for it to fully activate

## Solution 4: Verify Environment Variables

Check `.env.local` has correct values:

```
NEXT_PUBLIC_SUPABASE_URL=https://gymgxcspjysrkluxyavd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

If any are missing or wrong:
1. Go to Supabase dashboard
2. Click **Settings** → **API**
3. Copy the correct keys
4. Update `.env.local`
5. Restart dev server

## Solution 5: Check Browser Console for Errors

1. Open DevTools (**F12**)
2. Go to **Console** tab
3. Look for error messages
4. Common errors:
   - "supabaseKey is required" → Check `.env.local`
   - "Invalid login credentials" → Wrong email/password
   - "Email not confirmed" → Email confirmation is ON
   - "Too many requests" → Rate limit, wait a few minutes

## Solution 6: Try a Different Email

Sometimes the email gets stuck in a bad state:

1. Try signing up with a **different email address**
2. Use a test email like: `test+timestamp@example.com`
3. If it works, the first email might be corrupted

## Solution 7: Check Supabase Database

1. Go to Supabase dashboard
2. Click **SQL Editor**
3. Run this query:

```sql
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
```

4. Check if your user appears
5. If `email_confirmed_at` is NULL and email confirmation is OFF, there might be a sync issue

## Solution 8: Reset Supabase Auth (Nuclear Option)

⚠️ **WARNING: This deletes all users!**

Only do this if nothing else works:

1. Go to Supabase dashboard
2. Click **Settings** → **Auth**
3. Scroll down to **Danger Zone**
4. Click **Reset Auth**
5. Confirm deletion
6. Wait for reset to complete
7. Try signup again

## Solution 9: Check Network Tab

1. Open DevTools (**F12**)
2. Go to **Network** tab
3. Try to sign up
4. Look for the request to `/auth/v1/token`
5. Click on it
6. Check **Response** tab for error details
7. Common responses:
   - 400: Bad request (wrong credentials or email not confirmed)
   - 429: Too many requests (rate limit)
   - 500: Server error (Supabase issue)

## Solution 10: Restart Everything

Sometimes a fresh start fixes everything:

1. **Stop dev server** - Press Ctrl+C
2. **Clear node_modules cache:**
   ```bash
   npm cache clean --force
   ```
3. **Delete .next folder:**
   ```bash
   rm -rf .next
   ```
4. **Restart dev server:**
   ```bash
   npm run dev
   ```
5. **Clear browser cache** (Ctrl+Shift+Delete)
6. **Try signup again**

## Testing Checklist

After trying a solution, test with:

1. **New email address** - Use `test+[timestamp]@example.com`
2. **Simple password** - Use `Password123` (8+ chars)
3. **Valid phone** - Use `+1 (555) 123-4567`
4. **Check console** - Look for error messages
5. **Check network** - Look at API responses

## Still Not Working?

If none of these work:

1. **Check Supabase status** - https://status.supabase.com
2. **Check your internet** - Try a different network
3. **Try incognito mode** - Eliminates browser extensions
4. **Try a different browser** - Chrome, Firefox, Safari
5. **Check firewall** - Some firewalls block Supabase

## Debug Mode

Add this to your browser console to see detailed auth logs:

```javascript
// In browser console
localStorage.setItem('supabase.debug', 'true');
```

Then try signup again and check console for detailed logs.

## Contact Support

If still stuck:
1. Go to https://app.supabase.com
2. Click **Help** → **Support**
3. Describe the issue
4. Include error messages from console
5. Include your project ID: `gymgxcspjysrkluxyavd`

---

**Most Common Fix:** Clear browser cache and cookies (Solution 1)

**Second Most Common:** Verify email confirmation is OFF (Solution 2)

**If all else fails:** Restart everything (Solution 10)
