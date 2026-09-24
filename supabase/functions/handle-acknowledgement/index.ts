// Supabase Edge Function: handle-acknowledgement
// Called when the buyer clicks the confirmation link in their email.
// Verifies the HMAC token, marks the invoice as buyer_acknowledged,
// and stores the acknowledgement record with IP + timestamp.
// No buyer login required.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ACKNOWLEDGEMENT_SECRET = Deno.env.get('ACKNOWLEDGEMENT_SECRET') ?? 'vesto-ack-secret-v1';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function verifyToken(token: string): { invoiceId: string; buyerEmail: string; expiresAt: number } | null {
  try {
    // Restore base64url padding
    const padded = token.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((token.length * 3) % 4);
    const raw = atob(padded);
    const parts = raw.split('.');
    if (parts.length !== 4) return null;

    const [invoiceId, buyerEmail, expiresAtStr, receivedHmac] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (Date.now() > expiresAt) return null; // expired

    const payload = `${invoiceId}.${buyerEmail}.${expiresAt}`;
    const expectedHmac = createHmac('sha256', ACKNOWLEDGEMENT_SECRET)
      .update(payload)
      .digest('hex');

    if (receivedHmac !== expectedHmac) return null; // tampered

    return { invoiceId, buyerEmail, expiresAt };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('cf-connecting-ip') ?? 'unknown';
    const userAgent = req.headers.get('user-agent') ?? 'unknown';

    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 });
    }

    const verified = verifyToken(token);
    if (!verified) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired confirmation link. Please contact your supplier for a new link.' }),
        { status: 401 }
      );
    }

    const { invoiceId, buyerEmail } = verified;

    // Fetch acknowledgement record
    const { data: ack, error: ackErr } = await supabase
      .from('buyer_acknowledgements')
      .select('*')
      .eq('invoice_id', invoiceId)
      .eq('buyer_email', buyerEmail)
      .single();

    if (ackErr || !ack) {
      return new Response(JSON.stringify({ error: 'Acknowledgement record not found.' }), { status: 404 });
    }

    if (ack.status === 'confirmed') {
      // Already confirmed — idempotent, return success
      return new Response(
        JSON.stringify({ success: true, alreadyConfirmed: true, invoiceId }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    if (ack.status === 'disputed') {
      return new Response(
        JSON.stringify({ error: 'This invoice is under dispute and cannot be confirmed at this time.' }),
        { status: 409 }
      );
    }

    const confirmedAt = new Date().toISOString();

    // Update acknowledgement record
    await supabase
      .from('buyer_acknowledgements')
      .update({
        status: 'confirmed',
        confirmed_at: confirmedAt,
        confirmed_ip: ip,
        confirmed_user_agent: userAgent,
      })
      .eq('invoice_id', invoiceId)
      .eq('buyer_email', buyerEmail);

    // Mark invoice as buyer_acknowledged
    await supabase
      .from('invoices')
      .update({
        buyer_acknowledged: true,
        buyer_acknowledged_at: confirmedAt,
        buyer_acknowledged_ip: ip,
      })
      .eq('id', invoiceId);

    // Fetch invoice for confirmation details
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id, amount, due_date, seller_business_name, term_days')
      .eq('id', invoiceId)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        invoiceId,
        buyerEmail,
        confirmedAt,
        invoice: invoice ?? null,
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err) {
    console.error('handle-acknowledgement error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
