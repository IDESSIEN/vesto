import React from 'react';
import { useApp } from '../../context/AppContext';

const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8l5 5"/>
  </svg>
);
const BoltIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 1L4 9h5l-2 6 7-8H9l2-6z"/>
  </svg>
);

const FEE_PCT = 2.8;

export const FundInvoiceBatch: React.FC = () => {
  const { invoices, fundBatchLender, setLenderView, lender, selectedBatchIds, showToast } = useApp();

  const openInvoices = invoices.filter(i => i.status === 'published_marketplace');
  const batchInvoices = selectedBatchIds.length > 0
    ? invoices.filter(i => selectedBatchIds.includes(i.id))
    : (openInvoices.length >= 2 ? openInvoices.slice(0, 3) : openInvoices);

  const totalDeployment = batchInvoices.reduce((sum, i) => sum + i.advanceAmount, 0);
  const grossApy = batchInvoices.length > 0
    ? (batchInvoices.reduce((sum, i) => sum + i.expectedYieldPct, 0) / batchInvoices.length)
    : 14.5;
  const netApy = Math.max(0, grossApy - FEE_PCT);
  const avgTerm = batchInvoices.length > 0
    ? Math.round(batchInvoices.reduce((sum, i) => sum + i.termDays, 0) / batchInvoices.length)
    : 45;
  const hasBalance = totalDeployment <= lender.availableBalance;

  const handleExecuteBatch = () => {
    if (!hasBalance) {
      showToast(
        `Insufficient balance. Available: $${lender.availableBalance.toLocaleString()} · Required: $${totalDeployment.toLocaleString()}.`,
        'warning'
      );
      return;
    }
    fundBatchLender(batchInvoices.map(i => i.id));
    setLenderView('portfolio');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-7 pb-20 flex flex-col gap-5 view-enter">

      {/* Nav row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setLenderView('browse')}
          className="w-9 h-9 rounded-[9px] flex items-center justify-center transition-all duration-150 hover:bg-[rgba(13,24,36,0.06)] active:scale-[0.97]"
          style={{ background: 'var(--cream)', border: '1px solid var(--border-2)', color: 'var(--ink-muted)' }}
        ><ArrowLeft /></button>
        <span className="text-[9.5px] font-bold uppercase tracking-[0.10em]" style={{ color: 'var(--ink-subtle)' }}>
          Batch funding
        </span>
        <div className="w-9" />
      </div>

      {/* Heading */}
      <div>
        <h1
          className="font-display font-bold text-ink mb-2"
          style={{ fontSize: '26px', letterSpacing: '-0.032em', lineHeight: 1.06 }}
        >
          Deploy capital across {batchInvoices.length} invoice{batchInvoices.length !== 1 ? 's' : ''}
        </h1>
        <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-subtle)' }}>
          Diversify in one transaction. Capital is held in escrow and released on buyer settlement.
        </p>
      </div>

      {/* Summary hero — dark cinema card */}
      <div
        className="relative rounded-[15px] px-5 py-5 overflow-hidden grain-overlay"
        style={{
          background: 'linear-gradient(160deg,#0D1824 0%,#1A2A3E 100%)',
          border: '1px solid rgba(184,130,30,0.18)',
          boxShadow: 'var(--shadow-e3)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,#B8821E 25%,#E9BE68 60%,#B8821E 85%,transparent)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '20px 20px' }} />

        <div className="relative">
          <p className="text-[8.5px] font-bold uppercase tracking-[0.11em] mb-1" style={{ color: 'rgba(255,255,255,0.38)' }}>
            Total capital deployment
          </p>
          <p className="font-mono font-extrabold text-white font-tnum leading-none mb-4" style={{ fontSize: '32px', letterSpacing: '-0.04em' }}>
            ${totalDeployment.toLocaleString()}
            <span className="text-[13px] font-normal ml-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>USDC</span>
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { label: 'Gross APY',   value: `${grossApy.toFixed(1)}%`, color: 'rgba(255,255,255,0.65)' },
              { label: 'Platform fee', value: `${FEE_PCT}%`,            color: 'rgba(255,120,100,0.80)' },
              { label: 'Net APY',     value: `${netApy.toFixed(1)}%`,   color: '#E9BE68' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-[8.5px] font-bold uppercase tracking-[0.09em] mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {label}
                </p>
                <p className="font-mono font-bold font-tnum" style={{ fontSize: '18px', color, letterSpacing: '-0.03em' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <p className="text-[10.5px] font-semibold mt-3" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Weighted avg term: {avgTerm} days · {batchInvoices.length} invoice{batchInvoices.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Invoice list */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-subtle)' }}>
          Invoices in this batch
        </p>
        {batchInvoices.map(inv => (
          <div
            key={inv.id}
            className="flex items-center justify-between px-4 py-3.5 rounded-[11px]"
            style={{
              background: 'var(--cream)',
              border: '1px solid var(--border)',
              borderLeft: `3px solid ${inv.riskTier === 'A+' || inv.riskTier === 'A' ? '#1A6645' : inv.riskTier === 'B+' ? '#92570D' : '#8C1A1A'}`,
            }}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[12.5px] font-bold text-ink">{inv.sellerBusinessName}</span>
              <span className="text-[10.5px]" style={{ color: 'var(--ink-subtle)' }}>
                {inv.buyerName} · Due {inv.dueDate}
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-[13px] font-tnum text-ink block">
                ${inv.advanceAmount.toLocaleString()}
              </span>
              <span className="text-[10.5px] font-semibold" style={{ color: '#1A6645' }}>
                {inv.expectedYieldPct}% gross
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Balance check + CTA */}
      <div
        className="rounded-[13px] p-5 flex flex-col gap-4"
        style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e1)' }}
      >
        <div className="flex items-center justify-between text-[12px]">
          <span style={{ color: 'var(--ink-subtle)' }}>Available balance</span>
          <span className="font-mono font-bold font-tnum text-ink">${lender.availableBalance.toLocaleString()} USDC</span>
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span style={{ color: 'var(--ink-subtle)' }}>Required for batch</span>
          <span
            className="font-mono font-bold font-tnum"
            style={{ color: hasBalance ? 'var(--ink)' : '#8C1A1A' }}
          >
            ${totalDeployment.toLocaleString()} USDC
          </span>
        </div>

        {!hasBalance && (
          <p className="text-[11.5px] leading-snug" style={{ color: '#8C1A1A' }}>
            Insufficient balance. Reduce the batch size or add funds to your wallet.
          </p>
        )}

        <button
          onClick={handleExecuteBatch}
          disabled={!hasBalance || batchInvoices.length === 0}
          className="w-full h-[50px] rounded-[11px] text-[13.5px] font-bold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98]"
          style={hasBalance && batchInvoices.length > 0 ? {
            background: 'linear-gradient(135deg,#1A6645 0%,#27A06A 100%)',
            color: '#fff',
            boxShadow: '0 6px 20px rgba(26,102,69,0.28)',
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
          <BoltIcon /> Execute batch funding
        </button>
      </div>
    </div>
  );
};
