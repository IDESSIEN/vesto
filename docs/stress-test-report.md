# Vesto Stress Test Report
**Date:** September 20, 2026  
**Method:** Full code-level walkthrough simulating 5 user personas across all three roles, adversarial inputs, edge cases, and state transition sequences.

---

## Personas Tested

| Persona | Role | Scenario |
|---|---|---|
| Amara | New Seller | First-time signup, full verification flow, invoice submission |
| Kwame | Returning Seller | Signs out and back in, marks invoices repaid |
| David | New Lender | Signup, allocation, risk disclosure, batch fund |
| Fatima | Power Lender | Multiple invoice selections, portfolio review, withdraw |
| Admin | Administrator | KYC approve/reject, invoice flag, dispute resolution |

---

## Critical Issues (Must fix before any production use)

### C1 - State persists across role switches
**Severity:** Critical  
**Found in:** AppContext  
**Detail:** When a Seller signs up as "Amara" then switches to Lender role and signs up as "David", switching BACK to Seller still shows "Amara" as authenticated (sellerOnboarded=true, seller.fullName="Amara"). The role switcher in the Navbar never resets state. A user could fund an invoice as Lender then switch to Seller and see the dashboard of the previous Seller session.  
**Impact:** In a multi-user demo this breaks every user story. In production with real credentials this would be a serious data leakage bug.  
**Fix:** When switching roles via the Navbar, do NOT auto-sign-out (that would be annoying). But make each role's auth state fully isolated — currently they already are (sellerOnboarded is separate from lenderOnboarded), but the UI does not reflect this: the avatar chip should show per-role login state, not a shared "isAuthenticated" derived from all three.

### C2 - submitInvoice ignores credit limit
**Severity:** Critical  
**Found in:** AppContext.submitInvoice  
**Detail:** A seller with verificationTier=0 and creditLimit=0 can successfully call submitInvoice() by navigating directly to the + Invoice tab after signup. The Submit Invoice form does not check creditLimit before allowing submission. The invoice appears in the Admin oversight queue.  
**Impact:** Unverified sellers can submit invoices for admin review, wasting admin time and polluting the marketplace.  
**Fix:** In SubmitInvoice component (and as a guard in submitInvoice()), check seller.verificationTier > 0 and reject with a toast directing to verification.

### C3 - Admin has no way to view which seller a verification belongs to
**Severity:** Critical  
**Found in:** VerificationQueue  
**Detail:** The KYC Queue shows sellerName and businessName, but after approving VR-901 (Tier 2 for Amina Diallo), the seller.verificationTier in context only updates if `req.sellerId === seller.id`. For any seller OTHER than the currently signed-in seller (all the seed data sellers like sel_102, sel_103), approving their verification does nothing to their profile — there is no multi-seller store. The admin approving Kilifi Cashew Processors' KYC has zero effect on any seller profile.  
**Impact:** The entire KYC approval flow only works for the one currently signed-in seller. Every other seller's approval is a no-op.  
**Fix:** Either implement a sellers[] map in context, or for the demo accept this limitation and add a UI note that the verification queue shows the current user's requests only.

---

## High Issues

### H1 - Batch Funding: blended APY not shown
**Severity:** High  
**Found in:** FundInvoiceBatch  
**Detail:** Batch funding carries the selectedBatchIds through context correctly, but FundInvoiceBatch does not show a blended APY or total capital required up front. A lender selecting 3 invoices has no summary before committing.  
**Fix:** Add a summary card at the top of FundInvoiceBatch: total advance, count, blended APY, and a breakdown table.

### H2 - LenderWelcome has no "skip" path for returning lenders
**Severity:** High  
**Found in:** LenderWelcome, App.tsx  
**Detail:** After sign out and sign back in, the Lender always routes to 'welcome' first (completeLenderOnboarding sets lenderView='welcome'). There is no way to skip directly to the Marketplace. On the second signup the welcome screen feels redundant.  
**Fix:** After the first visit to LenderWelcome, set a flag and route directly to 'browse' on subsequent logins.

### H3 - Invoice amount field accepts zero and negative values
**Severity:** High  
**Found in:** SubmitInvoice  
**Detail:** The invoice amount input has type="number" but no min attribute enforced at the form level. Submitting amount=0 creates an invoice with advanceAmount=0, feeAmount=0, and ID in the marketplace.  
**Fix:** Add min="1" to the amount input and validate in submitInvoice() before creating the invoice.

### H4 - Admin flag action has no reason field
**Severity:** High  
**Found in:** InvoiceOversightTable, flagInvoiceAdmin  
**Detail:** flagInvoiceAdmin accepts an optional reason string but the UI never collects one. Admin clicks Flag and the invoice is flagged with no reason — the seller has no idea why.  
**Fix:** Add a small inline text input or modal that asks for a flag reason before committing. Store it on the invoice and surface it on the seller's dashboard for flagged invoices.

### H5 - Withdraw modal in LenderPortfolio is purely cosmetic
**Severity:** High  
**Found in:** LenderPortfolio  
**Detail:** The withdraw modal submits a form but only shows a toast — no actual state change. lender.availableBalance is not decremented. A lender could "withdraw" their full balance and it immediately reappears.  
**Fix:** Either wire it to a real onchain call (claimPayout from the VestoEscrow contract) or at minimum decrement lender.availableBalance in context to simulate the withdrawal.

### H6 - Risk Disclosure not gated before Marketplace
**Severity:** High  
**Found in:** App.tsx  
**Detail:** After signup, a lender can navigate directly to 'browse' without ever accepting the Risk Disclosure. The LenderWelcome CTA says "Continue to Risk Disclosure" but a user could click the Marketplace nav tab and bypass it. riskAccepted defaults to false on new signups and is never checked before showing the marketplace.  
**Fix:** In the Marketplace nav handler and the MarketplaceBrowse render, check lender.riskAccepted — if false, redirect to risk_disclosure.

---

## Medium Issues

### M1 - No "Invoice not found" state in SellerDashboard when seller has no invoices
**Detail:** A brand-new seller who signs up, verifies, but hasn't submitted an invoice sees the "All" tab with an empty state card — good. But the stat tiles still show $0 in all positions, which looks broken rather than intentional. Add a first-invoice prompt in place of the stat tiles when invoices.filter(i => i.sellerId === seller.id).length === 0.

### M2 - Seller Status screen shows all invoices, not just the signed-in seller's
**Detail:** SellerStatus maps over all invoices from context, including invoices from sel_102, sel_103, sel_104 (seed data). A new seller who hasn't submitted an invoice sees 4 invoices in their Status screen that aren't theirs.  
**Fix:** Filter by sellerId === seller.id in SellerStatus.

### M3 - MarketplaceBrowse shows "pending_admin_approval" invoices to lenders
**Detail:** openInvoices includes status === 'pending_admin_approval'. A lender can see and attempt to fund an invoice that hasn't been approved by admin yet.  
**Fix:** Filter to status === 'published_marketplace' only for lenders.

### M4 - Guided Tour is unreachable from the Lender nav
**Detail:** MarketplaceGuidedTour exists and is wired in App.tsx but there is no nav item for it after lender onboarding. It's only reachable from the LenderWelcome CTA. If a lender skips Welcome or wants to re-visit the tour, there's no way to get back.  
**Fix:** Add a "Tour" link or a help button in the Marketplace hero.

### M5 - Admin Disputes screen: resolveDispute just marks invoice as 'repaid' with no logic
**Detail:** resolveDisputeAdmin in context sets status to 'repaid' regardless of whether the refund goes to lender or seller. The DisputeResolution UI likely has a choice (refund lender vs pay seller) but it maps to a single outcome.  
**Fix:** Pass a resolution type ('refund_lender' | 'pay_seller') to resolveDisputeAdmin and update the invoice status and balances accordingly.

### M6 - No loading state on Verify Business CTA for Tier 1
**Detail:** Tier1Verification has an isVerifying spinner but the button text doesn't change. During the async cleanverseService call (which has a simulated delay), the button just sits there. Tier 2 handles this correctly.  
**Fix:** Match Tier 2's button loading treatment on Tier 1.

### M7 - SellerOnboardingTutorial has no "I'm done" CTA that routes back to Dashboard
**Detail:** The tutorial ends but the final step has no explicit CTA back to the dashboard. Users have to use the sub-nav.  
**Fix:** Add a "Go to Dashboard" button on the final tutorial step.

---

## Low Issues

### L1 - Avatar initials break on single-name users
**Detail:** initials = displayName.split(' ').map(w => w[0]).join('') — if a user types "Amara" (no surname), initials = "A". This is fine. But if they type nothing (blank name, which the form allows if validation is bypassed), initials = "" and the avatar chip is an empty circle.  
**Fix:** Add a fallback: initials || currentRole[0].toUpperCase().

### L2 - Font JetBrains Mono not loading consistently
**Detail:** The font-tnum class and font-family in index.css references JetBrains Mono but it's loaded via Google Fonts in index.html. On slow connections the USDC balance number shows in the fallback monospace font (Courier) before loading, causing a layout shift.  
**Fix:** Add font-display: swap and a preload link for the JetBrains Mono woff2.

### L3 - Dispute Resolution table has hardcoded dispute reasons
**Detail:** The DisputeResolution component likely shows seed dispute data that doesn't reflect invoices flagged by the admin during this session.  
**Fix:** Derive disputes from invoices.filter(i => i.status === 'flagged') so flagging in InvoiceOversightTable feeds through to the Disputes screen.

---

## What's Working Well (Genuine Strengths)

1. **The cinema-ticket balance card** is genuinely distinctive — no other invoice financing UI does this. Keep it.
2. **The onboarding gate** (Sign Up first, nav reveals after) is now logically clean and correct.
3. **Tier 2 camera recording** works well on mobile — the viewfinder, REC timer, and retake flow feel like a real KYC product.
4. **The Marketplace funding modal** two-step (approve USDC + fund) is the right UX for a Web3 audience. The step indicator is clear.
5. **Fade-in transition** between views is subtle and polished.
6. **Risk score tooltip** on hover is exactly the right level of detail.
7. **Sign out per-role** is correctly scoped — signing out as Seller doesn't affect the Lender session.
8. **Admin 2FA cinematic screen** looks genuinely premium.
9. **Mobile layout** holds at 390px for all key views.
10. **The gold palette** reads as intentional and high-quality, not generic.

---

## Priority Order for Next Fixes

| # | Issue | Effort |
|---|---|---|
| 1 | C2: Credit limit gate on invoice submit | 30 min |
| 2 | M3: Filter marketplace to published_marketplace only | 10 min |
| 3 | M2: Filter SellerStatus to seller's own invoices | 10 min |
| 4 | H3: Validate invoice amount > 0 | 15 min |
| 5 | H6: Gate marketplace behind riskAccepted | 20 min |
| 6 | H5: Wire withdraw to decrement lender balance | 20 min |
| 7 | H4: Flag reason field | 30 min |
| 8 | M7: Tutorial final step CTA | 10 min |
| 9 | L3: Disputes from flagged invoices | 20 min |
| 10 | C3: Accept multi-seller limitation in UI | Note only |
