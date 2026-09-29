Reading the codebase to check every one of these five against what's actually in the code. Now check for console.log of any sensitive values, VITE_ prefixed secrets, and service role key usage in frontend code: Now check the initial schema for RLS enablement, and check the Edge Functions for any console.log of sensitive data: Full picture. Here is the complete, honest check against all five exposure risks:

---

## Check 1 — Service role key in a VITE_ variable

**Status: Clean.**

`src/lib/supabase.ts` uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. No service role key anywhere in the `src/` directory. The grep for `SERVICE_ROLE` across all of `src/` returned zero matches. The service role key is referenced only in Edge Functions via `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` — server-side only, never in the browser bundle.

**One thing to note:** `supabase.ts` has a hardcoded fallback URL (`https://advance-agrarian-monad.supabase.co`) and `'mock_key'` fallback. These are placeholders, not real secrets — but the old Supabase project URL is visible in the bundle if env vars are not set. This is not a security risk (it is just an address, not a key) but it is a hygiene issue. When you wire the real project, the env vars will override these fallbacks and the old URL disappears.

---

## Check 2 — Committing .env to GitHub

**Status: Clean.**

`.gitignore` explicitly lists:
```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

All five variants are excluded. The only env-related file that can ever reach GitHub is `.env.example` — which contains only placeholder names, never real values. The real `.env` file (with your actual Supabase URL and anon key) will never be committed as long as `.gitignore` stays intact.

**One thing to note:** `*.log` is also in `.gitignore` — this matters because if a secret ever appeared in a log file and that file was committed, it would be in the git history permanently.

---

## Check 3 — RLS disabled on any table

**Status: Clean — with one gap.**

The initial schema migration explicitly enables RLS on five tables:
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
```

**The gap:** The newer tables added in later migrations — `invoice_virtual_accounts`, `invoice_settlements`, `pending_settlements`, `buyer_acknowledgements`, `buyers`, `invoice_reminders` — each have `ENABLE ROW LEVEL SECURITY` in their own migration files. This is correct. But you need to verify in the Supabase dashboard after running all migrations that every table in the list shows the green RLS shield. The migrations should have done it, but if any migration was run partially or errored mid-way, a table could be left with RLS disabled. Check: Supabase → Table Editor → each table → the RLS badge in the top right.

---

## Check 4 — Trusting user-supplied IDs without re-checking the session

**Status: Fixed by the security hardening migration.**

This was the most serious gap found in the audit. Before the hardening migration, `updateSellerTierOffchain` accepted a `sellerId` from the client and called `profiles.update()` with it — any authenticated user could supply someone else's UUID and escalate their verification tier.

The security hardening migration (`20260925000000_security_hardening.sql`) fixed this with:
- A `BEFORE UPDATE` trigger on `profiles` that raises `AUTHORIZATION_DENIED` if a non-admin touches `role`, `verification_tier`, `credit_limit`, or `used_limit`
- A `SECURITY DEFINER` RPC function for `updateSellerTier` that re-checks `is_admin()` inside Postgres — the user ID comes from `auth.uid()`, never from the request body
- An immutability trigger on `invoices.funded_by_lender_id` — cannot be changed after it is set
- A restricted UPDATE policy on `invoices` that blocks sellers from changing `status`, `risk_tier`, `risk_score`, or `funded_by_lender_id`

One residual note: `supabaseService.ts` has a `saveInvoiceOffchain` function that passes `seller_id: invoice.sellerId` from the client-supplied `Invoice` object. The INSERT RLS policy `WITH CHECK (auth.uid() = seller_id)` catches this at the DB layer — if the seller_id does not match the authenticated user's UUID, Postgres rejects the insert. This is correct behaviour. The client-supplied value is validated by the DB, not trusted blindly.

---

## Check 5 — Logging secrets in console.log

**Status: Clean.**

Zero `console.log` calls across the entire `src/` directory (all `.ts` and `.tsx` files). Zero `console.log` calls across all six Edge Functions in `supabase/functions/`. This means no API keys, JWT tokens, webhook secrets, or user data are being logged to the browser console or Supabase Edge Function logs.

**One legacy file to clean up:** `supabase/functions/agora/index.ts` is a leftover from the original Advance app (it proxies Agora Finance API calls). It references `AGORA_API_KEY` which is no longer used in Vesto. It does not log anything sensitive, but it is dead code. It should be deleted when you wire the real Supabase project so it does not consume Edge Function invocation quota.

---

## Summary scorecard

| Risk | Status | Action needed |
|---|---|---|
| Service role key in browser | Clean | None |
| .env committed to GitHub | Clean | None |
| RLS disabled | Mostly clean | Verify each new table in Supabase dashboard after migrations |
| User-supplied ID trusted | Fixed | Migration must be run — not automatic until applied to live project |
| console.log of secrets | Clean | Delete dead `agora/index.ts` function when wiring live project |

**The one action required before going live:** run all six migrations on the live Supabase project in order, then verify RLS is enabled on every table in the dashboard. Everything else is already in order.
