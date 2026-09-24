import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8l5 5"/>
  </svg>
);
const ArrowRight = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6.5h7M7 3l3.5 3.5L7 10"/>
  </svg>
);
const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2L1.5 13.5h13L8 2z"/>
    <path d="M8 7v3.5"/><circle cx="8" cy="12" r="0.6" fill="currentColor" stroke="none"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1.5L2 4.5V8c0 3.5 2.3 6.3 6 7 3.7-.7 6-3.5 6-7V4.5L8 1.5z"/>
    <path d="M5.5 8l2 2 3-3"/>
  </svg>
);

export const RiskDisclosure: React.FC = () => {
  const { setLenderView, showToast, lender, setLenderProfile } = useApp();
  const [agreed1, setAgreed1] = useState(lender.riskAccepted);
  const [agreed2, setAgreed2] = useState(lender.riskAccepted);

  const handleAgree = () => {
    setLenderProfile({ riskAccepted: true });
    showToast('Risk disclosure acknowledged. Starting marketplace tour.', 'success');
    setLenderView('guided_tour');
  };

  const bothAgreed = agreed1 && agreed2;

  return (
    <div className="max-w-[560px] mx-auto px-4 py-7 pb-20 flex flex-col gap-5 view-enter">

      {/* Nav row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setLenderView('signup')}
          className="w-9 h-9 rounded-[9px] flex items-center justify-center transition-all duration-150 hover:bg-[rgba(13,24,36,0.06)] active:scale-[0.97]"
          style={{ background: 'var(--cream)', border: '1px solid var(--border-2)', color: 'var(--ink-muted)' }}
        ><ArrowLeft /></button>
        <span className="text-[9.5px] font-bold uppercase tracking-[0.10em]" style={{ color: 'var(--ink-subtle)' }}>
          Step 2 of 3
        </span>
        <div className="w-9" />
      </div>

      {/* Heading */}
      <div>
        <h1
          className="font-display font-bold text-ink mb-2"
          style={{ fontSize: '26px', letterSpacing: '-0.032em', lineHeight: 1.06 }}
        >
          Risk disclosure
        </h1>
        <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-subtle)' }}>
          Unvarnished disclosure of how the mechanics, risk waterfall, and default safeguards work.
          Read carefully before deploying capital.
        </p>
      </div>

      {/* Risk cards */}
      <div className="flex flex-col gap-3">

        {/* Credit risk */}
        <div
          className="rounded-[13px] p-5 flex flex-col gap-2.5"
          style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e1)' }}
        >
          <div
            className="flex items-center gap-2 text-[13px] font-bold"
            style={{ color: '#92570D' }}
          >
            <div
              className="w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0"
              style={{ background: 'rgba(184,130,30,0.12)' }}
            >
              <WarningIcon />
            </div>
            Credit risk and delinquency
          </div>
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--ink-subtle)' }}>
            Invoices represent real short-term commercial obligations (30–90 days).
            Buyers are vetted corporate entities, but payment delays can occur.
            Liquidity reserves cover initial defaults up to 5% of total pool volume.
          </p>
        </div>

        {/* Protection */}
        <div
          className="rounded-[13px] p-5 flex flex-col gap-2.5"
          style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e1)' }}
        >
          <div
            className="flex items-center gap-2 text-[13px] font-bold"
            style={{ color: '#1A6645' }}
          >
            <div
              className="w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0"
              style={{ background: 'rgba(26,102,69,0.10)' }}
            >
              <ShieldIcon />
            </div>
            First-loss capital protection
          </div>
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--ink-subtle)' }}>
            Vesto maintains a 10% first-loss tranche funded by platform protocol fees.
            This protects senior lender capital against fraud or buyer insolvency before any
            lender principal is at risk.
          </p>
        </div>

        {/* Lender protection addendum */}
        <div
          className="rounded-[13px] p-5 flex flex-col gap-2.5"
          style={{ background: 'rgba(30,77,184,0.03)', border: '1px solid rgba(30,77,184,0.14)', boxShadow: 'var(--shadow-e1)' }}
        >
          <div
            className="flex items-center gap-2 text-[13px] font-bold"
            style={{ color: '#1E4DB8' }}
          >
            <div
              className="w-6 h-6 rounded-[6px] flex items-center justify-center shrink-0"
              style={{ background: 'rgba(30,77,184,0.10)' }}
            >
              <ShieldIcon />
            </div>
            Escrow reversal guarantee
          </div>
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--ink-subtle)' }}>
            If a buyer defaults and payment is never detected, you can recover your
            principal directly from escrow after the invoice due date plus a 14-day grace period.
            No admin action required. Your capital is never locked indefinitely.
          </p>
        </div>

      </div>

      {/* Checkboxes */}
      <div
        className="rounded-[13px] p-5 flex flex-col gap-3.5"
        style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}
      >
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed1}
            onChange={e => setAgreed1(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-[#C9922A] cursor-pointer shrink-0"
          />
          <span className="text-[12.5px] leading-relaxed" style={{ color: 'var(--ink-subtle)' }}>
            I understand that invoice factoring yield is variable and tied to buyer repayment performance.
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed2}
            onChange={e => setAgreed2(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-[#C9922A] cursor-pointer shrink-0"
          />
          <span className="text-[12.5px] leading-relaxed" style={{ color: 'var(--ink-subtle)' }}>
            I accept the smart contract execution terms on Arc Testnet and understand funds
            are held in a non-custodial escrow.
          </span>
        </label>
      </div>

      {/* CTA */}
      <button
        onClick={handleAgree}
        disabled={!bothAgreed}
        className="w-full h-[50px] rounded-[11px] text-[14px] font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98]"
        style={bothAgreed ? {
          background: 'linear-gradient(135deg,#C9922A 0%,#E8B96A 100%)',
          color: '#fff',
          boxShadow: '0 6px 20px rgba(201,146,42,0.30)',
          border: 'none',
          cursor: 'pointer',
        } : {
          background: 'rgba(13,24,36,0.08)',
          color: 'rgba(13,24,36,0.30)',
          border: 'none',
          cursor: 'not-allowed',
          boxShadow: 'none',
        }}
      >
        Accept and enter marketplace <ArrowRight />
      </button>
    </div>
  );
};
