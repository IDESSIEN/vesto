-- Migration: buyer acknowledgements
-- Stores one-click buyer confirmation records per invoice.
-- No buyer account required — identified by email + HMAC token.

create table if not exists buyer_acknowledgements (
  id                    uuid primary key default gen_random_uuid(),
  invoice_id            text not null references invoices(id) on delete cascade,
  buyer_id              uuid references buyers(id),
  buyer_email           text not null,
  token                 text not null unique,           -- signed HMAC token
  status                text not null default 'pending' -- pending | confirmed | disputed | expired
    check (status in ('pending','confirmed','disputed','expired')),
  email_sent_at         timestamptz,
  confirmed_at          timestamptz,
  confirmed_ip          text,
  confirmed_user_agent  text,
  expires_at            timestamptz not null,
  created_at            timestamptz not null default now()
);

-- Index for fast lookup by invoice_id
create index if not exists idx_ack_invoice_id on buyer_acknowledgements(invoice_id);
-- Index for token lookup (used on every confirmation click)
create index if not exists idx_ack_token on buyer_acknowledgements(token);

-- Add acknowledgement fields to invoices if not already present
alter table invoices
  add column if not exists buyer_acknowledged        boolean default false,
  add column if not exists buyer_acknowledged_at     timestamptz,
  add column if not exists buyer_acknowledged_ip     text,
  add column if not exists buyer_contact_email       text;   -- AP contact email for the buyer

-- RLS: sellers can see acknowledgements for their own invoices
alter table buyer_acknowledgements enable row level security;

create policy "Sellers can read their invoice acknowledgements"
  on buyer_acknowledgements for select
  using (
    invoice_id in (
      select id from invoices where seller_id = auth.uid()::text
    )
  );

create policy "Admin can read all acknowledgements"
  on buyer_acknowledgements for select
  using (
    exists (
      select 1 from admin_users where id = auth.uid()
    )
  );

-- Service role (Edge Functions) can insert and update
create policy "Service role full access"
  on buyer_acknowledgements for all
  using (auth.role() = 'service_role');

-- Function: auto-expire stale acknowledgements (called by a daily cron)
create or replace function expire_stale_acknowledgements()
returns void as $$
begin
  update buyer_acknowledgements
  set status = 'expired'
  where status = 'pending'
    and expires_at < now();
end;
$$ language plpgsql security definer;

comment on table buyer_acknowledgements is
  'One-click buyer confirmation records. Buyers click a signed link in an email — no account required.
   Confirmed records provide cryptographic proof that the buyer acknowledged the debt before lender funding.
   IP address and user-agent are logged at confirmation time for fraud investigation.';
