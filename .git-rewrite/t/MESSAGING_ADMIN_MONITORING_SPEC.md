# Messaging & Admin Monitoring System - Complete Specification

## Overview

This spec defines a comprehensive real-time messaging and admin monitoring system for the braider booking platform. It enables:

1. **Customer-Braider Chat** - Real-time messaging after booking confirmation
2. **Location Tracking** - Braider GPS tracking with real-time map updates
3. **Admin Monitoring** - Admin oversight of all conversations and payments
4. **Payment Notifications** - Real-time admin alerts when payments are made
5. **Admin Chat Access** - Admin can join any conversation to help resolve issues

## Key Features

### For Customers
- ✅ Chat with braider after booking confirmed
- ✅ View braider's real-time location on map
- ✅ Share own location with braider
- ✅ See estimated arrival time
- ✅ View location history
- ✅ See when admin joins conversation

### For Braiders
- ✅ Chat with customer after booking confirmed
- ✅ Share real-time GPS location
- ✅ View customer's location (if shared)
- ✅ See estimated travel time
- ✅ See who's viewing location
- ✅ See when admin joins conversation

### For Admin
- ✅ Monitor all conversations in real-time
- ✅ Join any conversation to help
- ✅ View all braider locations on map
- ✅ Receive real-time payment notifications
- ✅ View payment history
- ✅ View conversation history
- ✅ Send messages in conversations
- ✅ View location history

## Chat Initiation Timeline

```
STAGE 1: Booking Created
├─ Status: "pending"
├─ Chat: NOT available
└─ Customer: Sees "Awaiting payment"

STAGE 2: Payment Completed
├─ Status: "confirmed"
├─ Conversation: Created automatically
├─ Chat: NOW available
├─ Customer: Sees "Chat with Braider" button
├─ Braider: Sees "Chat with Customer" button
└─ Admin: Notified of payment

STAGE 3: Braider Accepts
├─ Braider: Can enable location sharing
├─ Location: Real-time tracking starts
└─ Customer: Can see location on map

STAGE 4: Service In Progress
├─ Braider: Shares GPS location
├─ Customer: Tracks arrival
├─ Both: Chat in real-time
└─ Admin: Can monitor everything

STAGE 5: Service Completed
├─ Braider: Marks booking complete
├─ Location: Sharing stops
├─ Chat: Remains available
└─ Conversation: Archived
```

## Database Schema

### New/Updated Tables
1. **conversations** - Links customer, braider, and admin
2. **messages** - Stores all messages with metadata
3. **location_tracking** - Stores GPS coordinates and movement data
4. **payment_notifications** - Tracks payment alerts to admin
5. **admin_access_logs** - Logs admin actions for compliance

## API Routes

### Messaging
- `POST /api/messages/send` - Send message
- `GET /api/messages/conversation/[id]` - Fetch messages
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation

### Location
- `POST /api/location/track` - Track braider location
- `GET /api/location/braider/[id]` - Get current location
- `GET /api/location/history/[booking_id]` - Get location history

### Admin
- `POST /api/admin/conversations/[id]/join` - Admin joins conversation
- `POST /api/admin/conversations/[id]/leave` - Admin leaves conversation
- `GET /api/admin/dashboard` - Get dashboard data
- `GET /api/admin/payments/notifications` - Get payment notifications

## UI Components

### Customer Pages
- `/app/(customer)/messages` - Messages list
- `/app/(customer)/messages/[booking_id]` - Chat with braider + map

### Braider Pages
- `/app/(braider)/braider/messages` - Messages list
- `/app/(braider)/braider/messages/[booking_id]` - Chat with customer + map
- `/app/(braider)/braider/location` - Location sharing control

### Admin Pages
- `/app/(admin)/admin/monitoring` - Main dashboard with map
- `/app/(admin)/admin/conversations/[id]` - Monitor conversation

## Real-Time Features

### Message Delivery
- Real-time message updates (< 500ms)
- Read receipts
- Typing indicators
- Message notifications

### Location Tracking
- GPS update every 10 seconds
- Real-time map updates (< 2 seconds)
- Speed and heading tracking
- Location accuracy display

### Admin Notifications
- Real-time payment alerts (< 1 second)
- Real-time conversation updates
- Real-time location updates
- Admin join/leave notifications

## Security & Permissions

### Customer
- Can send messages in their conversation
- Can view braider's location (if shared)
- Can share their own location
- Cannot view other conversations

### Braider
- Can send messages in their conversation
- Can share their location
- Can view customer's location (if shared)
- Cannot view other conversations

### Admin
- Can view all conversations
- Can view all locations
- Can join any conversation
- Can send messages in any conversation
- Can view all payments
- Cannot delete messages or conversations

## Implementation Phases

### Phase 1: Database & API (2-3 days)
- Create database tables
- Create all API routes
- Setup RLS policies

### Phase 2: Customer Features (2-3 days)
- Chat component
- Location viewing
- Location sharing
- Real-time subscriptions

### Phase 3: Braider Features (2-3 days)
- Chat component
- Location sharing
- Location viewing
- Real-time subscriptions

### Phase 4: Admin Dashboard (2-3 days)
- Monitoring dashboard
- Conversation monitor
- Location map
- Payment notifications

### Phase 5: Real-Time Features (1-2 days)
- Message real-time updates
- Location real-time updates
- Admin notifications

### Phase 6: Maps Integration (1-2 days)
- Maps library integration
- Location features
- Route visualization

### Phase 7: Testing & Optimization (1-2 days)
- Unit tests
- Integration tests
- Performance optimization
- Security review

### Phase 8: Deployment (1 day)
- Database migration
- API deployment
- Frontend deployment
- Monitoring setup

**Total: 13-19 days**

## Success Metrics

- Message delivery time: < 500ms
- Location update frequency: Every 10 seconds
- Admin notification delivery: < 1 second
- User adoption: > 80% of bookings use chat
- Admin monitoring: 100% of payments notified
- System uptime: > 99.9%

## Next Steps

1. Review and approve this specification
2. Start Phase 1: Database & API setup
3. Create database tables and RLS policies
4. Create API routes with proper error handling
5. Test all API endpoints
6. Move to Phase 2: Customer features

## Files Created

- `.kiro/specs/messaging-admin-monitoring/design.md` - Technical design
- `.kiro/specs/messaging-admin-monitoring/requirements.md` - Requirements
- `.kiro/specs/messaging-admin-monitoring/tasks.md` - Implementation tasks
- `MESSAGING_ADMIN_MONITORING_SPEC.md` - This summary

## Questions?

This spec is ready for implementation. All components are designed to work together seamlessly with real-time updates throughout the entire booking lifecycle.
