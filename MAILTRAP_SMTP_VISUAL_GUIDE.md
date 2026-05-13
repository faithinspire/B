# Mailtrap SMTP Credentials - Visual Guide

## The Problem

You were using this:
```
MAILTRAP_USER=ad4e934227c0808d8b8b029489fa0fa6  ❌ WRONG
MAILTRAP_PASS=ad4e934227c0808d8b8b029489fa0fa6  ❌ WRONG
```

This is the **API Key**, not SMTP credentials!

---

## Where to Find SMTP Credentials

### Step 1: Open Mailtrap
Go to: https://mailtrap.io

### Step 2: Login
Enter your email and password

### Step 3: Select Your Inbox
Click on the inbox you want to use for emails

### Step 4: Click Settings
Look for the gear icon ⚙️ in the top right

### Step 5: Find SMTP Credentials
You should see a section like this:

```
┌─────────────────────────────────────┐
│ SMTP Credentials                    │
├─────────────────────────────────────┤
│ SMTP Host:     smtp.mailtrap.io     │
│ SMTP Port:     2525                 │
│ SMTP Username: 123456               │
│ SMTP Password: abcdef123456789      │
└─────────────────────────────────────┘
```

---

## Copy Your Credentials

### Your SMTP Username
```
Look for: "SMTP Username"
Copy the value (usually a number like 123456)
```

### Your SMTP Password
```
Look for: "SMTP Password"
Copy the value (usually a token like abcdef123456789)
```

---

## Update Your `.env.local`

### Find This Section:
```
# Email Configuration (Mailtrap for welcome emails)
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=ad4e934227c0808d8b8b029489fa0fa6
MAILTRAP_PASS=ad4e934227c0808d8b8b029489fa0fa6
MAILTRAP_FROM_EMAIL=noreply@braidme.com
```

### Replace With Your Credentials:
```
# Email Configuration (Mailtrap for welcome emails)
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=123456
MAILTRAP_PASS=abcdef123456789
MAILTRAP_FROM_EMAIL=noreply@braidme.com
```

**Replace:**
- `123456` with your actual SMTP Username
- `abcdef123456789` with your actual SMTP Password

---

## Example Credentials

### What You Might See in Mailtrap:
```
SMTP Host:     smtp.mailtrap.io
SMTP Port:     2525
SMTP Username: 987654
SMTP Password: 1a2b3c4d5e6f7g8h
```

### What You Put in `.env.local`:
```
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=987654
MAILTRAP_PASS=1a2b3c4d5e6f7g8h
MAILTRAP_FROM_EMAIL=noreply@braidme.com
```

---

## Verify It Works

### 1. Restart Dev Server
```bash
npm run dev
```

### 2. Sign Up
Go to: http://localhost:3000/signup
- Email: test@example.com
- Password: Test123!
- Role: Customer

### 3. Check Mailtrap Inbox
Go to: https://mailtrap.io
- Open your inbox
- You should see the welcome email

### 4. Verify Email Content
- Subject: "Welcome to BraidMe!"
- Contains your name
- Has dashboard link

---

## Common Issues

### Issue: Still No Email
**Solution:**
1. Double-check SMTP credentials are correct
2. Make sure there are no extra spaces
3. Restart dev server after updating `.env.local`
4. Check Mailtrap inbox (not spam folder)

### Issue: "Authentication Failed"
**Solution:**
1. Verify SMTP Username and Password are correct
2. Make sure you copied from SMTP Credentials section (not API key)
3. Check for typos

### Issue: "Connection Refused"
**Solution:**
1. Verify MAILTRAP_HOST is: `smtp.mailtrap.io`
2. Verify MAILTRAP_PORT is: `2525`
3. Check your internet connection

---

## API Key vs SMTP Credentials

### API Key (❌ Don't Use for SMTP)
```
ad4e934227c0808d8b8b029489fa0fa6
```
- Used for: REST API calls
- Found in: Mailtrap → Settings → API Tokens
- NOT for: SMTP email sending

### SMTP Credentials (✅ Use for SMTP)
```
Username: 123456
Password: abcdef123456789
```
- Used for: SMTP email sending
- Found in: Mailtrap → Settings → SMTP Credentials
- Required for: Email sending via Nodemailer

---

## Quick Checklist

- [ ] Opened https://mailtrap.io
- [ ] Logged in
- [ ] Selected inbox
- [ ] Clicked Settings
- [ ] Found SMTP Credentials section
- [ ] Copied SMTP Username
- [ ] Copied SMTP Password
- [ ] Updated `.env.local` with credentials
- [ ] Restarted dev server
- [ ] Tested signup
- [ ] Verified email received

---

## Still Need Help?

### Check Mailtrap Documentation
https://mailtrap.io/inboxes

### Test SMTP Connection
In Mailtrap dashboard, there's a "Send Test Email" button
- Click it to verify SMTP works
- If test email works, your credentials are correct

### Check Server Logs
When you sign up, check your terminal for:
- "Email sent successfully" ✅
- Or error message with details ❌

---

**Next Step:** Update `.env.local` with your SMTP credentials and restart dev server!
