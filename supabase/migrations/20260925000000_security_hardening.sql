-- ============================================================
-- Security Hardening Migration
-- 20260925000000_security_hardening.sql
--
-- Fixes all gaps found in the object-level authorization audit:
-- 1. Prevent role escalation via profile self-update
-- 2. Restrict invoice UPDATE to non-sensitive columns only
-- 3. Fix admin check on updateSellerTierOffchain — admin-only function
-- 4. Fix buyer_acknowledgements admin policy (admin_users table does not exist)
-- 5. Restrict documents INSERT to own uid (not client-supplied userId)
-- 6. Add per-column UPDATE policies on invoices to prevent status/risk tampering
-- 7. Add caller-identity check helper for Edge Functions
-- 8. Restrict buyers freeze/unfreeze to admins only
-- 9. Lock down admin_notes to admin-only INSERT (not any authenticated user)
-- 10. Add immutability trigger: funded invoices cannot have funded_by_lender_id changed
-- ============================================================

-- ─── 1. Prevent role escalation ───────────────────────────────────────────────
-- Drop the permissive UPDATE policy that allows users to update any column
-- including `role`, `verification_tier`, and `credit_limit`.

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Replace with a restricted policy that explicitly excludes sensitive columns.
-- Postgres RLS cannot restrict per-column natively, so we use a BEFORE trigger
-- to enforce column-level immutability.

CREATE POLICY "Users can update own non-sensitive profile fields" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger: prevent any non-admin from changing role, verification_tier, credit_limit
CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow service role (Edge Functions, cron) to change anything
  IF current_setting('role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- If the caller is admin, allow
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Non-admin: block changes to sensitive columns
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: role cannot be changed by non-admin users';
  END IF;

  IF NEW.verification_tier IS DISTINCT FROM OLD.verification_tier THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: verification_tier cannot be changed by non-admin users';
  END IF;

  IF NEW.credit_limit IS DISTINCT FROM OLD.credit_limit THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: credit_limit cannot be changed by non-admin users';
  END IF;

  IF NEW.used_limit IS DISTINCT FROM OLD.used_limit THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: used_limit cannot be changed by non-admin users';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_guard_profile_sensitive ON public.profiles;
CREATE TRIGGER trg_guard_profile_sensitive
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_sensitive_columns();


-- ─── 2. Restrict invoice UPDATE — sellers cannot change status, risk, or ownership ──

DROP POLICY IF EXISTS "Sellers update own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins full access to invoices" ON public.invoices;

-- Admins can update anything
CREATE POLICY "Admins full update on invoices" ON public.invoices
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Sellers can update only description, doc fields, and buyer_contact_email
-- on their own PENDING invoices. They cannot change status, risk, amounts, or lender.
CREATE POLICY "Sellers update own pending invoices (restricted columns)" ON public.invoices
  FOR UPDATE
  USING (
    auth.uid() = seller_id
    AND status = 'pending_admin_approval'  -- can only edit before admin review
  )
  WITH CHECK (
    auth.uid() = seller_id
    AND status = 'pending_admin_approval'
  );

-- Trigger: prevent sellers from changing any protected column
CREATE OR REPLACE FUNCTION public.guard_invoice_protected_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role') = 'service_role' THEN RETURN NEW; END IF;
  IF public.is_admin() THEN RETURN NEW; END IF;

  -- Sellers: block changes to fields they must not touch
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: invoice status can only be changed by admin or system';
  END IF;
  IF NEW.risk_tier IS DISTINCT FROM OLD.risk_tier THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: risk_tier is admin-only';
  END IF;
  IF NEW.risk_score IS DISTINCT FROM OLD.risk_score THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: risk_score is admin-only';
  END IF;
  IF NEW.advance_rate_pct IS DISTINCT FROM OLD.advance_rate_pct THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: advance_rate_pct is admin-only';
  END IF;
  IF NEW.advance_amount IS DISTINCT FROM OLD.advance_amount THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: advance_amount is admin-only';
  END IF;
  IF NEW.funded_by_lender_id IS DISTINCT FROM OLD.funded_by_lender_id THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: funded_by_lender_id cannot be changed after assignment';
  END IF;
  IF NEW.seller_id IS DISTINCT FROM OLD.seller_id THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: seller_id is immutable';
  END IF;
  IF NEW.buyer_acknowledged IS DISTINCT FROM OLD.buyer_acknowledged
     AND current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: buyer_acknowledged can only be set by the system';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_guard_invoice_columns ON public.invoices;
CREATE TRIGGER trg_guard_invoice_columns
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.guard_invoice_protected_columns();


-- ─── 3. Admin-only function for updating seller tier ──────────────────────────
-- The supabaseService.updateSellerTierOffchain() calls profiles.update() directly.
-- Replace it with a SECURITY DEFINER function that checks the caller is admin.

CREATE OR REPLACE FUNCTION public.admin_update_seller_tier(
  p_seller_id   UUID,
  p_tier        INT,
  p_limit       NUMERIC
)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: only admins can update seller verification tier';
  END IF;

  IF p_tier NOT IN (0, 1, 2) THEN
    RAISE EXCEPTION 'INVALID_INPUT: tier must be 0, 1, or 2';
  END IF;

  IF p_limit < 0 THEN
    RAISE EXCEPTION 'INVALID_INPUT: credit limit cannot be negative';
  END IF;

  UPDATE public.profiles SET
    verification_tier = p_tier,
    credit_limit      = p_limit,
    updated_at        = NOW()
  WHERE id = p_seller_id AND role = 'seller';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: seller % does not exist', p_seller_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 4. Fix buyer_acknowledgements admin policy ───────────────────────────────
-- The existing "Admin can read all acknowledgements" policy references admin_users
-- which does not exist. Drop and replace with the correct profiles-based check.

DROP POLICY IF EXISTS "Admin can read all acknowledgements" ON public.buyer_acknowledgements;
DROP POLICY IF EXISTS "Service role full access" ON public.buyer_acknowledgements;

CREATE POLICY "Admins can read all acknowledgements" ON public.buyer_acknowledgements
  FOR SELECT
  USING (public.is_admin());

-- Service role (Edge Functions) needs full access for insert/update
CREATE POLICY "Service role full access to acknowledgements" ON public.buyer_acknowledgements
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Sellers can only SELECT (not insert/update) their own invoice acknowledgements
DROP POLICY IF EXISTS "Sellers can read their invoice acknowledgements" ON public.buyer_acknowledgements;
CREATE POLICY "Sellers read own invoice acknowledgements" ON public.buyer_acknowledgements
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE seller_id = auth.uid()
    )
  );


-- ─── 5. Restrict documents INSERT to own uid ─────────────────────────────────
-- The existing policy "Sellers insert own documents" checks auth.uid() = user_id.
-- This is correct at the DB layer. The gap is in the storage bucket policy.
-- We add a DB-level trigger to ensure user_id cannot differ from auth.uid()
-- regardless of what the client sends.

DROP POLICY IF EXISTS "Sellers insert own documents" ON public.documents;
CREATE POLICY "Sellers insert own documents (enforced uid)" ON public.documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.enforce_document_owner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id != auth.uid() AND current_setting('role') != 'service_role' THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: document user_id must match authenticated user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_document_owner ON public.documents;
CREATE TRIGGER trg_enforce_document_owner
  BEFORE INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.enforce_document_owner();


-- ─── 6. Admin notes: restrict INSERT to admins only ──────────────────────────
-- Currently any authenticated user can call addAdminNote() and it will insert
-- under the hardcoded name 'Institutional Risk Admin'. Lock this down.

DROP POLICY IF EXISTS "Admins access to admin_notes" ON public.admin_notes;

CREATE POLICY "Admins full access to admin_notes" ON public.admin_notes
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Also fix: admin_id should be stamped from auth.uid(), not a client-supplied value
CREATE OR REPLACE FUNCTION public.stamp_admin_note_author()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role') != 'service_role' THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'AUTHORIZATION_DENIED: only admins can create admin notes';
    END IF;
    -- Stamp the actual admin's id, ignoring any client-supplied value
    NEW.admin_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_stamp_admin_note ON public.admin_notes;
CREATE TRIGGER trg_stamp_admin_note
  BEFORE INSERT ON public.admin_notes
  FOR EACH ROW EXECUTE FUNCTION public.stamp_admin_note_author();


-- ─── 7. Immutability trigger: funded invoices lock lender assignment ──────────
-- Once funded_by_lender_id is set, it cannot be changed by anyone except service_role.

CREATE OR REPLACE FUNCTION public.guard_funded_invoice_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role') = 'service_role' THEN RETURN NEW; END IF;

  IF OLD.funded_by_lender_id IS NOT NULL
     AND NEW.funded_by_lender_id IS DISTINCT FROM OLD.funded_by_lender_id THEN
    RAISE EXCEPTION 'IMMUTABILITY_VIOLATION: funded_by_lender_id cannot be changed after funding';
  END IF;

  IF OLD.status IN ('funded','payment_detected','partial_shortfall','repaid','defaulted')
     AND NEW.advance_amount IS DISTINCT FROM OLD.advance_amount THEN
    RAISE EXCEPTION 'IMMUTABILITY_VIOLATION: advance_amount cannot be changed after funding';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_guard_funded_immutability ON public.invoices;
CREATE TRIGGER trg_guard_funded_immutability
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.guard_funded_invoice_immutability();


-- ─── 8. Buyers table: freeze/unfreeze is admin-only ───────────────────────────
-- The existing policy "Admins full access to buyers" covers this but there was
-- no explicit check blocking lenders/sellers from updating the frozen column.
-- Add a trigger to enforce it.

CREATE OR REPLACE FUNCTION public.guard_buyer_sensitive_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role') = 'service_role' THEN RETURN NEW; END IF;
  IF public.is_admin() THEN RETURN NEW; END IF;

  IF NEW.frozen IS DISTINCT FROM OLD.frozen THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: only admins can freeze or unfreeze buyers';
  END IF;
  IF NEW.credit_tier IS DISTINCT FROM OLD.credit_tier THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: credit_tier is admin-only';
  END IF;
  IF NEW.credit_score IS DISTINCT FROM OLD.credit_score THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: credit_score is admin-only';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_guard_buyer_columns ON public.buyers;
CREATE TRIGGER trg_guard_buyer_columns
  BEFORE UPDATE ON public.buyers
  FOR EACH ROW EXECUTE FUNCTION public.guard_buyer_sensitive_columns();


-- ─── 9. Edge Function caller verification helper ─────────────────────────────
-- This function is called by state-mutating Edge Functions to verify the caller
-- is an authenticated admin before proceeding. Used in send-acknowledgement.

CREATE OR REPLACE FUNCTION public.verify_admin_caller(p_jwt_claims jsonb)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
BEGIN
  v_user_id := (p_jwt_claims->>'sub')::UUID;

  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = v_user_id;

  RETURN v_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 10. Invoices INSERT: seller_id must match authenticated user ─────────────
-- The existing policy "Sellers insert own invoices" has WITH CHECK (auth.uid() = seller_id).
-- Add a trigger as a second enforcement layer so the DB rejects it even if RLS is bypassed
-- via a misconfigured client library.

CREATE OR REPLACE FUNCTION public.enforce_invoice_seller_id()
RETURNS TRIGGER AS $$
BEGIN
  IF current_setting('role') = 'service_role' THEN RETURN NEW; END IF;

  IF NEW.seller_id != auth.uid() THEN
    RAISE EXCEPTION 'AUTHORIZATION_DENIED: invoice seller_id must match authenticated user (got % expected %)',
      NEW.seller_id, auth.uid();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_invoice_seller ON public.invoices;
CREATE TRIGGER trg_enforce_invoice_seller
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.enforce_invoice_seller_id();


-- ─── Summary of changes ───────────────────────────────────────────────────────
-- Gap 1: Prevented role/tier/limit escalation via profile UPDATE (trigger)
-- Gap 2: Restricted invoice UPDATE columns for sellers (trigger)
-- Gap 3: Admin-only SECURITY DEFINER function for tier updates
-- Gap 4: Fixed buyer_acknowledgements admin policy (was referencing non-existent table)
-- Gap 5: Documents INSERT now trigger-enforced to match auth.uid()
-- Gap 6: Admin notes INSERT restricted to admins; admin_id stamped from auth.uid()
-- Gap 7: funded_by_lender_id and advance_amount immutable after funding
-- Gap 8: Buyer freeze/credit columns protected by trigger
-- Gap 9: Helper function for Edge Function caller verification
-- Gap 10: Invoice seller_id enforced at trigger level as second layer
