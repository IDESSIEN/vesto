# Admin Separation Plan

## Problem
Admin role is visible in the main app navbar role switcher and sub-nav, exposing the existence of an admin interface to all users.

## Solution
- Remove Admin from the main app entirely (role switcher + sub-nav)
- Add a dedicated `/admin` route not linked from anywhere in the main app
- Admin portal renders AdminLogin2FA first, then full admin panel after auth
- Existing @vesto.finance email + 6-digit passcode gate stays as Layer 2

## Files that change (4 only)
1. `src/App.tsx` — remove Admin from role switcher + sub-nav + view router; add /admin route handler
2. `src/main.tsx` — add /admin path to router
3. `src/components/admin/AdminPortal.tsx` — NEW: thin wrapper rendering login or panel based on auth state
4. `src/components/common/Navbar.tsx` — hide Admin option from role switcher

## Files that do NOT change
- All existing admin screens (InvoiceOversightTable, VerificationQueue, DisputeResolution, BuyerMonitoring, AnalyticsOverview, AdminLogin2FA)
- AppContext (completeAdminOnboarding, signOut, isAdminAuthenticated)
- All Seller and Lender flows
- All RLS security hardening

## Two-layer security model
- Layer 1: Admin URL not published or linked anywhere in the main app
- Layer 2: @vesto.finance email + 6-digit passcode gate on the /admin route

## Done when
- [ ] Main app shows only Seller and Lender in role switcher
- [ ] No admin sub-nav visible anywhere in the main app
- [ ] /admin route renders AdminLogin2FA gate
- [ ] After auth, full admin panel renders with all existing screens intact
- [ ] Seller and Lender flows completely unaffected
- [ ] TypeScript clean, build clean, deployed
