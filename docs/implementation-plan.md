Plan mode can only write markdown plan files — it cannot generate PDFs, run scripts, or write to arbitrary paths. To actually create the six documents you need Build mode.

Here is exactly what I'll do the moment you switch: Good — I have enough context from the codebase to write these at the highest level. Here is the plan for all six documents, which I'll save now and execute in Build mode.

---

## Plan: Vesto Documentation Suite

**Six documents, each a self-contained styled HTML file rendered as a print-ready PDF via `@media print` CSS. Written to `docs/` in the repo. Full Vesto brand — dark editorial headers, gold accents, cinema-ticket pull-quotes, Space Grotesk + JetBrains Mono.**

**Scope: Full roadmap (V1 now → V2 multi-chain + institutional → V3 tokenised invoices). Audience: both investors and engineering team. Backend: Supabase V1 with Postgres migration path noted for V2.**

---

### Document 1 — Product Requirements Document (`docs/PRD.html`)
- Executive summary and problem statement (SME invoice financing gap in frontier markets)
- Product vision, mission, north-star metric
- Three user personas (Seller / Lender / Admin) with jobs-to-be-done
- Feature matrix: V1 / V2 / V3 columns, P0/P1/P2 priority rows
- Non-functional requirements (latency, uptime, compliance)
- Success metrics and KPIs per persona
- Out of scope (V1)
- Risks and mitigations table

### Document 2 — Technical Requirements Document (`docs/TRD.html`)
- System architecture diagram (text-based, ASCII-art style)
- Smart contract spec: `VestoEscrow.sol` functions, events, access control, Arc Testnet address
- Frontend stack: React 18, TypeScript, Vite, wagmi v2, ConnectKit, Tailwind, Sonner
- Wallet connection: ConnectKit, Arc Testnet chain config
- USDC integration: token address, decimals, approve + transfer pattern
- Off-chain backend: Supabase tables, RLS policies, Edge Functions
- Security requirements: reentrancy guards, USDC blocklist handling, pull-claim pattern
- API contracts (Supabase service functions)
- Environment variables reference
- V2/V3 technical evolution notes (CCTP bridging, tokenisation via ERC-1155)

### Document 3 — App Flow (`docs/APP_FLOW.html`)
- Complete user journey maps for all three roles (Seller / Lender / Admin)
- Step-by-step flows: Sign-up → KYC → Invoice submission → Admin review → Marketplace listing → Lender funding → Onchain settlement → Seller claim
- State machine for invoice lifecycle (6 states, 8 transitions)
- Error and edge-case branches (insufficient balance, verification rejection, dispute)
- Navigation map showing all screens and their routing logic

### Document 4 — UI/UX Brief (`docs/UIUX_BRIEF.html`)
- Design philosophy: Morpho-level intentionality, Vesto identity, restraint over decoration
- Design token system: colour palette, typography scale, spacing grid, elevation levels, motion tokens
- Signature components spec: cinema-ticket card, dark editorial panel, lifted tab selector, inline position strip, split yield badge
- Screen-by-screen direction: Seller Dashboard, Submit Invoice, Marketplace, Funding Modal, Lender Portfolio, Admin Oversight, Verification Queue
- Interaction principles: press affordance, empty states, loading states, error states
- Accessibility notes
- What NOT to do (AI fingerprints list)

### Document 5 — Backend Schema (`docs/BACKEND_SCHEMA.html`)
- Full Supabase/Postgres schema with all tables, columns, types, constraints, and indexes
- RLS policy definitions for Seller / Lender / Admin roles
- Storage bucket structure for KYC documents
- Edge Function contracts (verification webhook, invoice status update, analytics aggregation)
- Onchain ↔ off-chain sync pattern (event listener → Supabase write)
- V2 schema evolution: lender pools table, yield accrual ledger, multi-chain invoice mapping
- V3 additions: tokenised invoice NFT registry, secondary market order book

### Document 6 — Implementation Plan (`docs/IMPLEMENTATION_PLAN.html`)
- Phased roadmap: V1 (0–3 months), V2 (3–9 months), V3 (9–18 months)
- V1 sprint breakdown: 6 sprints, 2 weeks each, with deliverables and acceptance criteria
- Dependencies map (Supabase setup → contract verification → KYC API integration)
- Team structure and role assignments
- Risk register with probability/impact matrix
- Definition of done for each phase
- Cost estimates: infrastructure, third-party APIs, audit
- Launch checklist

---

All six files will open in the browser and print cleanly to PDF via Cmd+P / Ctrl+P with `@media print` styles. Each document is 15–25 pages equivalent.

**Switch to Build mode to generate all six documents.** Plan saved to `arc-studio-plans/VESTO_DOCS_PLAN.md`.

**Switch to Build mode** using the mode selector — the moment you do, I'll write all six documents in parallel. Here is a preview of what each will contain:

---

**Document 1 — PRD**
Problem statement (the $1.5T SME trade finance gap), three personas with jobs-to-be-done, a V1/V2/V3 feature matrix with P0/P1/P2 priorities, non-functional requirements, KPIs, and a risk table.

**Document 2 — TRD**
Full stack spec: `VestoEscrow.sol` at `0x6b3a34d3dbf8986560ccf67bae7aff0cfbe82e6b`, wagmi/ConnectKit wiring, USDC approve + pull-claim pattern, Supabase RLS architecture, all environment variables, and V2/V3 evolution notes.

**Document 3 — App Flow**
Complete journey maps for all three roles, the invoice lifecycle state machine (6 states, 8 transitions), a screen navigation map covering all 23 screens, and onchain settlement sequence.

**Document 4 — UI/UX Brief**
The full Vesto design token system (every hex, every spacing value), the 6 signature components specced in hand-level detail, screen-by-screen direction for the 7 critical flows, interaction principles, and the anti-pattern list.

**Document 5 — Backend Schema**
Every Postgres table, column, type, constraint, and index. RLS policies for all three roles. Supabase Storage bucket structure. Edge Function contracts. Onchain-to-offchain sync pattern. V2 and V3 schema evolution.

**Document 6 — Implementation Plan**
6 × 2-week V1 sprints with acceptance criteria, V2/V3 phased roadmap, risk register, infrastructure cost estimates, team structure, and a 25-item launch checklist.
