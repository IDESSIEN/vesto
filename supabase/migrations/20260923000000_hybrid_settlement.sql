-- ============================================================
-- Vesto Hybrid Settlement System — Migration
-- Adds three tables for L2 virtual accounts, L3 webhook
-- settlement records, and the 24h pending settlement queue.
-- ============================================================

-- L2: virtual bank account issued per funded invoice
create table if not exists invoice_virtual_accounts (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references invoices(id) on delete cascade,
  provider        text not null check (provider in ('stripe','flutterwave','nala','manual')),
  account_id      text not null,       -- provider's internal virtual account ID
  account_number  text not null,       -- what the buyer sees on their remittance
  routing_ref     text,                -- routing number / sort code (where applicable)
  currency        text not null default 'USD',
  created_at      timestamptz not null default now(),
  unique (invoice_id)
);

comment on table invoice_virtual_accounts is
  'L2 – unique virtual bank account issued per funded invoice for unambiguous payment routing.';

-- L3: raw webhook settlement records for full audit trail
create table if not exists invoice_settlements (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references invoices(id) on delete cascade,
  provider        text not null,
  amount          numeric(18,6) not null,
  currency        text not null,
  payer_name      text,
  payment_ref     text,
  settled_at      timestamptz not null,
  webhook_payload jsonb,               -- raw provider payload — keep forever
  status          text not null default 'pending_buffer'
                  check (status in ('pending_buffer','executed','blocked','partial')),
  created_at      timestamptz not null default now()
);

comment on table invoice_settlements is
  'L3 – BaaS webhook payment records. One row per payment event. Immutable after insert.';

create index if not exists invoice_settlements_invoice_id_idx
  on invoice_settlements(invoice_id);

create index if not exists invoice_settlements_status_idx
  on invoice_settlements(status);

-- L3/L4: pending auto-settlement queue (one row per invoice in 24h buffer)
create table if not exists pending_settlements (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references invoices(id) on delete cascade,
  settlement_id   uuid not null references invoice_settlements(id) on delete cascade,
  execute_after   timestamptz not null,  -- settlement received_at + 24h
  blocked         boolean not null default false,
  block_reason    text,
  blocked_by      uuid references auth.users(id),
  blocked_at      timestamptz,
  executed        boolean not null default false,
  executed_at     timestamptz,
  created_at      timestamptz not null default now(),
  unique (invoice_id)  -- only one pending settlement per invoice at a time
);

comment on table pending_settlements is
  'L3/L4 – 24h buffer queue. Cron job executes matured rows; admin can block within window.';

create index if not exists pending_settlements_execute_after_idx
  on pending_settlements(execute_after)
  where executed = false and blocked = false;

-- ────────────────────────────────────────── RLS policies ──

alter table invoice_virtual_accounts enable row level security;
alter table invoice_settlements       enable row level security;
alter table pending_settlements       enable row level security;

-- Sellers can read their own virtual account details (to show repayment instructions)
create policy "Sellers read own virtual accounts"
  on invoice_virtual_accounts for select
  using (
    invoice_id in (
      select id from invoices where seller_id = auth.uid()
    )
  );

-- Lenders can read virtual account details for invoices they funded
create policy "Lenders read funded invoice virtual accounts"
  on invoice_virtual_accounts for select
  using (
    invoice_id in (
      select id from invoices where lender_id = auth.uid()
    )
  );

-- Admins have full access to all three tables (use service_role key in Edge Functions)
-- (No policy needed — service_role bypasses RLS)

-- Lenders can read settlement records for their funded invoices
create policy "Lenders read own settlement records"
  on invoice_settlements for select
  using (
    invoice_id in (
      select id from invoices where lender_id = auth.uid()
    )
  );

-- Sellers can read settlement records for their invoices
create policy "Sellers read own settlement records"
  on invoice_settlements for select
  using (
    invoice_id in (
      select id from invoices where seller_id = auth.uid()
    )
  );

-- Lenders can read pending settlements for their funded invoices
create policy "Lenders read pending settlements"
  on pending_settlements for select
  using (
    invoice_id in (
      select id from invoices where lender_id = auth.uid()
    )
  );
