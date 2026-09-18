import React from 'react';
import { useApp } from '../../context/AppContext';

export const LenderWelcome: React.FC = () => {
  const { lender, setLenderView } = useApp();

  const firstName = lender.fullName.split(' ')[0] || 'there';
  const isInstitutional = lender.accountType === 'institutional';

  return (
    <div className="max-w-lg mx-auto py-12 px-4 flex flex-col items-center text-center gap-8">

      {/* Animated checkmark */}
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg,#0A1628 0%,#112240 100%)',
          boxShadow: '0 16px 40px rgba(10,22,40,0.30), 0 0 0 1px rgba(201,146,42,0.25)',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="16" stroke="rgba(201,146,42,0.25)" strokeWidth="1.5" />
          <path
            d="M10 18L15.5 23.5L26 12.5"
            stroke="#E8B96A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Heading */}
      <div>
        <h1
          className="font-headline font-extrabold text-primary mb-2"
          style={{ fontSize: '32px', letterSpacing: '-0.03em' }}
        >
          Welcome to Vesto,<br />
          <span style={{ color: '#C9922A' }}>{firstName}.</span>
        </h1>
        <p className="text-sm text-secondary leading-relaxed max-w-sm mx-auto">
          Your {isInstitutional ? 'institutional' : 'investor'} account is set up.
          You have ${lender.targetAllocation.toLocaleString()} USDC allocated and ready to deploy into verified invoice pools.
        </p>
      </div>

      {/* Summary card */}
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
        <div className="p-5 flex flex-col gap-3">
          {[
            { label: 'Account Type',       value: isInstitutional ? 'Institutional LP' : 'Retail Investor' },
            { label: 'Target Allocation',  value: `$${lender.targetAllocation.toLocaleString()} USDC` },
            { label: 'Avg Pool Yield',     value: '12–24% APY',   gold: true },
            { label: 'Settlement',         value: '<1s on Arc Testnet' },
          ].map(({ label, value, gold }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-secondary">{label}</span>
              <span
                className="text-xs font-bold font-tnum"
                style={{ color: gold ? '#C9922A' : 'var(--primary)' }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Next steps */}
      <div className="w-full flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-secondary">Next steps</p>
        <button
          onClick={() => setLenderView('risk_disclosure')}
          className="w-full h-14 rounded-2xl text-sm font-extrabold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg,#C9922A 0%,#E8B96A 100%)',
            boxShadow: '0 8px 24px rgba(201,146,42,0.35)',
          }}
        >
          <span className="material-symbols-outlined text-lg">shield</span>
          Read Risk Disclosure
        </button>
        <button
          onClick={() => setLenderView('browse')}
          className="w-full h-12 rounded-2xl text-sm font-semibold text-primary flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
        >
          <span className="material-symbols-outlined text-lg">storefront</span>
          Skip to Marketplace
        </button>
      </div>
    </div>
  );
};
