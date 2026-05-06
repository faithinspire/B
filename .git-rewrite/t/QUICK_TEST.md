# Quick Test - 2 Minutes

## Start Here

### Step 1: Make sure dev server is running
```bash
npm run dev
```
You should see: `ready - started server on 0.0.0.0:3001`

### Step 2: Test Signup (1 minute)

1. Open http://localhost:3001
2. Click **"Join as Customer"**
3. Fill in:
   - Name: `Test User`
   - Email: `test@example.com`
   - Phone: `+1 (555) 123-4567`
   - Password: `Password123`
   - Confirm: `Password123`
4. Click **"Next"**
5. Fill in:
   - Address: `123 Main St`
   - Contact: **Email**
6. Click **"Complete Signup"**

**Expected**: Redirect to dashboard with "Welcome, Test User!" ✅

### Step 3: Test Login (1 minute)

1. Click **"Logout"** button
2. Go to http://localhost:3001/login
3. Enter:
   - Email: `test@example.com`
   - Password: `Password123`
4. Click **"Sign In"**

**Expected**: Redirect to dashboard ✅

## If It Works

✅ **Signup works**
✅ **Login works**
✅ **Session persists**
✅ **Redirect works**

**You're done! The app is working.**

## If It Doesn't Work

### Issue: Redirect not happening
- Wait 3 seconds
- Check browser console (F12)
- Look for red errors

### Issue: "Email already registered"
- Use different email: `test2@example.com`

### Issue: "Invalid email or password"
- Check email and password match exactly
- Passwords are case-sensitive

### Issue: Still on signup page
- Clear browser cache (Ctrl+Shift+Delete)
- Refresh page (F5)
- Try again

## Test Other Flows

### Braider Signup
1. Go to http://localhost:3001/signup
2. Click **"Join as Braider"**
3. Fill all 4 steps
4. Should redirect to `/braider/dashboard`

### Admin Signup
1. Go to http://localhost:3001/signup
2. Click **"Join as Admin"**
3. Fill form with admin code: `BRAIDLY_ADMIN_2024`
4. Should redirect to `/admin`

### Session Persistence
1. Sign up as customer
2. Refresh page (F5)
3. Should still be logged in ✅

### Protected Routes
1. Logout
2. Try to go to http://localhost:3001/dashboard
3. Should redirect to login ✅

---

**Total Time**: 2 minutes
**Status**: ✅ Ready to test
