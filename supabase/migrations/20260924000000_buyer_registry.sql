-- ============================================================
-- Buyer Registry Migration
-- Enables buyer-level monitoring, credit scoring, and
-- concentration risk tracking for lender protection.
-- ============================================================

-- 1. BUYERS TABLE
CREATE TABLE IF NOT EXISTS public.buyers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name    TEXT NOT NULL,
  tax_id          TEXT NOT NULL,
  country         TEXT NOT NULL,
  payment_terms   TEXT NOT NULL DEFAULT 'Net-30',
  credit_tier     VARCHAR(3) NOT NULL DEFAULT 'A' CHECK (credit_tier IN ('A+','A','B+','B')),
  credit_score    INT NOT NULL DEFAULT 85 CHECK (credit_score BETWEEN 0 AND 100),
  total_advanced  NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  total_repaid    NUMERIC(14,2) NOT NULL DEFAULT 0.00,
  on_time_count   INT NOT NULL DEFAULT 0,
  late_count      INT NOT NULL DEFAULT 0,
  default_count   INT NOT NULL DEFAULT 0,
  on_time_rate    NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN (on_time_count + late_count + default_count) = 0
    THEN 100
    ELSE ROUND(on_time_count::NUMERIC / NULLIF(on_time_count + late_count + default_count,0) * 100, 2)
    END
  ) STORED,
  virtual_accounts TEXT[] DEFAULT '{}',
  frozen          BOOLEAN NOT NULL DEFAULT FALSE,
  frozen_reason   TEXT,
  last_paid_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX buyers_tax_id_country_idx ON public.buyers(tax_id, country);
CREATE INDEX buyers_credit_tier_idx ON public.buyers(credit_tier);
CREATE INDEX buyers_frozen_idx ON public.buyers(frozen);

-- 2. BUYER_PAYMENT_EVENTS TABLE — full repayment audit trail
CREATE TABLE IF NOT EXISTS public.buyer_payment_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id        UUID NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
  invoice_id      TEXT NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  event_type      VARCHAR(30) NOT NULL CHECK (event_type IN (
    'advance_issued','payment_received','payment_partial',
    'reminder_14d','reminder_7d','reminder_3d',
    'overdue','default','dispute_opened','dispute_resolved'
  )),
  amount          NUMERIC(14,2),
  due_date        DATE,
  paid_date       DATE,
  days_late       INT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX buyer_events_buyer_idx   ON public.buyer_payment_events(buyer_id);
CREATE INDEX buyer_events_invoice_idx ON public.buyer_payment_events(invoice_id);
CREATE INDEX buyer_events_type_idx    ON public.buyer_payment_events(event_type);

-- 3. BUYER_REMINDERS TABLE — tracks automated reminder sends
CREATE TABLE IF NOT EXISTS public.buyer_reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      TEXT NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  buyer_id        UUID NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
  seller_email    TEXT NOT NULL,
  reminder_type   VARCHAR(10) NOT NULL CHECK (reminder_type IN ('14d','7d','3d','overdue')),
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered       BOOLEAN DEFAULT FALSE
);

CREATE INDEX buyer_reminders_invoice_idx ON public.buyer_reminders(invoice_id);
CREATE UNIQUE INDEX buyer_reminders_unique_idx ON public.buyer_reminders(invoice_id, reminder_type);

-- 4. Add buyer_id FK to invoices table
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES public.buyers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS repayment_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS buyer_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS buyer_acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS virtual_account_id TEXT,
  ADD COLUMN IF NOT EXISTS virtual_account_number TEXT,
  ADD COLUMN IF NOT EXISTS settlement_queued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS settlement_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS settlement_blocked_reason TEXT;

CREATE INDEX invoices_buyer_id_idx        ON public.invoices(buyer_id);
CREATE INDEX invoices_repayment_deadline_idx ON public.invoices(repayment_deadline)
  WHERE status NOT IN ('repaid','defaulted','disputed');

-- 5. CONCENTRATION RISK VIEW — live outstanding per buyer
CREATE OR REPLACE VIEW public.buyer_concentration AS
SELECT
  b.id,
  b.company_name,
  b.credit_tier,
  b.on_time_rate,
  b.frozen,
  COUNT(i.id)                                   AS open_invoice_count,
  COALESCE(SUM(i.advance_amount),0)             AS total_outstanding_usdc,
  MIN(i.repayment_deadline)                     AS earliest_deadline,
  MAX(i.repayment_deadline)                     AS latest_deadline,
  (COALESCE(SUM(i.advance_amount),0)
    / NULLIF((SELECT SUM(advance_amount) FROM public.invoices
              WHERE status = 'funded'),0) * 100) AS concentration_pct
FROM public.buyers b
LEFT JOIN public.invoices i ON i.buyer_id = b.id AND i.status = 'funded'
GROUP BY b.id, b.company_name, b.credit_tier, b.on_time_rate, b.frozen;

-- 6. Function to auto-update buyer stats after invoice settlement
CREATE OR REPLACE FUNCTION public.update_buyer_stats_on_settlement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'repaid' AND OLD.status <> 'repaid' THEN
    UPDATE public.buyers SET
      total_repaid  = total_repaid + NEW.advance_amount,
      on_time_count = on_time_count + CASE
        WHEN NEW.repaid_at::DATE <= NEW.due_date::DATE THEN 1 ELSE 0 END,
      late_count    = late_count + CASE
        WHEN NEW.repaid_at::DATE > NEW.due_date::DATE THEN 1 ELSE 0 END,
      last_paid_at  = NOW(),
      updated_at    = NOW()
    WHERE id = NEW.buyer_id;
  END IF;

  IF NEW.status = 'defaulted' AND OLD.status <> 'defaulted' THEN
    UPDATE public.buyers SET
      default_count = default_count + 1,
      frozen        = TRUE,
      frozen_reason = 'Automatic freeze: invoice ' || NEW.id || ' defaulted',
      updated_at    = NOW()
    WHERE id = NEW.buyer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER invoice_settlement_buyer_stats
  AFTER UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_buyer_stats_on_settlement();

-- 7. RLS
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_reminders ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "Admins full access to buyers"
  ON public.buyers FOR ALL USING (public.is_admin());

CREATE POLICY "Admins full access to buyer_payment_events"
  ON public.buyer_payment_events FOR ALL USING (public.is_admin());

CREATE POLICY "Admins full access to buyer_reminders"
  ON public.buyer_reminders FOR ALL USING (public.is_admin());

-- Lenders: read buyer info (trust signals on marketplace cards)
CREATE POLICY "Lenders can read buyers"
  ON public.buyers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'lender')
  );

-- Sellers: read buyer info for their own invoices only
CREATE POLICY "Sellers can read buyers for own invoices"
  ON public.buyers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices
      WHERE buyer_id = buyers.id AND seller_id = auth.uid()
    )
  );

-- 8. Seed demo buyers (matches existing invoice data)
INSERT INTO public.buyers
  (company_name, tax_id, country, payment_terms, credit_tier, credit_score,
   total_advanced, total_repaid, on_time_count, late_count, default_count)
VALUES
  ('Metro Supermarkets East Africa','P051294819X','Kenya',  'Net-40','A+',94, 48200,46900,12,1,0),
  ('Global Commodities Direct',     'GB948102931','United Kingdom','Net-55','A', 88, 31500,28700,8, 2,0),
  ('Kabras Sugar Refineries',       'P091240182Z','Kenya',  'Net-66','A+',96, 91000,91000,18,0,0),
  ('Zanzibar Spice Imports',        'TZ88194012', 'Tanzania','Net-20','B+',81, 12500,10200,5, 3,0)
ON CONFLICT (tax_id, country) DO NOTHING;
