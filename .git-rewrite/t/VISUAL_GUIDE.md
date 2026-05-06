# Visual Guide - Navigation & Layout

## Top Navbar (All Pages)

```
┌─────────────────────────────────────────────────────────────┐
│ [B] Braidly    [Home] [Browse] [Dashboard] [Profile] [Logout] │
└─────────────────────────────────────────────────────────────┘
```

**Features**:
- Sticky (stays at top when scrolling)
- Purple gradient background
- White text
- Role-based menu items
- Active link highlighting

---

## Bottom Navigation (Mobile Only)

```
┌──────────────────────────────────────────────────────────────┐
│                                                                │
│                     Page Content Here                          │
│                                                                │
├──────────────────────────────────────────────────────────────┤
│ [🏠 Home] [🔍 Browse] [❤️ Favorites] [👤 Profile]            │
└──────────────────────────────────────────────────────────────┘
```

**Features**:
- Fixed at bottom
- 4 important tabs
- Mobile only (< 768px)
- Active tab highlighted
- Touch-friendly (44px+ height)

---

## Page Layouts

### Customer Dashboard
```
┌─ Top Navbar ─────────────────────────────────────────┐
│ [B] Braidly    [Home] [Browse] [Dashboard] [Logout]  │
├───────────────────────────────────────────────────────┤
│                                                        │
│  Welcome, [Customer Name]!                            │
│                                                        │
│  [Search Bar] [Filters]                               │
│                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ Braider 1   │  │ Braider 2   │  │ Braider 3   │   │
│  │ ⭐ 4.8      │  │ ⭐ 4.9      │  │ ⭐ 5.0      │   │
│  │ [View]      │  │ [View]      │  │ [View]      │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                        │
├─ Bottom Nav (Mobile) ─────────────────────────────────┤
│ [🏠] [🔍] [❤️] [👤]                                   │
└───────────────────────────────────────────────────────┘
```

### Braider Dashboard
```
┌─ Top Navbar ─────────────────────────────────────────┐
│ [B] Braidly    [Home] [Browse] [Dashboard] [Logout]  │
├───────────────────────────────────────────────────────┤
│                                                        │
│  Braider Dashboard                                     │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Earnings │  │ Bookings │  │ Rating   │            │
│  │ $1,250   │  │ 5        │  │ 4.9 ⭐   │            │
│  └──────────┘  └──────────┘  └──────────┘            │
│                                                        │
│  [Portfolio] [Services] [Calendar] [Wallet]           │
│                                                        │
├─ Bottom Nav (Mobile) ─────────────────────────────────┤
│ [🏠] [🔍] [❤️] [👤]                                   │
└───────────────────────────────────────────────────────┘
```

### Admin Dashboard
```
┌─ Top Navbar ─────────────────────────────────────────┐
│ [B] Braidly    [Home] [Browse] [Dashboard] [Logout]  │
├───────────────────────────────────────────────────────┤
│                                                        │
│  Admin Dashboard                                       │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Users    │  │ Pending  │  │ Disputes │            │
│  │ 1,234    │  │ 45       │  │ 12       │            │
│  └──────────┘  └──────────┘  └──────────┘            │
│                                                        │
│  [Users] [Verification] [Disputes] [Financials]       │
│                                                        │
├─ Bottom Nav (Mobile) ─────────────────────────────────┤
│ [🏠] [🔍] [❤️] [👤]                                   │
└───────────────────────────────────────────────────────┘
```

---

## Navigation Flow

### Customer Journey
```
Landing Page
    ↓
[Sign Up] → Customer Dashboard
    ↓
[Browse] → Search Braiders
    ↓
[View Profile] → Braider Profile
    ↓
[Book Now] → Booking Page
    ↓
[Confirm] → Dashboard
```

### Braider Journey
```
Landing Page
    ↓
[Join as Braider] → Braider Dashboard
    ↓
[Portfolio] → Add Portfolio Items
    ↓
[Services] → Add Services
    ↓
[Calendar] → View Bookings
    ↓
[Wallet] → View Earnings
```

### Admin Journey
```
Landing Page
    ↓
[Join as Admin] → Admin Dashboard
    ↓
[Users] → Manage Users
    ↓
[Verification] → Review Verifications
    ↓
[Disputes] → Manage Disputes
    ↓
[Financials] → View Revenue
```

---

## Responsive Breakpoints

### Mobile (375px)
```
┌─────────────────────────┐
│ [B] Braidly    [≡]      │  ← Hamburger menu
├─────────────────────────┤
│                         │
│   Single Column         │
│   Layout                │
│                         │
│   [Card 1]              │
│   [Card 2]              │
│   [Card 3]              │
│                         │
├─────────────────────────┤
│ [🏠] [🔍] [❤️] [👤]     │  ← Bottom nav
└─────────────────────────┘
```

### Tablet (768px)
```
┌──────────────────────────────────────────┐
│ [B] Braidly    [Home] [Browse] [Logout]  │
├──────────────────────────────────────────┤
│                                          │
│   Two Column Layout                      │
│                                          │
│   [Card 1]        [Card 2]               │
│   [Card 3]        [Card 4]               │
│                                          │
│   [Card 5]        [Card 6]               │
│                                          │
└──────────────────────────────────────────┘
```

### Desktop (1920px)
```
┌────────────────────────────────────────────────────────────────┐
│ [B] Braidly    [Home] [Browse] [Dashboard] [Profile] [Logout]  │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Three Column Layout                                           │
│                                                                 │
│   [Card 1]        [Card 2]        [Card 3]                     │
│   [Card 4]        [Card 5]        [Card 6]                     │
│   [Card 7]        [Card 8]        [Card 9]                     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Color Scheme

```
Primary:   #9333ea (Purple)
Secondary: #3b82f6 (Blue)
Accent:    #ec4899 (Pink)
White:     #ffffff
Gray:      #f3f4f6 - #111827
```

---

## Typography

```
Headings:  Playfair Display (serif)
Body:      DM Sans (sans-serif)
Sizes:     h1: 48px, h2: 36px, h3: 24px, body: 16px
```

---

## Components

### Navbar
- Sticky positioning
- Gradient background
- Role-based menu
- Active highlighting
- Mobile hamburger

### Bottom Nav
- Fixed positioning
- 4 tabs
- Mobile only
- Active highlighting
- Touch-friendly

### Cards
- Rounded corners (24px)
- Shadow effects
- Hover animations
- Responsive grid
- Smooth transitions

### Buttons
- Gradient backgrounds
- Rounded corners (12px)
- Hover effects
- Disabled states
- Touch-friendly (44px+)

### Forms
- Rounded inputs (12px)
- Border focus states
- Error messages
- Validation
- Smooth transitions

---

## Animations

```
fade-in:     Fade in effect
slide-up:    Slide up from bottom
slide-down:  Slide down from top
scale-in:    Scale in effect
delay-*:     Staggered animations
```

---

## Summary

✅ **Clean Navigation** - No duplicates
✅ **Bottom Nav** - Mobile only
✅ **Responsive** - All devices
✅ **Professional** - Modern design
✅ **Functional** - All pages working
✅ **Ready** - To test and deploy

---

**Visual Guide Complete** ✨
