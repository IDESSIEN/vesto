import React from 'react';
import { useApp } from '../../context/AppContext';

const ShieldIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1.5L2 4.5V8c0 3.5 2.3 6.3 6 7 3.7-.7 6-3.5 6-7V4.5L8 1.5z"/>
    <path d="M5.5 8l2 2 3-3"/>
  </svg>
);
const StoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6h12M2 6l1.5-3h9L14 6M2 6v8h12V6"/>
    <rect x="6" y="9" width="4" height="5" rx="0.5"/>
  </svg>
);
const ArrowRight = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6.5h7M7 3l3.5 3.5L7 10"/>
  </svg>
);

export const LenderWelcome: React.FC = () => {
  const { lender, setLenderView } = useApp();

  const firstName    = lender.fullName.split(' ')[0] || 'there';
  const isInstitutional = lender.accountType === 'institutional';

  return (
    <div className="max-w-[460px] mx-auto px-4 py-12 flex flex-col items-center text-center gap-7 view-enter">

      {/* Checkmark icon */}
      <div
        className="w-[72px] h-[72px] rounded-[20px] flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg,#0A1628 0%,#112240 100%)',
          boxShadow: '0 16px 40px rgba(10,22,40,0.30), 0 0 0 1px rgba(201,146,42,0.25)',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="16" stroke="rgba(201,146,42,0.25)" strokeWidth="1.5"/>
          <path d="M10 18L15.5 23.5L26 12.5" stroke="#E8B96A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Heading */}
      <div>
        <h1
          className="font-display font-extrabold text-ink mb-2"
          style={{ fontSize: '30px', letterSpacing: '-0.03em', lineHeight: 1.1 }}
        >
          Welcome to Vesto,<br />
          <span style={{ color: '#C9922A' }}>{firstName}.</span>
        </h1>
        <p className="text-[13.5px] leading-relaxed max-w-[300px] mx-auto" style={{ color: 'var(--ink-subtle)' }}>
          Your {isInstitutional ? 'institutional' : 'investor'} account is live.{' '}
          ${lender.targetAllocation.toLocaleString()} USDC is allocated and ready to deploy into verified invoice pools.
        </p>
      </div>

      {/* Summary card */}
      <div
        className="w-full rounded-[15px] overflow-hidden"
        style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e2)' }}
      >
        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
        <div className="px-5 py-4 flex flex-col gap-3">
          {[
            { label: 'Account type',      value: isInstitutional ? 'Institutional LP' : 'Retail investor' },
            { label: 'Target allocation', value: `$${lender.targetAllocation.toLocaleString()} USDC` },
            { label: 'Pool yield range',  value: '12–24% gross APY',  gold: true },
            { label: 'Settlement',        value: 'Onchain · Arc Testnet' },
          ].map(({ label, value, gold }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[11px] font-semibold" style={{ color: 'var(--ink-subtle)' }}>{label}</span>
              <span
                className="text-[12px] font-bold font-tnum"
                style={{ color: gold ? '#C9922A' : 'var(--ink)' }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Next steps */}
      <div className="w-full flex flex-col gap-2.5">
        <p className="text-[9.5px] uppercase tracking-widest font-bold" style={{ color: 'var(--ink-subtle)' }}>
          Next steps
        </p>
        <button
          onClick={() => setLenderView('risk_disclosure')}
          className="btn-primary w-full h-[54px] rounded-[13px] text-[13.5px] justify-center gap-2"
        >
          <ShieldIcon /> Read risk disclosure <ArrowRight />
        </button>
        <button
          onClick={() => setLenderView('browse')}
          className="w-full h-[48px] rounded-[13px] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97]"
          style={{ background: 'var(--cream)', border: '1px solid var(--border)', color: 'var(--ink-subtle)', cursor: 'pointer' }}
        >
          <StoreIcon /> Skip to marketplace
        </button>
      </div>
    </div>
  );
};
