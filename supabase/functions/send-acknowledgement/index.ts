// Supabase Edge Function: send-acknowledgement
// Triggered when admin approves and publishes an invoice.
// Sends a one-click confirmation email to the buyer's accounts-payable contact.
// No buyer account required — just a signed token link.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const ACKNOWLEDGEMENT_SECRET = Deno.env.get('ACKNOWLEDGEMENT_SECRET') ?? 'vesto-ack-secret-v1';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://clever-alpaca-c23dbf.netlify.app';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Generate a signed HMAC token for the acknowledgement link.
// token = base64url( invoiceId + '.' + expiresAt + '.' + hmac )
function generateToken(invoiceId: string, buyerEmail: string): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = `${invoiceId}.${buyerEmail}.${expiresAt}`;
  const hmac = createHmac('sha256', ACKNOWLEDGEMENT_SECRET)
    .update(payload)
    .digest('hex');
  const raw = `${payload}.${hmac}`;
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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
    const body = await req.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: 'invoiceId required' }), { status: 400 });
    }

    // Fetch the invoice from Supabase
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invErr || !invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), { status: 404 });
    }

    // Fetch the buyer record to get their contact email
    const { data: buyer } = await supabase
      .from('buyers')
      .select('*')
      .eq('id', invoice.buyer_id)
      .single();

    const buyerEmail = buyer?.contact_email ?? invoice.buyer_contact_email;
    if (!buyerEmail) {
      return new Response(
        JSON.stringify({ error: 'No buyer contact email on record. Add one before sending acknowledgement.' }),
        { status: 422 }
      );
    }

    // Generate signed token
    const token = generateToken(invoiceId, buyerEmail);
    const ackUrl = `${APP_URL}/acknowledge?token=${token}`;
    const expiryDate = formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

    // Store the pending acknowledgement in Supabase
    const { error: insertErr } = await supabase
      .from('buyer_acknowledgements')
      .insert({
        invoice_id: invoiceId,
        buyer_id: buyer?.id ?? null,
        buyer_email: buyerEmail,
        token,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

    if (insertErr) {
      console.error('Failed to insert acknowledgement record:', insertErr);
    }

    // Send the email via Resend
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice Confirmation Request</title>
</head>
<body style="margin:0;padding:0;background:#F8F6F1;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F6F1;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(13,24,36,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0D1824;padding:28px 36px;">
              <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">
                Ve<span style="color:#B8821E;">sto</span>
              </div>
              <div style="font-size:10px;color:rgba(255,255,255,0.40);letter-spacing:0.08em;text-transform:uppercase;margin-top:4px;">
                Invoice Capital, Onchain
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 28px;">
              <p style="font-size:15px;font-weight:600;color:#0D1824;margin:0 0 8px;">
                Invoice confirmation request
              </p>
              <p style="font-size:13px;color:#4A5568;line-height:1.7;margin:0 0 28px;">
                Dear Finance Team,
              </p>
              <p style="font-size:13px;color:#4A5568;line-height:1.7;margin:0 0 28px;">
                <strong style="color:#0D1824;">${invoice.seller_business_name}</strong> has registered a trade receivable
                against your account on the Vesto platform. Please review the details below and confirm
                that this invoice is correct.
              </p>
              <p style="font-size:12px;color:#4A5568;line-height:1.6;margin:0 0 4px;">
                Your payment instructions remain unchanged — you will pay this invoice as normal.
                Vesto only facilitates early payment to the seller.
              </p>
            </td>
          </tr>

          <!-- Invoice details card -->
          <tr>
            <td style="padding:0 36px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#F8F6F1;border-radius:12px;border:1px solid rgba(13,24,36,0.08);overflow:hidden;">
                <tr>
                  <td style="padding:20px 24px;border-bottom:1px solid rgba(13,24,36,0.06);">
                    <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.09em;color:#8A96A3;font-weight:700;margin-bottom:4px;">
                      Invoice reference
                    </div>
                    <div style="font-size:15px;font-weight:700;color:#0D1824;font-family:'Courier New',monospace;">
                      ${invoice.id}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;width:50%;">
                          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#8A96A3;font-weight:700;">Owed to</div>
                          <div style="font-size:13px;font-weight:600;color:#0D1824;margin-top:2px;">${invoice.seller_business_name}</div>
                        </td>
                        <td style="padding:6px 0;width:50%;">
                          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#8A96A3;font-weight:700;">Amount due</div>
                          <div style="font-size:18px;font-weight:800;color:#0D1824;margin-top:2px;font-family:'Courier New',monospace;">
                            ${formatCurrency(invoice.amount)}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#8A96A3;font-weight:700;">Payment due</div>
                          <div style="font-size:13px;font-weight:600;color:#0D1824;margin-top:2px;">${formatDate(invoice.due_date)}</div>
                        </td>
                        <td style="padding:6px 0;">
                          <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#8A96A3;font-weight:700;">Payment terms</div>
                          <div style="font-size:13px;font-weight:600;color:#0D1824;margin-top:2px;">Net-${invoice.term_days}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 36px 28px;">
              <a href="${ackUrl}"
                style="display:block;background:#B8821E;color:#ffffff;text-decoration:none;
                       text-align:center;padding:16px 24px;border-radius:11px;
                       font-size:14px;font-weight:700;letter-spacing:-0.01em;">
                Confirm this invoice is correct
              </a>
              <p style="font-size:11px;color:#8A96A3;text-align:center;margin:12px 0 0;line-height:1.6;">
                This confirmation link expires on ${expiryDate}.
                Clicking confirm does not change your payment instructions.
              </p>
            </td>
          </tr>

          <!-- Dispute notice -->
          <tr>
            <td style="padding:0 36px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:rgba(140,26,26,0.05);border-radius:10px;border:1px solid rgba(140,26,26,0.12);">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="font-size:12px;color:#8C1A1A;font-weight:600;margin:0 0 4px;">
                      Do not recognise this invoice?
                    </p>
                    <p style="font-size:11px;color:#8C1A1A;margin:0;line-height:1.6;">
                      Reply to this email immediately and do not click confirm.
                      Our team will investigate and the invoice will be frozen pending resolution.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid rgba(13,24,36,0.06);">
              <p style="font-size:11px;color:#8A96A3;margin:0;line-height:1.7;">
                Vesto · Invoice Capital, Onchain<br />
                This email was sent on behalf of ${invoice.seller_business_name}.
                Vesto is a trade finance platform — it does not hold your funds.
                Your payment terms and instructions remain unchanged.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Vesto Platform <noreply@vesto.finance>',
        to: [buyerEmail],
        subject: `Invoice confirmation request — ${formatCurrency(invoice.amount)} from ${invoice.seller_business_name}`,
        html: emailHtml,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('Resend error:', errText);
      return new Response(JSON.stringify({ error: 'Email delivery failed', detail: errText }), { status: 502 });
    }

    // Mark acknowledgement email as sent in Supabase
    await supabase
      .from('buyer_acknowledgements')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('invoice_id', invoiceId)
      .eq('status', 'pending');

    return new Response(
      JSON.stringify({ success: true, buyerEmail, invoiceId }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (err) {
    console.error('send-acknowledgement error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
