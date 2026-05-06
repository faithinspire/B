# Setup Guide - Advanced Features

## Prerequisites

- Node.js 18+
- Supabase account
- Google Maps API key (already configured)
- Stripe account (already configured)
- Twilio account (already configured)

## Step 1: Create Database Tables

Run these SQL commands in your Supabase SQL editor:

```sql
-- Location Tracking Tables
CREATE TABLE IF NOT EXISTS location_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('braider', 'customer')),
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
  status TEXT DEFAULT 'tracking' CHECK (status IN ('tracking', 'arrived', 'completed')),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat Tables
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('braider', 'customer')),
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
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS typing_indicators (
  booking_id UUID NOT NULL,
  user_id UUID NOT NULL,
  is_typing BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (booking_id, user_id)
);

-- Payment Tables
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  braider_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
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
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
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

-- Rating Tables
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  rater_id UUID NOT NULL,
  rater_type TEXT NOT NULL CHECK (rater_type IN ('braider', 'customer')),
  ratee_id UUID NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_location_tracking_user_id ON location_tracking(user_id);
CREATE INDEX idx_location_tracking_booking_id ON location_tracking(booking_id);
CREATE INDEX idx_chat_messages_booking_id ON chat_messages(booking_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_braider_id ON payments(braider_id);
CREATE INDEX idx_ratings_ratee_id ON ratings(ratee_id);
```

## Step 2: Enable Real-Time in Supabase

1. Go to Supabase Dashboard
2. Navigate to Database → Replication
3. Enable replication for these tables:
   - location_tracking
   - location_tracking_sessions
   - chat_messages
   - chat_conversations
   - typing_indicators
   - payments
   - payouts
   - ratings

## Step 3: Install Dependencies

All dependencies are already in package.json. Just ensure they're installed:

```bash
npm install
```

## Step 4: Verify Environment Variables

Check `.env.local` has these keys:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_key
STRIPE_SECRET_KEY=your_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
```

## Step 5: Test the Features

### Test Location Tracking

1. Create a booking
2. Accept booking as braider
3. Open admin dashboard
4. Select booking to see tracking
5. Update location from braider app:

```typescript
import { useLocationStore } from '@/store/supabaseLocationStore';

const { updateLocation } = useLocationStore();

// Update location every 10 seconds
setInterval(() => {
  navigator.geolocation.getCurrentPosition((position) => {
    updateLocation(
      userId,
      'braider',
      position.coords.latitude,
      position.coords.longitude,
      bookingId
    );
  });
}, 10000);
```

### Test Messaging

1. Open chat between braider and customer
2. Send message from one side
3. Verify real-time delivery on other side
4. Check message history loads correctly

### Test Payments

1. Create booking with payment
2. Go to admin dashboard → Payments tab
3. Click "Release" on pending payment
4. Verify payment status changes to "completed"
5. Verify braider balance updates

### Test Admin Dashboard

1. Log in as admin
2. Navigate to `/admin`
3. View real-time stats
4. Select booking to see details
5. View tracking data
6. Release payments

## Step 6: Integration with Existing Pages

### Update Booking Page

```typescript
import { useLocationStore } from '@/store/supabaseLocationStore';

const { startTracking } = useLocationStore();

// When booking is accepted
const handleAcceptBooking = async () => {
  // ... existing code ...
  await startTracking(bookingId, braiderId, customerId);
};
```

### Update Messages Page

```typescript
import { RealtimeChat } from '@/app/components/RealtimeChat';

<RealtimeChat
  bookingId={bookingId}
  recipientId={recipientId}
  recipientName={recipientName}
/>
```

### Update Booking Details Page

```typescript
import { RealtimeMap } from '@/app/components/RealtimeMap';

<RealtimeMap
  braiderLocation={braiderLocation}
  customerLocation={customerLocation}
  distance={distance}
  eta={eta}
/>
```

## Step 7: Add Location Updates to Braider App

Add this to braider dashboard or a location service:

```typescript
import { useLocationStore } from '@/store/supabaseLocationStore';

export function LocationTracker({ bookingId }: { bookingId: string }) {
  const { updateLocation } = useLocationStore();
  const { user } = useSupabaseAuthStore();

  useEffect(() => {
    if (!user || user.role !== 'braider') return;

    // Request permission
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted' || result.state === 'prompt') {
        // Update location every 10 seconds
        const interval = setInterval(() => {
          navigator.geolocation.getCurrentPosition((position) => {
            updateLocation(
              user.id,
              'braider',
              position.coords.latitude,
              position.coords.longitude,
              bookingId
            );
          });
        }, 10000);

        return () => clearInterval(interval);
      }
    });
  }, [user, bookingId, updateLocation]);

  return null;
}
```

## Step 8: Testing Checklist

- [ ] Database tables created
- [ ] Real-time enabled in Supabase
- [ ] Admin dashboard loads
- [ ] Location tracking works
- [ ] Messages send/receive in real-time
- [ ] Payments can be released
- [ ] Map displays correctly
- [ ] Stats update in real-time
- [ ] All API endpoints respond

## Troubleshooting

### Location not updating
- Check browser geolocation permissions
- Verify location_tracking table has data
- Check Supabase real-time is enabled

### Messages not appearing
- Check chat_messages table
- Verify booking_id is correct
- Check Supabase real-time subscriptions

### Map not loading
- Verify Google Maps API key is valid
- Check browser console for errors
- Ensure locations have valid lat/lng

### Admin dashboard not loading
- Verify user has admin role
- Check Supabase connection
- Verify bookings table exists

## Next Steps

1. Add Twilio integration for calls
2. Add SMS notifications
3. Add push notifications
4. Add dispute resolution UI
5. Add advanced analytics
6. Add payment history reports
7. Add braider earnings dashboard
8. Add customer booking history

## Support

For issues or questions:
1. Check Supabase logs
2. Check browser console
3. Verify database tables exist
4. Verify real-time is enabled
5. Check API endpoints respond
