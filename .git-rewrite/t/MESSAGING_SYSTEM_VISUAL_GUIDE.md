# Messaging & Admin Monitoring System - Visual Guide

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE BOOKING JOURNEY                     │
└─────────────────────────────────────────────────────────────────┘

CUSTOMER JOURNEY:
1. Browse & Book
   ├─ Customer sees braiders
   ├─ Customer books braider
   └─ Customer pays

2. Chat Becomes Available
   ├─ Payment confirmed
   ├─ Conversation created
   ├─ "Chat with Braider" button appears
   └─ Customer can send first message

3. View Braider Location
   ├─ Customer opens chat
   ├─ Map shows braider's location
   ├─ Location updates in real-time
   └─ Customer sees estimated arrival

4. Share Own Location
   ├─ Customer clicks "Share Location"
   ├─ GPS permission requested
   ├─ Location sent to braider
   └─ Braider can see customer on map

5. Chat During Service
   ├─ Customer and braider chat
   ├─ Both see messages in real-time
   ├─ Can see typing indicators
   └─ Can see read receipts

6. Service Complete
   ├─ Braider marks complete
   ├─ Location sharing stops
   ├─ Chat remains available
   └─ Conversation archived

BRAIDER JOURNEY:
1. Receive Booking
   ├─ Customer books braider
   ├─ Braider notified
   └─ Braider sees booking

2. Chat Becomes Available
   ├─ Customer pays
   ├─ Conversation created
   ├─ "Chat with Customer" button appears
   └─ Braider can send first message

3. Share Location
   ├─ Braider clicks "Share Location"
   ├─ GPS permission requested
   ├─ Location sent every 10 seconds
   └─ Customer can see on map

4. View Customer Location
   ├─ Customer shares location
   ├─ Braider sees on map
   ├─ Can see estimated travel time
   └─ Can navigate to customer

5. Chat During Service
   ├─ Braider and customer chat
   ├─ Both see messages in real-time
   ├─ Can see typing indicators
   └─ Can see read receipts

6. Complete Service
   ├─ Braider marks complete
   ├─ Location sharing stops
   ├─ Chat remains available
   └─ Conversation archived

ADMIN JOURNEY:
1. Monitor Dashboard
   ├─ Admin opens dashboard
   ├─ Sees all active bookings
   ├─ Sees all conversations
   ├─ Sees all braider locations
   └─ Sees payment notifications

2. Receive Payment Notification
   ├─ Customer makes payment
   ├─ Admin notified in real-time
   ├─ Shows payment amount
   ├─ Shows customer and braider names
   └─ Can click to view conversation

3. Monitor Conversation
   ├─ Admin clicks "Monitor"
   ├─ Admin joins conversation
   ├─ Customer and braider notified
   ├─ Admin can see full chat
   └─ Admin can send messages

4. View Locations
   ├─ Admin sees all braiders on map
   ├─ Can see customer locations
   ├─ Can see booking details
   ├─ Can view location history
   └─ Can see estimated arrival times

5. Help Resolve Issues
   ├─ Admin sends message
   ├─ Both customer and braider see
   ├─ Admin can provide guidance
   └─ Admin can resolve disputes

6. Leave Conversation
   ├─ Admin clicks "Leave"
   ├─ Admin removed from conversation
   ├─ Customer and braider notified
   └─ Conversation continues without admin
```

## Chat Interface Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                      CHAT INTERFACE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ← Back    Chat with Braider    [Admin joined]                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    MAP SECTION                          │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │                                                   │  │   │
│  │  │  📍 Braider Location                             │  │   │
│  │  │  Accuracy: ±5m                                   │  │   │
│  │  │  ETA: 5 minutes                                  │  │   │
│  │  │                                                   │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  MESSAGES SECTION                       │   │
│  │                                                         │   │
│  │  [10:30] Braider: I'm on my way! ✓✓                   │   │
│  │  [10:31] You: Great! I'm at home                       │   │
│  │  [10:32] Braider: I can see your location             │   │
│  │  [10:33] Braider: typing...                           │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📍 Share Location  [Message Input]  [Send]            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Admin Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ACTIVE BOOKINGS: 12  CONVERSATIONS: 12  PAYMENTS: 3    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    MAP SECTION                           │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │                                                    │  │  │
│  │  │  📍 Braider 1 (In Service)                        │  │  │
│  │  │  📍 Braider 2 (In Service)                        │  │  │
│  │  │  📍 Braider 3 (Available)                         │  │  │
│  │  │  👤 Customer 1 (Shared Location)                  │  │  │
│  │  │  👤 Customer 2 (Shared Location)                  │  │  │
│  │  │                                                    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PAYMENT NOTIFICATIONS:                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 💰 $50.00 - John (Customer) → Jane (Braider)  [Monitor] │  │
│  │ 💰 $75.00 - Sarah (Customer) → Mike (Braider) [Monitor] │  │
│  │ 💰 $60.00 - Lisa (Customer) → Emma (Braider)  [Monitor] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CONVERSATIONS:                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ John ↔ Jane (In Progress)              [Monitor] [View] │  │
│  │ Sarah ↔ Mike (In Progress)             [Monitor] [View] │  │
│  │ Lisa ↔ Emma (In Progress)              [Monitor] [View] │  │
│  │ Tom ↔ Alex (Completed)                 [Monitor] [View] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Real-Time Update Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   REAL-TIME UPDATE FLOW                         │
└─────────────────────────────────────────────────────────────────┘

MESSAGE SENT:
Customer sends message
  ↓
Message stored in database
  ↓
Real-time event triggered
  ↓
Braider receives message (< 500ms)
  ↓
Admin receives message (< 500ms)
  ↓
All see message in real-time

LOCATION UPDATED:
Braider GPS updates
  ↓
Location sent to server
  ↓
Location stored in database
  ↓
Real-time event triggered
  ↓
Customer sees location update (< 2 seconds)
  ↓
Admin sees location update (< 2 seconds)
  ↓
Map updates in real-time

PAYMENT MADE:
Customer completes payment
  ↓
Stripe webhook triggered
  ↓
Payment notification created
  ↓
Real-time event triggered
  ↓
Admin notified (< 1 second)
  ↓
Admin sees notification in dashboard

ADMIN JOINS:
Admin clicks "Monitor"
  ↓
Admin added to conversation
  ↓
Conversation updated in database
  ↓
Real-time event triggered
  ↓
Customer notified (< 500ms)
  ↓
Braider notified (< 500ms)
  ↓
All see "Admin joined" message
```

## Location Tracking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  LOCATION TRACKING FLOW                         │
└─────────────────────────────────────────────────────────────────┘

BRAIDER ENABLES LOCATION SHARING:
1. Braider clicks "Share Location"
2. Browser requests GPS permission
3. GPS permission granted
4. Location captured every 10 seconds
5. Location sent to server
6. Location stored in database
7. Real-time update sent to customer
8. Real-time update sent to admin
9. Map updates with new location
10. Repeat every 10 seconds

CUSTOMER VIEWS LOCATION:
1. Customer opens chat
2. Map component loads
3. Fetches latest braider location
4. Displays location on map
5. Subscribes to location updates
6. Map updates in real-time
7. Shows estimated arrival time
8. Shows location accuracy
9. Shows speed and heading

ADMIN VIEWS ALL LOCATIONS:
1. Admin opens dashboard
2. Map component loads
3. Fetches all active braider locations
4. Fetches all shared customer locations
5. Displays all locations on map
6. Subscribes to all location updates
7. Map updates in real-time
8. Shows booking details on click
9. Can view location history
```

## Payment Notification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│               PAYMENT NOTIFICATION FLOW                         │
└─────────────────────────────────────────────────────────────────┘

CUSTOMER MAKES PAYMENT:
1. Customer enters card details
2. Customer clicks "Pay"
3. Payment sent to Stripe
4. Stripe processes payment
5. Stripe sends webhook
6. Webhook received by server
7. Payment notification created
8. Real-time event triggered
9. Admin notified in real-time
10. Admin sees notification in dashboard
11. Admin can click to view conversation
12. Admin can see booking details
13. Admin can see payment details
14. Admin can monitor service
```

## Database Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                  DATABASE RELATIONSHIPS                         │
└─────────────────────────────────────────────────────────────────┘

bookings
  ├─ customer_id → auth.users
  ├─ braider_id → auth.users
  └─ id → conversations (booking_id)
       └─ id → messages (conversation_id)
       └─ id → location_tracking (booking_id)
       └─ id → payment_notifications (booking_id)

conversations
  ├─ customer_id → auth.users
  ├─ braider_id → auth.users
  ├─ admin_id → auth.users (nullable)
  ├─ booking_id → bookings
  └─ id → messages (conversation_id)
  └─ id → admin_access_logs (conversation_id)

messages
  ├─ conversation_id → conversations
  ├─ sender_id → auth.users
  └─ metadata (JSON for location, images, etc.)

location_tracking
  ├─ booking_id → bookings
  ├─ braider_id → auth.users
  └─ GPS coordinates (latitude, longitude)

payment_notifications
  ├─ booking_id → bookings
  ├─ payment_id → payments
  ├─ admin_id → auth.users
  ├─ customer_id → auth.users
  └─ braider_id → auth.users

admin_access_logs
  ├─ admin_id → auth.users
  ├─ conversation_id → conversations
  └─ action (joined, left, viewed_location)
```

## Performance Targets

```
┌─────────────────────────────────────────────────────────────────┐
│                  PERFORMANCE TARGETS                            │
└─────────────────────────────────────────────────────────────────┘

Message Delivery:        < 500ms
Location Update:        < 2 seconds
Admin Notification:     < 1 second
Map Update:             < 1 second
Page Load:              < 2 seconds
Chat Load:              < 1 second
Dashboard Load:         < 2 seconds

Location Update Frequency: Every 10 seconds
Message Pagination:     20 messages per page
Location History:       30 days retention
Message Retention:      Indefinite
```

## Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY MODEL                               │
└─────────────────────────────────────────────────────────────────┘

CUSTOMER PERMISSIONS:
✓ Send messages in their conversation
✓ View braider's location (if shared)
✓ Share their own location
✗ View other conversations
✗ Access admin features

BRAIDER PERMISSIONS:
✓ Send messages in their conversation
✓ Share their location
✓ View customer's location (if shared)
✗ View other conversations
✗ Access admin features

ADMIN PERMISSIONS:
✓ View all conversations
✓ View all locations
✓ Join any conversation
✓ Send messages in any conversation
✓ View payment notifications
✓ View all bookings
✓ View location history
✗ Delete messages or conversations
✗ Modify user data
```
