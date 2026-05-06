# Braider Pages - Testing Guide

## Quick Testing Checklist

### 1. Services Page (`/braider/services`)
**Mobile Test (320px)**
- [ ] Page loads without errors
- [ ] "Add Service" button is responsive and clickable
- [ ] Form fields are properly sized for mobile
- [ ] Service list displays in single column
- [ ] Delete button works with confirmation
- [ ] Success/error messages display properly

**Desktop Test (1024px+)**
- [ ] Page layout is clean and organized
- [ ] Form is properly formatted
- [ ] Service list displays with proper spacing
- [ ] All buttons are easily clickable

**Functionality**
- [ ] Add new service with all fields
- [ ] Delete service with confirmation
- [ ] Error handling for missing fields
- [ ] Success message after adding service

### 2. Dashboard Page (`/braider/dashboard`)
**Mobile Test (320px)**
- [ ] Stats cards stack vertically
- [ ] Avatar upload button is accessible
- [ ] Profile photo displays correctly
- [ ] Quick action cards are responsive
- [ ] Text sizes are readable

**Desktop Test (1024px+)**
- [ ] Stats cards display in grid (2-4 columns)
- [ ] Avatar section is properly sized
- [ ] Profile info displays in columns
- [ ] All elements have proper spacing

**Functionality**
- [ ] Upload avatar image
- [ ] Avatar preview shows before upload
- [ ] Error handling for invalid files
- [ ] Remove avatar button works
- [ ] Profile info displays correctly

### 3. Portfolio Page (`/braider/portfolio`)
**Mobile Test (320px)**
- [ ] "Add Portfolio Item" button is responsive
- [ ] Image upload area is accessible
- [ ] Image previews display in 2-column grid
- [ ] Portfolio items display in single column
- [ ] Delete button is easily clickable

**Desktop Test (1024px+)**
- [ ] Image upload area is properly sized
- [ ] Image previews display in 4-column grid
- [ ] Portfolio items display in 3-column grid
- [ ] All elements have proper spacing

**Functionality**
- [ ] Upload multiple images
- [ ] Image validation works
- [ ] Add portfolio item with all fields
- [ ] Delete portfolio item with confirmation
- [ ] Error handling for missing fields

### 4. Wallet Page (`/braider/wallet`)
**Mobile Test (320px)**
- [ ] Stats cards stack vertically
- [ ] "Request Payout" button is responsive
- [ ] Form fields are properly sized
- [ ] Transaction list displays in single column
- [ ] All text is readable

**Desktop Test (1024px+)**
- [ ] Stats cards display in 3-column grid
- [ ] Form is properly formatted
- [ ] Transaction list displays with proper spacing
- [ ] All elements are well-organized

**Functionality**
- [ ] Display available balance, earnings, payouts
- [ ] Request payout with validation
- [ ] Error handling for insufficient balance
- [ ] Transaction history displays correctly
- [ ] Success message after payout request

### 5. Calendar Page (`/braider/calendar`)
**Mobile Test (320px)**
- [ ] Calendar displays properly
- [ ] Booking list displays in single column
- [ ] Accept/Decline buttons are responsive
- [ ] Booking details are readable
- [ ] Navigation arrows work

**Desktop Test (1024px+)**
- [ ] Calendar displays on left side
- [ ] Booking list displays on right side
- [ ] All elements have proper spacing
- [ ] Layout is clean and organized

**Functionality**
- [ ] Calendar navigation works (prev/next month)
- [ ] Bookings display with correct dates
- [ ] Accept booking action works
- [ ] Decline booking action works
- [ ] Booking details display correctly

### 6. Messages Page (`/braider/messages`)
**Mobile Test (320px)**
- [ ] Conversation list displays properly
- [ ] Chat area is accessible
- [ ] Message input is responsive
- [ ] Messages display correctly
- [ ] Back button works

**Desktop Test (1024px+)**
- [ ] Conversation list displays on left
- [ ] Chat area displays on right
- [ ] All elements have proper spacing
- [ ] Layout is clean and organized

**Functionality**
- [ ] Search conversations works
- [ ] Send message works
- [ ] Message history displays
- [ ] Conversation selection works
- [ ] Unread count displays

### 7. Verify Page (`/braider/verify`)
**Mobile Test (320px)**
- [ ] Content displays properly
- [ ] Buttons are responsive
- [ ] Text is readable
- [ ] All sections are accessible

**Desktop Test (1024px+)**
- [ ] Layout is clean and organized
- [ ] All elements have proper spacing
- [ ] Buttons are easily clickable

## Error Scenarios to Test

### Services Page
- [ ] Try adding service without name
- [ ] Try adding service without price
- [ ] Try deleting service (should show confirmation)
- [ ] Network error handling

### Dashboard
- [ ] Try uploading non-image file
- [ ] Try uploading file > 5MB
- [ ] Network error during upload
- [ ] Profile loading error

### Portfolio
- [ ] Try uploading > 10 images
- [ ] Try uploading invalid file type
- [ ] Network error during upload
- [ ] Portfolio loading error

### Wallet
- [ ] Try requesting payout > available balance
- [ ] Try requesting payout without bank account
- [ ] Network error during payout request
- [ ] Transaction loading error

### Calendar
- [ ] Try accepting/declining booking
- [ ] Network error during booking action
- [ ] Booking loading error

### Messages
- [ ] Try sending empty message
- [ ] Network error during send
- [ ] Conversation loading error

## Performance Testing

- [ ] Page load time < 3 seconds
- [ ] Images load quickly
- [ ] Smooth scrolling on mobile
- [ ] No layout shifts
- [ ] Responsive to user interactions

## Accessibility Testing

- [ ] All buttons have proper contrast
- [ ] Text is readable (min 16px on mobile)
- [ ] Form labels are clear
- [ ] Error messages are visible
- [ ] Touch targets are adequate (min 44px)

## Browser Testing

- [ ] Chrome (mobile & desktop)
- [ ] Safari (mobile & desktop)
- [ ] Firefox (mobile & desktop)
- [ ] Edge (desktop)

## Device Testing

- [ ] iPhone SE (375px)
- [ ] iPhone 12 (390px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] iPad (768px)
- [ ] iPad Pro (1024px)
- [ ] Desktop (1920px)

## Network Testing

- [ ] Test on 4G
- [ ] Test on 3G
- [ ] Test with slow network simulation
- [ ] Test with offline mode

## Notes

- All pages should work without localStorage
- All data should persist in Supabase
- All pages should be fully responsive
- All error messages should be clear
- All buttons should be touch-friendly
- All forms should have proper validation
