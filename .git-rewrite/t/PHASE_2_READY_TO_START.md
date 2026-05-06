# Phase 2: Customer Chat & Location - Ready to Start ✅

## Status Summary

### ✅ Completed
- Phase 1: Database tables and API routes (15+ endpoints)
- Payment Intent Creation: Fixed and tested
- Environment variables: Corrected
- Error handling: Enhanced

### 🚀 Ready to Start
- Phase 2: Customer Chat & Location Features

## Phase 2 Overview

Phase 2 focuses on implementing customer-facing chat and location viewing features. This is the foundation for real-time communication between customers and braiders.

## Phase 2 Tasks

### Task 2.1: Create Customer Chat Component
**Files to Create**:
- `app/(customer)/messages/page.tsx` - Messages list page
- `app/(customer)/messages/[booking_id]/page.tsx` - Chat interface

**Features**:
- Display conversation with braider
- Show message list with pagination
- Show message timestamps and read receipts
- Implement message input and send functionality
- Add typing indicators
- Add user avatars
- Responsive design for mobile

**API Routes Used**:
- GET /api/conversations - List conversations
- GET /api/messages/conversation/[id] - Fetch messages
- POST /api/messages/send - Send message

### Task 2.2: Create Customer Location Viewing
**Files to Create**:
- Add map component to chat page
- Display braider's current location
- Show location accuracy
- Show estimated arrival time
- Show location history on map
- Real-time map updates

**API Routes Used**:
- GET /api/location/braider/[id] - Get current location
- GET /api/location/history/[booking_id] - Get location history

### Task 2.3: Create Customer Location Sharing
**Files to Create**:
- Add "Share Location" toggle button to chat
- Request GPS permission
- Send location to server
- Show current location on map
- Show location sharing status
- Allow stopping location sharing
- Handle GPS errors gracefully

**API Routes Used**:
- POST /api/location/track - Send location update

### Task 2.4: Implement Real-Time Subscriptions (Customer)
**Features**:
- Subscribe to messages in conversation
- Subscribe to location updates
- Subscribe to conversation updates (admin joined)
- Handle subscription errors
- Cleanup subscriptions on unmount

**Supabase Real-Time**:
- Listen to `messages` table for INSERT events
- Listen to `location_tracking` table for INSERT events
- Listen to `conversations` table for UPDATE events

## Implementation Order

1. **Task 2.1** - Create customer chat component (foundation)
2. **Task 2.2** - Add location viewing to chat
3. **Task 2.3** - Add location sharing capability
4. **Task 2.4** - Implement real-time subscriptions

## Key Components to Build

### 1. Messages List Page
```
/app/(customer)/messages/page.tsx
- List all conversations for customer
- Show unread count
- Show last message preview
- Show braider name and avatar
- Click to open chat
```

### 2. Chat Interface
```
/app/(customer)/messages/[booking_id]/page.tsx
- Display full conversation
- Show all messages with timestamps
- Message input form
- Send button
- Typing indicators
- Read receipts
- Map showing braider location
```

### 3. Location Map Component
```
/app/components/CustomerLocationMap.tsx
- Display braider's current location
- Show customer's location (if shared)
- Show route/path
- Real-time updates
- Zoom and pan controls
```

### 4. Real-Time Subscription Manager
```
/app/hooks/useConversationSubscription.ts
- Subscribe to messages
- Subscribe to location updates
- Subscribe to conversation updates
- Handle errors
- Cleanup on unmount
```

## Database Schema (Already Created)

### conversations table
- id, booking_id, customer_id, braider_id, admin_id
- status, started_at, ended_at, created_at, updated_at

### messages table
- id, conversation_id, sender_id, sender_role
- content, message_type, metadata, read, read_at, created_at

### location_tracking table
- id, booking_id, braider_id
- latitude, longitude, accuracy, speed, heading
- is_active, created_at

## API Routes (Already Created)

### Messaging Routes
- GET /api/conversations - List conversations
- POST /api/conversations - Create conversation
- GET /api/messages/conversation/[id] - Fetch messages
- POST /api/messages/send - Send message
- PUT /api/conversations/[id] - Update conversation

### Location Routes
- GET /api/location/braider/[id] - Get current location
- GET /api/location/history/[booking_id] - Get location history
- POST /api/location/track - Track location (braider)

## UI/UX Considerations

### Messages List
- Show unread badge
- Show last message preview (truncated)
- Show timestamp of last message
- Show braider avatar
- Show online/offline status
- Smooth animations

### Chat Interface
- Message bubbles (different colors for customer vs braider)
- Timestamps on messages
- Read receipts (checkmarks)
- Typing indicator ("Braider is typing...")
- Message input at bottom
- Scroll to latest message
- Mobile-friendly layout

### Location Map
- Show braider marker with name
- Show customer marker (if shared)
- Show route line
- Show distance and ETA
- Zoom to fit both markers
- Real-time marker updates

## Performance Considerations

- Paginate messages (20 per page)
- Cache location data (latest only)
- Lazy load images
- Optimize re-renders
- Debounce location updates
- Cleanup subscriptions

## Security Considerations

- Verify user is part of conversation
- Verify user can view location
- Validate all input
- Use service role key for API calls
- Implement RLS policies
- Log access

## Testing Checklist

- [ ] Create conversation when booking confirmed
- [ ] List conversations for customer
- [ ] Send message in conversation
- [ ] Receive message in real-time
- [ ] View braider location
- [ ] Share customer location
- [ ] See location updates in real-time
- [ ] Pagination works
- [ ] Read receipts work
- [ ] Typing indicators work
- [ ] Mobile responsive
- [ ] Error handling works

## Timeline

- Task 2.1: 1-2 days
- Task 2.2: 1 day
- Task 2.3: 1 day
- Task 2.4: 1 day

**Total: 4-5 days**

## Next Phase (Phase 3)

After Phase 2 is complete, Phase 3 will implement:
- Braider chat component
- Braider location sharing
- Braider location viewing
- Real-time subscriptions for braider

## Ready to Begin?

Phase 2 is ready to start. All database tables and API routes are in place.

**Next Command**: Start implementing Task 2.1 - Create Customer Chat Component
