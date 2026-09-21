import React from 'react';
import { useApp } from '../../context/AppContext';

export const DisputeResolution: React.FC = () => {
  const { invoices, resolveDisputeAdmin, setAdminView } = useApp();
  const flagged = invoices.filter(i => i.status === 'flagged' || i.status === 'disputed');

  return (
    <div
      className="mx-auto py-7 px-4 flex flex-col gap-6 pb-28 animate-fade-up"
      style={{ maxWidth: '700px' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p
            className="text-[9px] uppercase font-semibold mb-1.5"
            style={{ color: 'var(--ink-faint)', letterSpacing: '0.12em' }}
          >
            Risk management
          </p>
          <h1
            className="font-display font-bold text-ink"
            style={{ fontSize: '20px', letterSpacing: '-0.028em', lineHeight: 1.1 }}
          >
            Dispute Resolution
          </h1>
        </div>
        <button
          onClick={() => setAdminView('oversight')}
          className="self-start sm:self-auto px-3 py-1.5 text-[11px] font-semibold rounded-[7px]"
          style={{ background: 'var(--cream)', border: '1px solid var(--border-2)', color: 'var(--ink-subtle)' }}
        >
          Invoice grid
        </button>
      </div>

      {/* Reserve pool banner */}
      <div
        className="flex items-center gap-3.5 p-4 rounded-[13px]"
        style={{ background: 'rgba(184,130,30,0.06)', border: '1px solid rgba(184,130,30,0.18)' }}
      >
        <div
          className="w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0"
          style={{ background: 'rgba(184,130,30,0.12)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: '#B8821E' }}>
            <path d="M8 1L1.5 3.5V8C1.5 12 4.5 14.5 8 15.5c3.5-1 6.5-3.5 6.5-7.5V3.5L8 1z"
              stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <path d="M5.5 8l1.8 1.8L10.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p className="text-[12px] font-semibold text-ink">First-loss reserve active</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-subtle)' }}>
            $25,000 USDC available to absorb defaults and cover verified disputes.
          </p>
        </div>
      </div>

      {/* Flagged invoices */}
      {flagged.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-[15px] gap-3"
          style={{ border: '1px dashed var(--border-2)' }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ color: 'var(--ink-faint)' }}>
            <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M16 10v7M16 21v1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          <p className="text-[13px] font-medium" style={{ color: 'var(--ink-subtle)' }}>
            All clear
          </p>
          <p className="text-[11px]" style={{ color: 'var(--ink-faint)' }}>
            No disputed or flagged invoices right now.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {flagged.map(inv => (
            <div
              key={inv.id}
              className="rounded-[15px] overflow-hidden"
              style={{
                background: 'var(--surface-1)',
                border: '1.5px solid rgba(140,26,26,0.20)',
                boxShadow: 'var(--shadow-e1)',
              }}
            >
              <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,#8C1A1A,#C44)' }} />
              <div className="p-5 flex flex-col gap-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className="font-mono text-[11px] font-semibold"
                      style={{ color: '#8C1A1A', letterSpacing: '-0.01em' }}
                    >
                      {inv.id}
                    </span>
                    <h4
                      className="font-display font-semibold text-ink mt-0.5"
                      style={{ fontSize: '14px', letterSpacing: '-0.018em' }}
                    >
                      {inv.sellerBusinessName}
                    </h4>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-subtle)' }}>
                      Buyer: {inv.buyerName} ({inv.buyerCountry})
                    </p>
                  </div>
                  <span
                    className="shrink-0 px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase"
                    style={{ background: 'rgba(140,26,26,0.08)', color: '#8C1A1A', letterSpacing: '0.06em' }}
                  >
                    Flagged
                  </span>
                </div>

                {/* Flag reason */}
                {inv.flagReason && (
                  <div
                    className="flex items-start gap-2.5 p-3 rounded-[9px]"
                    style={{ background: 'rgba(140,26,26,0.05)', border: '1px solid rgba(140,26,26,0.14)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: '#8C1A1A', marginTop: '1px', flexShrink: 0 }}>
                      <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M6 4v3.5M6 9v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    <p className="text-[11px]" style={{ color: 'var(--ink-subtle)', lineHeight: 1.5 }}>
                      <span className="font-semibold" style={{ color: '#8C1A1A' }}>Flag reason: </span>
                      {inv.flagReason}
                    </p>
                  </div>
                )}

                {/* Financials */}
                <div
                  className="grid grid-cols-2 gap-px rounded-[11px] overflow-hidden"
                  style={{ background: 'var(--border-2)' }}
                >
                  {[
                    { label: 'Invoice value', value: `$${inv.amount.toLocaleString()}`, color: 'var(--ink)' },
                    { label: 'Funded advance', value: `$${inv.advanceAmount.toLocaleString()}`, color: '#8C1A1A' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="px-4 py-3" style={{ background: 'var(--surface-1)' }}>
                      <p className="text-[9px] uppercase font-semibold mb-1" style={{ color: 'var(--ink-faint)', letterSpacing: '0.09em' }}>
                        {label}
                      </p>
                      <p className="font-mono font-bold text-[14px]" style={{ color, letterSpacing: '-0.01em' }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Resolution buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => resolveDisputeAdmin(inv.id, 'refund_lender')}
                    className="h-10 rounded-[9px] text-[12px] font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-1.5"
                    style={{ background: 'rgba(30,77,184,0.08)', color: '#1E4DB8', border: '1px solid rgba(30,77,184,0.20)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6h8M5 3L2 6l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Refund lender
                  </button>
                  <button
                    onClick={() => resolveDisputeAdmin(inv.id, 'pay_seller')}
                    className="h-10 rounded-[9px] text-[12px] font-semibold text-white transition-all active:scale-[0.97] flex items-center justify-center gap-1.5"
                    style={{ background: '#1A7A46' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                      <path d="M4 6l1.5 1.5L8 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Pay seller
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
