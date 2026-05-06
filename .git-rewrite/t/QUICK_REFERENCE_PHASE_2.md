# Quick Reference - Phase 2 Features

## New Features at a Glance

### 1. Real Braider Visibility
- Braiders auto-appear on landing page after signup
- No additional steps needed
- Customers can see all registered braiders

### 2. Messaging System
- **Customer**: `/messages` - Message braiders
- **Braider**: `/braider/messages` - Message customers
- Real-time message sync
- Unread badge on bottom nav

### 3. Image Upload
- Upload portfolio images (JPEG, PNG, WebP, GIF)
- Max 5MB, auto-compressed
- Displays in portfolio grid
- Persists in localStorage

### 4. Enhanced Bottom Nav
- 5 tabs: Home, Browse, Favorites, Messages, Profile
- Messages tab shows unread count
- Mobile only (hidden on desktop)

## Quick Test Checklist

```
□ Register braider
□ Verify braider on landing page
□ Upload portfolio image
□ Send message as customer
□ Reply as braider
□ Check unread badge
□ Test on mobile (375px)
□ Test on tablet (768px)
□ Test on desktop (1024px)
□ Refresh page - data persists
```

## File Locations

### New Files
- `store/messageStore.ts` - Messaging
- `lib/imageUpload.ts` - Image upload
- `app/(customer)/messages/page.tsx` - Customer messages
- `app/(braider)/braider/messages/page.tsx` - Braider messages

### Modified Files
- `app/(public)/signup/braider/page.tsx` - Auto-create profile
- `app/(public)/page.tsx` - Show real braiders
- `app/components/BottomNav.tsx` - Add messages tab

## Key Functions

### Messaging
```typescript
// Send message
sendMessage(senderId, senderName, receiverId, receiverName, content)

// Get conversations
getConversations(userId)

// Get conversation messages
getConversation(userId1, userId2)

// Get unread count
getUnreadCount(userId)
```

### Image Upload
```typescript
// Validate image
validateImageFile(file)

// Upload image
uploadImageToCloud(file)

// Compress image
compressImage(file, quality)

// Generate thumbnail
generateThumbnail(file, size)
```

## Data Storage

### localStorage Keys
```
auth_user - Current user
braider-profile-store - Braider profiles
message-store - Messages & conversations
my_bookings_${id} - Customer bookings
bookings_${id} - Braider bookings
favorites_${id} - Favorite braiders
transactions_${id} - Payout transactions
```

## Common Tasks

### Register Braider
1. Go to `/signup/braider`
2. Fill 4 steps
3. Click "Complete Signup"
4. Profile auto-created
5. Appears on landing page

### Send Message
1. Go to `/messages` (customer) or `/braider/messages` (braider)
2. Select conversation or create new
3. Type message
4. Click send
5. Message appears instantly

### Upload Portfolio
1. Go to `/braider/portfolio`
2. Click "Add Portfolio Item"
3. Select image
4. Fill title, style, description
5. Click "Add Item"
6. Image appears in grid

### Check Messages
1. Look at bottom nav
2. Messages tab shows unread count
3. Click to open messages
4. See all conversations
5. Click to read messages

## Troubleshooting

### Braider not showing on landing page
- Verify braider signup completed
- Check localStorage for profile
- Refresh page
- Check browser console for errors

### Message not sending
- Check internet connection
- Verify recipient exists
- Check localStorage for messages
- Try refreshing page

### Image not uploading
- Check file type (JPEG, PNG, WebP, GIF)
- Check file size (max 5MB)
- Check browser console for errors
- Try different image

### Bottom nav not showing
- Check screen size (mobile only)
- Resize to 375px width
- Check if on auth page (hidden there)
- Refresh page

## Performance Tips

- Clear browser cache if app feels slow
- Use incognito mode for testing
- Check localStorage size (DevTools > Application)
- Test on different devices
- Monitor console for errors

## Next Steps

1. **Test Phase 2**: Follow `PHASE_2_TESTING_GUIDE.md`
2. **Report Issues**: Check console for errors
3. **Prepare Phase 3**: Payment integration coming next
4. **Deploy**: When ready for production

## Support

- **Testing Guide**: `PHASE_2_TESTING_GUIDE.md`
- **Implementation**: `PHASE_2_IMPLEMENTATION.md`
- **Complete Info**: `PHASE_2_COMPLETE.md`
- **Architecture**: `APP_STRUCTURE_OVERVIEW.md`

## Status

✅ Phase 2 Complete
- Real braider visibility
- Messaging system
- Image upload
- Enhanced navigation
- All features working

⏳ Phase 3 Next
- Payment integration
- Cloud storage
- Email notifications
- SMS notifications

---

**Ready to test?** Start with the testing guide!

**Questions?** Check the documentation files.

**Good luck! 🚀**
