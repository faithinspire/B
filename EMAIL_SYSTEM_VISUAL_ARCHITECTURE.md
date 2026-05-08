# 📊 EMAIL SYSTEM VISUAL ARCHITECTURE

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    BraidMe Email System                         │
│                   (Hybrid Delivery)                             │
└─────────────────────────────────────────────────────────────────┘

                         User Interface
                              │
                              ▼
                    ┌──────────────────┐
                    │ /forgot-password │
                    │     Page         │
                    └────────┬─────────┘
                             │
                    Enter email address
                             │
                             ▼
                    ┌──────────────────┐
                    │ Send Reset Link  │
                    │     Button       │
                    └────────┬─────────┘
                             │
                    POST /api/auth/forgot-password
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │   Email Delivery System (Hybrid)       │
        │                                        │
        │  ┌──────────────────────────────────┐  │
        │  │ PRIMARY: Supabase Email Service  │  │
        │  │                                  │  │
        │  │ • No API key needed              │  │
        │  │ • Built into Supabase            │  │
        │  │ • Works for ALL users            │  │
        │  │ • Reliable & professional        │  │
        │  └────────────┬─────────────────────┘  │
        │               │                        │
        │        Try to send email               │
        │               │                        │
        │        ┌──────┴──────┐                 │
        │        │             │                 │
        │      SUCCESS        FAIL                │
        │        │             │                 │
        │        │             ▼                 │
        │        │  ┌──────────────────────────┐ │
        │        │  │ FALLBACK: Brevo SMTP API │ │
        │        │  │                          │ │
        │        │  │ • Uses API key           │ │
        │        │  │ • Professional service   │ │
        │        │  │ • Provides redundancy    │ │
        │        │  │ • Ensures delivery       │ │
        │        │  └────────────┬─────────────┘ │
        │        │               │               │
        │        │        Try to send email      │
        │        │               │               │
        │        │        ┌──────┴──────┐        │
        │        │        │             │        │
        │        │      SUCCESS        FAIL       │
        │        │        │             │        │
        │        └────────┼─────────────┼────────┘
        │                 │             │
        │          Email sent ✅   Log error
        │                 │             │
        └─────────────────┼─────────────┼────────┘
                          │             │
                          ▼             ▼
                    ┌──────────────────────────┐
                    │  Return Success Response │
                    │  (Always, to prevent     │
                    │   email enumeration)     │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │ User sees "Check your    │
                    │ email" message           │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │ Email arrives in inbox   │
                    │ From: noreply@braidme.com│
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │ User clicks reset link   │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │ /reset-password page     │
                    │ with session             │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │ User enters new password │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │ Password updated in      │
                    │ Supabase                 │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │ Redirected to login page │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │ User logs in with new    │
                    │ password ✅              │
                    └──────────────────────────┘
```

## Decision Tree

```
                    Password Reset Request
                            │
                            ▼
                    ┌───────────────────┐
                    │ Validate Email    │
                    └────────┬──────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                  VALID            INVALID
                    │                 │
                    ▼                 ▼
            ┌──────────────┐   ┌──────────────┐
            │ Try Supabase │   │ Return Error │
            └──────┬───────┘   └──────────────┘
                   │
            ┌──────┴──────┐
            │             │
          SUCCESS        FAIL
            │             │
            ▼             ▼
        ┌────────┐   ┌──────────────┐
        │ Email  │   │ Try Brevo    │
        │ Sent ✅│   └──────┬───────┘
        └────────┘          │
                    ┌───────┴────────┐
                    │                │
                  SUCCESS          FAIL
                    │                │
                    ▼                ▼
                ┌────────┐      ┌──────────┐
                │ Email  │      │ Log Error│
                │ Sent ✅│      │ (Still   │
                └────────┘      │ return   │
                                │ success) │
                                └──────────┘
                    │                │
                    └────────┬───────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Return Success   │
                    │ Response         │
                    └──────────────────┘
```

## Component Interaction

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ /forgot-password/page.tsx                              │ │
│  │                                                        │ │
│  │ • Email input field                                   │ │
│  │ • Send button                                         │ │
│  │ • Success/error messages                              │ │
│  │ • Calls POST /api/auth/forgot-password                │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP POST
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    Backend (Next.js)                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ /api/auth/forgot-password/route.ts                     │ │
│  │                                                        │ │
│  │ • Validate email                                      │ │
│  │ • Get reset URL                                       │ │
│  │ • Try Supabase email service                          │ │
│  │ • Fallback to Brevo if needed                         │ │
│  │ • Return success response                             │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
    ┌──────────────────────┐  ┌──────────────────────┐
    │  Supabase Auth       │  │  Brevo SMTP API      │
    │                      │  │                      │
    │ • Service role key   │  │ • API key            │
    │ • generateLink()     │  │ • SMTP endpoint      │
    │ • Send email         │  │ • Send email         │
    │ • Works for ALL      │  │ • Fallback method    │
    │   users              │  │                      │
    └──────────────────────┘  └──────────────────────┘
                │                       │
                └───────────┬───────────┘
                            │
                            ▼
                ┌──────────────────────┐
                │  Email Sent ✅       │
                │                      │
                │ To: user@example.com │
                │ From: noreply@...    │
                │ Subject: Reset pwd   │
                └──────────────────────┘
                            │
                            ▼
                ┌──────────────────────┐
                │  User's Inbox        │
                │                      │
                │ Email received ✅    │
                └──────────────────────┘
```

## Error Handling Flow

```
                    Email Request
                            │
                            ▼
                    ┌───────────────────┐
                    │ Try Supabase      │
                    └────────┬──────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                  SUCCESS            ERROR
                    │                 │
                    ▼                 ▼
                ┌────────┐      ┌──────────────┐
                │ Email  │      │ Log error    │
                │ Sent ✅│      │ Try Brevo    │
                └────────┘      └──────┬───────┘
                    │                  │
                    │          ┌───────┴────────┐
                    │          │                │
                    │        SUCCESS           ERROR
                    │          │                │
                    │          ▼                ▼
                    │      ┌────────┐      ┌──────────────┐
                    │      │ Email  │      │ Log error    │
                    │      │ Sent ✅│      │ (Both failed)│
                    │      └────────┘      └──────────────┘
                    │          │                │
                    └──────────┼────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Return Success       │
                    │ (Always, to prevent  │
                    │  email enumeration)  │
                    └──────────────────────┘
```

## Data Flow

```
User Input
    │
    ├─ Email: user@example.com
    │
    ▼
Validation
    │
    ├─ Check email format
    ├─ Check email not empty
    │
    ▼
Reset URL Generation
    │
    ├─ Get origin from request
    ├─ Build reset URL
    │
    ▼
Email Service Selection
    │
    ├─ PRIMARY: Supabase
    │   ├─ Create client
    │   ├─ Call generateLink()
    │   └─ Send email
    │
    ├─ FALLBACK: Brevo
    │   ├─ Validate API key
    │   ├─ Call Brevo API
    │   └─ Send email
    │
    ▼
Response Generation
    │
    ├─ Success: true
    ├─ Message: "Check your email"
    │
    ▼
Return to Frontend
    │
    ├─ HTTP 200 OK
    ├─ JSON response
    │
    ▼
User Sees Message
    │
    ├─ "Check your email"
    ├─ "If account exists..."
    │
    ▼
Email Delivery
    │
    ├─ Supabase or Brevo sends email
    ├─ Email arrives in inbox
    │
    ▼
User Action
    │
    ├─ Clicks reset link
    ├─ Updates password
    ├─ Logs in
```

## System Status

```
┌─────────────────────────────────────────────────────────────┐
│                   System Status                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Email Service:        ✅ HYBRID (Supabase + Brevo)        │
│  Primary Method:       ✅ Supabase (No API key needed)     │
│  Fallback Method:      ✅ Brevo (For redundancy)           │
│  Works for ALL users:  ✅ YES                              │
│  API Key Issues:       ✅ RESOLVED                         │
│  Error Handling:       ✅ COMPREHENSIVE                    │
│  Logging:              ✅ DETAILED                         │
│  Security:             ✅ EMAIL ENUMERATION PREVENTION     │
│  Production Ready:     ✅ YES                              │
│                                                             │
│  Status: 🟢 COMPLETE & READY FOR DEPLOYMENT               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0
**Date**: May 8, 2026
**Status**: ✅ PRODUCTION READY
