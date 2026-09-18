# Vesto — UX Walkthrough Simulation Report
**Date:** September 18, 2026  
**Simulated users:** First-time Seller (Amina), experienced Lender (David), Admin reviewer  
**Device mix:** Desktop (1440px), Mobile (390px iPhone 15)

---

## Executive Summary

Vesto has a strong visual foundation. The deep navy / warm gold palette reads as premium and the cinema-ticket balance card is genuinely distinctive. However 7 friction points were found across the three roles that would cause a real user to pause, hesitate, or abandon a flow. None are unfixable. Severity ratings: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low.

---

## Role 1: Seller (Amina, first-time user, mobile)

### Flow: Sign Up → Tier 1 Verify → Submit Invoice → Dashboard

**1. 🔴 CRITICAL — No clear entry point**  
The app lands on the Seller Dashboard by default, not Sign Up. Amina sees a dashboard for someone else's data (pre-filled name, business name, invoices) with no prompt to create her own account. There is no onboarding gate. A new user has no idea they should click "Sign Up" in the sub-nav.  
**Fix:** On first load, show the Sign Up screen if no user session exists. Add a "New here? Create your account" banner on the Dashboard empty state.

**2. 🟠 HIGH — "Connect wallet" appears before trust is established**  
On the Sign Up form, a "Connect" button appears below the form divider before Amina has any context about what the wallet is for or why she needs it. For a user unfamiliar with Web3, this is the moment they leave.  
**Fix:** Move wallet connection to Step 2 (after basic account details are submitted). Add a one-line explainer: "Your wallet is your payment address — no seed phrase required. We'll guide you."

**3. 🟠 HIGH — Tier 1 verification breaks the design language**  
The Tier 1 Verification screen looks visually disconnected from the rest of the app — it uses the old token classes (`bg-surface-container`, `text-primary-container`) instead of the new Vesto design system. It feels like a different product.  
**Fix:** Restyle Tier1Verification and Tier2Verification with the same dark-card + gold-trim language used on the Dashboard and Marketplace.

**4. 🟡 MEDIUM — Submit Invoice form lacks visual feedback on the advance calculation**  
The live calculation ribbon shows the payout number updating, which is great. But it only shows "Immediate Payout" — not a clear breakdown of what the seller keeps, what the fee is, and when they get it. Sellers from markets like Kenya and Nigeria are very fee-conscious.  
**Fix:** Add a 3-row breakdown: Invoice Total → Advance (85%) → Fee (2%) → **Net Payout (83%)**. Use a simple visual bar to make the split tangible.

**5. 🟡 MEDIUM — Sub-nav is too long and exposes admin-style complexity to sellers**  
Sellers see 7 nav items including "Tier 1 ($500)", "Tier 2 ($5,000)", "Status", and "Tour" simultaneously. This is a menu designed around implementation, not a user's mental model.  
**Fix:** Collapse to 3 items: **Dashboard · + Invoice · Account**. Progressive disclosure: the verification and tour items should appear as cards on the Dashboard, not permanent nav items.

**6. 🟢 LOW — "Mark Repaid" on invoice rows has no confirmation step**  
Clicking "Mark Repaid" immediately triggers `repayInvoiceSeller()` — no modal, no "Are you sure?". This is a state change that cannot be undone.  
**Fix:** Add a single-step confirmation toast or modal before committing the state change.

---

## Role 2: Lender (David, experienced DeFi user, desktop)

### Flow: Sign Up → Marketplace → Fund Invoice

**7. 🔴 CRITICAL — Lender Sign Up doesn't connect to anything**  
David completes the Lender Sign Up form (name, capital range, investment style) and clicks "Create Lender Account" — he gets a toast and is dropped back at the Marketplace. None of the information he entered persists or changes anything. There is no confirmation of what just happened.  
**Fix:** After sign-up, show a one-screen "Welcome to Vesto, David" confirmation that acknowledges his capital range and shows the top 3 invoices that match his stated yield target. Creates a sense that the platform "knows" him.

**8. 🟠 HIGH — The allocation slider on Lender Sign Up is decorative**  
The slider for "Capital to Deploy" ($1k–$50k range) doesn't wire to anything downstream. The Marketplace shows the same invoices regardless of the slider value.  
**Fix:** Either remove the slider (honesty) or use it to pre-filter the Marketplace on first load. A filtered view on arrival feels like personalisation, not a gimmick.

**9. 🟠 HIGH — Funding modal has no wallet balance sufficiency check**  
If David's wallet has less USDC than the invoice advance amount, he discovers this only after the USDC `approve` transaction fails in the wallet. The modal shows his balance, but nothing warns him before he clicks "Fund on Arc."  
**Fix:** Before showing the CTA button, compare `usdcBalance` against `advanceAmount`. If insufficient, replace the button with a "Insufficient balance — get test USDC" state with a direct link to the Arc faucet.

**10. 🟡 MEDIUM — Batch Funding flow is reachable but underwhelming**  
Selecting multiple invoices and clicking "Batch (N)" navigates to FundInvoiceBatch. The batch screen is a plain list with no visual connection to the invoices selected in the Marketplace. It feels like starting over.  
**Fix:** Carry the selected invoice cards into the batch screen, show the combined capital requirement prominently, and show the blended yield APY across the batch as a headline number.

**11. 🟡 MEDIUM — "Risk Score" has no explanation**  
Invoice cards show a risk bar with a number (e.g., 78/100) but no legend. Is 78 good or bad? What does the score measure? First-time lenders won't know.  
**Fix:** Add a one-line tooltip on hover: "Score based on buyer payment history, invoice age, and seller tier. 70+ = Low Risk."

---

## Role 3: Admin (internal user, desktop)

### Flow: 2FA Login → Invoice Oversight → KYC Queue → Disputes → Analytics

**12. 🟠 HIGH — Admin 2FA screen uses old design tokens**  
The AdminLogin2FA screen uses `bg-primary`, `bg-surface-container-lowest`, and `text-on-surface-variant` — all legacy Material Design-style tokens that produce flat, unstyled results compared to the rest of the app. The 'A' avatar is just a plain navy square. This is the first thing an admin sees.  
**Fix:** Restyle AdminLogin2FA with the Vesto cinematic treatment: dark panel, gold strip, monospace TOTP input with a character-slot layout, and the Vesto V logo.

**13. 🟡 MEDIUM — KYC Queue "Approve/Reject" actions give no confirmation**  
Clicking Approve or Reject in the verification queue fires immediately. For a compliance-sensitive action, there should be a brief confirmation with the admin's name and timestamp recorded.  
**Fix:** Add a 2-second undo window ("Approved. Undo?") using a Sonner toast with an action button. This is a standard pattern in compliance tooling.

**14. 🟡 MEDIUM — Analytics page lacks data visualisation**  
The analytics screen has strong stat tiles but no charts. "Invoice Funding Rate" and "APY Trend" are shown as numbers — but the value of an analytics screen is seeing *trend over time*, not a snapshot.  
**Fix:** Add a simple 7-day sparkline SVG next to the key KPIs (can be hardcoded for the demo). Even a 60px wide SVG line chart communicates "this is a living platform" better than a static number.

**15. 🟢 LOW — "Admin 2FA" nav item is exposed to all roles**  
The Admin 2FA login is visible as a sub-nav item only when the Admin role is selected — that's correct. But it's also the *first thing* shown by default when switching to Admin, rather than the Invoice Oversight table.  
**Fix:** Make Invoice Oversight the default admin landing view. Admin 2FA should be a settings-area item, not a primary nav tab.

---

## Cross-Cutting Issues

**16. 🟠 HIGH — No loading states between view transitions**  
Clicking a sub-nav item renders the new view instantly with all its data, but there's no skeleton or transition. On a slow connection this would feel frozen for 100–200ms, then suddenly render — janky. On a fast connection it's fine, but a 150ms fade-in transition between views would make the app feel polished.

**17. 🟡 MEDIUM — Toast messages are informational but not actionable**  
Success toasts say "Account created!" but don't tell the user what to do next. In a multi-step onboarding flow, each toast should include a next-step hint: "Account created! → Next: Verify your ID."

**18. 🟢 LOW — No favicon / PWA manifest**  
The browser tab shows a generic Vite favicon. A simple V-logo favicon in the Vesto gold takes 5 minutes and makes the app feel shipped.

---

## Priority Fix Order

| # | Screen | Issue | Severity |
|---|--------|-------|----------|
| 1 | All | No entry-point gate for new users | 🔴 Critical |
| 2 | Lender Sign Up | Form data doesn't persist or personalise | 🔴 Critical |
| 3 | Marketplace Modal | No insufficient balance guard on Fund CTA | 🟠 High |
| 4 | Seller Sign Up | Wallet connect too early, no context | 🟠 High |
| 5 | Tier 1/2 Verify | Broken design language | 🟠 High |
| 6 | Admin 2FA | Old design tokens | 🟠 High |
| 7 | Submit Invoice | Fee breakdown not visual enough | 🟡 Medium |
| 8 | Marketplace | Risk score has no tooltip | 🟡 Medium |
| 9 | Analytics | No sparkline / trend charts | 🟡 Medium |
| 10 | All | No transition animation between views | 🟠 High |

---

## What's Working Well

- The cinema-ticket balance card on the Seller Dashboard is genuinely distinctive. No other invoice financing UI does this.
- The gold APY badge on invoice cards is prominent and immediately communicates the yield proposition.
- Mobile layout is clean — the navbar compression and scrollable sub-nav work well at 390px.
- The funding modal 2-step flow (approve → fund) with step indicators is clear and correctly sets expectations for a wallet user.
- The pool health bar and live opportunity badge on the Marketplace hero are strong first-impression elements.
- The payout claim banner (green, pulsing) on the Seller Dashboard correctly draws attention when funds are ready.

---

*Report generated from code-level simulation of all user flows.*
