# Vesto Documentation Suite — Build Plan

## Overview
Six standalone HTML documents written to `docs/` in the repo.
Each is print-ready via `@media print` CSS — open in browser, Cmd+P → Save as PDF.
Full Vesto brand: dark editorial headers, gold accents (#B8821E), Space Grotesk + JetBrains Mono, cinema-ticket pull-quotes.
Scope: Full roadmap (V1 → V2 → V3). Audience: investors + engineering. Backend: Supabase V1 with Postgres V2 path.

---

## Files to Create

| # | File | Title |
|---|------|--------|
| 1 | `docs/PRD.html` | Product Requirements Document |
| 2 | `docs/TRD.html` | Technical Requirements Document |
| 3 | `docs/APP_FLOW.html` | App Flow & User Journey Maps |
| 4 | `docs/UIUX_BRIEF.html` | UI/UX Design Brief |
| 5 | `docs/BACKEND_SCHEMA.html` | Backend Schema & Data Architecture |
| 6 | `docs/IMPLEMENTATION_PLAN.html` | Implementation Plan & Roadmap |

---

## Document 1 — PRD (`docs/PRD.html`)
- Executive summary: SME invoice financing gap in frontier markets
- Product vision, mission, north-star metric (total USDC advanced per month)
- Three personas: Seller (SME exporter), Lender (yield-seeking capital deployer), Admin (Vesto operator)
- Jobs-to-be-done per persona
- Feature matrix: V1 / V2 / V3 columns, P0/P1/P2 priority rows
- Non-functional requirements: <1s Arc finality, 99.9% uptime, GDPR/KYC compliance
- Success metrics and KPIs
- Out of scope (V1)
- Risk and mitigation table

## Document 2 — TRD (`docs/TRD.html`)
- System architecture overview (layered diagram in HTML/CSS)
- Smart contract: `VestoEscrow.sol` — functions, events, access control, Arc Testnet address `0x6b3a34d3dbf8986560ccf67bae7aff0cfbe82e6b`
- Frontend stack: React 18, TypeScript 5, Vite 5, wagmi v2, ConnectKit, Tailwind CSS 3, Sonner
- Wallet: ConnectKit, Arc Testnet chain ID and RPC
- USDC: token address, 6 decimals, approve + transfer flow, pull-claim pattern
- Off-chain: Supabase tables, RLS, Edge Functions
- Security: reentrancy guard, USDC blocklist handling, admin pre-registration, no push-settlement
- Environment variables reference
- V2/V3 technical evolution: CCTP bridging, ERC-1155 tokenisation

## Document 3 — App Flow (`docs/APP_FLOW.html`)
- User journey maps: Seller / Lender / Admin (full happy path + error branches)
- Invoice lifecycle state machine: 6 states, 8 transitions, visual diagram
- Screen navigation map: all 23 screens, routing logic
- Error branches: insufficient balance, KYC rejection, dispute, USDC blocklist
- Onchain settlement sequence diagram

## Document 4 — UI/UX Brief (`docs/UIUX_BRIEF.html`)
- Design philosophy: Morpho-level intentionality applied to Vesto identity
- Token system: colour palette (hex values), type scale, 6px spacing grid, 5-level elevation, motion
- Signature components: cinema-ticket card, dark editorial panel, lifted tab selector, inline position strip, split yield badge, RiskMeter
- Screen-by-screen direction for all 7 critical flows
- Interaction principles: press affordance (scale 0.97), empty states, loading states, error states
- Accessibility: WCAG AA contrast, focus-visible rings, ARIA labels
- Anti-pattern list: what NOT to do (AI fingerprints, rounded-2xl defaults, blended yields)

## Document 5 — Backend Schema (`docs/BACKEND_SCHEMA.html`)
- Full Postgres schema: all tables with columns, types, constraints, indexes
  - `profiles`, `seller_profiles`, `lender_profiles`
  - `invoices`, `invoice_documents`
  - `verification_requests`, `verification_documents`
  - `admin_notes`, `disputes`
  - `platform_analytics` (materialised view)
- RLS policies: Seller / Lender / Admin access rules
- Supabase Storage: `kyc-documents` and `invoice-documents` buckets
- Edge Functions: `process-verification`, `update-invoice-status`, `aggregate-analytics`
- Onchain ↔ off-chain sync: Arc event listener → Supabase write pattern
- V2 additions: `lender_pools`, `yield_accrual_ledger`, `multi_chain_invoice_map`
- V3 additions: `tokenised_invoices`, `secondary_market_orders`

## Document 6 — Implementation Plan (`docs/IMPLEMENTATION_PLAN.html`)
- V1 (0–3 months): 6 × 2-week sprints with deliverables and acceptance criteria
  - Sprint 1: Supabase wiring + auth
  - Sprint 2: KYC API integration (Smile Identity or similar)
  - Sprint 3: Contract verification on Arc + production USDC address
  - Sprint 4: Admin dashboard hardening + audit trail
  - Sprint 5: Performance + bundle splitting
  - Sprint 6: Security audit + launch prep
- V2 (3–9 months): multi-chain CCTP, institutional lender onboarding, yield accrual ledger
- V3 (9–18 months): tokenised invoices (ERC-1155), secondary market, governance
- Team structure and role assignments
- Risk register: probability × impact matrix
- Infrastructure cost estimates
- Launch checklist (25 items)

---

## Build Sequence
1. Create shared CSS/brand stylesheet (inline in each file for portability)
2. Write all 6 HTML files in parallel
3. Verify each opens cleanly in browser
4. Commit to `docs/` and push to GitHub

## Done When
- [ ] All 6 `.html` files exist in `docs/`
- [ ] Each file prints cleanly to PDF via browser print dialog
- [ ] No broken references or missing fonts (fonts loaded via Google Fonts CDN)
- [ ] All contract addresses, type names, and screen names match the actual codebase
- [ ] Pushed to `IDESSIEN/vesto` GitHub repo
