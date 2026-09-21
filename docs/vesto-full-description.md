# Vesto — Full Application Description
**Invoice Capital, Onchain**
*Last updated: September 20, 2026*

---

## What Vesto Is

Vesto is a full-stack invoice financing marketplace built on the Arc blockchain with USDC as the settlement currency. It connects three parties:

- **Sellers** (agricultural exporters and commodity traders) who hold unpaid invoices from large buyers and need immediate cash advances
- **Lenders** (retail and institutional investors) who provide liquidity by funding those invoices and earn yield on their capital
- **Admins** (platform operators) who oversee KYC verification, approve invoices for the marketplace, and resolve disputes

The platform digitises what has historically been done by factoring companies and trade finance banks — advancing a percentage of an invoice's face value to the seller, then collecting repayment from the buyer and paying the lender their principal plus yield. Every settlement happens in USDC on Arc Testnet, with a deployed Solidity escrow contract handling onchain custody.

---

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** build tool with HMR
- **Tailwind CSS v3** for utility-first styling
- **Framer Motion** (available, used for transitions)
- **wagmi v2** for Ethereum wallet hooks (useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt)
- **ConnectKit** for wallet connection UI (MetaMask, Coinbase Wallet, injected wallets)
- **viem** for ABI encoding and contract interaction
- **Sonner** for toast notifications
- **Google Fonts**: Space Grotesk (display/headings), DM Sans (body), JetBrains Mono (financial numbers)

### Blockchain
- **Chain**: Arc Testnet (Chain ID 5454)
- **Native gas token**: USDC (Arc's native asset IS USDC — no separate gas token)
- **USDC contract**: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` (6 decimals, ERC-20)
- **Escrow contract**: `VestoEscrow` at `0x6b3a34d3dbf8986560ccf67bae7aff0cfbe82e6b`
- **Admin wallet**: `0x5B12Ce46C7194aD57d143bC22847224047b1Ef42` (platform deployer)

### Smart Contract
`VestoEscrow.sol` — a Solidity ^0.8.20 contract using OpenZeppelin 5.1.0:
- `ReentrancyGuard` on all state-changing transfer paths
- `SafeERC20` for all USDC transfers
- Pull-claim payment model (no push transfers — prevents blocklist lock)
- Admin pre-registration of invoices before lenders can fund them (prevents invoice ID squatting)
- Precompile and zero-address guards on all recipient fields
- Functions: `adminRegisterInvoice`, `fundInvoice`, `approveRepayment`, `flagDispute`, `resolveDispute`, `claimPayout`, `getInvoice`
- Events: `InvoiceRegistered`, `InvoiceFunded`, `RepaymentApproved`, `DisputeFlagged`, `DisputeResolved`, `PendingClaimAdded`

### State Management
A single `AppContext` (React Context + useState) manages the entire application state:
- Role switching (seller / lender / admin) and per-role view routing
- Onboarding gates (`sellerOnboarded`, `lenderOnboarded`, `adminOnboarded`)
- Seller and lender profile objects
- Invoice array with full lifecycle status tracking
- Verification request queue
- Seller registry map (for admin KYC approvals affecting any seller, not just the signed-in one)
- Platform analytics (derived + seeded)
- Toast notification system (4-second auto-dismiss)

### Backend / Persistence
- **Supabase** integration (optional, gated behind `isSupabaseConfigured`): saves invoices and verification documents off-chain when configured. Falls back to in-memory state when not configured.
- No server process — pure client-side SPA with Supabase as the optional backend

### Hosting
- **Live URL**: https://clever-alpaca-c23dbf.netlify.app
- **GitHub**: https://github.com/IDESSIEN/vesto
- **Build**: Vite production build, `dist/` folder deployed to Netlify

---

## Design System

### Color Palette
| Token | Value | Usage |
|---|---|---|
| `--primary` / ink navy | `#0A1628` | Navbar, headings, dark cards |
| `--primary-mid` | `#112240` | Gradient mid-point |
| `--canvas` | `#F8F6F1` | Page background (warm parchment) |
| `--surface-card` | `#FEFCF8` | Card backgrounds (cream) |
| `--gold` | `#C9922A` | Primary accent (active states, CTA buttons) |
| `--gold-light` | `#E8B96A` | Gold gradient end, soft highlights |
| `--gold-soft` | `#FDF0D5` | Gold-tinted backgrounds, badge fills |
| `--accent` (forest green) | `#047857` | Money-positive states ONLY (funded, verified, yield) |
| `--error` | `#EF4444` | Destructive, rejected, high-risk |
| `--secondary` | `#4A5568` | Body copy, labels |

### Typography
- **Headlines**: Space Grotesk, `font-extrabold` (800), `letter-spacing: -0.025em`
- **Body**: DM Sans, `font-normal` (400)
- **Financial numbers / IDs**: JetBrains Mono, tabular numerals (`font-tnum`)
- **Labels / caps**: `text-[10px]` uppercase with `tracking-widest`

### Signature Visual Elements
- **Cinema-ticket balance card**: dark gradient hero card with a 3px gold top strip, diagonal dot-matrix texture (radial-gradient SVG), a dashed perforation line separating the balance from the stats strip
- **Gold gradient CTA buttons**: `linear-gradient(135deg, #C9922A, #E8B96A)` with `shadow-gold`
- **Frosted dark navbar**: full-bleed `#0A1628` with a 2px gold bottom accent line
- **Active nav pills**: gold gradient background
- **Dark editorial side panels**: used on all sign-up and admin screens — deep navy with dot-matrix texture, gold strip, radial glow
- **Status pulse badges**: `animate-pulse` on live/active states
- **View fade-in animation**: `vesto-fade-in` keyframe (opacity 0→1, translateY 6px→0, 180ms) on every view switch

---

## Application Structure

### Navigation
The app has a top-level role switcher in the Navbar: **Seller**, **Lender**, **Admin**. Each role has its own view stack, onboarding gate, and sub-navigation bar.

**Pre-login (all roles):** only the Sign Up / Sign In tab is visible.
**Post-login:** full sub-nav revealed, specific to role.

### Seller Flow (6 screens)

#### 1. Seller Sign Up (`sellerView: 'signup'`)
**Default landing for all new users.**
- Split-screen editorial layout: dark left panel with "Advance your invoices, not your debt." headline, gold accent, benefit callouts (Cash in 24 hours, Verified Buyers, Onchain Settlement), and a quote from a fictional seller
- Right panel: 3-step progress indicator, full name (whitespace-validated, inline error), email, mobile number with country code selector (Kenya +254, Nigeria +234, US +1, UK +44), registered business name (whitespace-validated, inline error), operating jurisdiction selector
- "Connect wallet" is NOT shown on step 1 — a gold-bordered explainer card below the CTA says "You'll connect a wallet in the next step — no seed phrase required" with a smaller optional "Connect now" link for existing wallet holders
- On submit: `completeSellerOnboarding` writes trimmed data to context, resets all financial fields to 0 (`totalFinanced: 0`, `availablePayout: 0`, `usedLimit: 0`, `creditLimit: 0`, `verificationTier: 0`), routes to Dashboard

#### 2. Seller Dashboard (`sellerView: 'dashboard'`)
**The primary hub for all seller activity.**
- **Cinema-ticket balance card**: dark gradient hero with dot-matrix texture, 64px `font-tnum` USDC number, 3px gold top strip, dashed perforation line. Shows: Available Payout, Total Financed, Invoice Count. Gold "Claim USDC" button (active when `pendingClaims > 0` from the escrow contract via `usePendingClaim` hook).
- **Identity header**: seller name + tier badge, ConnectKit wallet button (shows address when connected)
- **Stat tiles grid**: 2-col on mobile, 3-col on tablet — Total Financed, Active Invoices, Available Credit. Stats are all live from context state.
- **Your Progress checklist**: 3-step card showing the seller's onboarding journey:
  - Step 1: Verify Identity (Tier 1) — gold CTA until done, green checkmark after
  - Step 2: Upgrade to Tier 2 — grayed until Step 1 done, then gold CTA
  - Step 3: Take the Tour — always available
  - Step counter badge (e.g. "1/3 steps") in the section header
- **Invoice Ledger**: horizontally scrollable tab switcher (All, Pending, On Market, Funded, Repaid), invoice rows with lift-on-hover shadow, status badges, "Mark Repaid" button with Sonner confirmation toast (requires explicit "Confirm Repaid" click — cannot accidentally confirm)
- **Empty state**: first-time sellers with zero invoices see a call-to-action card instead of empty stat tiles

#### 3. Submit Invoice (`sellerView: 'invoice'`)
**Locked behind `verificationTier > 0`** — unverified sellers see a lock screen with "Start Tier 1 Verification" CTA.
- Form fields: Buyer Name, Buyer Tax PIN, Buyer Country, Invoice Amount ($ USD), Due Date, Document Upload (PDF/PNG/JPG, max 15MB)
- Live calculation ribbon (dark card with gold top strip): Invoice Total → Advance (85% Tier 1, 90% Tier 2) → Fee (2%) → Net Payout — shown as labelled bars with proportional widths
- Credit limit guard: `exceedsLimit` flag recolors the amount input border red, shows inline error "Advance of $X exceeds your available credit of $Y. Upgrade to Tier 2 for a higher limit.", and disables the submit button (button reads "Credit limit reached - Upgrade to Tier 2" in grey)
- On successful submit: creates a new `Invoice` object with `status: 'pending_admin_approval'`, prepends to `invoices[]`, saves to Supabase (if configured), toasts with "Invoice submitted and saved"

#### 4. Verify ID (`sellerView: 'tier1'` or `'tier2'`)
**Smart-routed**: "Verify ID" sub-nav button auto-routes based on current `verificationTier`:
- Tier 0 → Tier 1 Verification
- Tier 1 pending → Verification In Progress
- Tier 1 verified → Tier 2 Verification
- Tier 2 → Tier 2 (re-submittable)

**Tier 1 Verification** (`sellerView: 'tier1'`):
- Cinema-ticket style hero card: dark gradient, gold strip, "PERSONAL CREDIT LIMIT" label, `$500` in large mono type, dot-matrix texture, "Unlocked on clear pass" label
- Demo simulation toggle (Pass / Fail / Uncertain) — for testing the admin approval flow
- Upload field: National ID front photo (drag-and-drop or click), file name display
- Cleanverse AI integration toggle — "Run AI-assisted document check" — when enabled, calls `cleanverseService.verifyDocument()` which returns a risk score
- "Verify Identity & Unlock $500" gold CTA button — shows loading spinner "Sending to Cleanverse AI..." during async check
- On pass: calls `submitVerification(1, ...)`, updates `kycStatusTier1: 'pending'`, routes to VerificationInProgress

**Tier 2 Verification** (`sellerView: 'tier2'`):
- Same cinema-ticket hero with `$5,000` limit, "T2" badge
- KRA / National Tax PIN field
- Business Tax Cert / Bank Statement upload (PDF/PNG/JPG, max 15MB)
- **Shop / Farm Walkthrough Video** toggle — the signature feature:
  - Toggle OFF: static row with videocam icon, "Boosts confidence score by up to 15%"
  - Toggle ON: requests device camera permission (`facingMode: environment` — rear camera preferred). Always-mounted `<video>` element (CSS hidden when not recording) ensures `videoRef` is always valid when the stream arrives.
  - Recording state: live viewfinder fills the card below the toggle. Pulsing red REC badge, running timer (MM:SS). Red "Stop Recording" pill CTA. Icon switches to `radio_button_checked`.
  - After stop: playback preview with green "Recorded" badge showing duration. "Retake video" button. Icon switches to `check_circle`. Recorded blob URL passed to Cleanverse API call.
  - Permission denied: inline amber error card with instructions.
- "Verify Business & Unlock $5,000" gold CTA

**Verification In Progress** (`sellerView: 'verification_in_progress'`):
- Status card showing submitted documents, review timeline, estimated turnaround

#### 5. Seller Status (`sellerView: 'status'`)
**New purpose-built account summary screen.**
- Hero card: recommended next step based on current tier (dark gradient, gold strip)
- Verification tracker: two-row progress (Tier 1, Tier 2) with live status badges (Verified/Pending/Not Started)
- Credit limit bar: used vs available credit, dollar amounts, percentage fill
- Invoice pipeline grid: counts by stage (Pending Admin / On Market / Funded / Repaid)

#### 6. Seller Onboarding Tour (`sellerView: 'tour'`)
- Step-by-step guided tour (5 steps) explaining the invoice financing flow
- Step dots glow gold when active, pulse animation
- "Done — Back to Dashboard" CTA calls `completeSellerTour()`, marks `sellerTourCompleted: true`

---

### Lender Flow (6 screens)

#### 1. Lender Sign Up (`lenderView: 'signup'`)
**Default landing for all new lenders.**
- Split-screen editorial layout: dark left panel with "Deploy capital into real-world invoice pools." headline, gold accent on last line, yield range card (13.8% — 18.2% APY shown), feature bullets (Verified Invoices, Arc Testnet USDC, Sub-second Settlement)
- Right panel: account type selector (Individual / Institutional pill toggle with dark active state), full name / entity name (whitespace-validated, inline red error on blank submit), email, target allocation slider ($500 — $100,000, live dollar display in JetBrains Mono)
- On submit: `completeLenderOnboarding` sets `availableBalance = targetAllocation`, resets all portfolio metrics to 0, sets `riskAccepted: false`
- First visit routes to `LenderWelcome`, return login routes straight to `browse`

#### 2. Lender Welcome (`lenderView: 'welcome'`)
**Personalised first-time welcome screen (skipped on re-login).**
- Large gold greeting: "Welcome, [Name]"
- Dark hero card: Account Type, Target Allocation in large JetBrains Mono, estimated annual yield range (calculated from targetAllocation × 15.2% average APY)
- CTA: "Review Risk Disclosure to Start Investing" routes to `risk_disclosure`

#### 3. Risk Disclosure (`lenderView: 'risk_disclosure'`)
- Full plain-language risk document covering invoice default risk, liquidity risk, platform risk, and Arc Testnet context
- "I understand and accept the risks" checkbox + "Accept and Continue" gold CTA
- Sets `lender.riskAccepted = true` on accept

#### 4. Marketplace Browse (`lenderView: 'browse'`)
**Gated behind `lender.riskAccepted`** — if false, shows a blocking gate: gavel icon, "Risk Disclosure Required" heading, "Review Risk Disclosure" CTA.

- **Pool hero banner** (full-width dark): live green pulse badge "Live · Accepting Capital", pool total volume in 58px JetBrains Mono, pool health progress bar in emerald green, Avg APY chip, Active Opportunities count. "New here? Take a 2-min tour" link + "Blended Pool" investment button.
- **Search + filter bar**: text search (buyer name, seller, ID), category filter chips (All, Agri Export, Agri Processing, Cold Chain, Spices)
- Only shows invoices with `status: 'published_marketplace'` (admin-approved invoices only — pre-approval invoices never appear)
- Invoice is pre-filtered by lender's `targetAllocation` on first load (H4: shows invoices the lender can actually afford)
- **Invoice cards**: sellerBusinessName, buyer, invoice ID, amount, advance amount in gold badge, term days, expected yield APY, risk score with `RiskBar` (color-coded: green >75, amber 50-75, red <50) + tooltip on hover ("Low/Medium/High Risk · Score based on buyer payment history, invoice age, and seller tier. 70+ = Low Risk."), APY badge, "Fund on Arc" gold CTA
- **Multi-select + batch**: checkbox on each card, sticky "Fund X Invoices" CTA at bottom when >0 selected, writes `selectedBatchIds` to context and routes to `batch_fund`
- **Funding Modal** (selected invoice):
  - Dark capital card with invoice details and perforation treatment
  - USDC balance check: `hasInsufficientBalance()` compares live ERC-20 balance against advance amount. If insufficient: amber warning card "Insufficient USDC balance — [balance] available" with Arc faucet link; gold CTA disabled.
  - 2-step flow: Step 1 "Approve USDC" → calls `approve(vestoEscrowAddress, amount)` on the USDC contract via `useWriteContract`. Step 2 "Fund Invoice" → calls `fundInvoice(invoiceId, seller, amount, dueDate)` on VestoEscrow. Live step indicators, spinner during confirmation, green checkmark + Arc explorer link on success.
  - On success: `fundInvoiceLender(invoiceId)` updates context state — lender `totalInvested += advanceAmount`, `availableBalance -= advanceAmount`; seller `availablePayout += advanceAmount`, `totalFinanced += amount`

#### 5. Batch Funding (`lenderView: 'batch_fund'`)
- Reads `selectedBatchIds` from context — only shows the exact invoices selected in the Marketplace
- Blended APY calculation across all selected invoices
- Total capital deployment summary card
- "Fund All [N] Invoices on Arc" CTA calls `fundBatchLender(selectedBatchIds)`
- Capital summary: total advance, blended fee, net deployment

#### 6. Lender Portfolio (`lenderView: 'portfolio'`)
**Scoped to signed-in lender** — filters by `i.fundedByLenderId === lender.id` (only shows invoices the current lender has personally funded).
- **Auto-Invest ribbon**: toggle to enable/disable automatic reinvestment, styled as a dark card
- **Stats row**: Total Invested, Yield Earned, Available Balance — all live from context
- **Active positions table**: invoiceId, seller, buyer, advance amount, APY, due date, days remaining, status badge
- **Withdraw modal**: amount input, insufficient-balance guard (`amount > lender.availableBalance` shows warning, blocks submit), on success calls `withdrawFunds(amount)` which decrements `availableBalance`
- **ConnectKit wallet button**: visible if not connected, with "Connect wallet to withdraw" guard

---

### Admin Flow (5 screens)

#### 1. Admin 2FA Sign In (`adminView: '2fa'`)
**Default landing for all admin role visits.**
- Split-screen editorial layout: dark left panel with "Governance. Precision. Trust." headline, V logo, gold strip, dot-matrix texture
- Right form: Admin Identifier field — validates `@vesto.finance` domain on blur, inline red error "Only @vesto.finance accounts are permitted." for wrong domains, red border on invalid
- 6-slot TOTP input: hidden `<input type="tel" maxLength={6}>` behind 6 visual slot `<div>` elements — renders as large monospace digit boxes
- Passcode validation: must be exactly `123456` for the demo. Any other 6-digit code shows "Invalid code. Use 123456 for the demo." and clears the input. Shorter codes show "Please enter all 6 digits." Authenticate button is disabled until length === 6.
- Demo hint: gold "Demo: use 123456" line below the TOTP input
- On success: `completeAdminOnboarding()`, routes to Invoice Oversight

#### 2. Invoice Oversight Table (`adminView: 'oversight'`) — Default post-login view
- All invoices from the global `invoices[]` array
- Status filter tabs: All, Pending, Published, Funded, Repaid, Flagged
- Each row: Invoice ID, Seller, Buyer, Amount, Advance, Status badge, Action buttons
- **Approve**: sets `status: 'published_marketplace'`, with Sonner undo toast (4-second window to cancel)
- **Flag**: opens a modal for entering a flag reason (textarea + confirm), sets `status: 'flagged'`, stores `flagReason` on the invoice
- **Mark Repaid**: Sonner confirmation toast with two explicit buttons (Confirm Repaid / Cancel) — no accidental commits

#### 3. Verification Queue (`adminView: 'verification'`)
- All pending `VerificationRequest` objects from `verifications[]`
- Each card: seller name, business name, tier, document preview (image or PDF icon), submitted timestamp, risk score suggested by Cleanverse AI
- **Approve** (with Sonner undo toast, 4-second window): calls `approveVerificationAdmin(reqId)`, which:
  - Updates `verifications[]` status to `'approved'`
  - Sets `newLimit` to $500 (Tier 1) or $5,000 (Tier 2)
  - Updates the signed-in seller if `req.sellerId === seller.id` (direct update)
  - Updates `sellerRegistry[req.sellerId]` if the seller is in the registry (C3 fix — affects any seller, not just signed-in)
  - Saves to Supabase via `supabaseService.updateSellerTierOffchain`
- **Reject** (with Sonner undo toast): sets status `'rejected'`, toasts with seller name

#### 4. Dispute Resolution (`adminView: 'disputes'`)
- Shows all invoices with `status === 'flagged' || status === 'disputed'`
- Each dispute card: invoice ID, seller, buyer, amount, `flagReason` displayed, submission date
- Two explicit resolution buttons per dispute:
  - **Refund Lender**: calls `resolveDisputeAdmin(id, 'refund_lender')` — adds `advanceAmount` to `lender.availableBalance`, sets invoice to `'repaid'`
  - **Pay Seller**: calls `resolveDisputeAdmin(id, 'pay_seller')` — adds `advanceAmount` to `seller.availablePayout`, sets invoice to `'repaid'`

#### 5. Analytics Overview (`adminView: 'analytics'`)
- Live-derived `PlatformAnalytics` object: Total Volume, Active Liquidity, Average Yield APY, Default Rate, Seller Count, Lender Count, Funded Invoice Count, System Health
- 4 KPI tiles each with a 7-day inline SVG sparkline chart (pure SVG, no charting library)
- Arc Testnet performance card: block time, finality, USDC gas cost — stacks vertically on mobile
- Admin header with export button (decorative)

#### 6. Admin Security / 2FA Settings (`adminView: '2fa'` — accessible via "Security" in post-login nav)
- The same 2FA form, accessible as a settings screen after login (e.g. to test re-authentication)

---

## Shared UI Components

### Navbar (`src/components/common/Navbar.tsx`)
- Full-bleed `#0A1628` background, 72px height, 2px gold bottom border
- Left: Vesto "V" gold monogram + "VESTO / INVOICE CAPITAL, ONCHAIN" wordmark
- Center-right: role switcher pill (Seller / Lender / Admin) — frosted dark surface, active role gets gold gradient
- Right: ConnectKit "Connect Wallet" button (shown to all) + avatar chip (shown when current role is authenticated)
- **Avatar chip**: gold circle with initials (first letter of name, falls back to role initial if name is blank), name label, role sub-label. Click opens dropdown: full name, role label, red "Sign out" button with logout icon
- **Sign Out**: resets role state to pre-login (`sellerOnboarded/lenderOnboarded/adminOnboarded = false`), routes to respective signup/sign-in screen, shows "Signed out successfully" toast

### Sub-navigation bar
- Rendered below the Navbar inside each role's view wrapper
- **Seller (pre-login)**: Sign Up only
- **Seller (post-login)**: Dashboard, + Invoice, Verify ID, Status
- **Lender (pre-login)**: Sign Up only
- **Lender (post-login)**: Marketplace, Batch Fund, Portfolio, Risk Disclosure
- **Admin (pre-login)**: Sign In only
- **Admin (post-login)**: Invoices, KYC Queue, Disputes, Analytics, Security
- Active item gets gold gradient pill, inactive items are plain text
- All items right-aligned via `ml-auto` on the container

### Toast System
- Sonner toasts for all user actions
- 4-second auto-dismiss
- Types: success (green), info (blue), warning (amber)
- Key milestone toasts include next-step hints: "Invoice submitted → Check admin queue", "Funded → View Portfolio for yield tracking", "Tier 1 approved → Next: Submit an invoice"
- Undo toasts (Admin Approve/Reject, Mark Repaid): explicit "Confirm" + "Cancel" buttons before action commits

---

## Onchain Integration

### wagmi Config (`src/config/wagmi.tsx`)
- Arc Testnet chain definition: Chain ID 5454, RPC `https://rpc.testnet.arc.io`, explorer `https://explorer.testnet.arc.io`
- Mainnet added for ENS resolution only
- ConnectKit wrapped around the app with custom theme (dark navy background)

### Contract Hooks (`src/hooks/useVestoEscrow.ts`)
Four custom hooks built on wagmi v2:
- `useFundInvoice()` — manages the 2-step USDC approve + fundInvoice flow with step state, txHash, confirmation, success, and error states
- `useClaimPayout()` — calls `claimPayout()` on VestoEscrow for sellers claiming settled funds
- `usePendingClaim(address)` — reads `pendingClaims[address]` from VestoEscrow (used to show the claim button on the Dashboard when > 0)
- `useUSDCBalance()` — reads `balanceOf(address)` on the USDC ERC-20 contract, returns both raw (BigInt, 6 decimals) and formatted (2 d.p. string) values

### Contract Config (`src/config/contracts.ts`)
- Contract address constant
- Imported ABI from Foundry artifact
- `formatUSDC(bigint)` utility: divides by 1e6, formats to 2 decimal places
- `explorerTxUrl(txHash)` utility: constructs Arc Testnet explorer URL
- USDC contract address and minimal ERC-20 ABI for approve/balanceOf calls

---

## Validation & Guards

| Screen | Guard |
|---|---|
| All views (all roles) | Onboarding gate — blocked until sign-up complete |
| Submit Invoice | `verificationTier > 0` — lock screen if unverified |
| Submit Invoice | `exceedsLimit` — inline error + disabled button if advance > available credit |
| Seller Sign Up | `.trim().length > 0` on fullName and businessName |
| Lender Sign Up | `.trim().length > 0` on fullName |
| Marketplace Browse | `lender.riskAccepted` — blocking gate screen if not accepted |
| Marketplace Fund CTA | `hasInsufficientBalance()` — replaces CTA with amber warning if USDC balance < advance |
| Admin 2FA email | `@vesto.finance` domain enforcement, inline error on blur |
| Admin 2FA code | Exactly `123456` (demo), `length === 6` required, button disabled until 6 digits |
| Lender withdraw | `amount > lender.availableBalance` — blocks with warning |
| Mark Repaid | Sonner confirmation toast — requires explicit "Confirm Repaid" click |

---

## Security Architecture (VestoEscrow.sol)

The smart contract was written, then audited twice with a balanced severity level across two parallel audit tracks (rule corpus + functional). The following findings were identified and fixed:

| Finding | Severity | Fix Applied |
|---|---|---|
| Unauthenticated invoice ID squatting | High | `adminRegisterInvoice` pre-registration with seller/amount binding |
| Blocklisted recipient lock | Critical | Pull-claim model (`pendingClaims` mapping + `claimPayout()`) |
| Admin confiscation via `adminReroute` | Critical | Removed `adminReroute` entirely |
| Unfunded repayment credit (design caveat) | Critical | Accepted as intentional custodial escrow design (admin controls repayment confirmation) |

The final audited contract has zero material findings at balanced severity.

---

## Repository Structure

```
vesto/
├── contracts/
│   ├── VestoEscrow.sol          # Audited escrow contract
│   └── out/VestoEscrow.sol/     # Foundry build artifact
├── src/
│   ├── components/
│   │   ├── admin/               # AdminLogin2FA, AnalyticsOverview, DisputeResolution,
│   │   │                          InvoiceOversightTable, VerificationQueue
│   │   ├── auth/                # WalletAuthModal (legacy, unused)
│   │   ├── common/              # Navbar
│   │   ├── lender/              # FundInvoiceBatch, LenderPortfolio, LenderSignUp,
│   │   │                          LenderWelcome, MarketplaceBrowse, MarketplaceGuidedTour,
│   │   │                          RiskDisclosure
│   │   └── seller/              # SellerDashboard, SellerOnboardingTutorial, SellerSignUp,
│   │                              SellerStatus, SubmitInvoice, Tier1Verification,
│   │                              Tier2Verification, VerificationInProgress
│   ├── config/
│   │   ├── contracts.ts         # Contract address, ABI, USDC helpers
│   │   └── wagmi.tsx            # wagmi + ConnectKit config, Arc Testnet chain
│   ├── context/
│   │   └── AppContext.tsx       # Full application state (18 actions, 12 state slices)
│   ├── hooks/
│   │   └── useVestoEscrow.ts    # useFundInvoice, useClaimPayout, usePendingClaim, useUSDCBalance
│   ├── services/
│   │   ├── cleanverseService.ts # Cleanverse AI document verification API
│   │   ├── escrowService.ts     # Off-chain escrow event helpers
│   │   └── supabaseService.ts   # Optional Supabase persistence
│   ├── types/
│   │   └── index.ts             # TypeScript types: Invoice, SellerProfile, LenderProfile,
│   │                              VerificationRequest, PlatformAnalytics, UserRole
│   ├── App.tsx                  # Thin composition root — role router + sub-nav
│   ├── index.css                # Tailwind directives + CSS custom properties + keyframes
│   └── main.tsx                 # App entry — WagmiProvider, ConnectKitProvider, AppProvider
├── docs/
│   ├── stress-test-report.md    # First stress test (18 issues, all resolved)
│   └── stress-test-report-2.md  # Second stress test (6 issues, all resolved)
├── design/                      # Original design assets and HTML mockups
├── supabase/
│   └── migrations/              # Initial schema SQL
├── AGENTS.md                    # Deployed contract addresses and key file index
└── index.html                   # Vesto favicon (inline SVG data URI), Google Fonts
```

---

## Issue Resolution History

Two full stress tests were run. All 25 issues across both tests have been resolved.

**Stress Test 1 (18 issues):**
- 2 Critical: onboarding gate, lender personalisation
- 6 High: wallet connect UX, Tier 1/2 design tokens, balance guard, allocation filter, Admin 2FA tokens, view transitions
- 7 Medium: fee breakdown visual, sub-nav collapse, batch carry-through, risk tooltip, undo toasts, sparklines, toast hints
- 3 Low: Mark Repaid confirmation, admin default landing, favicon

**Stress Test 2 (6 issues after first test fixes, then 1 more fix added):**
- 1 Critical: seller initial state pre-populated with demo data (seed totalFinanced leaking through)
- 2 High: Admin 2FA accepts any code; lender portfolio shows seed data for every new lender
- 3 Medium: whitespace names, credit limit cosmetic only, marketplace bypasses risk disclosure
- 1 Bonus fix: Admin email enforces `@vesto.finance` domain; sub-6-digit codes rejected
