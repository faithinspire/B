# ACTION CARD: Admin Email Setup

## Current Status
✅ Password reset system working (custom token generation deployed)
✅ Resend API key configured
⏳ **NEXT**: Set up 3 admin users with personal emails

## What You Need to Do

### 1. Edit SQL File (2 minutes)
Open: `COMPLETE_FIX_EMAILS_AND_ADMINS.sql`

Find this section:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
  'your-email-1@gmail.com',
  'your-email-2@gmail.com', 
  'your-email-3@gmail.com'
);
```

Replace with YOUR 3 emails:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
  'your-email@gmail.com',
  'admin2@gmail.com', 
  'admin3@gmail.com'
);
```

### 2. Run SQL in Supabase (1 minute)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** → **New Query**
4. Copy entire `COMPLETE_FIX_EMAILS_AND_ADMINS.sql` file
5. Paste into editor
6. Click **Run**

### 3. Verify Success (1 minute)
You should see at the bottom:
- ✅ `password_reset_tokens table created`
- ✅ Your 3 admin emails listed with `role = 'admin'`

## What Gets Fixed

| Issue | Solution |
|-------|----------|
| Password reset tokens not stored | ✅ Creates `password_reset_tokens` table |
| Users can't be made admin | ✅ Updates 3 users to admin role |
| API can't access tables | ✅ Disables RLS on both tables |

## After Setup

### Verify Resend Domain (5 minutes)
- Go to https://resend.com/domains
- Add domain: `braidme.com`
- Follow DNS verification
- Once verified → emails will send ✅

### Test Password Reset
1. Go to http://localhost:3001/login
2. Click "Forgot Password"
3. Enter email
4. Check inbox for reset email
5. Click reset link
6. Verify password reset works ✅

### Test Admin Access
1. Log in with one of your 3 admin emails
2. Go to http://localhost:3001/admin
3. Verify admin dashboard loads ✅

## Files Involved

| File | Purpose |
|------|---------|
| `COMPLETE_FIX_EMAILS_AND_ADMINS.sql` | SQL migration (edit emails here) |
| `app/api/auth/forgot-password/route.ts` | Password reset endpoint (already deployed) |
| `.env.local` | Resend API key (already configured) |

## Timeline

- **Now**: Edit SQL file with your 3 emails
- **2 min**: Run SQL in Supabase
- **5 min**: Verify Resend domain
- **Done**: System ready to use ✅

## Questions?

See:
- `ADMIN_EMAIL_SETUP_GUIDE.md` - Detailed setup guide
- `RESEND_DOMAIN_VERIFICATION_GUIDE.md` - Domain verification steps
- `PASSWORD_RESET_TESTING_GUIDE.md` - Testing guide
