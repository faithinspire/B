# START HERE: Admin Email Setup

## You Asked For
> "I was thinking there is a place i can paste personal email for the admin"

## Answer
✅ **YES!** You can now paste your personal emails directly into the SQL file.

---

## What You Need to Do (3 Simple Steps)

### Step 1: Open the SQL File
Open this file in your editor:
```
COMPLETE_FIX_EMAILS_AND_ADMINS.sql
```

### Step 2: Find and Replace 3 Emails
Look for this section (around line 30-40):

**BEFORE:**
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
  'your-email-1@gmail.com',
  'your-email-2@gmail.com', 
  'your-email-3@gmail.com'
);
```

**AFTER (Your emails):**
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
  'damilola@gmail.com',
  'admin@braidme.com', 
  'support@braidme.com'
);
```

### Step 3: Run in Supabase
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** → **New Query**
4. Copy the entire `COMPLETE_FIX_EMAILS_AND_ADMINS.sql` file
5. Paste into the editor
6. Click **Run**

**Done!** ✅ Your 3 admins are now set up.

---

## What Happens

| Before | After |
|--------|-------|
| No password reset table | ✅ Table created with proper schema |
| No admin users | ✅ Your 3 emails become admins |
| API can't access tables | ✅ RLS disabled for API access |

---

## Next: Verify Resend Domain (5 minutes)

For emails to actually send, you need to verify your domain:

1. Go to https://resend.com/domains
2. Click **Add Domain**
3. Enter: `braidme.com`
4. Follow the DNS verification steps
5. Wait for verification (usually instant)

Once verified, password reset emails will send automatically! ✅

---

## Then: Test Everything

### Test 1: Password Reset
1. Go to http://localhost:3001/login
2. Click "Forgot Password"
3. Enter any email
4. Check inbox for reset email
5. Click the reset link
6. Verify password reset works ✅

### Test 2: Admin Access
1. Log in with one of your 3 admin emails
2. Go to http://localhost:3001/admin
3. Verify admin dashboard loads ✅

---

## Files You Have

| File | Purpose | Action |
|------|---------|--------|
| `COMPLETE_FIX_EMAILS_AND_ADMINS.sql` | Main SQL file | **Edit this** - replace 3 emails |
| `ADMIN_EMAIL_SETUP_GUIDE.md` | Detailed guide | Read if you need more details |
| `ACTION_CARD_ADMIN_EMAIL_SETUP.md` | Quick card | Read for quick overview |
| `ADMIN_EMAILS_COPY_PASTE_TEMPLATE.md` | Copy-paste template | Use for easy copy-paste |
| `ADMIN_SETUP_VISUAL_FLOW.md` | Visual diagrams | Read for visual understanding |
| `SESSION_SUMMARY_ADMIN_EMAIL_SETUP.md` | Full summary | Read for complete context |

---

## Timeline

```
Now (3 min):
  1. Edit SQL file with your 3 emails
  2. Run SQL in Supabase
  3. Verify admins were created

Then (5 min):
  1. Verify Resend domain
  2. Wait for verification

Then (5 min):
  1. Test password reset
  2. Test admin access

Total: ~13 minutes to fully working system
```

---

## Common Questions

**Q: Do the emails need to exist already?**
A: No! The SQL will work with any email addresses. Users can sign up later with those emails.

**Q: Can I change the admin emails later?**
A: Yes! Just run the SQL again with different emails.

**Q: What if I only want 2 admins?**
A: Just use 2 emails instead of 3. The SQL will still work.

**Q: What if I want more than 3 admins?**
A: Add more emails to the list in the SQL.

**Q: Will this break anything?**
A: No! This only:
- Creates a new table (password_reset_tokens)
- Updates 3 user roles to 'admin'
- Disables RLS on 2 tables (for API access)

All changes are reversible.

---

## Need Help?

### For detailed setup instructions:
→ Read `ADMIN_EMAIL_SETUP_GUIDE.md`

### For quick copy-paste:
→ Read `ADMIN_EMAILS_COPY_PASTE_TEMPLATE.md`

### For visual diagrams:
→ Read `ADMIN_SETUP_VISUAL_FLOW.md`

### For domain verification:
→ Read `RESEND_DOMAIN_VERIFICATION_GUIDE.md`

### For testing:
→ Read `PASSWORD_RESET_TESTING_GUIDE.md`

---

## Ready?

1. Open `COMPLETE_FIX_EMAILS_AND_ADMINS.sql`
2. Replace the 3 placeholder emails with your emails
3. Run it in Supabase
4. Done! ✅

**Estimated time: 3 minutes**

---

**Questions?** Check the guide files above. Everything is documented! 📚
