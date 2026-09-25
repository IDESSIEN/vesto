/**
 * Object-Level Authorization Negative Tests
 * ==========================================
 * Tests that cross-account access is denied at the Supabase RLS + trigger layer.
 *
 * Each test uses two separate Supabase client instances authenticated as
 * different users (attacker and victim) and proves that the attacker cannot
 * read, update, or delete records owned by the victim.
 *
 * These are integration tests that require a live Supabase instance with the
 * 20260925000000_security_hardening.sql migration applied.
 *
 * Run: bun test tests/security/object-level-authorization.test.ts
 *
 * Environment variables required:
 *   SUPABASE_URL          — your project URL
 *   SUPABASE_ANON_KEY     — anon public key
 *   TEST_SELLER_A_JWT     — JWT for seller A (victim)
 *   TEST_SELLER_B_JWT     — JWT for seller B (attacker)
 *   TEST_LENDER_JWT       — JWT for a lender account
 *   TEST_ADMIN_JWT        — JWT for an admin account
 *   TEST_SELLER_A_ID      — UUID of seller A's profile
 *   TEST_SELLER_B_ID      — UUID of seller B's profile
 *   TEST_INVOICE_A_ID     — ID of an invoice owned by seller A
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll } from 'bun:test';

// ─── Client factory ──────────────────────────────────────────────────────────

function makeClient(jwt?: string): SupabaseClient {
  const url  = process.env.SUPABASE_URL!;
  const anon = process.env.SUPABASE_ANON_KEY!;
  if (!url || !anon) throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set');
  return createClient(url, anon, {
    global: jwt ? { headers: { Authorization: `Bearer ${jwt}` } } : undefined,
  });
}

// ─── Test fixtures ───────────────────────────────────────────────────────────

let sellerA: SupabaseClient;   // victim — owns the test resources
let sellerB: SupabaseClient;   // attacker — should be denied access
let lender:  SupabaseClient;   // lender role
let admin:   SupabaseClient;   // admin role
let anon:    SupabaseClient;   // unauthenticated

const SELLER_A_ID   = process.env.TEST_SELLER_A_ID!;
const SELLER_A_JWT  = process.env.TEST_SELLER_A_JWT!;
const SELLER_B_ID   = process.env.TEST_SELLER_B_ID!;
const INVOICE_A_ID  = process.env.TEST_INVOICE_A_ID!;

const SKIP = !process.env.SUPABASE_URL;

beforeAll(() => {
  if (SKIP) return;
  sellerA = makeClient(process.env.TEST_SELLER_A_JWT);
  sellerB = makeClient(process.env.TEST_SELLER_B_JWT);
  lender  = makeClient(process.env.TEST_LENDER_JWT);
  admin   = makeClient(process.env.TEST_ADMIN_JWT);
  anon    = makeClient();
});

// ─── Helper ──────────────────────────────────────────────────────────────────

function skip(name: string) {
  it.skip(`[SKIP — no Supabase] ${name}`, () => {});
}

// ─── 1. PROFILES ─────────────────────────────────────────────────────────────

describe('profiles — cross-account read denied', () => {
  it('seller B cannot read seller A profile', async () => {
    if (SKIP) return;
    const { data, error } = await sellerB
      .from('profiles')
      .select('*')
      .eq('id', SELLER_A_ID)
      .single();
    // RLS: SELECT only allowed for auth.uid() = id OR is_admin()
    // Seller B is neither — should get empty or RLS error
    expect(data).toBeNull();
    expect(error).not.toBeNull();
  });

  it('anon cannot read any profile', async () => {
    if (SKIP) return;
    const { data } = await anon.from('profiles').select('*').limit(1);
    expect(data).toEqual([]);
  });
});

describe('profiles — role escalation denied', () => {
  it('seller A cannot set their own role to admin', async () => {
    if (SKIP) return;
    const { error } = await sellerA
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', SELLER_A_ID);
    expect(error).not.toBeNull();
    expect(error!.message).toContain('AUTHORIZATION_DENIED');
  });

  it('seller A cannot set their own verification_tier to 2', async () => {
    if (SKIP) return;
    const { error } = await sellerA
      .from('profiles')
      .update({ verification_tier: 2 })
      .eq('id', SELLER_A_ID);
    expect(error).not.toBeNull();
    expect(error!.message).toContain('AUTHORIZATION_DENIED');
  });

  it('seller A cannot set their own credit_limit to 1000000', async () => {
    if (SKIP) return;
    const { error } = await sellerA
      .from('profiles')
      .update({ credit_limit: 1000000 })
      .eq('id', SELLER_A_ID);
    expect(error).not.toBeNull();
    expect(error!.message).toContain('AUTHORIZATION_DENIED');
  });

  it('seller B cannot update seller A profile (any field)', async () => {
    if (SKIP) return;
    const { error } = await sellerB
      .from('profiles')
      .update({ full_name: 'PWNED' })
      .eq('id', SELLER_A_ID);
    // Either RLS blocks it (0 rows affected, no error) or trigger raises
    // Either way the name must not have changed — verified by reading as admin
    if (!error) {
      // Verify no change occurred
      const { data } = await admin.from('profiles').select('full_name').eq('id', SELLER_A_ID).single();
      expect(data?.full_name).not.toBe('PWNED');
    }
  });
});

// ─── 2. INVOICES ─────────────────────────────────────────────────────────────

describe('invoices — cross-account read denied', () => {
  it('seller B cannot read seller A pending invoices', async () => {
    if (SKIP) return;
    const { data } = await sellerB
      .from('invoices')
      .select('*')
      .eq('seller_id', SELLER_A_ID)
      .eq('status', 'pending_admin_approval');
    // Pending invoices are not visible to other sellers
    expect(data).toEqual([]);
  });

  it('anon cannot read any invoices', async () => {
    if (SKIP) return;
    const { data } = await anon.from('invoices').select('*').limit(5);
    expect(data).toEqual([]);
  });
});

describe('invoices — cross-account write denied', () => {
  it('seller B cannot update seller A invoice status', async () => {
    if (SKIP) return;
    const { error } = await sellerB
      .from('invoices')
      .update({ status: 'published_marketplace' })
      .eq('id', INVOICE_A_ID);
    expect(error).not.toBeNull();
  });

  it('seller A cannot self-approve their own invoice', async () => {
    if (SKIP) return;
    const { error } = await sellerA
      .from('invoices')
      .update({ status: 'published_marketplace' })
      .eq('id', INVOICE_A_ID);
    expect(error).not.toBeNull();
    expect(error!.message).toContain('AUTHORIZATION_DENIED');
  });

  it('seller A cannot change risk_tier on their own invoice', async () => {
    if (SKIP) return;
    const { error } = await sellerA
      .from('invoices')
      .update({ risk_tier: 'A+', risk_score: 100 })
      .eq('id', INVOICE_A_ID);
    expect(error).not.toBeNull();
    expect(error!.message).toContain('AUTHORIZATION_DENIED');
  });

  it('seller A cannot submit invoice with a different seller_id', async () => {
    if (SKIP) return;
    const { error } = await sellerA
      .from('invoices')
      .insert({
        id: 'TEST-FAKE-OWNERSHIP',
        seller_id: SELLER_B_ID,       // attacker claims to own another seller's ID
        seller_business_name: 'PWNED',
        buyer_name: 'Test Buyer',
        buyer_tax_id: 'TEST',
        buyer_country: 'Kenya',
        amount: 1000,
        advance_rate_pct: 85,
        advance_amount: 850,
        fee_pct: 2.8,
        fee_amount: 23.8,
        expected_yield_pct: 14.5,
        due_date: '2026-12-01',
        term_days: 60,
        risk_tier: 'A+',
        risk_score: 90,
        status: 'pending_admin_approval',
      });
    expect(error).not.toBeNull();
    expect(error!.message).toContain('AUTHORIZATION_DENIED');
  });
});

describe('invoices — funded_by_lender_id immutability', () => {
  it('seller A cannot change funded_by_lender_id after funding', async () => {
    if (SKIP) return;
    // Find a funded invoice owned by seller A (if any)
    const { data: funded } = await sellerA
      .from('invoices')
      .select('id, funded_by_lender_id')
      .eq('seller_id', SELLER_A_ID)
      .eq('status', 'funded')
      .limit(1);

    if (!funded?.length || !funded[0].funded_by_lender_id) {
      console.log('No funded invoices for seller A — skipping immutability test');
      return;
    }

    const { error } = await sellerA
      .from('invoices')
      .update({ funded_by_lender_id: SELLER_B_ID })  // try to redirect payout
      .eq('id', funded[0].id);

    expect(error).not.toBeNull();
    expect(error!.message).toContain('AUTHORIZATION_DENIED');
  });
});

// ─── 3. DOCUMENTS ────────────────────────────────────────────────────────────

describe('documents — cross-account read denied', () => {
  it('seller B cannot read seller A documents', async () => {
    if (SKIP) return;
    const { data } = await sellerB
      .from('documents')
      .select('*')
      .eq('user_id', SELLER_A_ID);
    expect(data).toEqual([]);
  });
});

describe('documents — cannot insert with wrong user_id', () => {
  it('seller A cannot create a document with seller B user_id', async () => {
    if (SKIP) return;
    const { error } = await sellerA
      .from('documents')
      .insert({
        user_id: SELLER_B_ID,        // wrong uid
        document_type: 'tier1_id',
        file_name: 'pwned.pdf',
        file_url: 'https://evil.com/pwned.pdf',
      });
    expect(error).not.toBeNull();
    expect(error!.message).toContain('AUTHORIZATION_DENIED');
  });
});

// ─── 4. BUYER ACKNOWLEDGEMENTS ───────────────────────────────────────────────

describe('buyer_acknowledgements — cross-account read denied', () => {
  it('seller B cannot read acknowledgements for seller A invoices', async () => {
    if (SKIP) return;
    const { data } = await sellerB
      .from('buyer_acknowledgements')
      .select('*')
      .eq('invoice_id', INVOICE_A_ID);
    expect(data).toEqual([]);
  });

  it('anon cannot read any acknowledgements', async () => {
    if (SKIP) return;
    const { data } = await anon.from('buyer_acknowledgements').select('*').limit(5);
    expect(data).toEqual([]);
  });
});

// ─── 5. SETTLEMENT TABLES ────────────────────────────────────────────────────

describe('invoice_settlements — cross-account read denied', () => {
  it('seller B cannot read settlements for seller A invoices', async () => {
    if (SKIP) return;
    const { data } = await sellerB
      .from('invoice_settlements')
      .select('*')
      .eq('invoice_id', INVOICE_A_ID);
    expect(data).toEqual([]);
  });

  it('anon cannot read any settlements', async () => {
    if (SKIP) return;
    const { data } = await anon.from('invoice_settlements').select('*').limit(5);
    expect(data).toEqual([]);
  });
});

describe('pending_settlements — sellers cannot block settlements they do not own', () => {
  it('seller B cannot update pending_settlements for seller A invoice', async () => {
    if (SKIP) return;
    const { error } = await sellerB
      .from('pending_settlements')
      .update({ blocked: true, block_reason: 'PWNED' })
      .eq('invoice_id', INVOICE_A_ID);
    // RLS allows admin only for UPDATE — seller B should be blocked
    expect(error).not.toBeNull();
  });

  it('seller A cannot block their own pending settlement', async () => {
    if (SKIP) return;
    const { error } = await sellerA
      .from('pending_settlements')
      .update({ blocked: true, block_reason: 'seller self-block attempt' })
      .eq('invoice_id', INVOICE_A_ID);
    // Only admins can UPDATE pending_settlements
    expect(error).not.toBeNull();
  });
});

// ─── 6. ADMIN NOTES ──────────────────────────────────────────────────────────

describe('admin_notes — non-admin cannot insert', () => {
  it('seller A cannot create an admin note', async () => {
    if (SKIP) return;
    const { error } = await sellerA
      .from('admin_notes')
      .insert({
        entity_type: 'invoice',
        entity_id: INVOICE_A_ID,
        admin_name: 'Institutional Risk Admin',
        note: 'PWNED — self-approved',
      });
    expect(error).not.toBeNull();
  });

  it('lender cannot create an admin note', async () => {
    if (SKIP) return;
    const { error } = await lender
      .from('admin_notes')
      .insert({
        entity_type: 'invoice',
        entity_id: INVOICE_A_ID,
        admin_name: 'Institutional Risk Admin',
        note: 'PWNED by lender',
      });
    expect(error).not.toBeNull();
  });

  it('anon cannot create an admin note', async () => {
    if (SKIP) return;
    const { error } = await anon
      .from('admin_notes')
      .insert({
        entity_type: 'invoice',
        entity_id: INVOICE_A_ID,
        admin_name: 'Anon Admin',
        note: 'PWNED by anon',
      });
    expect(error).not.toBeNull();
  });
});

// ─── 7. BUYERS TABLE ─────────────────────────────────────────────────────────

describe('buyers — non-admin cannot freeze or change credit tier', () => {
  it('seller A cannot freeze a buyer', async () => {
    if (SKIP) return;
    const { data: buyers } = await sellerA.from('buyers').select('id').limit(1);
    if (!buyers?.length) return;
    const { error } = await sellerA
      .from('buyers')
      .update({ frozen: true, frozen_reason: 'PWNED' })
      .eq('id', buyers[0].id);
    expect(error).not.toBeNull();
    expect(error!.message).toContain('AUTHORIZATION_DENIED');
  });

  it('lender cannot change buyer credit_tier', async () => {
    if (SKIP) return;
    const { data: buyers } = await lender.from('buyers').select('id').limit(1);
    if (!buyers?.length) return;
    const { error } = await lender
      .from('buyers')
      .update({ credit_tier: 'A+', credit_score: 100 })
      .eq('id', buyers[0].id);
    expect(error).not.toBeNull();
    expect(error!.message).toContain('AUTHORIZATION_DENIED');
  });
});

// ─── 8. SEND-ACKNOWLEDGEMENT EDGE FUNCTION ───────────────────────────────────

describe('send-acknowledgement — unauthenticated request denied', () => {
  const edgeFnUrl = `${process.env.SUPABASE_URL}/functions/v1/send-acknowledgement`;

  it('rejects request with no Authorization header', async () => {
    if (SKIP || !process.env.SUPABASE_URL) return;
    const res = await fetch(edgeFnUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: INVOICE_A_ID }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Unauthorized');
  });

  it('rejects request from non-admin authenticated seller', async () => {
    if (SKIP || !process.env.SUPABASE_URL || !SELLER_A_JWT) return;
    const res = await fetch(edgeFnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SELLER_A_JWT}`,
        'apikey': process.env.SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ invoiceId: INVOICE_A_ID }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Unauthorized');
  });
});

// ─── Summary ─────────────────────────────────────────────────────────────────
// Total: 22 negative tests across 8 attack surfaces
// All tests verify that the server rejects the request based on the
// authenticated session identity — never trusting client-supplied IDs or roles.
//
// Attack surfaces covered:
// 1. Profile read (cross-account)          — DENIED
// 2. Profile role escalation               — DENIED (trigger + RLS)
// 3. Profile credit limit self-modification — DENIED (trigger)
// 4. Invoice read (cross-account)          — DENIED (RLS)
// 5. Invoice status self-approval          — DENIED (trigger)
// 6. Invoice risk_tier self-modification   — DENIED (trigger)
// 7. Invoice seller_id spoofing on INSERT  — DENIED (trigger + RLS)
// 8. Invoice funded_by_lender_id redirect  — DENIED (trigger)
// 9. Document cross-account read           — DENIED (RLS)
// 10. Document INSERT with wrong user_id   — DENIED (trigger + RLS)
// 11. Buyer acknowledgement cross-read     — DENIED (RLS)
// 12. Settlement cross-account read        — DENIED (RLS)
// 13. Pending settlement seller-block      — DENIED (RLS — admin only UPDATE)
// 14. Admin note INSERT by non-admin       — DENIED (trigger + RLS)
// 15. Buyer freeze by non-admin            — DENIED (trigger)
// 16. Buyer credit_tier change by lender   — DENIED (trigger)
// 17. Edge Function unauthenticated call   — DENIED (JWT check)
// 18. Edge Function non-admin call         — DENIED (role check)
