# Testing Guide: Messaging & PWA Fixes

## Part 1: Message Delivery Testing

### Test 1: Customer to Braider Message
1. Log in as **Customer**
2. Go to **Messages** page
3. Select a booking with a braider
4. Type a message: "Test message from customer"
5. Click **Send**
6. **Expected:** Message appears in chat immediately
7. **Verify:** No "Sender not authorized" error

### Test 2: Braider to Customer Message
1. Log in as **Braider**
2. Go to **Messages** page
3. Select a booking with a customer
4. Type a message: "Test message from braider"
5. Click **Send**
6. **Expected:** Message appears in chat immediately
7. **Verify:** No authorization error

### Test 3: Admin Message in Conversation
1. Log in as **Admin**
2. Go to **Admin Dashboard** → **Conversations**
3. Select a conversation
4. Type a message: "Admin message"
5. Click **Send**
6. **Expected:** Message sends successfully
7. **Verify:** Message appears in conversation

### Test 4: Real-time Message Sync
1. Open same conversation in two browser tabs
2. Send message from Tab 1
3. **Expected:** Message appears in Tab 2 within 1 second
4. **Verify:** Real-time Supabase subscription working

---

## Part 2: Maps Integration Testing

### Test 5: Customer View - Braider Location Map
1. Log in as **Customer**
2. Go to **Messages** → Select a booking
3. **Expected:** Right sidebar shows "Braider Location" map
4. Click **MapPin button** in header
5. **Expected:** Map toggles on/off
6. **Verify:** Map shows braider's location (if sharing)

### Test 6: Braider View - Location Sharing
1. Log in as **Braider**
2. Go to **Messages** → Select a booking
3. **Expected:** Right sidebar shows "Share Your Location" button
4. Click **"Share Location"** button
5. **Expected:** Button changes to "Stop Sharing" (red)
6. **Verify:** Location updates every 15 seconds
7. Click **"Stop Sharing"** to disable

### Test 7: Real-time Location Updates
1. Braider clicks **"Share Location"**
2. Customer opens same conversation
3. **Expected:** Customer sees braider location on map
4. Braider moves (simulate with GPS)
5. **Expected:** Customer map updates within 15 seconds
6. **Verify:** Real-time location tracking working

### Test 8: Map Toggle Functionality
1. In any messaging page, click **MapPin button** in header
2. **Expected:** Map appears/disappears
3. Refresh page
4. **Expected:** Map state persists (if using localStorage)
5. **Verify:** Toggle works smoothly

---

## Part 3: PWA Installation Testing

### Test 9: PWA Installation on iPhone (iOS)
**Requirements:** iPhone with Safari, iOS 13.4+

1. Open Safari on iPhone
2. Navigate to your BraidMe URL
3. Tap **Share button** (square with arrow at bottom)
4. Scroll down and tap **"Add to Home Screen"**
5. **Expected:** Modal appears with app name "BraidMe"
6. Tap **"Add"**
7. **Expected:** App icon appears on home screen
8. Tap app icon
9. **Expected:** App opens in full-screen standalone mode
10. **Verify:** No Safari address bar visible
11. **Verify:** Status bar is black/translucent

### Test 10: PWA Installation on Android
**Requirements:** Android phone with Chrome, Android 5.0+

1. Open Chrome on Android
2. Navigate to your BraidMe URL
3. Tap **menu (three dots)** at top right
4. Tap **"Install app"** or **"Add to Home Screen"**
5. **Expected:** Installation dialog appears
6. Tap **"Install"**
7. **Expected:** App icon appears on home screen
8. Tap app icon
9. **Expected:** App opens in full-screen standalone mode
10. **Verify:** No Chrome address bar visible
11. **Verify:** App runs in standalone mode

### Test 11: PWA Offline Functionality
1. Install PWA on device (iOS or Android)
2. Open app and browse some pages
3. Turn off WiFi/Mobile data
4. **Expected:** App still works (cached pages load)
5. Try to send a message
6. **Expected:** Message queues or shows offline indicator
7. Turn WiFi/Mobile data back on
8. **Expected:** Message sends and syncs

### Test 12: PWA App Icon & Splash Screen
1. Install PWA on device
2. Tap app icon to launch
3. **Expected:** Splash screen appears briefly
4. **Expected:** App icon is visible on home screen
5. **Expected:** App name "BraidMe" shows under icon
6. **Verify:** Icon matches manifest configuration

### Test 13: PWA Notifications
1. Install PWA on device
2. Have someone send you a message
3. **Expected:** Push notification appears
4. Tap notification
5. **Expected:** App opens to messaging page
6. **Verify:** Notification system working

---

## Part 4: Cross-Browser Testing

### Test 14: Desktop Browser (Chrome)
1. Open Chrome on desktop
2. Navigate to BraidMe
3. Look for **"Install"** button in address bar
4. Click **"Install"**
5. **Expected:** App installs as desktop app
6. **Verify:** App runs in standalone window

### Test 15: Desktop Browser (Firefox)
1. Open Firefox on desktop
2. Navigate to BraidMe
3. Look for **"Install"** button
4. Click to install
5. **Expected:** App installs as desktop app
6. **Verify:** App runs in standalone window

### Test 16: Desktop Browser (Safari on Mac)
1. Open Safari on Mac
2. Navigate to BraidMe
3. Go to **File** → **Add to Dock**
4. **Expected:** App adds to dock
5. Click dock icon
6. **Expected:** App opens in standalone mode

---

## Part 5: Performance Testing

### Test 17: Message Send Performance
1. Send 10 messages rapidly
2. **Expected:** All messages send within 2 seconds
3. **Verify:** No message loss
4. **Verify:** Messages appear in correct order

### Test 18: Location Update Performance
1. Braider shares location
2. Customer opens conversation
3. **Expected:** Map loads within 2 seconds
4. **Verify:** Location updates smooth (no lag)
5. **Verify:** No excessive API calls

### Test 19: PWA Load Performance
1. Install PWA on device
2. Open app from home screen
3. **Expected:** App loads within 2 seconds
4. **Verify:** Smooth animations
5. **Verify:** No jank or stuttering

---

## Part 6: Error Handling

### Test 20: Network Error Handling
1. Send a message
2. Disconnect internet mid-send
3. **Expected:** Error message appears
4. Reconnect internet
5. **Expected:** Retry option available
6. **Verify:** Message eventually sends

### Test 21: Invalid Conversation
1. Try to access non-existent conversation ID
2. **Expected:** Error message: "No conversation found"
3. **Verify:** Redirect to messages list

### Test 22: Unauthorized Access
1. Try to access another user's conversation directly
2. **Expected:** Access denied or redirect
3. **Verify:** Security working

---

## Verification Checklist

### Messaging
- [ ] Customer can send messages
- [ ] Braider can send messages
- [ ] Admin can send messages
- [ ] No authorization errors
- [ ] Messages sync in real-time
- [ ] Message order is correct
- [ ] Timestamps display correctly

### Maps
- [ ] Braider location map shows in customer chat
- [ ] Customer location map shows in braider chat
- [ ] Map toggle button works
- [ ] Location updates in real-time
- [ ] Map displays correct coordinates
- [ ] Location sharing can be toggled on/off

### PWA
- [ ] Installs on iPhone (Safari)
- [ ] Installs on Android (Chrome)
- [ ] Runs in full-screen standalone mode
- [ ] App icon appears on home screen
- [ ] App name displays correctly
- [ ] Status bar styling correct
- [ ] Offline functionality works
- [ ] Push notifications work
- [ ] App loads quickly

---

## Troubleshooting

### Messages Not Sending
- Check network connection
- Verify conversation exists
- Check browser console for errors
- Try refreshing page
- Clear browser cache

### Maps Not Showing
- Verify location permission granted
- Check if braider is sharing location
- Refresh page
- Check browser console for errors
- Verify Supabase connection

### PWA Not Installing
- Clear browser cache
- Try different browser
- Check manifest.json is valid
- Verify HTTPS connection
- Check browser console for errors
- Try incognito/private mode

### PWA Not Working Offline
- Check Service Worker registration
- Verify pages are cached
- Check browser storage quota
- Try clearing app data
- Reinstall PWA

---

## Success Criteria

✅ All messaging tests pass
✅ All maps tests pass
✅ PWA installs on iOS and Android
✅ PWA runs in standalone mode
✅ No console errors
✅ Performance is smooth
✅ Error handling works correctly

**Once all tests pass, system is ready for production deployment.**
