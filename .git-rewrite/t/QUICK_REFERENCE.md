# Braidly Quick Reference Card

## 🚀 Start Development
```bash
npm run dev
# Open http://localhost:3000
```

## 📋 Environment Variables
```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
✅ STRIPE_SECRET_KEY
✅ STRIPE_WEBHOOK_SECRET
```

## 🗄️ Database Tables
```
profiles
braider_profiles
services
portfolio
bookings
messages
conversations
favorites
notifications
```

## 📦 Real-Time Stores
```typescript
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { useSupabaseBraiderStore } from '@/store/supabaseBraiderStore';
import { useSupabaseBookingStore } from '@/store/supabaseBookingStore';
import { useSupabaseMessageStore } from '@/store/supabaseMessageStore';
import { useSupabaseFavoritesStore } from '@/store/supabaseFavoritesStore';
import { useSupabaseNotificationStore } from '@/store/supabaseNotificationStore';
```

## 💳 Payment
```typescript
import { createPaymentIntent } from '@/lib/stripe';

const result = await createPaymentIntent(amount, 'usd', customerId, {
  bookingId,
  customerId,
  braiderId,
});
```

## 📸 Image Upload
```typescript
import { uploadAvatar, uploadPortfolioImage } from '@/lib/supabaseStorage';

const { url } = await uploadAvatar(userId, file);
const { url } = await uploadPortfolioImage(braiderId, file);
```

## 🔐 Authentication
```typescript
const { signUp, signIn, signOut } = useSupabaseAuthStore();

await signUp(email, password, fullName, role);
await signIn(email, password);
await signOut();
```

## 📊 Real-Time Subscriptions
```typescript
const { subscribeToProfiles, unsubscribeFromProfiles } = useSupabaseBraiderStore();

useEffect(() => {
  subscribeToProfiles();
  return () => unsubscribeFromProfiles();
}, []);
```

## 🧪 Test Scenarios

### Test 1: Real-Time Sync
1. Open app in 2 browsers
2. Sign up as braider in Browser 1
3. Verify appears in Browser 2 instantly

### Test 2: Payments
1. Create booking
2. Use test card: 4242 4242 4242 4242
3. Verify payment succeeds

### Test 3: Messaging
1. Send message in Browser 1
2. Verify appears in Browser 2 instantly

## 📚 Documentation Files
```
COMPLETE_SETUP_GUIDE.md          ← Start here
DEPLOYMENT_GUIDE.md              ← For production
SUPABASE_MIGRATION_GUIDE.md       ← Database setup
SUPABASE_STORAGE_SETUP.md         ← Image storage
PHASE_2_IMPLEMENTATION_COMPLETE.md ← Technical reference
```

## 🔗 Useful Links
```
Supabase Dashboard: https://app.supabase.com
Stripe Dashboard: https://dashboard.stripe.com
Vercel Dashboard: https://vercel.com/dashboard
```

## ⚡ Common Commands
```bash
npm run dev              # Start development
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run linter
npm run type-check       # Check TypeScript
```

## 🐛 Troubleshooting
```
Braiders not appearing?
→ Check Supabase connection
→ Verify subscription is active
→ Check browser console

Payments not working?
→ Check Stripe keys
→ Verify webhook secret
→ Use test card: 4242 4242 4242 4242

Real-time not syncing?
→ Check Supabase connection
→ Verify RLS policies
→ Check browser console
```

## 📞 Support
```
Supabase: https://supabase.com/docs
Stripe: https://stripe.com/docs
Next.js: https://nextjs.org/docs
```

## ✅ Pre-Deployment Checklist
- [ ] All environment variables set
- [ ] Database tables created
- [ ] Storage buckets created
- [ ] Real-time sync tested
- [ ] Payments tested
- [ ] Cross-browser tested
- [ ] No console errors
- [ ] Performance acceptable

## 🎯 Key Features
✅ Real-time synchronization
✅ Payment processing
✅ Image storage
✅ Messaging
✅ Notifications
✅ Authentication
✅ Favorites
✅ Bookings

## 🚀 Ready to Deploy?
Follow: `DEPLOYMENT_GUIDE.md`

---

**Status**: ✅ PRODUCTION READY
**Last Updated**: March 2026
