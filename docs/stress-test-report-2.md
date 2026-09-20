# Vesto Platform — Stress Test Report 2
**Date:** September 20, 2026  
**Tester:** Arc Studio (simulated multi-role walkthrough)  
**Build:** Post all 19-issue fixes + camera fix + admin validation fix  
**Live URL:** https://clever-alpaca-c23dbf.netlify.app

---

## Executive Summary

This second stress test covers three complete user journeys: Seller (sign up through invoice submission and tier verification), Lender (sign up through marketplace funding and portfolio management), and Admin (2FA login through KYC approval, invoice oversight, and dispute resolution). The build is significantly stronger than the first test. The onboarding gates, design system, and core flows all hold up. Six issues remain — one Critical, two High, and three Medium. No Low issues.

---

## Overall Scorecard

| Severity | Count | Status |
|---|---|---|
| Critical | 1 | Open |
| High | 2 | Open |
| Medium | 3 | Open |
| Low | 0 | None |
| **Total** | **6** | |

---

## Critical Issues

### C1 — Seller initial state is pre-populated with demo data
**Location:** AppContext.tsx, initialSeller  
**What happens:** When a new seller signs up, `completeSellerOnboarding` spreads `initialSeller` as the base, which contains `verificationTier: 1`, `kycStatusTier1: 'verified'`, `totalFinanced: 4500`, and other demo values. The override resets `verificationTier` to 0 and `creditLimit` to 0 correctly, but `totalFinanced: 4500` is NOT reset — a brand new seller immediately shows $4,500 financed on their dashboard. Similarly, the credit utilisation bar calculates against `availablePayout: 1020` from `initialSeller` if any merge path leaks it through.  
**Impact:** Misleads the seller into thinking they have financing history they don't have. Breaks trust if shown to investors or reviewers.  
**Fix:** In `completeSellerOnboarding`, explicitly reset `totalFinanced: 0`, `availablePayout: 0`, `usedLimit: 0` alongside the existing resets.

---

## High Issues

### H1 — Admin 2FA accepts any 6-digit code
**Location:** AdminLogin2FA.tsx, handleLogin  
**What happens:** The 2FA validation only checks that `passcode.length >= 6`. Any 6-digit number — `000000`, `123456`, `999999` — is accepted. There is no hardcoded demo code, no TOTP simulation, and no indication to the user what the correct code is.  
**Impact:** The gate provides zero security. Any attacker who knows the UI structure can log in as admin with `admin@vesto.finance` + `123456`. For a demo/testnet app this is acceptable risk but it creates a false impression of security.  
**Fix (for demo):** Define a demo TOTP code (e.g. `246810`) in the component and show a hint: "Demo code: 246810". Reject all other codes with a clear error. For production, integrate a real TOTP library.

### H2 — Lender portfolio does not reflect funded invoices correctly
**Location:** LenderPortfolio.tsx  
**What happens:** After a lender funds an invoice in the marketplace, the portfolio's "Active Investments" section still shows seed data invoices (`INV-2026-6102 Rift Valley Logistics`) which are from `fundedByLenderId: 'len_505'`. But the actual signed-in lender's ID is also `len_505` (hardcoded in `completeLenderOnboarding`). So all seed funded invoices always appear in every new lender's portfolio regardless of who signed up. A lender who just signed up and funded zero invoices sees pre-existing portfolio entries.  
**Impact:** Misleading portfolio data. A lender who funds one invoice sees 2 entries — theirs and the seed data's. Total invested amounts double-count.  
**Fix:** Either clear seed invoices on new lender sign-up, or assign seed invoice lender IDs to a different fixed ID (`len_seed`) so they don't collide with the signed-in lender.

---

## Medium Issues

### M1 — Sign Up forms accept empty/whitespace-only names
**Location:** SellerSignUp.tsx, LenderSignUp.tsx  
**What happens:** Both forms use `required` on the name field but browsers allow whitespace-only strings through `required` validation. A seller can sign up as `"   "` (spaces only), which then renders their avatar initial as blank and their dashboard header name as empty.  
**Impact:** Cosmetically broken dashboard. Avatar initial shows blank. The "Your Progress" header shows no name.  
**Fix:** Add `.trim().length > 0` validation on submit and show an inline error: "Please enter your full name."

### M2 — Seller can submit an invoice exceeding their credit limit
**Location:** SubmitInvoice.tsx, AppContext.submitInvoice  
**What happens:** The UI correctly gates the submit invoice page behind `verificationTier > 0`, but there is no check that `invoice.advanceAmount <= seller.creditLimit - seller.usedLimit`. A Tier 1 seller with a $500 limit can submit a $10,000 invoice. The invoice goes to admin review with the full amount, and if approved, the seller's credit utilisation bar overflows.  
**Impact:** Credit limit is purely cosmetic. Defeats the purpose of the tiered verification system.  
**Fix:** In `SubmitInvoice`, cap the advance amount to `Math.min(amount * advanceRate, seller.creditLimit)` and show an inline "Amount exceeds your $500 credit limit" error if exceeded.

### M3 — Risk Disclosure can be bypassed after first acceptance
**Location:** AppContext, completeLenderOnboarding  
**What happens:** `riskAccepted` is set to `false` on sign-up, but `RiskDisclosure.tsx` is only shown if the lender navigates to it manually via the lender sub-nav. The Marketplace is accessible without ever accepting the risk disclosure. After sign-out and re-login, `riskAccepted` resets to `false` again, but the marketplace is still accessible.  
**Impact:** Regulatory and compliance concern. Lenders can fund invoices without formally accepting the risk terms.  
**Fix:** In `MarketplaceBrowse`, check `lender.riskAccepted`. If false, show a blocking banner: "Please review and accept the Risk Disclosure before investing." with a direct link to the disclosure screen.

---

## What is Working Well

- **Onboarding gates** are solid: all three roles land on their sign-in screen and cannot reach protected views without completing sign-up.
- **Camera recording** on Tier 2 now shows live viewfinder correctly. The always-mounted `<video>` element fix works.
- **Admin login validation** correctly rejects non-`@vesto.finance` emails and codes shorter than 6 digits. The button disables properly.
- **Marketplace funding flow** (approve USDC + fund) is the strongest part of the app — the 2-step modal, insufficient balance guard, and Arc explorer link are all production-quality.
- **Sign-out** works correctly for all three roles. State resets cleanly.
- **Mobile layout** holds at 390px across all screens.
- **Your Progress** checklist on the Seller Dashboard is an excellent UX pattern — clear, actionable, non-intrusive.
- **Design system** is consistent throughout: gold accents, dot-matrix textures, JetBrains Mono for numbers, and the cinema-ticket hero card are visually distinctive and non-generic.
- **Dispute resolution** with Refund Lender / Pay Seller buttons is correctly wired and updates balances.
- **Batch funding** correctly carries selected invoice IDs through to the batch screen.

---

## Priority Fix Order

1. **C1** — Reset seller `totalFinanced`, `availablePayout`, `usedLimit` on sign-up (5 min fix)
2. **H1** — Add demo TOTP code `246810` with hint and rejection of others (10 min fix)
3. **H2** — Change seed invoice `fundedByLenderId` to `len_seed` so it doesn't collide (5 min fix)
4. **M1** — Trim validation on name fields in both sign-up forms (10 min fix)
5. **M2** — Cap invoice amount against credit limit in SubmitInvoice (15 min fix)
6. **M3** — Gate Marketplace behind `riskAccepted` check with blocking banner (10 min fix)

**Total estimated fix time: ~55 minutes**

---

## Conclusion

Vesto is in strong shape. The core invoice financing loop (submit → review → publish → fund → repay → claim) works end-to-end for all three roles. The design is distinctive and intentional. The six remaining issues are all tractable and do not block the primary user journeys — they are edge cases and guard rails that should be tightened before a real user demo.
