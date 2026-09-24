import React from 'react';
import { useApp } from '../../context/AppContext';

const HourglassIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 4h16M8 28h16"/>
    <path d="M10 4v6l6 6-6 6v6M22 4v6l-6 6 6 6v6"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M6.5 2v9M2 6.5h9"/>
  </svg>
);
const ArrowRight = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6.5h7M7 3l3.5 3.5L7 10"/>
  </svg>
);

export const VerificationInProgress: React.FC = () => {
  const { setSellerView, verifications, seller } = useApp();

  const pendingItem = verifications.find(
    (v) => v.sellerId === seller.id && v.status === 'pending'
  ) || verifications[0];

  return (
    <div className="max-w-md mx-auto px-4 py-10 flex flex-col items-center text-center view-enter">

      {/* Icon */}
      <div
        className="w-[72px] h-[72px] rounded-[18px] flex items-center justify-center mb-6 relative"
        style={{
          background: 'rgba(184,130,30,0.10)',
          border: '1px solid rgba(184,130,30,0.22)',
          color: 'var(--gold)',
        }}
      >
        <HourglassIcon />
        <span
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white"
          style={{ background: 'var(--gold)' }}
        >
          !
        </span>
      </div>

      {/* Copy */}
      <h1
        className="font-display font-bold text-ink mb-2"
        style={{ fontSize: '24px', letterSpacing: '-0.028em', lineHeight: 1.1 }}
      >
        Under review
      </h1>
      <p className="text-[13.5px] leading-relaxed mb-7 max-w-[300px]" style={{ color: 'var(--ink-subtle)' }}>
        Your{' '}
        <span className="text-ink font-semibold">
          {pendingItem?.documentType || 'business credential'}
        </span>{' '}
        is in the admin review queue. Typical review time is under 5 minutes.
      </p>

      {/* Status card */}
      <div
        className="w-full rounded-[13px] p-5 mb-7 text-left flex flex-col gap-3"
        style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e1)' }}
      >
        {[
          { label: 'Queue ID',          value: pendingItem?.id || 'VR-901',    mono: true },
          { label: 'Submitted',         value: pendingItem?.submittedAt || 'Just now' },
          { label: 'Target limit',      value: pendingItem?.tier === 2 ? '$5,000' : '$500', gold: true },
        ].map(({ label, value, mono, gold }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.07em]" style={{ color: 'var(--ink-subtle)' }}>
              {label}
            </span>
            <span
              className={`text-[12px] font-bold${mono ? ' font-mono' : ''}`}
              style={{ color: gold ? 'var(--gold)' : 'var(--ink)' }}
            >
              {value}
            </span>
          </div>
        ))}

        <div
          className="flex items-center gap-2.5 pt-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
            style={{ background: 'var(--gold)' }}
          />
          <span className="text-[11.5px] leading-relaxed" style={{ color: 'var(--ink-subtle)' }}>
            Admin review takes about 5 minutes. You will receive SMS confirmation.
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-2.5">
        <button
          onClick={() => setSellerView('submit_invoice')}
          className="btn-primary w-full h-[50px] rounded-[11px] text-[13.5px] justify-center gap-2"
        >
          <PlusIcon /> Submit an invoice now
        </button>
        <button
          onClick={() => setSellerView('dashboard')}
          className="w-full h-[46px] rounded-[11px] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97]"
          style={{ background: 'var(--cream)', border: '1px solid var(--border)', color: 'var(--ink-subtle)' }}
        >
          Back to dashboard <ArrowRight />
        </button>
      </div>
    </div>
  );
};
