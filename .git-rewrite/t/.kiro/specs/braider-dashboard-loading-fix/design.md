# Braider Dashboard Loading Fix Design

## Overview

The braider dashboard page experiences an infinite loading state due to improper coordination between local component state (`profileLoading`) and the Zustand store's global `loading` state. When the profile loading check completes and sets `profileLoading` to false, the component still displays the loading spinner if the store's `loading` state remains true. This occurs because the store's `loading` state is set to true during profile operations but is not explicitly reset after profile retrieval operations complete.

The fix will ensure that the loading state is properly managed by either:
1. Decoupling the component's loading logic from the store's `loading` state, OR
2. Ensuring the store properly resets its `loading` state after read operations

The minimal approach is to modify the loading condition in the dashboard component to only depend on `profileLoading`, which accurately reflects whether the profile data has been retrieved.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when `profileLoading` is false but store's `loading` is true, causing infinite spinner
- **Property (P)**: The desired behavior - dashboard content should display once profile retrieval completes, regardless of store's loading state
- **Preservation**: Existing authentication checks, profile not found handling, and dashboard rendering must remain unchanged
- **profileLoading**: Local component state that tracks whether the initial profile retrieval is complete
- **store.loading**: Global Zustand store state that tracks whether any profile operation is in progress
- **getProfile()**: Function in `useBraiderProfileStore` that retrieves a profile by userId or email (synchronous read operation)
- **setCurrentProfile()**: Function that sets the active profile in the store

## Bug Details

### Bug Condition

The bug manifests when a braider navigates to the dashboard and the profile loading check completes (setting `profileLoading` to false), but the Zustand store's `loading` state remains true. The component's loading condition checks both `profileLoading || loading`, causing the spinner to display indefinitely even though the profile data is available.

**Formal Specification:**
```
FUNCTION isBugCondition(componentState)
  INPUT: componentState of type { profileLoading: boolean, storeLoading: boolean, profileExists: boolean }
  OUTPUT: boolean
  
  RETURN componentState.profileLoading === false
         AND componentState.storeLoading === true
         AND componentState.profileExists === true
         AND infiniteSpinnerDisplayed === true
END FUNCTION
```

### Examples

- **Example 1**: Braider logs in → dashboard loads → `useEffect` runs → `getProfile()` succeeds → `setProfileLoading(false)` → store's `loading` is still true → spinner continues indefinitely
- **Example 2**: Braider refreshes dashboard page → profile exists in localStorage → `getProfile()` returns immediately → `profileLoading` set to false → store's `loading` remains true from previous operation → spinner blocks dashboard
- **Example 3**: Braider navigates from another page → profile already in store → retrieval is instant → `profileLoading` becomes false → store's `loading` not reset → infinite loading state
- **Edge Case**: Braider has no profile → `getProfile()` returns undefined → `setProfile(null)` → `profileLoading` set to false → "Profile not found" message should display, but if store's `loading` is true, spinner displays instead

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Authentication checks must continue to redirect non-braider users to login
- Profile not found state must continue to display the "Profile not found" message with setup link
- Verification alert banner must continue to display for unverified profiles
- Dashboard stats, quick actions, and profile information must continue to render correctly
- Avatar upload functionality must continue to work as expected
- All profile data retrieval logic (checking by email then by id) must remain unchanged

**Scope:**
All functionality that does NOT involve the initial loading state determination should be completely unaffected by this fix. This includes:
- Profile data display and rendering
- Navigation and routing logic
- Avatar upload and preview functionality
- Stats calculation and display
- Quick action links
- Profile information display

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Loading State Coupling**: The component's loading condition `if (profileLoading || loading)` creates a dependency on the store's global `loading` state, which is intended for write operations (create, update, delete) but not for read operations like `getProfile()`

2. **Store Loading State Not Reset**: The `getProfile()` function is a synchronous read operation that doesn't set `loading` to false. If a previous operation (like `createProfile` or `updateProfile`) set `loading` to true and failed to reset it, the state persists

3. **Incorrect Loading Semantics**: The store's `loading` state is designed to track async operations (create, update, delete) but `getProfile()` is a synchronous getter that reads from the in-memory store. The component incorrectly treats this synchronous read as if it were an async operation

4. **Race Condition**: If the store's `loading` state is true when the component mounts (from a previous operation), and `getProfile()` completes instantly, `profileLoading` becomes false but the component still waits for `loading` to become false

## Correctness Properties

Property 1: Bug Condition - Dashboard Displays After Profile Retrieval

_For any_ dashboard page load where the profile retrieval completes (either finding a profile or determining none exists), the fixed component SHALL display the appropriate content (dashboard or "profile not found" message) without waiting for the store's global loading state to become false.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Existing Dashboard Functionality

_For any_ dashboard interaction that does NOT involve the initial loading state (authentication checks, profile display, avatar upload, navigation), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `app/(braider)/braider/dashboard/page.tsx`

**Function**: `BraiderDashboard` component

**Specific Changes**:
1. **Decouple Loading Condition**: Change the loading condition from `if (profileLoading || loading)` to `if (profileLoading)` to remove dependency on the store's global loading state
   - This ensures the component only waits for its own profile retrieval logic to complete
   - The store's `loading` state will continue to work for write operations (create, update, delete) but won't block the initial render

2. **Rationale**: The `getProfile()` function is a synchronous read operation that doesn't need a loading state. The component's `profileLoading` state accurately tracks whether the profile retrieval logic has completed. The store's `loading` state is intended for async write operations and should not gate the initial dashboard render.

3. **Alternative Approach** (if the above doesn't work): Explicitly reset the store's `loading` state in the `useEffect` after profile retrieval:
   ```typescript
   // After profile retrieval logic
   setProfileLoading(false);
   // Force reset store loading state if needed
   if (loading) {
     // Call a store method to reset loading, or access the store's set function
   }
   ```

4. **Minimal Change Philosophy**: The first approach (removing `|| loading` from the condition) is preferred because it:
   - Requires only one line change
   - Doesn't modify store behavior
   - Correctly reflects that profile retrieval is synchronous
   - Maintains separation of concerns (component state vs store state)

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Manually test the dashboard page with the store's `loading` state artificially set to true. Observe whether the spinner displays indefinitely even when `profileLoading` is false. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Fresh Login Test**: Log in as a braider and navigate to dashboard (will show infinite spinner on unfixed code if store loading is true)
2. **Page Refresh Test**: Refresh the dashboard page while logged in (will show infinite spinner on unfixed code if store loading persists)
3. **Navigation Test**: Navigate away and back to dashboard (will show infinite spinner on unfixed code if store loading not reset)
4. **No Profile Test**: Access dashboard with no profile setup (may show spinner instead of "profile not found" message on unfixed code)

**Expected Counterexamples**:
- Dashboard displays infinite loading spinner even though profile data is available
- Possible causes: loading condition depends on store's `loading` state, store's `loading` not reset after read operations, incorrect loading semantics for synchronous reads

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL dashboardLoad WHERE isBugCondition(dashboardLoad) DO
  result := renderDashboard_fixed(dashboardLoad)
  ASSERT result.displaysDashboardContent === true
  ASSERT result.displaysInfiniteSpinner === false
END FOR
```

**Manual Test Cases**:
1. Log in as braider → navigate to dashboard → verify dashboard content displays immediately
2. Refresh dashboard page → verify dashboard content displays without infinite spinner
3. Navigate away and back → verify dashboard loads correctly
4. Test with no profile → verify "profile not found" message displays correctly

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL dashboardInteraction WHERE NOT isBugCondition(dashboardInteraction) DO
  ASSERT originalDashboard(dashboardInteraction) = fixedDashboard(dashboardInteraction)
END FOR
```

**Testing Approach**: Manual testing is appropriate for this UI bug because:
- The bug is deterministic and easily reproducible
- The fix is a simple conditional change
- The scope is limited to one component's loading logic
- Visual verification is necessary to confirm correct rendering

**Test Plan**: Observe behavior on UNFIXED code first for all non-loading interactions, then verify the same behavior continues after the fix.

**Test Cases**:
1. **Authentication Preservation**: Verify non-braider users are still redirected to login
2. **Profile Not Found Preservation**: Verify "profile not found" message displays when no profile exists
3. **Verification Alert Preservation**: Verify unverified profiles still show the verification banner
4. **Dashboard Content Preservation**: Verify all stats, quick actions, and profile info display correctly
5. **Avatar Upload Preservation**: Verify avatar upload and preview functionality continues to work
6. **Navigation Preservation**: Verify all dashboard links and navigation work correctly

### Unit Tests

- Test that dashboard renders when `profileLoading` is false, regardless of store's `loading` state
- Test that authentication redirect works for non-braider users
- Test that "profile not found" message displays when profile is null
- Test that verification alert displays for unverified profiles

### Property-Based Tests

Not applicable for this bug fix. The bug is a simple conditional logic error in a UI component, not a complex algorithmic issue that would benefit from property-based testing.

### Integration Tests

- Test full login flow → dashboard navigation → verify dashboard displays
- Test page refresh on dashboard → verify no infinite loading
- Test navigation between dashboard and other pages → verify loading state resets correctly
- Test dashboard with various profile states (verified, unverified, no profile) → verify correct rendering
