# Implementation Plan - Supabase Off-Chain Backend & Row-Level Security (RLS) Integration

Integrating Supabase as the dedicated off-chain storage engine for non-financial metadata (Seller/Lender profiles, uploaded ID & business documents, invoice descriptions, admin notes, and verification statuses) with strict Row-Level Security (RLS) policies separating money movement on Monad from off-chain administrative data.

## User Review Required

> [!IMPORTANT]
> - **Strict Money / Off-Chain Separation**: Smart contracts on Monad exclusively handle value transfer & liquidity pooling. All profiles, document binaries, descriptions, admin audit notes, and KYC approval statuses are persisted off-chain in Supabase.
> - **Row-Level Security (RLS)**:
>   - **Sellers**: Can only `SELECT`, `INSERT`, `UPDATE` their own profile, submitted invoices, and uploaded KYC/business documents (`auth.uid() = user_id`).
>   - **Lenders**: Can only `SELECT` their own profile, active portfolio positions, and published marketplace invoices.
>   - **Admins**: Granted full `ALL` access across all tables (`role = 'admin'`).
> - **Seamless Offline / Fallback Support**: Includes a mock/resilient client adapter so the application functions out-of-the-box locally even before production Supabase credentials are inserted into `.env`.

## Open Questions

> [!NOTE]
> No blocking questions. Default environment variables `.env` and `.env.example` will be provided for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## Proposed Changes

### Supabase Database & Security Policies

#### [NEW] [supabase/migrations/20260905000000_initial_schema.sql](file:///c:/Users/User/Documents/Advance/supabase/migrations/20260905000000_initial_schema.sql)
- SQL migration creating:
  - `profiles` table (Seller & Lender profile metadata)
  - `documents` table (ID photos, Tax PIN PDFs, bank statement storage references)
  - `invoices` table (Off-chain descriptions, buyer metadata, document attachments)
  - `verifications` table (KYC queue, tier review history)
  - `admin_notes` table (Audit notes, dispute resolution comments)
  - RLS Policies for Sellers, Lenders, and Admins
  - Storage bucket setup for `documents` with access policies.

#### [NEW] [.env.example](file:///c:/Users/User/Documents/Advance/.env.example)
- Example environment file specifying `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

### Frontend Supabase Integration

#### [MODIFY] [package.json](file:///c:/Users/User/Documents/Advance/package.json)
- Add `@supabase/supabase-js` dependency.

#### [NEW] [src/lib/supabase.ts](file:///c:/Users/User/Documents/Advance/src/lib/supabase.ts)
- Supabase client initialization with graceful fallback for local development.

#### [NEW] [src/services/supabaseService.ts](file:///c:/Users/User/Documents/Advance/src/services/supabaseService.ts)
- Data access layer executing off-chain CRUD:
  - `fetchUserProfile(userId)`
  - `updateUserProfile(profile)`
  - `uploadDocument(file, docType)`
  - `createInvoiceOffchain(invoice)`
  - `submitVerificationOffchain(verification)`
  - `addAdminNote(entityType, entityId, note)`
  - `approveVerificationOffchain(reqId, tier)`

#### [MODIFY] [src/context/AppContext.tsx](file:///c:/Users/User/Documents/Advance/src/context/AppContext.tsx)
- Connect actions (invoice submission, file upload, KYC verification, admin notes) to `supabaseService` for off-chain persistence and RLS-scoped data queries.

#### [MODIFY] [src/components/admin/VerificationQueue.tsx](file:///c:/Users/User/Documents/Advance/src/components/admin/VerificationQueue.tsx)
- Add admin note input field for audit trail recording when reviewing KYC requests.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure zero TypeScript errors or missing imports.
- Test Supabase client initialization and service fallbacks.

### Manual Verification
- **Seller Flow Test**:
  1. Register a Seller -> Upload Tier 1 ID -> Verify record created in `documents` & `verifications` tables.
  2. Submit Invoice with description & PDF -> Verify stored in `invoices` table linked to `seller_id`.
- **Admin Flow Test**:
  1. Access KYC Queue -> Inspect document -> Add admin note "Verified against KRA registry" -> Click Approve -> Verify `admin_notes` and `verifications` updated.
- **RLS Policy Verification**:
  1. Inspect SQL policies ensuring Sellers cannot read other Sellers' documents or admin notes.
