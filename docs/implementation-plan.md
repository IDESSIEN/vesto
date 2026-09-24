Yes. Here are the exact UI changes, screen by screen, so you know precisely what will change before a single line is written.

---

## Screens that change

### 1. Admin — Invoice Oversight Table (`InvoiceOversightTable.tsx`)

**What changes:**
The Approve button currently fires immediately with no modal. It will now open a verification panel / modal instead.

**New elements:**
- A "Settlement Terms" block inside the approval modal containing the four fields (Invoice Due Date read-only, Grace Period stepper, Final Repayment Deadline date picker, Lender Lock-up derived read-only)
- The Override Reason dropdown — hidden by default, appears when admin changes the grace period from 14
- Warning banners (amber strip for W-01 through W-06, red strip for V-03 W-03)
- A confirmation summary step before final approval showing all four settlement values
- The "Ack." button column already exists — no change there

**What it looks like now vs after:**

Now: `[Approve]` button → invoice immediately moves to approved state.

After: `[Approve]` button → opens a dark modal with the settlement terms block → admin reviews / adjusts → clicks "Confirm and approve" → invoice moves to approved with deadline locked.

---

### 2. Admin — Verification Queue (`VerificationQueue.tsx`)

**What changes:**
Same as above — the T1/T2 KYC approve action currently has no settlement step. Since KYC approval and invoice approval are separate flows, the settlement modal only appears on the invoice approval path, not on KYC approval. No change to VerificationQueue.

---

### 3. Marketplace — Invoice Card (`MarketplaceBrowse.tsx`)

**What changes:**
Two new data points added to the card, both derived from `finalRepaymentDeadline`:

Before (current thesis line):
```
60d trade receivable · AgriCo Ltd · 94% on-time · A+ grade
```

After:
```
60d trade receivable · AgriCo Ltd · 94% on-time · A+ grade
Lender exit: 22 Oct 2026 · 28d lock-up
```

The "Lender exit" line is a second line below the thesis in `text-[10px]` — navy for normal, amber if ≤14 days remaining, red if ≤7 days.

**Funding modal deal facts table** gets one new row:
```
Final repayment deadline    22 Oct 2026
Lender lock-up              28 calendar days
```
Replaces the current generic "Term" placeholder row.

---

### 4. Lender Portfolio — Position rows (`LenderPortfolio.tsx`)

**What changes:**
The `SettlementCountdown` component already exists and shows a countdown. It currently calculates days from a hardcoded offset. After the change it reads the actual `finalRepaymentDeadline` date from the invoice record.

Visual change is minimal — the countdown number and urgency colour will now reflect the admin-set deadline rather than a formula. If an admin set a 7-day grace period on an invoice, a lender in their portfolio will see a tighter countdown than they would have seen before.

---

### 5. Seller Dashboard — Repayment instructions card

**What changes:**
The card that shows the buyer their virtual account number and payment deadline currently shows `invoiceDueDate`. After the change it shows `finalRepaymentDeadline` (the hard cutoff) alongside the contractual due date:

```
Invoice due date:           15 Oct 2026  ← when buyer should pay
Final settlement deadline:  22 Oct 2026  ← last possible date before lender can claim refund
```

This distinction matters for the seller — they need to know that chasing the buyer must happen before the 22nd, not just by the 15th.

---

## Screens that do NOT change

- `SellerSignUp`, `LenderSignUp`, `AdminLogin2FA` — no change
- `SubmitInvoice` — no change (seller does not set the deadline)
- `Tier1Verification`, `Tier2Verification` — no change (KYC flow, unrelated)
- `SellerStatus` — no change
- `BuyerMonitoring` — the deadline column already shows `finalRepaymentDeadline`; once it is admin-set it will just show a more precise date. No layout change.
- `AnalyticsOverview`, `DisputeResolution` — no change
- `AcknowledgePage` — no change

---

## Summary of new UI elements count

| Element | Screen | New or modified |
|---|---|---|
| Settlement terms block (4 fields) | Admin approval modal | New |
| Override reason dropdown | Admin approval modal | New |
| Warning banners (up to 3 types) | Admin approval modal | New |
| Confirmation summary step | Admin approval modal | New |
| "Lender exit" line on card | MarketplaceBrowse card | New line |
| Deadline + lock-up rows in funding modal | MarketplaceBrowse modal | New rows |
| SettlementCountdown data source fix | LenderPortfolio | Modified |
| Dual date display (due vs deadline) | SellerDashboard repayment card | Modified |

Eight discrete UI changes across four screens, all additive — nothing is removed, only extended.

Ready to build?
