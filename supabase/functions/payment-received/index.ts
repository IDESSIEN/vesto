/**
 * Supabase Edge Function: payment-received
 *
 * Receives BaaS provider webhooks (Stripe Treasury, Flutterwave, Nala, or mock).
 * Validates the payment, matches it to an invoice, and queues a 24-hour
 * auto-settlement via the pending_settlements table.
 *
 * Provider is identified from the X-Vesto-Provider header.
 * Each provider has its own adapter that normalises the payload.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PaymentEvent {
  virtualAccountId: string;   // provider's virtual account ID
  amount: number;             // amount received
  currency: string;           // e.g. 'USD', 'USDC'
  payerName?: string;
  payerAccount?: string;
  paymentRef?: string;
  settledAt: string;          // ISO timestamp when bank confirmed
  status: 'settled' | 'pending' | 'failed';
  rawPayload: unknown;
}

interface BaaSAdapter {
  name: string;
  verifySignature(body: string, signature: string, secret: string): Promise<boolean>;
  parsePayload(body: unknown): PaymentEvent;
}

// ─── BaaS Adapters ───────────────────────────────────────────────────────────

const stripeAdapter: BaaSAdapter = {
  name: 'stripe',
  async verifySignature(body, signature, secret) {
    // Stripe uses t=timestamp,v1=signature format
    const parts = signature.split(',').reduce((acc, part) => {
      const [k, v] = part.split('=');
      acc[k] = v;
      return acc;
    }, {} as Record<string, string>);

    const signedPayload = `${parts['t']}.${body}`;
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return computed === parts['v1'];
  },
  parsePayload(body: unknown): PaymentEvent {
    const b = body as Record<string, unknown>;
    const obj = (b['data'] as Record<string, unknown>)?.['object'] as Record<string, unknown>;
    return {
      virtualAccountId: obj?.['financial_account'] as string ?? '',
      amount: ((obj?.['amount'] as number) ?? 0) / 100,  // Stripe uses cents
      currency: ((obj?.['currency'] as string) ?? 'usd').toUpperCase(),
      payerName: (obj?.['description'] as string) ?? undefined,
      paymentRef: (obj?.['id'] as string) ?? undefined,
      settledAt: new Date((((obj?.['created'] as number) ?? 0) * 1000)).toISOString(),
      status: obj?.['status'] === 'posted' ? 'settled' : 'pending',
      rawPayload: body,
    };
  },
};

const flutterwaveAdapter: BaaSAdapter = {
  name: 'flutterwave',
  async verifySignature(body, signature, secret) {
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
    const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return computed === signature;
  },
  parsePayload(body: unknown): PaymentEvent {
    const b = body as Record<string, unknown>;
    const data = b['data'] as Record<string, unknown>;
    return {
      virtualAccountId: data?.['account_number'] as string ?? '',
      amount: data?.['amount'] as number ?? 0,
      currency: data?.['currency'] as string ?? 'USD',
      payerName: data?.['customer']?.['name'] as string ?? undefined,
      payerAccount: data?.['customer']?.['email'] as string ?? undefined,
      paymentRef: data?.['tx_ref'] as string ?? undefined,
      settledAt: data?.['created_at'] as string ?? new Date().toISOString(),
      status: data?.['status'] === 'successful' ? 'settled' : 'pending',
      rawPayload: body,
    };
  },
};

const mockAdapter: BaaSAdapter = {
  name: 'mock',
  async verifySignature(_body, signature, _secret) {
    // Mock adapter accepts any non-empty signature — for development only
    return signature === 'mock-valid-sig';
  },
  parsePayload(body: unknown): PaymentEvent {
    const b = body as Record<string, unknown>;
    return {
      virtualAccountId: b['virtualAccountId'] as string ?? '',
      amount: b['amount'] as number ?? 0,
      currency: b['currency'] as string ?? 'USD',
      payerName: b['payerName'] as string ?? undefined,
      payerAccount: b['payerAccount'] as string ?? undefined,
      paymentRef: b['paymentRef'] as string ?? undefined,
      settledAt: b['settledAt'] as string ?? new Date().toISOString(),
      status: b['status'] as PaymentEvent['status'] ?? 'settled',
      rawPayload: body,
    };
  },
};

const ADAPTERS: Record<string, BaaSAdapter> = {
  stripe: stripeAdapter,
  flutterwave: flutterwaveAdapter,
  nala: flutterwaveAdapter,  // Nala uses same format as Flutterwave
  mock: mockAdapter,
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_FEE_PCT = 2.8;
const BUFFER_HOURS = 24;
const PARTIAL_THRESHOLD = 0.50;  // below 50% of required = rejected
const CURE_DAYS = 7;

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  try {
    const providerName = (req.headers.get('X-Vesto-Provider') ?? 'mock').toLowerCase();
    const adapter = ADAPTERS[providerName] ?? mockAdapter;
    const webhookSecret = Deno.env.get(`WEBHOOK_SECRET_${providerName.toUpperCase()}`) ?? '';
    const signature = req.headers.get('X-Webhook-Signature') ??
                      req.headers.get('Stripe-Signature') ??
                      req.headers.get('verif-hash') ?? '';

    const rawBody = await req.text();

    // ── 1. Verify webhook signature ────────────────────────────────────────
    if (webhookSecret) {
      const valid = await adapter.verifySignature(rawBody, signature, webhookSecret);
      if (!valid) {
        console.error('Webhook signature verification failed', { provider: providerName });
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
      }
    }

    // ── 2. Parse the payment event ────────────────────────────────────────
    const body = JSON.parse(rawBody);
    const event = adapter.parsePayload(body);

    if (event.status !== 'settled') {
      // Not yet settled — acknowledge but do nothing
      return new Response(JSON.stringify({ received: true, action: 'awaiting_settlement' }), { status: 200 });
    }

    // ── 3. Match to invoice via virtual account ────────────────────────────
    const { data: va, error: vaErr } = await supabase
      .from('invoice_virtual_accounts')
      .select('invoice_id, currency')
      .or(`account_id.eq.${event.virtualAccountId},account_number.eq.${event.virtualAccountId}`)
      .single();

    if (vaErr || !va) {
      console.error('No virtual account found for', event.virtualAccountId);
      // Log unmatched payment for manual review
      await supabase.from('unmatched_payments').insert({
        provider: providerName,
        virtual_account_id: event.virtualAccountId,
        amount: event.amount,
        currency: event.currency,
        settled_at: event.settledAt,
        webhook_payload: event.rawPayload,
      });
      return new Response(JSON.stringify({ error: 'No matching invoice found' }), { status: 404 });
    }

    const invoiceId = va.invoice_id;

    // ── 4. Load invoice ────────────────────────────────────────────────────
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invErr || !invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), { status: 404 });
    }

    if (invoice.status === 'repaid' || invoice.status === 'settled') {
      return new Response(JSON.stringify({ received: true, action: 'already_settled' }), { status: 200 });
    }

    // ── 5. Calculate required amount ──────────────────────────────────────
    const advanceAmount = invoice.advance_amount ?? 0;
    const grossYield = advanceAmount * ((invoice.expected_yield_pct ?? 17.6) / 100) * ((invoice.term_days ?? 60) / 365);
    const platformFee = advanceAmount * (PLATFORM_FEE_PCT / 100) * ((invoice.term_days ?? 60) / 365);
    const totalRequired = advanceAmount + grossYield + platformFee;
    const coveragePct = event.amount / totalRequired;

    // ── 6. Store settlement record ─────────────────────────────────────────
    const paymentType = event.amount >= totalRequired ? 'full' : 'partial';
    const { data: settlement, error: settleErr } = await supabase
      .from('invoice_settlements')
      .insert({
        invoice_id: invoiceId,
        provider: providerName,
        amount: event.amount,
        currency: event.currency,
        payer_name: event.payerName,
        payer_account: event.payerAccount,
        payment_ref: event.paymentRef,
        payment_type: paymentType,
        settled_at: event.settledAt,
        webhook_payload: event.rawPayload,
        status: 'pending_buffer',
      })
      .select()
      .single();

    if (settleErr || !settlement) {
      console.error('Failed to store settlement record', settleErr);
      return new Response(JSON.stringify({ error: 'Database error' }), { status: 500 });
    }

    // ── 7. Reject if below minimum threshold (likely fraud) ────────────────
    if (coveragePct < PARTIAL_THRESHOLD) {
      await supabase.from('invoice_settlements')
        .update({ status: 'rejected', rejection_reason: `Payment covers only ${(coveragePct * 100).toFixed(1)}% of required amount` })
        .eq('id', settlement.id);

      // Alert admin
      await supabase.from('admin_notifications').insert({
        type: 'suspicious_payment',
        invoice_id: invoiceId,
        message: `Received ${event.currency} ${event.amount} on invoice ${invoiceId} — only ${(coveragePct * 100).toFixed(1)}% of required. Possible fraud.`,
        metadata: { settlement_id: settlement.id, coverage_pct: coveragePct * 100 },
      });

      return new Response(JSON.stringify({ received: true, action: 'rejected_insufficient', coveragePct }), { status: 200 });
    }

    // ── 8. Partial payment — Layer 7 ──────────────────────────────────────
    if (paymentType === 'partial') {
      const cureDeadline = new Date(Date.now() + CURE_DAYS * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('invoice_shortfalls').insert({
        invoice_id: invoiceId,
        settlement_id: settlement.id,
        total_due: totalRequired,
        amount_received: event.amount,
        cure_deadline: cureDeadline,
        status: 'open',
      });

      await supabase.from('invoices').update({ status: 'partial_shortfall' }).eq('id', invoiceId);

      // Queue the partial settlement — proportional release after buffer
      const executeAfter = new Date(Date.now() + BUFFER_HOURS * 60 * 60 * 1000).toISOString();
      await supabase.from('pending_settlements').insert({
        invoice_id: invoiceId,
        settlement_id: settlement.id,
        execute_after: executeAfter,
      });

      return new Response(JSON.stringify({
        received: true,
        action: 'partial_queued',
        coveragePct: coveragePct * 100,
        cureDeadline,
      }), { status: 200 });
    }

    // ── 9. Full payment — queue 24h auto-settlement ────────────────────────
    const executeAfter = new Date(Date.now() + BUFFER_HOURS * 60 * 60 * 1000).toISOString();
    await supabase.from('pending_settlements').insert({
      invoice_id: invoiceId,
      settlement_id: settlement.id,
      execute_after: executeAfter,
    });

    await supabase.from('invoices').update({ status: 'payment_detected' }).eq('id', invoiceId);

    // ── 10. Notify admin of pending settlement ─────────────────────────────
    await supabase.from('admin_notifications').insert({
      type: 'pending_settlement',
      invoice_id: invoiceId,
      message: `Payment received for invoice ${invoiceId}. Auto-settlement in ${BUFFER_HOURS}h unless blocked.`,
      metadata: {
        settlement_id: settlement.id,
        amount: event.amount,
        payer_name: event.payerName,
        execute_after: executeAfter,
      },
    });

    return new Response(JSON.stringify({
      received: true,
      action: 'queued_for_settlement',
      executeAfter,
      bufferHours: BUFFER_HOURS,
    }), { status: 200 });

  } catch (err) {
    console.error('payment-received error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
});
