/**
 * send-reminders — Supabase Edge Function
 * Runs daily (Supabase cron: "0 8 * * *")
 *
 * For every funded invoice approaching its repayment deadline:
 *   - 14 days out: first reminder to seller
 *   - 7 days out:  second reminder — escalate copy
 *   - 3 days out:  final notice — urgent copy + admin CC
 *   - Overdue:     overdue alert + admin escalation flag
 *
 * Reminder records are written to invoice_reminders so admin
 * can see the full escalation trail per invoice in BuyerMonitoring.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

interface Invoice {
  id: string;
  seller_id: string;
  buyer_name: string;
  advance_amount: number;
  due_date: string;
  repayment_deadline: string | null;
  status: string;
  virtual_account_number: string | null;
}

interface ReminderRecord {
  invoice_id: string;
  reminder_type: '14d' | '7d' | '3d' | 'overdue';
  sent_at: string;
}

const daysUntil = (dateStr: string): number => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
};

const getReminderType = (days: number): '14d' | '7d' | '3d' | 'overdue' | null => {
  if (days < 0) return 'overdue';
  if (days <= 3) return '3d';
  if (days <= 7) return '7d';
  if (days <= 14) return '14d';
  return null;
};

const buildEmailSubject = (type: string, invoiceId: string, buyerName: string): string => {
  switch (type) {
    case '14d':    return `Action needed: ${buyerName} payment due in 14 days — ${invoiceId}`;
    case '7d':     return `Follow up now: ${buyerName} payment due in 7 days — ${invoiceId}`;
    case '3d':     return `URGENT: ${buyerName} payment due in 3 days — ${invoiceId}`;
    case 'overdue':return `OVERDUE: ${buyerName} has missed payment deadline — ${invoiceId}`;
    default:       return `Payment reminder — ${invoiceId}`;
  }
};

const buildEmailBody = (
  type: string,
  invoice: Invoice,
  days: number,
): string => {
  const deadline = invoice.repayment_deadline || invoice.due_date;
  const amount = `$${invoice.advance_amount.toLocaleString()} USDC`;
  const va = invoice.virtual_account_number
    ? `\n\nPayment reference: ${invoice.virtual_account_number}`
    : '';

  switch (type) {
    case '14d':
      return `Your buyer ${invoice.buyer_name} has ${days} days to settle invoice ${invoice.id} (${amount}).

Please follow up with your buyer now to confirm payment is on track. Payment is due by ${deadline}.${va}

Once payment lands in the Vesto virtual account, settlement processes automatically within 24 hours.`;

    case '7d':
      return `This is a second reminder. Invoice ${invoice.id} (${amount}) is due in ${days} days on ${deadline}.

If your buyer has not confirmed payment, contact them today. Delayed payment past the deadline will trigger an escrow review and may affect your credit limit.${va}`;

    case '3d':
      return `URGENT: Invoice ${invoice.id} (${amount}) is due in ${days} days on ${deadline}.

Vesto requires payment confirmation within the next 72 hours. If payment cannot be confirmed, this invoice will enter dispute review.

Contact your buyer immediately and confirm via this invoice's virtual account.${va}`;

    case 'overdue':
      return `Invoice ${invoice.id} (${amount}) was due on ${deadline} and has not been settled.

This invoice is now ${Math.abs(days)} days overdue. Vesto admin has been notified and a dispute review has been opened. The lender's escrow timer is active.

If you have received payment from your buyer, upload proof of payment immediately at app.vesto.finance.${va}`;

    default:
      return `Reminder for invoice ${invoice.id}.`;
  }
};

Deno.serve(async () => {
  try {
    // 1. Fetch all funded invoices that have not yet been repaid
    const { data: invoices, error: fetchErr } = await supabase
      .from('invoices')
      .select('id, seller_id, buyer_name, advance_amount, due_date, repayment_deadline, status, virtual_account_number')
      .in('status', ['funded', 'payment_detected', 'partial_shortfall'])
      .order('due_date', { ascending: true });

    if (fetchErr || !invoices) {
      console.error('Failed to fetch invoices:', fetchErr);
      return new Response(JSON.stringify({ error: 'fetch_failed' }), { status: 500 });
    }

    // 2. Fetch already-sent reminders to avoid duplicates
    const invoiceIds = invoices.map((i: Invoice) => i.id);
    const { data: sentReminders } = await supabase
      .from('invoice_reminders')
      .select('invoice_id, reminder_type')
      .in('invoice_id', invoiceIds);

    const alreadySent = new Set(
      (sentReminders || []).map((r: ReminderRecord) => `${r.invoice_id}:${r.reminder_type}`)
    );

    // 3. Process each invoice
    const results: { invoiceId: string; type: string; action: string }[] = [];

    for (const inv of invoices as Invoice[]) {
      const deadline = inv.repayment_deadline || inv.due_date;
      const days = daysUntil(deadline);
      const reminderType = getReminderType(days);

      if (!reminderType) continue; // more than 14 days out, no action
      if (alreadySent.has(`${inv.id}:${reminderType}`)) {
        results.push({ invoiceId: inv.id, type: reminderType, action: 'skipped_already_sent' });
        continue;
      }

      // 4. Fetch seller contact details
      const { data: sellerProfile } = await supabase
        .from('sellers')
        .select('email, full_name, business_name')
        .eq('id', inv.seller_id)
        .single();

      const sellerEmail = sellerProfile?.email;
      const sellerName  = sellerProfile?.full_name || 'Seller';

      // 5. Send email via Resend (or any provider wired into RESEND_API_KEY)
      const resendKey = Deno.env.get('RESEND_API_KEY');
      if (resendKey && sellerEmail) {
        const subject = buildEmailSubject(reminderType, inv.id, inv.buyer_name);
        const body    = buildEmailBody(reminderType, inv, days);

        const emailPayload = {
          from: 'Vesto <no-reply@vesto.finance>',
          to:   [sellerEmail],
          cc:   reminderType === 'overdue' || reminderType === '3d'
            ? ['admin@vesto.finance']
            : [],
          subject,
          text: `Hi ${sellerName},\n\n${body}\n\nVesto Platform\nhttps://app.vesto.finance`,
        };

        const emailResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
        });

        if (!emailResp.ok) {
          console.error(`Email failed for ${inv.id}:`, await emailResp.text());
        }
      }

      // 6. If overdue, set invoice status to flag admin review
      if (reminderType === 'overdue') {
        await supabase
          .from('invoices')
          .update({ status: 'disputed', admin_escalated_at: new Date().toISOString() })
          .eq('id', inv.id);
      }

      // 7. Record the reminder so we never double-send
      await supabase.from('invoice_reminders').insert({
        invoice_id:    inv.id,
        reminder_type: reminderType,
        seller_id:     inv.seller_id,
        buyer_name:    inv.buyer_name,
        amount_usdc:   inv.advance_amount,
        days_until:    days,
        email_sent_to: sellerEmail || null,
        sent_at:       new Date().toISOString(),
      });

      results.push({ invoiceId: inv.id, type: reminderType, action: 'sent' });
    }

    console.log(`send-reminders: processed ${invoices.length} invoices, sent ${results.filter(r => r.action === 'sent').length} reminders`);
    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('send-reminders error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
