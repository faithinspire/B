# Login & Signup Pages - Visual Guide

## Login Page Layout

```
┌─────────────────────────────────────┐
│                                     │
│   ┌─────────────────────────────┐   │
│   │  [B] Logo                   │   │
│   │  Welcome Back               │   │
│   │  Sign in to your account    │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │ Email Address               │   │
│   │ [📧] you@example.com        │   │
│   │                             │   │
│   │ Password                    │   │
│   │ [🔒] ••••••••  [👁️]        │   │
│   │                             │   │
│   │ [Sign In] (Loading...)      │   │
│   └─────────────────────────────┘   │
│                                     │
│   ─────────── or ───────────        │
│                                     │
│   Don't have an account? Sign up    │
│   Forgot password?                  │
│                                     │
│   Demo: customer@test.com           │
│   Password: password123             │
│                                     │
└─────────────────────────────────────┘
```

## Signup Page Layout

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                    [B] Logo                             │
│                  Join Braidly                           │
│         Choose your role and start your journey         │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │              │  │              │  │              │  │
│  │  [👥]        │  │  [✂️]        │  │  [🛡️]       │  │
│  │              │  │              │  │              │  │
│  │ I'm a        │  │ I'm a        │  │ I'm an       │  │
│  │ Customer     │  │ Braider      │  │ Admin        │  │
│  │              │  │ (Popular)    │  │              │  │
│  │ Book verified│  │ Grow your    │  │ Manage       │  │
│  │ braiders...  │  │ business...  │  │ platform...  │  │
│  │              │  │              │  │              │  │
│  │ ✓ Browse     │  │ ✓ Grow       │  │ ✓ User       │  │
│  │ ✓ Secure     │  │ ✓ Secure     │  │ ✓ Dispute    │  │
│  │ ✓ Escrow     │  │ ✓ Verify     │  │ ✓ Analytics  │  │
│  │ ✓ Dispute    │  │ ✓ Earnings   │  │ ✓ Security   │  │
│  │              │  │              │  │              │  │
│  │ [Get Started]│  │ [Get Started]│  │ [Admin Access]  │
│  │              │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  Already have an account? Sign in                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Responsive Behavior

### Mobile (< 640px)
```
┌─────────────────┐
│   [B] Logo      │
│  Join Braidly   │
│                 │
│ ┌─────────────┐ │
│ │ Customer    │ │
│ │ [Get Start] │ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │ Braider     │ │
│ │ [Get Start] │ │
│ └─────────────┘ │
│                 │
│ ┌─────────────┐ │
│ │ Admin       │ │
│ │ [Get Start] │ │
│ └─────────────┘ │
│                 │
└─────────────────┘
```

### Tablet (640px - 1024px)
```
┌──────────────────────────────────┐
│      [B] Logo                    │
│     Join Braidly                 │
│                                  │
│ ┌──────────────┐ ┌──────────────┐│
│ │  Customer    │ │  Braider     ││
│ │ [Get Start]  │ │ [Get Start]  ││
│ └──────────────┘ └──────────────┘│
│                                  │
│ ┌──────────────┐                 │
│ │  Admin       │                 │
│ │ [Get Start]  │                 │
│ └──────────────┘                 │
│                                  │
└──────────────────────────────────┘
```

### Desktop (> 1024px)
```
┌────────────────────────────────────────────────────────┐
│              [B] Logo                                  │
│            Join Braidly                                │
│                                                        │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│ │  Customer    │ │  Braider     │ │  Admin       │   │
│ │ [Get Start]  │ │ [Get Start]  │ │ [Get Start]  │   │
│ └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Interactive Elements

### Login Form
- **Email Input**: Real-time validation, error clearing
- **Password Input**: Toggle visibility with eye icon
- **Submit Button**: Disabled until form is valid
- **Loading State**: Spinner shows during submission
- **Error Messages**: Clear, helpful feedback

### Signup Cards
- **Hover Effect**: Card scales up, shadow increases
- **Icon Animation**: Icon scales on hover
- **Button Animation**: Arrow icon moves on hover
- **Smooth Transitions**: All changes are animated

## Color Scheme

### Primary Colors
- Primary: `#9333ea` (Purple)
- Secondary: `#06b6d4` (Cyan)
- Accent: `#ec4899` (Pink)

### Neutral Colors
- White: `#ffffff`
- Gray: `#6b7280` (text)
- Light Gray: `#f3f4f6` (backgrounds)

### Status Colors
- Success: `#10b981` (Green)
- Error: `#ef4444` (Red)
- Warning: `#f59e0b` (Amber)

## Typography

- **Headings**: Playfair Display (serif)
- **Body**: DM Sans (sans-serif)
- **Sizes**: 
  - H1: 2.25rem (36px)
  - H2: 1.875rem (30px)
  - Body: 1rem (16px)
  - Small: 0.875rem (14px)

## Animations

- **Page Load**: Fade in + scale
- **Card Hover**: Scale 1.05 + shadow increase
- **Button Hover**: Shadow increase + gap change
- **Error Clear**: Smooth color transition
- **Loading**: Spinner rotation

## Accessibility

- ✅ Keyboard navigation
- ✅ Focus states visible
- ✅ Color contrast > 4.5:1
- ✅ Proper labels
- ✅ Error messages linked
- ✅ Autocomplete hints
- ✅ Disabled states clear

## Performance

- ✅ No layout shifts
- ✅ GPU-accelerated animations
- ✅ Minimal repaints
- ✅ Fast interactions
- ✅ Smooth 60fps

## Status: ✅ COMPLETE

Both pages are now fully responsive, real-time functional, and beautifully designed.
