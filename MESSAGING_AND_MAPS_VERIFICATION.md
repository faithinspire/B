# Messaging & Maps System - Complete Verification

## System Overview

### ✅ Messaging System
- **Customer → Braider:** Messages sent via `/api/messages/send`
- **Braider → Customer:** Messages sent via `/api/messages/send`
- **Real-time:** Supabase Realtime subscriptions on `messages` table
- **Notifications:** Auto-sent to receiver when message arrives

### ✅ Location Tracking & Maps
- **Braider Location Sharing:** Braider can toggle location sharing in chat
- **Customer Location:** Auto-fetched via browser geolocation
- **Real-time Updates:** Location updates every 10 seconds
- **Maps Display:**
  - Google Maps with directions
  - Fallback to coordinate display if no API key
  - Distance calculation via Haversine formula
  - Satellite/Map toggle

## Testing Checklist

### 1. Customer → Braider Messaging

**Setup:**
1. Create customer account
2. Create braider account
3. Customer books braider service
4. Booking accepted by braider

**Test:**
1. Go to `/messages/[booking_id]` as customer
2. Type message: "Hello, can you come at 2pm?"
3. Click Send
4. ✅ Message appears in chat
5. ✅ Message shows as sent (check icon)
6. ✅ Braider receives notification

**Expected:**
- Message appears immediately in customer chat
- Braider sees message in real-time
- Timestamp shows correct time
- Read status updates when braider reads

### 2. Braider → Customer Messaging

**Setup:**
- Same booking as above

**Test:**
1. Go to `/braider/messages/[booking_id]` as braider
2. Type message: "I'll be there at 2pm"
3. Click Send
4. ✅ Message appears in braider chat
5. ✅ Customer receives notification
6. ✅ Message appears in customer chat

**Expected:**
- Message appears immediately in braider chat
- Customer sees message in real-time
- Conversation history preserved
- Both sides see same message thread

### 3. Location Sharing - Braider

**Setup:**
- Active booking with conversation

**Test:**
1. Go to `/braider/messages/[booking_id]`
2. Click "Share Location" button
3. ✅ Browser requests location permission
4. ✅ Button changes to "Stop Sharing"
5. ✅ Green indicator shows location is live
6. ✅ Customer sees braider location on map

**Expected:**
- Location updates every 10 seconds
- Map shows braider position (purple marker)
- Distance and ETA calculated
- Accuracy shown in coordinates

### 4. Location Display - Customer

**Setup:**
- Braider is sharing location

**Test:**
1. Go to `/messages/[booking_id]` as customer
2. ✅ Map shows on right side
3. ✅ Purple marker shows braider location
4. ✅ Blue marker shows customer location
5. ✅ Route line connects both
6. ✅ Distance and ETA displayed

**Expected:**
- Map updates in real-time
- Distance in km and miles
- ETA in minutes
- Satellite/Map toggle works
- Zoom/pan works

### 5. Real-time Message Sync

**Setup:**
- Two browser windows open
- One as customer, one as braider
- Same booking

**Test:**
1. Customer sends message in window 1
2. ✅ Message appears immediately in window 1
3. ✅ Message appears immediately in window 2 (braider)
4. Braider sends message in window 2
5. ✅ Message appears immediately in window 2
6. ✅ Message appears immediately in window 1 (customer)

**Expected:**
- No page refresh needed
- Messages sync within 1 second
- Conversation history preserved
- Read status updates

### 6. Location Real-time Sync

**Setup:**
- Braider sharing location
- Customer viewing map

**Test:**
1. Braider moves (simulate with GPS)
2. ✅ Customer map updates within 10 seconds
3. ✅ Distance recalculates
4. ✅ ETA updates
5. Braider stops sharing
6. ✅ Map shows "Location not shared"

**Expected:**
- Smooth location updates
- No lag in map display
- Accurate distance calculation
- Graceful fallback when location stops

### 7. Conversation History

**Setup:**
- Multiple messages exchanged

**Test:**
1. Refresh page
2. ✅ All previous messages still visible
3. ✅ Messages in correct order
4. ✅ Timestamps preserved
5. ✅ Read status preserved

**Expected:**
- Messages load from database
- Conversation history complete
- No messages lost
- Correct chronological order

### 8. Error Handling

**Test Cases:**
1. Send message with no text
   - ✅ Send button disabled
2. Send message while offline
   - ✅ Error message shown
   - ✅ Can retry when online
3. Location permission denied
   - ✅ Error message shown
   - ✅ Can retry
4. No conversation found
   - ✅ Error message shown
   - ✅ Back button works

**Expected:**
- Graceful error messages
- No crashes
- Clear user guidance
- Ability to recover

## Database Tables

### messages
```sql
- id (uuid)
- conversation_id (uuid)
- sender_id (uuid)
- sender_role (text: customer/braider/admin)
- content (text)
- read/is_read (boolean)
- created_at (timestamp)
```

### conversations
```sql
- id (uuid)
- booking_id (uuid)
- customer_id (uuid)
- braider_id (uuid)
- admin_id (uuid, nullable)
- status (text)
- created_at (timestamp)
```

### location_tracking
```sql
- id (uuid)
- booking_id (uuid)
- latitude (float)
- longitude (float)
- accuracy (float)
- created_at (timestamp)
```

## API Endpoints

### Messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/conversation/[id]` - Get conversation messages

### Conversations
- `GET /api/conversations` - List user conversations
- `GET /api/conversations/[id]` - Get conversation details

### Location
- `POST /api/location/track` - Update location
- `GET /api/location/braider/[id]` - Get braider location
- `GET /api/location/history/[booking_id]` - Get location history

## Troubleshooting

### Messages not appearing
1. Check browser console for errors
2. Verify conversation exists
3. Check Supabase RLS policies
4. Verify user is part of conversation

### Map not loading
1. Check Google Maps API key in `.env.local`
2. Verify API key has Maps JavaScript API enabled
3. Check browser console for errors
4. Fallback to coordinate display works

### Location not updating
1. Check browser geolocation permission
2. Verify location tracking is enabled
3. Check network connectivity
4. Verify booking_id is correct

### Real-time not working
1. Check Supabase connection
2. Verify Realtime is enabled in Supabase
3. Check browser console for subscription errors
4. Verify table names match

## Performance Notes

- Messages load last 100 by default
- Location updates every 10 seconds
- Map updates in real-time via Supabase
- Haversine distance calculated client-side
- Google Directions API used for routes

## Security

- Messages verified by sender_id and conversation membership
- Location only visible to conversation participants
- Admin can view all conversations
- RLS policies enforce access control
- Service role key used for API endpoints

---

**Status:** ✅ Complete and tested
**Last Updated:** April 9, 2026
