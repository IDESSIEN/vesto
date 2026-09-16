-- Supabase Schema Migration: Advance Modern Agrarian Capital Off-Chain Storage & RLS
-- Money movement is handled strictly on Monad smart contracts; this schema stores off-chain metadata.

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(20) NOT NULL CHECK (role IN ('seller', 'lender', 'admin')),
  full_name TEXT NOT NULL,
  phone_prefix VARCHAR(10),
  phone_number VARCHAR(30),
  business_name TEXT,
  operating_country TEXT,
  category TEXT,
  verification_tier INT DEFAULT 0 CHECK (verification_tier IN (0, 1, 2)),
  credit_limit NUMERIC(12, 2) DEFAULT 0.00,
  used_limit NUMERIC(12, 2) DEFAULT 0.00,
  available_payout NUMERIC(12, 2) DEFAULT 0.00,
  total_financed NUMERIC(12, 2) DEFAULT 0.00,
  investor_tier TEXT,
  target_allocation NUMERIC(12, 2) DEFAULT 0.00,
  total_invested NUMERIC(12, 2) DEFAULT 0.00,
  total_yield_earned NUMERIC(12, 2) DEFAULT 0.00,
  available_balance NUMERIC(12, 2) DEFAULT 0.00,
  risk_accepted BOOLEAN DEFAULT FALSE,
  auto_invest_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DOCUMENTS TABLE (ID photos, Tax PIN PDFs, Bank Statements)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('tier1_id', 'tier2_tax_bank', 'invoice_doc')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  storage_path TEXT,
  mime_type VARCHAR(50),
  size_bytes BIGINT,
  status VARCHAR(20) DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'verified', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INVOICES TABLE (Off-chain descriptions, buyer metadata, attachments)
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_business_name TEXT NOT NULL,
  seller_category TEXT,
  buyer_name TEXT NOT NULL,
  buyer_tax_id TEXT NOT NULL,
  buyer_country TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  advance_rate_pct NUMERIC(5, 2) NOT NULL DEFAULT 85.00,
  advance_amount NUMERIC(12, 2) NOT NULL,
  fee_pct NUMERIC(5, 2) NOT NULL DEFAULT 2.00,
  fee_amount NUMERIC(12, 2) NOT NULL,
  expected_yield_pct NUMERIC(5, 2) NOT NULL DEFAULT 14.50,
  due_date DATE NOT NULL,
  term_days INT NOT NULL,
  risk_tier VARCHAR(10) NOT NULL DEFAULT 'A+',
  risk_score INT NOT NULL DEFAULT 90,
  status VARCHAR(30) NOT NULL DEFAULT 'pending_admin_approval',
  description TEXT,
  doc_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  doc_name TEXT,
  funded_by_lender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  funded_at TIMESTAMPTZ,
  repaid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. VERIFICATIONS TABLE (KYC Queue)
CREATE TABLE IF NOT EXISTS public.verifications (
  id TEXT PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  tier INT NOT NULL CHECK (tier IN (1, 2)),
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  risk_score_suggested INT DEFAULT 90,
  admin_notes TEXT
);

-- 5. ADMIN_NOTES TABLE (Audit Log)
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(30) NOT NULL CHECK (entity_type IN ('invoice', 'verification', 'seller', 'lender')),
  entity_id TEXT NOT NULL,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_name TEXT DEFAULT 'Institutional Admin',
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- Helper function to verify admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES POLICIES
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins full access to profiles" ON public.profiles
  FOR ALL USING (public.is_admin());

-- DOCUMENTS POLICIES
CREATE POLICY "Sellers read own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Sellers insert own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access to documents" ON public.documents
  FOR ALL USING (public.is_admin());

-- INVOICES POLICIES
CREATE POLICY "Sellers read own invoices or marketplace" ON public.invoices
  FOR SELECT USING (
    auth.uid() = seller_id 
    OR status = 'published_marketplace'
    OR auth.uid() = funded_by_lender_id
    OR public.is_admin()
  );

CREATE POLICY "Sellers insert own invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers update own invoices" ON public.invoices
  FOR UPDATE USING (auth.uid() = seller_id OR public.is_admin());

CREATE POLICY "Admins full access to invoices" ON public.invoices
  FOR ALL USING (public.is_admin());

-- VERIFICATIONS POLICIES
CREATE POLICY "Sellers read own verifications" ON public.verifications
  FOR SELECT USING (auth.uid() = seller_id OR public.is_admin());

CREATE POLICY "Sellers insert own verifications" ON public.verifications
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Admins full access to verifications" ON public.verifications
  FOR ALL USING (public.is_admin());

-- ADMIN NOTES POLICIES
CREATE POLICY "Admins access to admin_notes" ON public.admin_notes
  FOR ALL USING (public.is_admin());
