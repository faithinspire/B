# Quick Messaging & Maps Test - 5 Minutes

## Prerequisites
- ✅ Admin page working
- ✅ Braiders visible
- ✅ RLS disabled
- ✅ Supabase connected

## Test Flow

### Step 1: Create Test Accounts (1 min)
1. Sign up as Customer: `customer@test.com`
2. Sign up as Braider: `braider@test.com`
3. Verify both accounts created in admin panel

### Step 2: Create Booking (1 min)
1. Login as customer
2. Go to `/search` → Find braider
3. Click "Book Now"
4. Complete booking form
5. Submit booking

### Step 3: Accept Booking (1 min)
1. Login as braider
2. Go to `/braider/bookings`
3. Find customer booking
4. Click "Accept"
5. Booking status changes to "confirmed"

### Step 4: Test Messaging (1 min)
1. **Customer sends message:**
   - Go to `/messages/[booking_id]`
   - Type: "Hi, can you come tomorrow?"
   - Click Send
   - ✅ Message appears immediately

2. **Braider receives message:**
   - Login as braider
   - Go to `/braider/messages/[booking_id]`
   - ✅ Message appears in real-time
   - Type: "Yes, I'll be there at 2pm"
   - Click Send

3. **Customer receives message:**
   - Switch to customer window
   - ✅ Message appears in real-time
   - ✅ Both messages in conversation

### Step 5: Test Location Sharing (1 min)
1. **Braider shares location:**
   - In braider chat, click "Share Location"
   - ✅ Browser asks for permission
   - ✅ Click "Allow"
   - ✅ Button changes to "Stop Sharing"

2. **Customer sees location:**
   - In customer chat, look at map on right
   - ✅ Purple marker shows braider
   - ✅ Blue marker shows customer
   - ✅ Route line connects them
   - ✅ Distance and ETA shown

## Expected Results

| Feature | Status | Notes |
|---------|--------|-------|
| Customer → Braider message | ✅ | Real-time sync |
| Braider → Customer message | ✅ | Real-time sync |
| Message history | ✅ | Persists on refresh |
| Location sharing | ✅ | Updates every 10s |
| Map display | ✅ | Google Maps or fallback |
| Distance calculation | ✅ | Haversine formula |
| Real-time updates | ✅ | Supabase Realtime |

## Troubleshooting

### Messages not appearing
```
1. Check browser console (F12)
2. Look for errors in Network tab
3. Verify conversation_id is correct
4. Check Supabase connection
```

### Map not showing
```
1. Check if Google Maps API key is set
2. Verify API key has Maps JavaScript API enabled
3. Check browser console for errors
4. Fallback coordinate display should work
```

### Location not updating
```
1. Check browser geolocation permission
2. Verify "Share Location" button is active
3. Check network connectivity
4. Verify booking_id is correct
```

## Success Criteria

✅ All 5 steps complete without errors
✅ Messages sync in real-time
✅ Location updates on map
✅ No console errors
✅ Both users see same data

---

**Time:** 5 minutes
**Difficulty:** Easy
**Status:** Ready to test
