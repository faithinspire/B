# Braider Pages - Implementation Details

## Architecture Overview

### Store Structure
```
useSupabaseAuthStore
├── user (current user)
├── login()
├── logout()
└── signup()

useSupabaseBraiderStore
├── getProfile(userId)
├── updateProfile(userId, data)
├── addService()
├── removeService()
└── [other braider operations]
```

### Database Schema

#### braider_profiles
```sql
- id (UUID)
- user_id (UUID)
- full_name (text)
- email (text)
- avatar_url (text)
- bio (text)
- experience_years (integer)
- rating_avg (decimal)
- rating_count (integer)
- verification_status (text)
- travel_radius_miles (integer)
- is_mobile (boolean)
- salon_address (text)
- specialties (array)
- total_earnings (decimal)
- available_balance (decimal)
- created_at (timestamp)
- updated_at (timestamp)
```

#### services
```sql
- id (UUID)
- braider_id (UUID)
- name (text)
- description (text)
- price (decimal)
- duration_minutes (integer)
- created_at (timestamp)
- updated_at (timestamp)
```

#### portfolio
```sql
- id (UUID)
- braider_id (UUID)
- image_url (text)
- title (text)
- description (text)
- style (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### bookings
```sql
- id (UUID)
- braider_id (UUID)
- customer_id (UUID)
- customer_name (text)
- service_name (text)
- booking_date (date)
- booking_time (time)
- duration_minutes (integer)
- location (text)
- status (text: pending, confirmed, cancelled)
- notes (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### transactions
```sql
- id (UUID)
- braider_id (UUID)
- type (text: earning, payout)
- description (text)
- amount (decimal)
- status (text: pending, completed, failed)
- created_at (timestamp)
- updated_at (timestamp)
```

#### payouts
```sql
- id (UUID)
- braider_id (UUID)
- amount (decimal)
- bank_account (text)
- status (text: pending, completed, failed)
- created_at (timestamp)
- updated_at (timestamp)
```

## Component Implementation Details

### Services Page

**Key Functions:**
```typescript
loadData() - Load services from Supabase
handleSubmit() - Add new service
handleRemoveService() - Delete service
```

**State Management:**
```typescript
- services: Service[] - List of services
- showForm: boolean - Show/hide form
- loading: boolean - Loading state
- error: string - Error message
- success: boolean - Success message
- formData: FormData - Form input
```

**Supabase Queries:**
```typescript
// Get services
supabase
  .from('services')
  .select('*')
  .eq('braider_id', user.id)
  .order('created_at', { ascending: false })

// Add service
supabase
  .from('services')
  .insert({ braider_id, name, description, price, duration_minutes })
  .select()
  .single()

// Delete service
supabase
  .from('services')
  .delete()
  .eq('id', serviceId)
```

### Dashboard Page

**Key Functions:**
```typescript
loadProfile() - Load profile from Supabase
handleAvatarUpload() - Upload avatar
handleAvatarPreview() - Show preview
```

**State Management:**
```typescript
- profile: Profile - User profile
- profileLoading: boolean - Loading state
- avatarUploading: boolean - Upload state
- avatarPreview: string - Preview URL
- error: string - Error message
```

**Supabase Queries:**
```typescript
// Get profile
supabase
  .from('braider_profiles')
  .select('*')
  .eq('user_id', user.id)
  .single()

// Update profile
supabase
  .from('braider_profiles')
  .upsert({ user_id, avatar_url, ... })
  .select()
  .single()
```

### Portfolio Page

**Key Functions:**
```typescript
loadData() - Load portfolio from Supabase
handleImageSelect() - Handle image upload
removeImage() - Remove image from preview
handleSubmit() - Add portfolio item
handleRemovePortfolioItem() - Delete item
```

**State Management:**
```typescript
- portfolio: PortfolioItem[] - Portfolio items
- showForm: boolean - Show/hide form
- submitting: boolean - Submitting state
- uploadSuccess: boolean - Success message
- formError: string - Error message
- imagePreviews: string[] - Image previews
- uploadingImages: boolean - Upload state
- formData: FormData - Form input
```

**Supabase Queries:**
```typescript
// Get portfolio
supabase
  .from('portfolio')
  .select('*')
  .eq('braider_id', user.id)
  .order('created_at', { ascending: false })

// Add portfolio item
supabase
  .from('portfolio')
  .insert({ braider_id, image_url, title, description, style })
  .select()
  .single()

// Delete portfolio item
supabase
  .from('portfolio')
  .delete()
  .eq('id', itemId)
```

### Wallet Page

**Key Functions:**
```typescript
loadData() - Load wallet data from Supabase
handlePayoutSubmit() - Submit payout request
```

**State Management:**
```typescript
- profile: Profile - User profile
- showPayoutForm: boolean - Show/hide form
- loading: boolean - Loading state
- submitting: boolean - Submitting state
- error: string - Error message
- success: boolean - Success message
- transactions: Transaction[] - Transaction history
- payoutData: PayoutData - Form input
```

**Supabase Queries:**
```typescript
// Get profile
supabase
  .from('braider_profiles')
  .select('*')
  .eq('user_id', user.id)
  .single()

// Get transactions
supabase
  .from('transactions')
  .select('*')
  .eq('braider_id', user.id)
  .order('created_at', { ascending: false })

// Create payout
supabase
  .from('payouts')
  .insert({ braider_id, amount, bank_account, status: 'pending' })
  .select()
  .single()
```

### Calendar Page

**Key Functions:**
```typescript
loadData() - Load bookings from Supabase
handleBookingAction() - Accept/decline booking
getDaysInMonth() - Calculate calendar days
getFirstDayOfMonth() - Get first day
```

**State Management:**
```typescript
- bookings: Booking[] - List of bookings
- currentDate: Date - Current month
- loading: boolean - Loading state
- actionLoading: boolean - Action state
- error: string - Error message
```

**Supabase Queries:**
```typescript
// Get bookings
supabase
  .from('bookings')
  .select('*')
  .eq('braider_id', user.id)
  .order('booking_date', { ascending: true })

// Update booking status
supabase
  .from('bookings')
  .update({ status: newStatus })
  .eq('id', bookingId)
```

### Messages Page

**Key Functions:**
```typescript
handleSendMessage() - Send message
getConversations() - Get user conversations
getConversation() - Get specific conversation
```

**State Management:**
```typescript
- selectedConversation: string - Selected conversation ID
- messageText: string - Message input
- searchQuery: string - Search query
- loading: boolean - Loading state
```

**Store Functions:**
```typescript
getConversations(userId) - Get all conversations
getConversation(userId, otherUserId) - Get messages
sendMessage(senderId, senderName, recipientId, recipientName, content)
```

## Responsive Design Implementation

### Mobile-First Approach

**Base Styles (Mobile)**
```css
/* Default: 320px - 639px */
- text-sm (14px)
- px-4 (16px padding)
- gap-3 (12px gap)
- grid-cols-1 (single column)
- rounded-lg (8px radius)
```

**Tablet Styles (sm:)**
```css
/* 640px - 1023px */
- sm:text-base (16px)
- sm:px-6 (24px padding)
- sm:gap-4 (16px gap)
- sm:grid-cols-2 (two columns)
- sm:rounded-2xl (16px radius)
```

**Desktop Styles (lg:)**
```css
/* 1024px+ */
- text-base (16px)
- px-8 (32px padding)
- gap-6 (24px gap)
- lg:grid-cols-3+ (three+ columns)
- rounded-3xl (24px radius)
```

### Touch-Friendly Design

**Button Sizing**
```css
/* Mobile */
- min-height: 44px
- padding: 12px 16px
- font-size: 14px

/* Desktop */
- min-height: 48px
- padding: 12px 24px
- font-size: 16px
```

**Spacing**
```css
/* Mobile */
- gap between elements: 12px
- padding: 16px

/* Desktop */
- gap between elements: 24px
- padding: 32px
```

## Error Handling Strategy

### Error Types

1. **Network Errors**
   - Display: "Failed to load data"
   - Action: Show retry button

2. **Validation Errors**
   - Display: "Please fill in all required fields"
   - Action: Highlight invalid fields

3. **Permission Errors**
   - Display: "You don't have permission to perform this action"
   - Action: Redirect to appropriate page

4. **Not Found Errors**
   - Display: "Item not found"
   - Action: Show fallback UI

### Error Display

```typescript
// Error Alert Component
<div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
  <p className="text-red-700 text-sm">{error}</p>
</div>
```

## Loading States

### Loading Spinner
```typescript
<div className="text-center">
  <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
  <p className="text-gray-600 font-semibold">Loading...</p>
</div>
```

### Skeleton Loading
- Use placeholder cards
- Show loading animation
- Maintain layout stability

## Success Feedback

### Success Message
```typescript
<div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
  <p className="text-green-700 text-sm">Operation successful!</p>
</div>
```

### Auto-dismiss
- Display for 3 seconds
- Auto-dismiss after timeout
- Allow manual dismiss

## Performance Optimization

### Image Optimization
- Use responsive images
- Lazy load images
- Optimize file sizes
- Use WebP format

### Query Optimization
- Use specific selects
- Add proper indexes
- Limit result sets
- Use pagination

### Component Optimization
- Use React.memo for expensive components
- Implement proper key props
- Avoid unnecessary re-renders
- Use useCallback for functions

## Security Considerations

### Data Protection
- Use Supabase RLS (Row Level Security)
- Validate all inputs
- Sanitize user data
- Use HTTPS only

### Authentication
- Check user role before rendering
- Verify user permissions
- Handle auth errors gracefully
- Redirect unauthorized users

## Testing Strategies

### Unit Testing
- Test individual functions
- Test error handling
- Test validation logic

### Integration Testing
- Test Supabase queries
- Test form submissions
- Test navigation

### E2E Testing
- Test complete workflows
- Test on real devices
- Test error scenarios

## Deployment Checklist

- [ ] All pages tested on mobile
- [ ] All pages tested on desktop
- [ ] All Supabase queries verified
- [ ] All error handling tested
- [ ] All forms validated
- [ ] All images optimized
- [ ] All code reviewed
- [ ] All diagnostics cleared
- [ ] Performance tested
- [ ] Security verified

---

**Last Updated**: March 13, 2026
**Version**: 1.0
