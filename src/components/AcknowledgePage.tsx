import React, { useEffect, useState } from 'react';

// Buyer acknowledgement landing page.
// Reached via /acknowledge?token=xxx from the confirmation email.
// No login required. Verifies token client-side by calling the
// handle-acknowledgement Edge Function, then shows a branded result screen.

type AckState = 'loading' | 'confirmed' | 'already_confirmed' | 'expired' | 'disputed' | 'error';

function CheckCircleSvg() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="24" fill="rgba(26,102,69,0.10)" />
      <circle cx="24" cy="24" r="17" fill="rgba(26,102,69,0.14)" />
      <path d="M16 24.5L21.5 30L32 19" stroke="#1A6645" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarningCircleSvg() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="24" fill="rgba(140,26,26,0.08)" />
      <circle cx="24" cy="24" r="17" fill="rgba(140,26,26,0.12)" />
      <path d="M24 16v10M24 31v1" stroke="#8C1A1A" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function SpinnerSvg() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
      <circle cx="20" cy="20" r="16" stroke="rgba(184,130,30,0.15)" strokeWidth="3" />
      <path d="M20 4a16 16 0 0 1 16 16" stroke="#B8821E" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

interface InvoiceDetails {
  id: string;
  amount: number;
  due_date: string;
  seller_business_name: string;
  term_days: number;
}

export const AcknowledgePage: React.FC = () => {
  const [state, setState] = useState<AckState>('loading');
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setState('error');
      setErrorMsg('No confirmation token found in this link. Please check the email and try again.');
      return;
    }

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON) {
      // Demo mode: simulate a successful acknowledgement after 1.5s
      setTimeout(() => {
        setState('confirmed');
        setInvoice({
          id: 'INV-2026-8901',
          amount: 1200,
          due_date: '2026-10-15',
          seller_business_name: 'Nairobi Fresh Produce Co.',
          term_days: 40,
        });
      }, 1500);
      return;
    }

    const fnUrl = `${SUPABASE_URL}/functions/v1/handle-acknowledgement?token=${encodeURIComponent(token)}`;

    fetch(fnUrl, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) { setState('expired'); return; }
          if (res.status === 409) { setState('disputed'); return; }
          setState('error');
          setErrorMsg(data.error ?? 'Confirmation failed.');
          return;
        }
        if (data.alreadyConfirmed) { setState('already_confirmed'); }
        else { setState('confirmed'); }
        if (data.invoice) setInvoice(data.invoice);
      })
      .catch(() => {
        setState('error');
        setErrorMsg('Network error. Please try again or contact support@vesto.finance.');
      });
  }, []);

  function formatCurrency(n: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
  }
  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8F6F1',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .ack-card { animation: fadeUp 0.3s ease-out both; }
      `}</style>

      {/* Wordmark */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', color: '#0D1824' }}>
          Ve<span style={{ color: '#B8821E' }}>sto</span>
        </div>
        <div style={{ fontSize: '9.5px', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#8A96A3', marginTop: '3px' }}>
          Invoice Capital, Onchain
        </div>
      </div>

      {/* Card */}
      <div className="ack-card" style={{
        background: '#fff',
        borderRadius: '18px',
        border: '1px solid rgba(13,24,36,0.08)',
        boxShadow: '0 4px 32px rgba(13,24,36,0.07)',
        padding: '40px 36px',
        maxWidth: '460px',
        width: '100%',
        textAlign: 'center',
      }}>

        {state === 'loading' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <SpinnerSvg />
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#0D1824', marginBottom: '8px' }}>
              Verifying your confirmation
            </div>
            <div style={{ fontSize: '12px', color: '#8A96A3', lineHeight: 1.6 }}>
              This takes a moment. Please do not close this page.
            </div>
          </>
        )}

        {(state === 'confirmed' || state === 'already_confirmed') && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <CheckCircleSvg />
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#0D1824', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              {state === 'already_confirmed' ? 'Already confirmed' : 'Invoice confirmed'}
            </div>
            <div style={{ fontSize: '12px', color: '#4A5568', lineHeight: 1.7, marginBottom: '24px' }}>
              {state === 'already_confirmed'
                ? 'You have already confirmed this invoice. No further action is needed.'
                : 'Thank you. Your confirmation has been recorded with a timestamp. Your payment instructions remain unchanged.'}
            </div>

            {invoice && (
              <div style={{
                background: '#F8F6F1',
                borderRadius: '12px',
                border: '1px solid rgba(13,24,36,0.08)',
                padding: '18px 20px',
                textAlign: 'left',
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.09em', color: '#8A96A3', fontWeight: 700, marginBottom: '3px' }}>Reference</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#0D1824', fontFamily: "'JetBrains Mono', monospace" }}>{invoice.id}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.09em', color: '#8A96A3', fontWeight: 700, marginBottom: '3px' }}>Amount</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0D1824', fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(invoice.amount)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.09em', color: '#8A96A3', fontWeight: 700, marginBottom: '3px' }}>Supplier</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#0D1824' }}>{invoice.seller_business_name}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.09em', color: '#8A96A3', fontWeight: 700, marginBottom: '3px' }}>Due</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#0D1824' }}>{formatDate(invoice.due_date)}</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', padding: '14px 16px', background: 'rgba(26,102,69,0.06)', borderRadius: '10px', border: '1px solid rgba(26,102,69,0.14)' }}>
              <div style={{ fontSize: '11px', color: '#1A6645', fontWeight: 600, lineHeight: 1.6 }}>
                Your payment due date and bank instructions are unchanged.
                Pay as you normally would when the invoice falls due.
              </div>
            </div>
          </>
        )}

        {state === 'expired' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <WarningCircleSvg />
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#0D1824', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Link expired
            </div>
            <div style={{ fontSize: '12px', color: '#4A5568', lineHeight: 1.7 }}>
              This confirmation link has expired (links are valid for 7 days).
              Please ask your supplier to request a new confirmation link.
            </div>
          </>
        )}

        {state === 'disputed' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <WarningCircleSvg />
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#0D1824', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Invoice under review
            </div>
            <div style={{ fontSize: '12px', color: '#4A5568', lineHeight: 1.7 }}>
              This invoice has been flagged for review and cannot be confirmed at this time.
              If you believe this is an error, contact{' '}
              <a href="mailto:support@vesto.finance" style={{ color: '#B8821E', fontWeight: 600 }}>support@vesto.finance</a>.
            </div>
          </>
        )}

        {state === 'error' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <WarningCircleSvg />
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#0D1824', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Something went wrong
            </div>
            <div style={{ fontSize: '12px', color: '#4A5568', lineHeight: 1.7, marginBottom: '16px' }}>
              {errorMsg || 'We could not process your confirmation. Please try again or contact support.'}
            </div>
            <a href="mailto:support@vesto.finance" style={{
              display: 'inline-block',
              background: '#0D1824',
              color: '#fff',
              textDecoration: 'none',
              padding: '11px 22px',
              borderRadius: '9px',
              fontSize: '12px',
              fontWeight: 700,
            }}>
              Contact support
            </a>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '28px', fontSize: '10.5px', color: '#8A96A3', textAlign: 'center', lineHeight: 1.7, maxWidth: '380px' }}>
        Vesto is a trade finance platform. It does not hold buyer funds or change payment terms.
        Questions? Email{' '}
        <a href="mailto:support@vesto.finance" style={{ color: '#B8821E', fontWeight: 600 }}>support@vesto.finance</a>
      </div>
    </div>
  );
};
