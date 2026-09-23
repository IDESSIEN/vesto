# Vesto Hybrid Settlement System — Architecture & Build Plan

## What this solves
The current VestoEscrow contract relies entirely on admin calling `approvePayout` manually.
This creates a single point of failure: admin corruption, absence, or error can lock lender capital indefinitely.
The hybrid replaces admin as the primary settlement path with an automated, multi-layered system where admin is only an override.

---

## Design Constraints (from user answers)
- BaaS layer: provider-agnostic (adapter pattern, swappable)
- USDC direct repayment: supported from day one, incentivised with fee discount
- V2: strictly USDC-only repayment as the default path
- Architecture priority: lender capital protection above all else

---

## The 7 Layers

### Layer 1 — Buyer Acknowledgement (fraud prevention)
- Every invoice requires buyer countersignature before lenders can fund
- Buyer receives a unique payment reference link
- Confirmation is either a wallet signature (onchain) or a signed email hash (off-chain, stored in Supabase)
- Contract: `acknowledgeBuyer(bytes32 invoiceId, bytes calldata sig)` sets `invoice.buyerAcknowledged = true`
- Marketplace listing is blocked until `buyerAcknowledged == true`
- Eliminates fake/inflated invoice fraud at source

### Layer 2 — Virtual Account Per Invoice (payment routing)
- Each funded invoice is assigned a unique virtual bank account number by the BaaS adapter
- Buyer pays that specific account — provider can match payment to invoice with 100% certainty
- BaaS adapter interface (provider-agnostic):
  ```typescript
  interface BaaSAdapter {
    createVirtualAccount(invoiceId: string, amount: number, currency: string): Promise<VirtualAccount>
    verifyWebhookSignature(payload: string, sig: string): boolean
    parsePaymentEvent(payload: unknown): PaymentEvent
  }
  ```
- Supported adapters in V1: Stripe Treasury, Flutterwave, Nala Business (swap by env var)
- Virtual account details stored in Supabase `invoice_virtual_accounts` table

### Layer 3 — Automated Webhook Settlement with 24h Buffer
- BaaS provider fires POST to Supabase Edge Function `/functions/v1/payment-received`
- Edge Function flow:
  1. Verify HMAC webhook signature
  2. Parse payment event via BaaS adapter
  3. Match to invoice by virtual account ID
  4. Verify: `amount >= invoice.advanceAmount + fee`
  5. Verify: payment status is `settled` (not `initiated`)
  6. Store settlement record in `invoice_settlements` Supabase table
  7. Schedule `approvePayout` call for `now + 24h` (stored in `pending_settlements` table)
  8. Notify admin of pending auto-settlement (email + in-app)
- A separate cron Edge Function (`/functions/v1/process-settlements`) runs every 15 minutes and executes any pending settlements whose 24h window has passed and have no admin block

### Layer 4 — Admin Block Window
- During the 24h buffer, admin sees a "Pending Settlement" banner in the Admin dashboard
- Admin can call `blockPayout(invoiceId, reason)` on the contract within the window
- `blockPayout` moves invoice to `DISPUTED` state
- After 24h expires with no block, the cron job executes `approvePayout` automatically
- Admin is override, not primary path

### Layer 5 — Escrow Reversal Timer (guaranteed lender exit)
- `repaymentDeadline` set at funding time: `invoice.dueDate + 14 days grace period`
- After deadline: any lender can call `claimRefund(invoiceId)` to recover principal directly from escrow
- Contract does NOT require admin action to trigger refund
- On `claimRefund`: invoice state → `DEFAULTED`, seller credit limit frozen, admin notified
- Lender receives 100% of principal; yield is forfeited on default (this is disclosed at funding time)

### Layer 6 — USDC Direct Repayment (trustless fast path)
- `buyerRepay(bytes32 invoiceId)` function on contract
- Buyer sends exact USDC amount directly to contract
- Settlement is instant and trustless — no webhook, no buffer, no admin step
- Fee discount: 0.5% reduction applied automatically (`fee = fee * 0.995`)
- Available from day one; becomes the default path in V2

### Layer 7 — Partial Payment Handling
- If webhook payment amount is `>= 50%` but `< 100%` of required amount:
  - Proportional lender capital released immediately (e.g. 70% paid → 70% of principal + yield released)
  - Remaining 30% moved to shortfall escrow
  - 7-day cure window opens: buyer can top up to 100%
  - If cured within 7 days: full settlement executed
  - If not cured: shortfall portion moves to dispute; lender can claim proportional refund on the shortfall
- Payments below 50% are rejected and trigger an admin alert (likely fraud)

---

## Contract State Machine

```
PENDING
  → (admin approves listing) → LISTED
  → (buyer acknowledges) → BUYER_ACKNOWLEDGED
  → (lender funds) → FUNDED
    → (webhook received, buffer running) → PAYMENT_DETECTED
      → (admin blocks) → DISPUTED
      → (24h passes, no block) → SETTLED
    → (buyer calls buyerRepay) → USDC_REPAID → SETTLED
    → (partial payment) → PARTIAL_SHORTFALL
      → (cured) → SETTLED
      → (not cured) → DISPUTED
    → (repaymentDeadline passed) → DEFAULTED
SETTLED
  → seller calls claimPayout() — receives net advance
  → lender calls claimYield() — receives principal + yield
DEFAULTED
  → lender calls claimRefund() — receives principal only
DISPUTED
  → admin resolves → SETTLED or REFUNDED
```

---

## New Contract Functions

```solidity
// Layer 1
function acknowledgeBuyer(bytes32 invoiceId, bytes calldata sig) external;

// Layer 4
function blockPayout(bytes32 invoiceId, string calldata reason) external onlyAdmin;

// Layer 5
function claimRefund(bytes32 invoiceId) external;
// requires: block.timestamp > invoice.repaymentDeadline && !invoice.settled

// Layer 6
function buyerRepay(bytes32 invoiceId) external;
// transfers USDC from msg.sender, applies fee discount, marks settled

// Layer 7 (internal, called by approvePayout)
function _handlePartialPayment(bytes32 invoiceId, uint256 amountReceived) internal;
```

---

## New Supabase Tables

```sql
invoice_virtual_accounts (
  invoice_id      uuid references invoices(id),
  provider        text,           -- 'stripe' | 'flutterwave' | 'nala'
  account_id      text,           -- provider's virtual account ID
  account_number  text,           -- what the buyer sees
  created_at      timestamptz
)

invoice_settlements (
  invoice_id      uuid references invoices(id),
  provider        text,
  amount          numeric,
  currency        text,
  payer_name      text,
  payment_ref     text,
  settled_at      timestamptz,
  webhook_payload jsonb,          -- raw payload for audit
  status          text            -- 'pending_buffer' | 'executed' | 'blocked'
)

pending_settlements (
  invoice_id      uuid references invoices(id),
  execute_after   timestamptz,    -- settlement_received_at + 24h
  blocked         boolean default false,
  block_reason    text
)
```

---

## New Edge Functions

| Function | Trigger | Purpose |
|---|---|---|
| `payment-received` | BaaS webhook POST | Validates, matches, queues settlement |
| `process-settlements` | Cron every 15 min | Executes matured settlements, skips blocked |
| `notify-settlement` | After settlement | Emails lender + seller with transaction details |
| `handle-default` | After repaymentDeadline | Freezes seller credit, notifies all parties |

---

## Frontend Changes

- **Admin dashboard:** "Pending Settlement" queue with timer, Block button, full webhook payload viewer
- **Marketplace card:** Virtual account details shown after funding ("Buyer pays to: Account XXXXXX, Ref: VESTO-INV-001")
- **Lender Portfolio:** Settlement status per position (Detected / In Buffer / Settled / Defaulted), countdown timer to repaymentDeadline
- **Seller Dashboard:** Repayment instructions card (virtual account number, reference, amount due) shown after invoice is funded

---

## Build Sequence

1. Update `VestoEscrow.sol` — add all new functions and state machine
2. Write new Supabase migrations — 3 new tables
3. Write `payment-received` Edge Function with BaaS adapter pattern
4. Write `process-settlements` cron Edge Function
5. Update Admin dashboard — Pending Settlement queue + Block button
6. Update Lender Portfolio — settlement status + countdown timer
7. Update Seller Dashboard — repayment instructions card
8. Update Marketplace card — virtual account details post-funding
9. Re-audit contract (new functions add new attack surface)
10. Deploy contract to Arc Testnet, run integration test of full pipeline
11. Typecheck + build + deploy to Netlify + push to GitHub

---

## Done When
- [ ] All 7 hybrid layers implemented in contract
- [ ] BaaS adapter pattern written (provider-agnostic, 1 concrete adapter stubbed)
- [ ] `payment-received` Edge Function handles happy path, partial payment, and rejects below-50% payments
- [ ] `process-settlements` cron executes correctly after 24h buffer
- [ ] Admin can block a pending settlement within the buffer window
- [ ] Lender can call `claimRefund` after repaymentDeadline with no admin action required
- [ ] Buyer can call `buyerRepay` in USDC and receive fee discount
- [ ] Frontend shows settlement status, countdown, and repayment instructions
- [ ] TypeScript 0 errors, clean build
- [ ] Full test of happy path + default path + USDC direct path
