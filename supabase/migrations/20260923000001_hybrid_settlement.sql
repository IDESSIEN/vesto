-- Hybrid Settlement System: 3 new tables for Layers 2, 3, and 7
-- Migration: 20260923000001_hybrid_settlement.sql

-- ─── Layer 2: Virtual bank accounts per invoice ─────────────────────────────

CREATE TABLE IF NOT EXISTS invoice_virtual_accounts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  provider        text NOT NULL CHECK (provider IN ('stripe','flutterwave','nala','mock')),
  account_id      text NOT NULL,          -- provider's internal virtual account ID
  account_number  text NOT NULL,          -- what the buyer sees on their bank statement
  sort_code       text,                   -- UK/EU routing (if applicable)
  routing_number  text,                   -- US ACH routing (if applicable)
  swift_bic       text,                   -- international SWIFT (if applicable)
  currency        text NOT NULL DEFAULT 'USD',
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(invoice_id)                      -- one virtual account per invoice
);

CREATE INDEX idx_virtual_accounts_invoice ON invoice_virtual_accounts(invoice_id);
CREATE INDEX idx_virtual_accounts_provider ON invoice_virtual_accounts(provider, account_id);

-- ─── Layer 3: Payment detection and settlement queue ────────────────────────

CREATE TABLE IF NOT EXISTS invoice_settlements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  provider        text NOT NULL,
  amount          numeric(18,6) NOT NULL,
  currency        text NOT NULL DEFAULT 'USD',
  payer_name      text,
  payer_account   text,
  payment_ref     text,
  payment_type    text CHECK (payment_type IN ('full','partial')),
  settled_at      timestamptz NOT NULL,   -- when bank confirmed the payment
  received_at     timestamptz NOT NULL DEFAULT now(),  -- when webhook arrived
  webhook_payload jsonb NOT NULL,         -- raw payload for audit trail
  status          text NOT NULL DEFAULT 'pending_buffer'
                  CHECK (status IN ('pending_buffer','executed','blocked','rejected')),
  rejection_reason text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_settlements_invoice ON invoice_settlements(invoice_id);
CREATE INDEX idx_settlements_status ON invoice_settlements(status);
CREATE INDEX idx_settlements_received ON invoice_settlements(received_at);

-- ─── Layer 3: 24-hour buffer queue for pending auto-settlements ──────────────

CREATE TABLE IF NOT EXISTS pending_settlements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  settlement_id   uuid NOT NULL REFERENCES invoice_settlements(id) ON DELETE CASCADE,
  execute_after   timestamptz NOT NULL,   -- received_at + 24 hours
  blocked         boolean NOT NULL DEFAULT false,
  block_reason    text,
  blocked_by      uuid REFERENCES profiles(id),
  blocked_at      timestamptz,
  executed        boolean NOT NULL DEFAULT false,
  executed_at     timestamptz,
  tx_hash         text,                   -- onchain transaction hash after execution
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(invoice_id)                      -- one pending settlement per invoice at a time
);

CREATE INDEX idx_pending_settlements_execute ON pending_settlements(execute_after)
  WHERE executed = false AND blocked = false;
CREATE INDEX idx_pending_settlements_invoice ON pending_settlements(invoice_id);

-- ─── Layer 7: Partial payment shortfall tracking ─────────────────────────────

CREATE TABLE IF NOT EXISTS invoice_shortfalls (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  settlement_id   uuid NOT NULL REFERENCES invoice_settlements(id),
  total_due       numeric(18,6) NOT NULL,
  amount_received numeric(18,6) NOT NULL,
  shortfall       numeric(18,6) NOT NULL GENERATED ALWAYS AS (total_due - amount_received) STORED,
  coverage_pct    numeric(5,2)  NOT NULL GENERATED ALWAYS AS (amount_received / total_due * 100) STORED,
  cure_deadline   timestamptz NOT NULL,   -- received_at + 7 days
  cured           boolean NOT NULL DEFAULT false,
  cured_at        timestamptz,
  cure_payment_ref text,
  status          text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','cured','disputed','refunded')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(invoice_id)
);

CREATE INDEX idx_shortfalls_invoice ON invoice_shortfalls(invoice_id);
CREATE INDEX idx_shortfalls_cure_deadline ON invoice_shortfalls(cure_deadline)
  WHERE cured = false AND status = 'open';

-- ─── RLS policies ─────────────────────────────────────────────────────────────

ALTER TABLE invoice_virtual_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_settlements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_settlements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_shortfalls        ENABLE ROW LEVEL SECURITY;

-- Virtual accounts: sellers can see their own; admins can see all
CREATE POLICY "sellers_own_virtual_accounts" ON invoice_virtual_accounts
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE seller_id = auth.uid()
    )
  );

CREATE POLICY "admins_all_virtual_accounts" ON invoice_virtual_accounts
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Lenders can see virtual account for invoices they funded
CREATE POLICY "lenders_funded_virtual_accounts" ON invoice_virtual_accounts
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE funded_by_lender_id = auth.uid()
    )
  );

-- Settlements: admins can see all; sellers/lenders see their own invoices
CREATE POLICY "admins_all_settlements" ON invoice_settlements
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "sellers_own_settlements" ON invoice_settlements
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE seller_id = auth.uid()
    )
  );

CREATE POLICY "lenders_funded_settlements" ON invoice_settlements
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE funded_by_lender_id = auth.uid()
    )
  );

-- Pending settlements: admins can read and update; others read-only on own invoices
CREATE POLICY "admins_all_pending" ON pending_settlements
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "lenders_own_pending" ON pending_settlements
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE funded_by_lender_id = auth.uid()
    )
  );

-- Shortfalls: same access pattern as settlements
CREATE POLICY "admins_all_shortfalls" ON invoice_shortfalls
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "sellers_own_shortfalls" ON invoice_shortfalls
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE seller_id = auth.uid()
    )
  );

CREATE POLICY "lenders_funded_shortfalls" ON invoice_shortfalls
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE funded_by_lender_id = auth.uid()
    )
  );

-- ─── Layer 6: Reminder escalation audit trail ────────────────────────────────

CREATE TABLE IF NOT EXISTS invoice_reminders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id      text NOT NULL,
  reminder_type   text NOT NULL CHECK (reminder_type IN ('14d','7d','3d','overdue')),
  seller_id       text NOT NULL,
  buyer_name      text NOT NULL,
  amount_usdc     numeric(18,6) NOT NULL,
  days_until      integer NOT NULL,
  email_sent_to   text,
  sent_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_invoice ON invoice_reminders(invoice_id);
CREATE INDEX idx_reminders_sent_at ON invoice_reminders(sent_at);

-- Admins can read all reminders; sellers can see reminders for their own invoices
ALTER TABLE invoice_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins_all_reminders" ON invoice_reminders
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "sellers_own_reminders" ON invoice_reminders
  FOR SELECT USING (seller_id = auth.uid()::text);

-- ─── Helper function: get full settlement status for an invoice ───────────────

CREATE OR REPLACE FUNCTION get_invoice_settlement_status(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'settlement',      row_to_json(s.*),
    'pending',         row_to_json(ps.*),
    'shortfall',       row_to_json(sf.*),
    'virtual_account', row_to_json(va.*)
  )
  INTO v_result
  FROM invoices i
  LEFT JOIN invoice_settlements s    ON s.invoice_id = i.id AND s.status != 'rejected'
  LEFT JOIN pending_settlements ps   ON ps.invoice_id = i.id
  LEFT JOIN invoice_shortfalls sf    ON sf.invoice_id = i.id
  LEFT JOIN invoice_virtual_accounts va ON va.invoice_id = i.id
  WHERE i.id = p_invoice_id
  LIMIT 1;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;
