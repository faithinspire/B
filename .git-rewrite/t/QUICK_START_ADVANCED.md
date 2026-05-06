# Quick Start - Advanced Features

## 5-Minute Setup

### 1. Create Database Tables (2 minutes)

Copy and paste this SQL into Supabase SQL Editor:

```sql
-- Location Tracking
CREATE TABLE IF NOT EXISTS location_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy INT DEFAULT 10,
  booking_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS location_tracking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE,
  braider_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  status TEXT DEFAULT 'tracking',
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL,
  recipient_id UUID NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE,
  braider_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  braider_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMP,
  unread_count INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS typing_indicators (
  booking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_typing BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (booking_id, user_id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  braider_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  payment_method TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  braider_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  stripe_payout_id TEXT,
  bank_account TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  braider_id UUID NOT NULL,
  released_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  rater_id UUID NOT NULL,
  rater_type TEXT NOT NULL,
  ratee_id UUID NOT NULL,
  rating INT NOT NULL,
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_location_tracking_user_id ON location_tracking(user_id);
CREATE INDEX idx_location_tracking_booking_id ON location_tracking(booking_id);
CREATE INDEX idx_chat_messages_booking_id ON chat_messages(booking_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_ratings_ratee_id ON ratings(ratee_id);
```

### 2. Enable Real-Time (1 minute)

In Supabase Dashboard:
1. Go to Database → Replication
2. Enable for: location_tracking, chat_messages, payments, ratings

### 3. Test Admin Dashboard (2 minutes)

1. Start app: `npm run dev`
2. Log in as admin
3. Go to `/admin`
4. View real-time stats

## What You Get

✅ Real-time location tracking (Uber-like)
✅ Real-time messaging
✅ Payment management
✅ Admin dashboard
✅ Google Maps integration
✅ Star ratings

## Key Files

- **Stores**: `store/supabase*Store.ts`
- **API**: `app/api/location/`, `app/api/messages/`, `app/api/payments/`
- **Components**: `app/components/Realtime*.tsx`
- **Admin**: `app/(admin)/admin/page.tsx`

## Usage

### Location Tracking
```typescript
import { useLocationStore } from '@/store/supabaseLocationStore';

const { updateLocation } = useLocationStore();
await updateLocation(userId, 'braider', lat, lng, bookingId);
```

### Messaging
```typescript
import { useChatStore } from '@/store/supabaseChatStore';

const { sendMessage } = useChatStore();
await sendMessage(bookingId, senderId, name, 'braider', recipientId, 'Hi!');
```

### Payments
```typescript
import { usePaymentStore } from '@/store/supabasePaymentStore';

const { releasePayment } = usePaymentStore();
await releasePayment(paymentId);
```

## Admin Dashboard

Navigate to `/admin` to:
- View real-time stats
- Monitor active bookings
- See live tracking
- Release payments
- Manage users

## Next Steps

1. ✅ Create tables (done)
2. ✅ Enable real-time (done)
3. ✅ Test admin dashboard (done)
4. 📝 Integrate with booking flow
5. 📝 Add location updates to braider app
6. 📝 Add chat to messages page
7. 📝 Add map to booking details
8. 📝 Add Twilio calls (optional)
9. 📝 Add SMS notifications (optional)

## Troubleshooting

**Admin dashboard not loading?**
- Verify user has admin role
- Check Supabase connection
- Check browser console

**Location not updating?**
- Check geolocation permissions
- Verify booking_id is correct
- Check real-time is enabled

**Messages not appearing?**
- Verify chat_messages table exists
- Check booking_id is correct
- Check real-time subscriptions

## Documentation

- `SETUP_ADVANCED_FEATURES.md` - Full setup guide
- `ADVANCED_FEATURES_IMPLEMENTATION_COMPLETE.md` - Complete feature guide
- `ADVANCED_FEATURES_SUMMARY.md` - Feature summary

## Support

Check these files for help:
1. `.env.local` - Verify API keys
2. Supabase logs - Check for errors
3. Browser console - Check for JS errors
4. Network tab - Check API responses

---

**You're all set!** The advanced features are ready to use. 🚀
