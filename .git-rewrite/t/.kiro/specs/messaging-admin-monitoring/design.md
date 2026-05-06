# Messaging & Admin Monitoring System - Technical Design

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    REAL-TIME MESSAGING SYSTEM                   │
└─────────────────────────────────────────────────────────────────┘

COMPONENTS:
1. Messaging Layer (Supabase Real-time)
2. Location Tracking Layer (GPS + Maps)
3. Admin Monitoring Layer (Dashboard + Notifications)
4. Payment Notification Layer (Stripe Webhook)
5. Chat Access Control Layer (Admin Permissions)
```

## Database Schema

### 1. Conversations Table (Enhanced)
```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  booking_id TEXT REFERENCES bookings(id),
  customer_id UUID REFERENCES auth.users(id),
  braider_id UUID REFERENCES auth.users(id),
  admin_id UUID REFERENCES auth.users(id) -- NULL if no admin joined
  status TEXT DEFAULT 'active', -- active, completed, archived
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 2. Messages Table (Enhanced)
```sql
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id),
  sender_id UUID REFERENCES auth.users(id),
  sender_role TEXT, -- 'customer', 'braider', 'admin'
  content TEXT,
  message_type TEXT DEFAULT 'text', -- text, location, image, system
  metadata JSONB, -- for location data, images, etc.
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP
);
```

### 3. Location Tracking Table (Enhanced)
```sql
CREATE TABLE location_tracking (
  id TEXT PRIMARY KEY,
  booking_id TEXT REFERENCES bookings(id),
  braider_id UUID REFERENCES auth.users(id),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  accuracy DECIMAL(10,2), -- GPS accuracy in meters
  speed DECIMAL(10,2), -- Speed in km/h
  heading DECIMAL(10,2), -- Direction in degrees
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);
```

### 4. Payment Notifications Table (New)
```sql
CREATE TABLE payment_notifications (
  id TEXT PRIMARY KEY,
  booking_id TEXT REFERENCES bookings(id),
  payment_id TEXT REFERENCES payments(id),
  admin_id UUID REFERENCES auth.users(id),
  customer_id UUID REFERENCES auth.users(id),
  braider_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10,2),
  status TEXT, -- pending, completed, failed
  notification_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  created_at TIMESTAMP
);
```

### 5. Admin Access Log Table (New)
```sql
CREATE TABLE admin_access_logs (
  id TEXT PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id),
  conversation_id TEXT REFERENCES conversations(id),
  action TEXT, -- 'joined', 'left', 'viewed_location'
  timestamp TIMESTAMP
);
```

## API Routes

### Messaging API Routes

#### POST /api/messages/send
- Send message in conversation
- Validates sender is part of conversation
- Triggers real-time update
- Logs admin access if admin sends message

#### GET /api/messages/conversation/[id]
- Fetch all messages in conversation
- Paginates results
- Marks messages as read

#### GET /api/conversations
- List all conversations for user
- Filters by role (customer, braider, admin)
- Shows unread count

#### POST /api/conversations
- Create new conversation
- Triggered when booking is confirmed
- Links to booking_id

### Location Tracking API Routes

#### POST /api/location/track
- Braider sends GPS location
- Stores in location_tracking table
- Triggers real-time update for customer and admin

#### GET /api/location/braider/[id]
- Get braider's current location
- Returns latest location record
- Admin can access any braider's location

#### GET /api/location/history/[booking_id]
- Get location history for booking
- Returns all location points
- Used for route visualization

### Admin Monitoring API Routes

#### POST /api/admin/conversations/[id]/join
- Admin joins conversation
- Updates conversations table (admin_id)
- Logs access
- Notifies customer and braider

#### POST /api/admin/conversations/[id]/leave
- Admin leaves conversation
- Clears admin_id
- Logs access

#### GET /api/admin/dashboard
- Get all active bookings
- Get all conversations
- Get payment notifications
- Get location data for all active braiders

#### GET /api/admin/payments/notifications
- Get all payment notifications
- Filters by status
- Marks as read

### Payment Notification API Routes

#### POST /api/payments/notify-admin
- Called by Stripe webhook
- Creates payment notification
- Sends real-time notification to admin
- Logs payment details

## Real-Time Subscriptions

### Customer Subscriptions
```typescript
// Listen for messages in conversation
supabase
  .from('messages')
  .on('INSERT', (payload) => {
    // New message received
  })
  .subscribe();

// Listen for braider location updates
supabase
  .from('location_tracking')
  .on('INSERT', (payload) => {
    // Braider location updated
  })
  .subscribe();

// Listen for admin joining conversation
supabase
  .from('conversations')
  .on('UPDATE', (payload) => {
    // Admin joined conversation
  })
  .subscribe();
```

### Braider Subscriptions
```typescript
// Listen for messages in conversation
supabase
  .from('messages')
  .on('INSERT', (payload) => {
    // New message received
  })
  .subscribe();

// Listen for customer location (if shared)
supabase
  .from('location_tracking')
  .on('INSERT', (payload) => {
    // Customer location updated
  })
  .subscribe();

// Listen for admin joining conversation
supabase
  .from('conversations')
  .on('UPDATE', (payload) => {
    // Admin joined conversation
  })
  .subscribe();
```

### Admin Subscriptions
```typescript
// Listen for all messages
supabase
  .from('messages')
  .on('INSERT', (payload) => {
    // New message in any conversation
  })
  .subscribe();

// Listen for all location updates
supabase
  .from('location_tracking')
  .on('INSERT', (payload) => {
    // Braider location updated
  })
  .subscribe();

// Listen for payment notifications
supabase
  .from('payment_notifications')
  .on('INSERT', (payload) => {
    // New payment received
  })
  .subscribe();

// Listen for conversation updates
supabase
  .from('conversations')
  .on('UPDATE', (payload) => {
    // Conversation status changed
  })
  .subscribe();
```

## UI Components

### Customer Chat Component
- Location: `/app/(customer)/messages/[booking_id]/page.tsx`
- Shows conversation with braider
- Shows braider location on map
- Shows when admin joined
- Allows sending messages and sharing location

### Braider Chat Component
- Location: `/app/(braider)/braider/messages/[booking_id]/page.tsx`
- Shows conversation with customer
- Shows customer location (if shared)
- Shows when admin joined
- Allows sending messages and sharing location
- Allows sharing real-time GPS location

### Braider Location Sharing Component
- Location: `/app/(braider)/braider/location/page.tsx`
- Toggle to start/stop sharing location
- Shows current location
- Shows location history
- Shows who can see location

### Admin Dashboard Component
- Location: `/app/(admin)/admin/monitoring/page.tsx`
- Shows all active bookings
- Shows all conversations
- Shows all braider locations on map
- Shows payment notifications
- Allows joining any conversation
- Allows viewing location history

### Admin Conversation Monitor Component
- Location: `/app/(admin)/admin/conversations/[id]/page.tsx`
- Shows full conversation
- Shows braider location on map
- Shows customer location (if shared)
- Allows sending messages as admin
- Allows viewing location history

### Maps Component
- Location: `/app/components/RealtimeMap.tsx`
- Shows braider location
- Shows customer location (if shared)
- Shows route/path
- Updates in real-time
- Shows location accuracy

## Chat Initiation Flow

### When Chat Starts
1. **Booking Confirmed** (Payment completed)
   - Conversation created automatically
   - Customer can see "Chat with Braider" button
   - Braider can see "Chat with Customer" button

2. **Customer Opens Chat**
   - Conversation loads
   - Messages load
   - Real-time subscription starts
   - Can see braider's location (if shared)

3. **Braider Opens Chat**
   - Conversation loads
   - Messages load
   - Real-time subscription starts
   - Can see customer's location (if shared)
   - Can enable location sharing

## Location Sharing Flow

### Braider Shares Location
1. Braider clicks "Share Location" button
2. Browser requests GPS permission
3. Location sent to server every 10 seconds
4. Stored in location_tracking table
5. Real-time update sent to customer and admin
6. Map updates in real-time

### Customer Views Location
1. Customer opens chat
2. Map shows braider's current location
3. Map updates in real-time
4. Can see location history
5. Can see estimated arrival time

## Admin Monitoring Flow

### Admin Joins Conversation
1. Admin opens admin dashboard
2. Admin clicks "Monitor" on booking
3. Admin joins conversation
4. Conversation updated with admin_id
5. Customer and braider notified
6. Admin can see full conversation
7. Admin can see both locations
8. Admin can send messages

### Admin Views Payment
1. Payment made by customer
2. Stripe webhook triggered
3. Payment notification created
4. Admin notified in real-time
5. Admin can see payment details
6. Admin can see booking details
7. Admin can see conversation

## Payment Notification Flow

### Payment Made
1. Customer completes payment
2. Stripe webhook called
3. Booking status updated to "confirmed"
4. Conversation created
5. Payment notification created
6. Admin notified in real-time
7. Admin can see payment in dashboard

### Admin Notification
- Real-time notification in admin dashboard
- Shows payment amount
- Shows customer name
- Shows braider name
- Shows booking details
- Allows clicking to view conversation

## Security & Permissions

### Customer Permissions
- Can send messages in their conversation
- Can view braider's location (if shared)
- Can share their own location
- Cannot view other conversations
- Cannot access admin features

### Braider Permissions
- Can send messages in their conversation
- Can share their location
- Can view customer's location (if shared)
- Cannot view other conversations
- Cannot access admin features

### Admin Permissions
- Can view all conversations
- Can view all locations
- Can join any conversation
- Can send messages in any conversation
- Can view payment notifications
- Can view all bookings
- Can view location history
- Cannot delete messages or conversations

## Real-Time Update Latency

- Message delivery: < 500ms
- Location update: < 2 seconds
- Admin notification: < 1 second
- Map update: < 1 second

## Scalability Considerations

- Location tracking: Store every 10 seconds (6 per minute, 360 per hour)
- Message storage: Unlimited
- Conversation storage: One per booking
- Admin access logs: Unlimited
- Payment notifications: One per payment

## Error Handling

- GPS unavailable: Show error, allow manual location entry
- Network error: Queue messages, retry on reconnect
- Permission denied: Show permission request
- Admin access denied: Show error message
- Conversation not found: Redirect to dashboard

## Performance Optimizations

- Paginate messages (20 per page)
- Cache location data (latest only)
- Index conversations by booking_id
- Index messages by conversation_id
- Index location_tracking by booking_id
- Real-time subscriptions only for active conversations
