You already have a full answer to this — I sent it in the previous message. Here is a quick recap, then we move to building it.

---

**The hybrid uses 7 layers, each covering a different failure mode:**

- **Layer 1** — Buyer acknowledgement before any lender can fund (kills fake invoice fraud at source)
- **Layer 2** — Unique virtual bank account per invoice (eliminates payment matching ambiguity)
- **Layer 3** — Automated webhook settlement with a 24-hour buffer (auto-detects real payment, protects against bank reversal)
- **Layer 4** — Admin block window during the 24h buffer (human override without being the primary path)
- **Layer 5** — Escrow reversal timer (guaranteed principal recovery if buyer goes silent — no lender is ever locked in indefinitely)
- **Layer 6** — USDC direct repayment with fee discount (instant trustless settlement for crypto-native buyers)
- **Layer 7** — Partial payment handling (lenders get proportional capital back immediately, remainder goes to cure window)

**The lender protection answer:** yes, significantly safer. Under the current single-layer system, one admin failure or one undetected non-payment locks lender capital indefinitely. Under the hybrid, every risk vector has at least two independent protections. The only way a lender loses principal is if: the buyer defaults AND the escrow timer has not expired yet. And that is time-bounded, not permanent.

---

You answered the three planning questions as:

- **Build now:** Not yet — understand the architecture first
- **BaaS layer:** Provider-agnostic design
- **USDC buyers:** Can accommodate both now, strictly USDC in V2

So the plan is written to be BaaS-agnostic (the Edge Function accepts any provider's webhook format via an adapter pattern) and the USDC direct-repayment path is live from day one.

The full plan is saved. Switch to **Build mode** to implement it — the contract changes first, then the Edge Function, then the frontend settlement status UI. Now saving the hybrid settlement plan as its own document. Plan saved to `arc-studio-plans/HYBRID_SETTLEMENT_PLAN.md`.

---

Here is the precise answer to your question: **yes, the hybrid makes lender protection significantly stronger.** Here is why in concrete terms.

**Under the current system, a lender can lose in two ways:**
1. Admin never calls `approvePayout` — capital locked permanently
2. Admin calls it prematurely on a fraudulent invoice — capital lost

**Under the hybrid, every lender risk vector has two or more independent protections:**

| Risk | Primary protection | Backup protection |
|---|---|---|
| Fake invoice | Layer 1 buyer acknowledgement | Admin review before listing |
| Admin failure / absence | Layer 3 auto-settlement | Layer 5 escrow timer |
| Admin corruption | Layer 3 auto-settlement (unstoppable after 24h) | Layer 5 timer bypass |
| Buyer default | Layer 5 guaranteed principal recovery | Layer 7 partial release |
| Bank reversal fraud | Layer 3 24h buffer | Layer 4 admin block |
| Capital locked forever | Layer 5 time-bounded exit | Layer 6 USDC instant path |
| Partial non-payment | Layer 7 proportional release | Cure window before dispute |

**The key safety property:** no single actor — not admin, not the seller, not the BaaS provider — can permanently prevent a lender from recovering their principal. Layer 5 (the escrow reversal timer) is the unconditional floor. It requires no admin, no webhook, no third party. After the deadline, the contract returns the money. That is the guarantee.

**Switch to Build mode** to implement it. The contract changes come first — they are the foundation everything else depends on.
