# Auth Pattern Reference - Copy & Paste Template

## Standard Braider Page Pattern

Use this template for all braider pages:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { useSupabaseBraiderStore } from '@/store/supabaseBraiderStore';
import { Loader } from 'lucide-react';

export default function BraiderPageName() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const { getProfile } = useSupabaseBraiderStore();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      // Wait for auth to initialize
      if (authLoading) return;

      // Check if user is authenticated and is a braider
      if (!user) {
        router.push('/login');
        return;
      }

      if (user.role !== 'braider') {
        router.push('/');
        return;
      }

      // Load page data
      await loadData();
    };

    checkAuthAndLoad();
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load your data here
      const profile = await getProfile(user!.id);
      setData(profile);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while auth is initializing
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 mt-16">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or not a braider, don't render
  if (!user || user.role !== 'braider') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 mt-16 pb-24">
      {/* Your page content here */}
    </div>
  );
}
```

## Standard Customer Page Pattern

Use this template for all customer pages:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { Loader } from 'lucide-react';

export default function CustomerPageName() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      // Wait for auth to initialize
      if (authLoading) return;

      // Check if user is authenticated and is a customer
      if (!user) {
        router.push('/login');
        return;
      }

      if (user.role !== 'customer') {
        router.push('/');
        return;
      }

      // Load page data
      await loadData();
    };

    checkAuthAndLoad();
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load your data here
      setData({});
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while auth is initializing
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 mt-16">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or not a customer, don't render
  if (!user || user.role !== 'customer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 mt-16 pb-24">
      {/* Your page content here */}
    </div>
  );
}
```

## Key Points

### 1. Always Import Loader
```typescript
import { Loader } from 'lucide-react';
```

### 2. Always Destructure authLoading
```typescript
const { user, loading: authLoading } = useSupabaseAuthStore();
```

### 3. Always Check authLoading First
```typescript
useEffect(() => {
  if (authLoading) return;  // MUST be first check
  // ... rest of checks
}, [user, authLoading, router]);
```

### 4. Always Show Loading State
```typescript
if (authLoading || loading) {
  return <LoadingScreen />;
}
```

### 5. Always Return Null After Auth Checks
```typescript
if (!user || user.role !== 'braider') {
  return null;  // Don't render if auth fails
}
```

## Common Mistakes to Avoid

### ❌ Wrong: Checking user before authLoading
```typescript
useEffect(() => {
  if (!user) router.push('/login');  // WRONG - checks before auth completes
  if (authLoading) return;
}, [user, router]);
```

### ✅ Correct: Check authLoading first
```typescript
useEffect(() => {
  if (authLoading) return;  // CORRECT - waits for auth
  if (!user) router.push('/login');
}, [user, authLoading, router]);
```

### ❌ Wrong: Not showing loading state
```typescript
if (!user || user.role !== 'braider') {
  return null;  // WRONG - shows blank page while loading
}
```

### ✅ Correct: Show loading state
```typescript
if (authLoading || loading) {
  return <LoadingScreen />;  // CORRECT - shows spinner
}
if (!user || user.role !== 'braider') {
  return null;
}
```

### ❌ Wrong: Missing authLoading in dependencies
```typescript
useEffect(() => {
  if (authLoading) return;
  // ...
}, [user, router]);  // WRONG - missing authLoading
```

### ✅ Correct: Include authLoading in dependencies
```typescript
useEffect(() => {
  if (authLoading) return;
  // ...
}, [user, authLoading, router]);  // CORRECT
```

## Testing the Pattern

### Test 1: Auth Initializes
```
1. Open page
2. Should show loading spinner
3. After ~500ms, should show content
4. Should NOT redirect
```

### Test 2: Not Authenticated
```
1. Logout
2. Try to access page
3. Should redirect to /login
4. Should NOT show blank page
```

### Test 3: Wrong Role
```
1. Login as braider
2. Try to access customer page
3. Should redirect to /
4. Should NOT show error
```

### Test 4: Correct Role
```
1. Login as braider
2. Access braider page
3. Should load content
4. Should NOT redirect
```

## Performance Tips

1. **Minimize loadData calls**: Only call once on mount
2. **Use proper dependencies**: Include all used variables
3. **Avoid unnecessary renders**: Use proper state management
4. **Cache data**: Consider using stores for shared data
5. **Lazy load**: Load data only when needed

## Accessibility

- Loading spinner has proper ARIA labels
- Loading text is visible to screen readers
- Proper semantic HTML
- Keyboard navigation works
- Color contrast is sufficient

## Mobile Responsiveness

- Loading spinner scales properly
- Text is readable on small screens
- Touch targets are 44px minimum
- Proper spacing on mobile

## Browser Compatibility

- Works on all modern browsers
- Fallback for older browsers
- No console errors
- Proper error handling

## Deployment Checklist

- [ ] All pages use consistent pattern
- [ ] All pages pass TypeScript checks
- [ ] All pages have proper loading states
- [ ] All pages have proper error handling
- [ ] All pages enforce role-based access
- [ ] No redirect loops
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Accessibility compliant
- [ ] Performance optimized
