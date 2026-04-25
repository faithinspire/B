# Quick Deployment Commands

## 🚀 One-Command Deployment

### Step 1: Commit Changes
```bash
git add .
git commit -m "Critical fixes: marketplace currency, payment gateways, order system, messaging"
```

### Step 2: Push to Main
```bash
git push origin main
```

### Step 3: Verify Deployment
```bash
# Check Vercel deployment status
vercel status

# View logs
vercel logs
```

---

## 🔐 Environment Variables (Vercel CLI)

### Add Variables Using CLI
```bash
# Paystack
vercel env add PAYSTACK_SECRET_KEY
# Paste: sk_live_your_paystack_secret_key

# Stripe
vercel env add STRIPE_SECRET_KEY
# Paste: sk_live_your_stripe_secret_key

vercel env add STRIPE_PUBLISHABLE_KEY
# Paste: pk_live_your_stripe_publishable_key

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# Paste: pk_live_your_stripe_publishable_key
```

### Redeploy After Adding Variables
```bash
vercel redeploy
```

---

## 🗄️ Database Migration

### Run Migration in Supabase
```sql
-- Copy and paste in Supabase SQL Editor
-- File: supabase/migrations/add_marketplace_orders.sql

-- This will:
-- 1. Create marketplace_orders table with proper foreign keys
-- 2. Create marketplace_order_messages table
-- 3. Add RLS policies
-- 4. Create indexes
```

---

## ✅ Quick Verification

### Test Nigeria Payment
```bash
# 1. Go to app
# 2. Login as customer
# 3. Search for Nigerian braider
# 4. Book service
# 5. Should redirect to Paystack
```

### Test USA Payment
```bash
# 1. Go to app
# 2. Login as customer
# 3. Search for USA braider
# 4. Book service
# 5. Should redirect to Stripe
```

### Test Marketplace Order
```bash
# 1. Go to Marketplace
# 2. Click "Order Now"
# 3. Fill details
# 4. Create order
# 5. Should appear in database
```

### Test Messaging
```bash
# 1. Create marketplace order
# 2. Click "Chat with Seller"
# 3. Send message
# 4. Should appear in database
```

---

## 📊 Check Deployment Status

### Vercel Dashboard
```
https://vercel.com/dashboard
→ Select project
→ Check latest deployment
→ View logs
```

### Supabase Dashboard
```
https://app.supabase.com
→ Select project
→ SQL Editor
→ Run: SELECT * FROM marketplace_orders LIMIT 1;
```

---

## 🔍 Troubleshooting Commands

### Check Environment Variables
```bash
vercel env list
```

### View Recent Logs
```bash
vercel logs --follow
```

### Redeploy Specific Branch
```bash
vercel redeploy --prod
```

### Clear Cache and Redeploy
```bash
vercel redeploy --prod --force
```

---

## 📋 Pre-Deployment Checklist

```bash
# 1. Verify all files are created
ls -la app/api/payments/create-payment-intent/
ls -la app/api/marketplace/orders/
ls -la app/api/marketplace/orders/[id]/

# 2. Check git status
git status

# 3. Verify no uncommitted changes
git diff

# 4. Check branch
git branch

# 5. Verify remote
git remote -v
```

---

## 🎯 Complete Deployment Flow

```bash
# 1. Commit changes
git add .
git commit -m "Critical fixes: marketplace currency, payment gateways, order system, messaging"

# 2. Push to main
git push origin main

# 3. Wait for Vercel deployment (2-3 minutes)

# 4. Add environment variables (if not already done)
vercel env add PAYSTACK_SECRET_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_PUBLISHABLE_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# 5. Redeploy with new variables
vercel redeploy --prod

# 6. Run database migration in Supabase
# (Copy SQL from supabase/migrations/add_marketplace_orders.sql)

# 7. Test all flows
# (Follow TESTING_GUIDE_CURRENT_SESSION.md)

# 8. Monitor logs
vercel logs --follow
```

---

## 🚨 Rollback Commands

### If Something Goes Wrong
```bash
# Revert last commit
git revert HEAD

# Or reset to previous commit
git reset --hard HEAD~1

# Push revert
git push origin main
```

---

## 📞 Support Commands

### Get Help
```bash
vercel help
vercel help env
vercel help redeploy
```

### Check Version
```bash
vercel --version
```

### Login to Vercel
```bash
vercel login
```

---

## ✨ Success Indicators

After deployment, you should see:

✅ Vercel deployment successful
✅ No errors in logs
✅ Database tables created
✅ Environment variables set
✅ Nigeria payments use Paystack
✅ USA payments use Stripe
✅ Marketplace orders working
✅ Messaging system working

---

## 🎉 You're Done!

Once all checks pass, your system is live with:
- ✅ Fixed marketplace currency
- ✅ Country-based payment gateways
- ✅ Complete order management
- ✅ Buyer-seller messaging
- ✅ Fixed profile navigation
- ✅ Separated braiders/barbers

**Congratulations! 🎊**
