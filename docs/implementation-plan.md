Based on your answers — both the role switcher and sub-nav should be hidden, Admin should be a completely separate page, and the existing email + passcode gate should stay as a second layer — here is the precise plan before we touch a single line of code.

---

## The problem in concrete terms

Right now the app has three roles in one place. The navbar shows a role switcher with Seller, Lender, and Admin visible to everyone. When someone clicks Admin they see the 2FA login — but the fact that an admin interface exists at all is already exposed. On mobile the sub-nav tabs (Invoices, KYC Queue, Disputes, Buyers, Analytics) are also partially visible before authentication.

---

## The correct architecture

**The main app** (`clever-alpaca-c23dbf.netlify.app`) shows only Seller and Lender. Admin is completely absent — no tab, no option, no hint it exists.

**The admin portal** lives at a separate route — `/admin` or a path you choose — that is not linked from anywhere in the main app. You share the URL privately with your admin team. Anyone who navigates there directly sees only the existing `@vesto.finance` email + 6-digit passcode gate. Nothing else is visible until they authenticate.

---

## Exactly what changes and what does not

**What changes:**
1. Remove Admin from the role switcher in the navbar — the switcher shows only Seller and Lender
2. Remove the Admin sub-nav from App.tsx — it does not render at all on the main app
3. Add a dedicated `/admin` route in the router that renders a self-contained `AdminPortal` component
4. The `AdminPortal` component renders the existing `AdminLogin2FA` screen first, then — after successful authentication — renders the full admin panel with all existing screens (Invoices, KYC Queue, Disputes, Buyers, Analytics, Security) unchanged
5. The admin panel state stays in AppContext — nothing is ripped out, the `isAdminAuthenticated` flag simply moves to being set by the `/admin` route instead of the role switcher

**What does not change:**
- Every admin screen (InvoiceOversightTable, VerificationQueue, DisputeResolution, BuyerMonitoring, AnalyticsOverview, AdminLogin2FA) — zero changes to any of these files
- The existing `@vesto.finance` email + 6-digit passcode gate — stays exactly as is
- The `completeAdminOnboarding` and `signOut` logic in AppContext — unchanged
- All the security hardening from the RLS migration — unchanged
- The Seller and Lender flows — completely untouched

---

## The two-layer security model after the change

**Layer 1 — Obscurity:** The admin URL is not published or linked anywhere. You only share it with your team. The main app has no trace of admin functionality.

**Layer 2 — Authentication:** Anyone who finds or guesses the URL still hits the `@vesto.finance` email + 6-digit passcode gate before seeing anything. These are two independent barriers.

---

## The four files that change

1. `src/App.tsx` — remove Admin from the role switcher; remove the admin sub-nav and admin view router; add the `/admin` route handler
2. `src/main.tsx` — add the `/admin` path to the router so it renders `AdminPortal`
3. `src/components/admin/AdminPortal.tsx` — new file, thin wrapper that renders `AdminLogin2FA` or the full admin panel based on auth state (reuses everything that already exists)
4. `src/components/common/Navbar.tsx` — hide the Admin option from the role switcher (one conditional)

No other files change. All existing admin screens are untouched.

---

Ready to build? Say "build it" and I'll implement all four changes. Plan saved to `arc-studio-plans/ADMIN_SEPARATION_PLAN.md`.

Switch to **Build mode** and say "build it" — I'll implement all four changes cleanly without touching any admin screen files.
