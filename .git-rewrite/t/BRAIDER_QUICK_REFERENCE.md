# Braider Pages - Quick Reference Card

## Pages Overview

| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| Dashboard | `/braider/dashboard` | Profile & stats | ✅ Fixed |
| Services | `/braider/services` | Manage services | ✅ Fixed |
| Portfolio | `/braider/portfolio` | Showcase work | ✅ Fixed |
| Calendar | `/braider/calendar` | Manage bookings | ✅ Fixed |
| Wallet | `/braider/wallet` | Earnings & payouts | ✅ Fixed |
| Messages | `/braider/messages` | Chat with customers | ✅ Fixed |
| Verify | `/braider/verify` | Profile setup | ✅ Fixed |

## Key Fixes Applied

### Store Migration
```
❌ useBraiderProfileStore (localStorage)
✅ useSupabaseBraiderStore (Supabase)
```

### Mobile Responsiveness
```
Mobile:  320px - 639px  (default)
Tablet:  640px - 1023px (sm:)
Desktop: 1024px+        (lg:)
```

### Error Handling
```
✅ Loading states
✅ Error alerts
✅ Success messages
✅ Form validation
✅ Fallback UI
```

## Common Patterns

### Loading State
```typescript
if (loading) {
  return <LoadingSpinner />;
}
```

### Error Handling
```typescript
{error && (
  <ErrorAlert message={error} />
)}
```

### Success Message
```typescript
{success && (
  <SuccessAlert message="Operation successful!" />
)}
```

### Form Submission
```typescript
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    // Supabase operation
    setSuccess(true);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

## Responsive Classes

### Text Sizes
```
text-sm → sm:text-base → text-base
text-xs → sm:text-sm → text-sm
```

### Padding
```
px-4 → sm:px-6 → px-8
py-3 → sm:py-4 → py-6
```

### Grid Columns
```
grid-cols-1 → sm:grid-cols-2 → lg:grid-cols-3
```

### Gaps
```
gap-3 → sm:gap-4 → lg:gap-6
```

## Supabase Queries

### Get Profile
```typescript
const { data } = await supabase
  .from('braider_profiles')
  .select('*')
  .eq('user_id', userId)
  .single();
```

### Get Services
```typescript
const { data } = await supabase
  .from('services')
  .select('*')
  .eq('braider_id', userId)
  .order('created_at', { ascending: false });
```

### Get Portfolio
```typescript
const { data } = await supabase
  .from('portfolio')
  .select('*')
  .eq('braider_id', userId)
  .order('created_at', { ascending: false });
```

### Get Bookings
```typescript
const { data } = await supabase
  .from('bookings')
  .select('*')
  .eq('braider_id', userId)
  .order('booking_date', { ascending: true });
```

### Get Transactions
```typescript
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('braider_id', userId)
  .order('created_at', { ascending: false });
```

## Component Structure

### Page Layout
```
<div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 mt-16 pb-24">
  {/* Header */}
  <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white py-6 sm:py-8 px-4">
    {/* Content */}
  </div>

  {/* Main Content */}
  <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
    {/* Content */}
  </div>
</div>
```

### Card Component
```
<div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6">
  {/* Content */}
</div>
```

### Button Component
```
<button className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-smooth font-semibold">
  Action
</button>
```

## Testing Checklist

### Mobile (320px)
- [ ] Page loads
- [ ] Text readable
- [ ] Buttons clickable
- [ ] Forms work
- [ ] Images display

### Tablet (768px)
- [ ] Layout responsive
- [ ] Spacing correct
- [ ] All elements visible
- [ ] Navigation works

### Desktop (1024px+)
- [ ] Full layout
- [ ] Proper spacing
- [ ] All features work
- [ ] Performance good

## Common Issues & Solutions

### Issue: Page not loading
**Solution**: Check user role and authentication

### Issue: Data not displaying
**Solution**: Verify Supabase query and RLS policies

### Issue: Form not submitting
**Solution**: Check validation and error handling

### Issue: Mobile layout broken
**Solution**: Verify responsive classes (sm:, lg:)

### Issue: Avatar not uploading
**Solution**: Check file size and type validation

### Issue: Services not showing
**Solution**: Verify Supabase query and braider_id

## Performance Tips

- ✅ Use responsive images
- ✅ Lazy load content
- ✅ Minimize re-renders
- ✅ Optimize queries
- ✅ Cache data when possible

## Accessibility Tips

- ✅ Use semantic HTML
- ✅ Add alt text to images
- ✅ Ensure color contrast
- ✅ Make buttons large enough
- ✅ Use clear labels

## Security Tips

- ✅ Validate all inputs
- ✅ Check user permissions
- ✅ Use HTTPS only
- ✅ Sanitize user data
- ✅ Implement RLS policies

## Debugging Tips

### Check Console
```
Open DevTools → Console
Look for errors and warnings
```

### Check Network
```
Open DevTools → Network
Verify Supabase requests
Check response status
```

### Check Elements
```
Open DevTools → Elements
Inspect responsive classes
Check CSS styles
```

### Check Performance
```
Open DevTools → Performance
Record page load
Analyze bottlenecks
```

## Useful Commands

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm run test
```

### Check Diagnostics
```bash
npm run lint
```

## File Locations

```
app/(braider)/braider/
├── dashboard/page.tsx
├── services/page.tsx
├── portfolio/page.tsx
├── calendar/page.tsx
├── wallet/page.tsx
├── messages/page.tsx
└── verify/page.tsx

store/
├── supabaseAuthStore.ts
├── supabaseBraiderStore.ts
└── messageStore.ts

lib/
├── supabase.ts
└── imageUpload.ts
```

## Documentation Files

- `BRAIDER_FIX_COMPLETE_SUMMARY.md` - Overall summary
- `BRAIDER_PAGES_COMPREHENSIVE_FIX.md` - Detailed fixes
- `BRAIDER_IMPLEMENTATION_DETAILS.md` - Technical details
- `BRAIDER_TESTING_GUIDE.md` - Testing procedures
- `BRAIDER_QUICK_REFERENCE.md` - This file

## Support

For issues or questions:
1. Check the documentation files
2. Review the implementation details
3. Check the testing guide
4. Review error messages
5. Check browser console

---

**Last Updated**: March 13, 2026
**Status**: ✅ Ready for Production
