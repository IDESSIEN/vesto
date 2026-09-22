import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const ArrowLeft = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 3L4.5 7.5l5 4.5"/>
  </svg>
);
const ArrowRight = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6.5h7M7 3l3.5 3.5L7 10"/>
  </svg>
);
const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 16V9"/><path d="M9 12l3-3 3 3"/>
    <path d="M20 17a4 4 0 0 0-4-4H5.5A3.5 3.5 0 0 0 5 17"/>
  </svg>
);
const FileCheckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5-7z"/>
    <path d="M13 2v7h7"/><path d="M8 13l2.5 2.5 4-4"/>
  </svg>
);
const LockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="12" width="18" height="13" rx="2.5"/>
    <path d="M9 12V9a5 5 0 0 1 10 0v3"/>
    <circle cx="14" cy="18.5" r="1.8" fill="currentColor" stroke="none"/>
  </svg>
);

export const SubmitInvoice: React.FC = () => {
  const { setSellerView, submitInvoice, seller, showToast } = useApp();

  const [buyerName, setBuyerName]       = useState('Metro Supermarkets East Africa');
  const [buyerTaxId, setBuyerTaxId]     = useState('P051294819X');
  const [buyerCountry, setBuyerCountry] = useState('Kenya');
  const [amount, setAmount]             = useState<number>(1200);
  const [dueDate, setDueDate]           = useState('2026-10-15');
  const [docName, setDocName]           = useState('bill_of_lading_metro_produce.pdf');
  const [docUploaded, setDocUploaded]   = useState(true);

  const advanceRatePct  = seller.verificationTier === 2 ? 90 : 85;
  const advanceAmount   = Math.round(amount * (advanceRatePct / 100));
  const platformFeePct  = 2.0;
  const feeAmount       = Math.round(amount * (platformFeePct / 100));
  const netPayout       = advanceAmount - feeAmount;
  const availableCredit = seller.creditLimit - seller.usedLimit;
  const exceedsLimit    = seller.creditLimit > 0 && advanceAmount > availableCredit;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setDocName(e.target.files[0].name);
      setDocUploaded(true);
      showToast(`Uploaded ${e.target.files[0].name}`, 'success');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (seller.verificationTier === 0) {
      showToast('Verify your identity before submitting invoices.', 'warning');
      setSellerView('tier1');
      return;
    }
    if (amount < 50) {
      showToast('Invoice amount must be at least $50.', 'warning');
      return;
    }
    if (exceedsLimit) {
      showToast(`Advance of $${advanceAmount.toLocaleString()} exceeds your $${availableCredit.toLocaleString()} available credit.`, 'warning');
      return;
    }
    submitInvoice({ buyerName, buyerTaxId, buyerCountry, amount, dueDate, docName, advanceRatePct });
    setSellerView('dashboard');
  };

  /* ── Locked gate ─────────────────────────────────────────────── */
  if (seller.verificationTier === 0) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center text-center px-6 py-20 view-enter">
        <div
          className="w-[72px] h-[72px] rounded-[18px] flex items-center justify-center mb-6"
          style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', color: 'var(--gold)' }}
        >
          <LockIcon />
        </div>
        <h2
          className="font-display font-bold text-ink mb-3"
          style={{ fontSize: '22px', letterSpacing: '-0.028em', lineHeight: 1.1 }}
        >
          Verify your identity first
        </h2>
        <p className="text-[13.5px] leading-relaxed mb-7 max-w-[280px]" style={{ color: 'var(--ink-subtle)' }}>
          Tier 1 takes under two minutes and unlocks a $500 advance limit. Your first capital arrives within 24 hours of admin approval.
        </p>
        <button onClick={() => setSellerView('tier1')} className="btn-primary px-6 py-3 flex items-center gap-2">
          Start identity check <ArrowRight />
        </button>
        <button
          onClick={() => setSellerView('dashboard')}
          className="mt-4 text-[11.5px] underline underline-offset-2 bg-transparent border-none cursor-pointer"
          style={{ color: 'var(--ink-subtle)' }}
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto px-4 py-7 pb-24 flex flex-col gap-5 view-enter">

      {/* Nav row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSellerView('dashboard')}
          className="w-9 h-9 rounded-[9px] flex items-center justify-center transition-all duration-150 hover:bg-[rgba(13,24,36,0.06)] active:scale-[0.97]"
          style={{ background: 'var(--cream)', border: '1px solid var(--border-2)', color: 'var(--ink-muted)' }}
        >
          <ArrowLeft />
        </button>
        <span
          className="text-[9.5px] font-bold uppercase tracking-[0.11em]"
          style={{ color: 'var(--ink-subtle)' }}
        >
          Advance request · Tier {seller.verificationTier}
        </span>
        <div className="w-9" />
      </div>

      {/* Heading */}
      <div>
        <h1
          className="font-display font-bold text-ink mb-2"
          style={{ fontSize: '26px', letterSpacing: '-0.032em', lineHeight: 1.06 }}
        >
          Turn unpaid invoices<br />into immediate cash.
        </h1>
        <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-subtle)' }}>
          Receive {advanceRatePct}% of the invoice face value. Net payout lands within 24 hours of approval.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Buyer details */}
        <section
          className="rounded-[13px] p-5 flex flex-col gap-4"
          style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e1)' }}
        >
          <p className="field-label">Buyer details</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Buyer name</label>
              <input
                type="text" required value={buyerName}
                onChange={e => setBuyerName(e.target.value)}
                placeholder="e.g. Metro Supermarkets"
                className="input"
              />
            </div>
            <div>
              <label className="field-label">Tax PIN / Reg number</label>
              <input
                type="text" required value={buyerTaxId}
                onChange={e => setBuyerTaxId(e.target.value)}
                placeholder="P051294819X"
                className="input font-mono"
                style={{ fontSize: '13px' }}
              />
            </div>
          </div>

          <div>
            <label className="field-label">Buyer country</label>
            <input
              type="text" value={buyerCountry}
              onChange={e => setBuyerCountry(e.target.value)}
              placeholder="Kenya"
              className="input"
            />
          </div>
        </section>

        {/* Amount + due date */}
        <section
          className="rounded-[13px] p-5 grid grid-cols-1 sm:grid-cols-2 gap-4"
          style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e1)' }}
        >
          <div>
            <label className="field-label">Invoice total (USD)</label>
            <div className="relative">
              <span
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold pointer-events-none"
                style={{ color: 'var(--ink-muted)' }}
              >$</span>
              <input
                type="number" min="50" max="50000" required
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className={`input font-mono font-bold pl-7 text-[15px]${exceedsLimit ? ' input-error' : ''}`}
              />
            </div>
            {exceedsLimit && (
              <p className="text-[11px] mt-1.5 leading-snug" style={{ color: 'var(--danger)' }}>
                Advance of ${advanceAmount.toLocaleString()} exceeds your ${availableCredit.toLocaleString()} available credit.
                {seller.verificationTier < 2 && ' Upgrade to Tier 2 for a $5,000 limit.'}
              </p>
            )}
          </div>
          <div>
            <label className="field-label">Payment due date</label>
            <input
              type="date" required value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="input"
            />
          </div>
        </section>

        {/* Document upload */}
        <section
          className="rounded-[13px] p-5"
          style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e1)' }}
        >
          <label className="field-label mb-3 block">Official commercial invoice</label>
          <label
            className="relative flex flex-col items-center gap-2.5 py-6 px-4 rounded-[9px] cursor-pointer transition-all duration-150"
            style={{
              border: `1.5px dashed ${docUploaded ? 'var(--gold)' : 'var(--border-2)'}`,
              background: docUploaded ? 'var(--gold-bg)' : 'transparent',
            }}
          >
            <input
              type="file" accept=".pdf,.jpg,.png"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <span style={{ color: docUploaded ? 'var(--gold)' : 'var(--ink-subtle)' }}>
              {docUploaded ? <FileCheckIcon /> : <UploadIcon />}
            </span>
            <p className="text-[12.5px] font-semibold text-ink text-center">
              {docUploaded ? docName : 'Click to upload invoice file'}
            </p>
            <p className="text-[10.5px]" style={{ color: 'var(--ink-faint)' }}>PDF, PNG, JPG · up to 15 MB</p>
          </label>
        </section>

        {/* Payout breakdown — dark cinema ribbon */}
        <section
          className="relative rounded-[15px] px-5 pt-5 pb-5 overflow-hidden grain-overlay"
          style={{
            background: 'linear-gradient(160deg,#0D1824 0%,#1A2A3E 100%)',
            border: '1px solid rgba(184,130,30,0.18)',
            boxShadow: 'var(--shadow-e3)',
          }}
        >
          {/* Gold strip */}
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,#B8821E 25%,#E9BE68 60%,#B8821E 85%,transparent)' }} />
          {/* Dot matrix */}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '20px 20px' }} />

          <div className="relative">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[8.5px] font-bold uppercase tracking-[0.11em]" style={{ color: 'rgba(255,255,255,0.42)' }}>
                Payout breakdown
              </span>
              <span className="text-[9.5px] font-semibold px-2 py-0.5 rounded-[4px]" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}>
                Tier {seller.verificationTier} · {advanceRatePct}% advance rate
              </span>
            </div>

            {/* Rows */}
            {[
              { label: 'Face value', pct: 100, value: `$${amount.toLocaleString()}`, barColor: 'rgba(255,255,255,0.20)', valColor: 'rgba(255,255,255,0.70)' },
              { label: `Advance (${advanceRatePct}%)`, pct: advanceRatePct, value: `$${advanceAmount.toLocaleString()}`, barColor: 'linear-gradient(90deg,#B8821E,#E9BE68)', valColor: '#E9BE68' },
              { label: `Platform fee (${platformFeePct}%)`, pct: platformFeePct, value: `−$${feeAmount.toLocaleString()}`, barColor: 'rgba(220,60,60,0.55)', valColor: 'rgba(255,120,120,0.80)' },
            ].map(({ label, pct, value, barColor, valColor }) => (
              <div key={label} className="flex items-center gap-2.5 mb-2.5">
                <span className="text-[10px] font-medium shrink-0 w-[110px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
                <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor, transition: 'width 350ms var(--ease-out)' }} />
                </div>
                <span className="font-mono text-[11px] font-bold font-tnum w-[72px] text-right" style={{ color: valColor }}>{value}</span>
              </div>
            ))}

            {/* Perforation */}
            <div className="relative my-4">
              <div className="absolute rounded-full" style={{ left: '-21px', top: '-8px', width: '16px', height: '16px', background: 'var(--bg)' }} />
              <div className="absolute rounded-full" style={{ right: '-21px', top: '-8px', width: '16px', height: '16px', background: 'var(--bg)' }} />
              <div className="perforation" />
            </div>

            {/* Net payout hero */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[8.5px] font-bold uppercase tracking-[0.09em] mb-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  Net immediate payout
                </p>
                <p
                  className="font-mono font-bold text-white font-tnum leading-none"
                  style={{ fontSize: '30px', letterSpacing: '-0.04em' }}
                >
                  ${netPayout.toLocaleString()}
                  <span className="text-[12px] font-normal ml-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>USDC</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8.5px] font-bold uppercase tracking-[0.09em] mb-1" style={{ color: 'rgba(255,255,255,0.38)' }}>Settlement</p>
                <p className="text-[10.5px] font-semibold" style={{ color: '#E9BE68' }}>Onchain · Arc Testnet</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <button
          type="submit"
          disabled={exceedsLimit}
          className="btn-primary w-full h-[50px] rounded-[11px] text-[14px] justify-center"
          style={exceedsLimit ? { background: 'rgba(13,24,36,0.12)', color: 'rgba(13,24,36,0.35)', boxShadow: 'none', cursor: 'not-allowed' } : {}}
        >
          {exceedsLimit
            ? `Credit limit reached — upgrade to Tier 2`
            : 'Submit to Vesto marketplace'}
        </button>

      </form>
    </div>
  );
};
