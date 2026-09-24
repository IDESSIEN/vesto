import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';

const statusMeta: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  pending_admin_approval: { label: 'Awaiting review', dot: '#B8821E', text: '#7A5510', bg: 'rgba(184,130,30,0.08)' },
  published_marketplace:  { label: 'Live',            dot: '#1A7A46', text: '#1A7A46', bg: 'rgba(26,122,70,0.08)'  },
  funded:                 { label: 'Funded',           dot: '#1E4DB8', text: '#1E4DB8', bg: 'rgba(30,77,184,0.08)'  },
  flagged:                { label: 'Flagged',          dot: '#8C1A1A', text: '#8C1A1A', bg: 'rgba(140,26,26,0.08)'  },
  disputed:               { label: 'Disputed',         dot: '#8C1A1A', text: '#8C1A1A', bg: 'rgba(140,26,26,0.08)'  },
  repaid:                 { label: 'Settled',          dot: '#3D3D3D', text: '#5A5A5A', bg: 'rgba(0,0,0,0.04)'      },
};

const riskColor = (tier: string) =>
  tier === 'Low' ? '#1A7A46' : tier === 'Medium' ? '#B8821E' : '#8C1A1A';

const FILTERS = ['all','pending','published','funded','settlement','flagged'] as const;
type Filter = typeof FILTERS[number];

// Pending settlement banner component
const PendingSettlementBanner: React.FC<{
  inv: Invoice;
  onBlock: (inv: Invoice) => void;
}> = ({ inv, onBlock }) => {
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null);

  React.useEffect(() => {
    // In production this would come from pending_settlements.execute_after
    // For demo: show a 24h countdown from when status changed
    const deadline = new Date(Date.now() + 23.5 * 60 * 60 * 1000);
    const tick = () => {
      const diff = Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const hours   = secondsLeft !== null ? Math.floor(secondsLeft / 3600) : '--' as string | number;
  const minutes = secondsLeft !== null ? Math.floor((secondsLeft % 3600) / 60) : '--';

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-[11px] animate-fade-in"
      style={{
        background: 'rgba(184,130,30,0.06)',
        border: '1.5px solid rgba(184,130,30,0.22)',
      }}
    >
      {/* Pulse dot */}
      <span
        className="w-2 h-2 rounded-full shrink-0 animate-[pulse-live_1.5s_ease-in-out_infinite]"
        style={{ background: '#B8821E' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-ink">
          Payment detected · {inv.sellerBusinessName}
        </p>
        <p className="text-[11px]" style={{ color: 'var(--ink-subtle)' }}>
          Auto-settles in <span className="font-mono font-bold">{hours}h {minutes}m</span> unless blocked · {inv.buyerName}
        </p>
      </div>
      <button
        onClick={() => onBlock(inv)}
        className="shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-[7px] transition-all active:scale-[0.97]"
        style={{ background: 'rgba(140,26,26,0.08)', color: '#8C1A1A', border: '1px solid rgba(140,26,26,0.18)' }}
      >
        Block settlement
      </button>
    </div>
  );
};

export const InvoiceOversightTable: React.FC = () => {
  const { invoices, approveInvoiceAdmin, flagInvoiceAdmin, acknowledgeInvoice, setAdminView } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [flagModal, setFlagModal] = useState<Invoice | null>(null);
  const [blockModal, setBlockModal] = useState<Invoice | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [reasonFocused, setReasonFocused] = useState(false);
  const [blockFocused, setBlockFocused] = useState(false);

  const pendingSettlements = invoices.filter(i => i.status === 'payment_detected' || i.status === 'partial_shortfall');

  const filtered = invoices.filter(inv => {
    if (filter === 'all')        return true;
    if (filter === 'pending')    return inv.status === 'pending_admin_approval';
    if (filter === 'published')  return inv.status === 'published_marketplace';
    if (filter === 'funded')     return inv.status === 'funded';
    if (filter === 'settlement') return inv.status === 'payment_detected' || inv.status === 'partial_shortfall';
    if (filter === 'flagged')    return inv.status === 'flagged' || inv.status === 'disputed' || inv.status === 'defaulted';
    return true;
  });

  const counts: Record<Filter, number> = {
    all:        invoices.length,
    pending:    invoices.filter(i => i.status === 'pending_admin_approval').length,
    published:  invoices.filter(i => i.status === 'published_marketplace').length,
    funded:     invoices.filter(i => i.status === 'funded').length,
    settlement: pendingSettlements.length,
    flagged:    invoices.filter(i => ['flagged','disputed','defaulted'].includes(i.status)).length,
  };

  return (
    <div
      className="mx-auto py-7 px-4 flex flex-col gap-6 pb-28 animate-fade-up"
      style={{ maxWidth: '920px' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p
            className="text-[9px] uppercase font-semibold mb-1.5"
            style={{ color: 'var(--ink-faint)', letterSpacing: '0.12em' }}
          >
            Invoice management
          </p>
          <h1
            className="font-display font-bold text-ink"
            style={{ fontSize: '20px', letterSpacing: '-0.028em', lineHeight: 1.1 }}
          >
            Risk Oversight Grid
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {(['queue','dispute','analytics'] as const).map(view => (
            <button
              key={view}
              onClick={() => setAdminView(view)}
              className="px-3 py-1.5 text-[11px] font-semibold rounded-[7px] transition-colors"
              style={{
                background: 'var(--cream)',
                border: '1px solid var(--border-2)',
                color: 'var(--ink-subtle)',
              }}
            >
              {view === 'queue' ? 'KYC Queue' : view === 'dispute' ? 'Disputes' : 'Analytics'}
            </button>
          ))}
        </div>
      </div>

      {/* Pending settlement banners — shown above filter bar when present */}
      {pendingSettlements.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.10em]" style={{ color: 'var(--ink-faint)' }}>
            Pending auto-settlement · {pendingSettlements.length} invoice{pendingSettlements.length !== 1 ? 's' : ''}
          </p>
          {pendingSettlements.map(inv => (
            <PendingSettlementBanner key={inv.id} inv={inv} onBlock={inv => { setBlockModal(inv); setBlockReason(''); }} />
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-120 whitespace-nowrap"
            style={
              filter === tab
                ? { background: 'var(--ink)', color: '#fff', boxShadow: 'var(--shadow-e1)' }
                : { background: 'transparent', color: 'var(--ink-faint)', border: '1px solid var(--border-2)' }
            }
          >
            <span className="capitalize">
              {tab === 'settlement' ? 'Settlement' : tab}
            </span>
            {counts[tab] > 0 && (
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold"
                style={{
                  background: filter === tab ? 'rgba(255,255,255,0.18)' : tab === 'settlement' && counts[tab] > 0 ? 'rgba(184,130,30,0.18)' : 'var(--border)',
                  color: filter === tab ? '#fff' : tab === 'settlement' ? '#B8821E' : 'var(--ink-subtle)',
                }}
              >
                {counts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-[15px] overflow-hidden"
        style={{ border: '1px solid var(--border-2)', boxShadow: 'var(--shadow-e1)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--border-2)' }}>
                {['Invoice','Seller','Buyer','Value','Risk','Status',''].map((h, i) => (
                  <th
                    key={i}
                    className="font-semibold"
                    style={{
                      padding: '10px 14px',
                      fontSize: '9px',
                      color: 'var(--ink-faint)',
                      letterSpacing: '0.10em',
                      textTransform: 'uppercase',
                      textAlign: i === 6 ? 'right' : 'left',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center"
                    style={{ padding: '48px 20px', color: 'var(--ink-faint)', fontSize: '12px' }}
                  >
                    No invoices in this category.
                  </td>
                </tr>
              ) : (
                filtered.map((inv, idx) => {
                  const sm = statusMeta[inv.status] ?? statusMeta['repaid'];
                  return (
                    <tr
                      key={inv.id}
                      className="transition-colors duration-100"
                      style={{
                        background: idx % 2 === 0 ? 'var(--surface-1)' : 'transparent',
                        borderBottom: '1px solid var(--border-2)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--cream)')}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'var(--surface-1)' : 'transparent')}
                    >
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <span
                          className="font-mono font-semibold text-[11px]"
                          style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}
                        >
                          {inv.id.slice(0, 14)}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span className="text-[12px] font-semibold" style={{ color: 'var(--ink)' }}>
                          {inv.sellerBusinessName}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span className="text-[12px]" style={{ color: 'var(--ink-subtle)' }}>
                          {inv.buyerName}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <span
                          className="font-mono font-bold text-[12px]"
                          style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}
                        >
                          ${inv.amount.toLocaleString()}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <span
                          className="text-[11px] font-semibold"
                          style={{ color: riskColor(inv.riskTier) }}
                        >
                          {inv.riskScore}/100
                        </span>
                        <span
                          className="ml-1 text-[10px]"
                          style={{ color: riskColor(inv.riskTier) }}
                        >
                          {inv.riskTier}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: sm.bg, color: sm.text }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: sm.dot }}
                          />
                          {sm.label}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div className="flex items-center justify-end gap-2">
                          {inv.status === 'pending_admin_approval' && (
                            <button
                              onClick={() => approveInvoiceAdmin(inv.id)}
                              className="px-2.5 py-1 rounded-[7px] text-[11px] font-semibold transition-all active:scale-[0.97]"
                              style={{ background: 'rgba(26,122,70,0.10)', color: '#1A7A46', border: '1px solid rgba(26,122,70,0.20)' }}
                            >
                              Approve
                            </button>
                          )}
                          {/* Buyer acknowledgement — shown when not yet acknowledged */}
                          {!inv.buyerAcknowledged && inv.status !== 'repaid' && inv.status !== 'defaulted' && (
                            <button
                              onClick={() => acknowledgeInvoice(inv.id)}
                              className="px-2.5 py-1 rounded-[7px] text-[11px] font-semibold transition-all active:scale-[0.97]"
                              title="Simulate buyer clicking the acknowledgement email link"
                              style={{ background: 'rgba(26,77,184,0.07)', color: '#1E4DB8', border: '1px solid rgba(26,77,184,0.15)' }}
                            >
                              Ack.
                            </button>
                          )}
                          {inv.buyerAcknowledged && (
                            <span
                              className="px-2 py-1 rounded-[7px] text-[10px] font-semibold"
                              style={{ background: 'rgba(26,102,69,0.08)', color: '#1A6645' }}
                            >
                              ✓ Ack'd
                            </span>
                          )}
                          {inv.status !== 'flagged' && (
                            <button
                              onClick={() => { setFlagModal(inv); setFlagReason(''); }}
                              className="px-2.5 py-1 rounded-[7px] text-[11px] font-semibold transition-all active:scale-[0.97]"
                              style={{ background: 'rgba(140,26,26,0.07)', color: '#8C1A1A', border: '1px solid rgba(140,26,26,0.15)' }}
                            >
                              Flag
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block settlement modal */}
      {blockModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(13,24,36,0.55)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="w-full max-w-[380px] rounded-[15px] overflow-hidden animate-fade-up"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)', boxShadow: 'var(--shadow-e4)' }}
          >
            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,#B8821E,#E8B96A)' }} />
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-semibold text-ink" style={{ fontSize: '15px', letterSpacing: '-0.018em' }}>
                    Block auto-settlement
                  </h3>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>
                    {blockModal.id} · {blockModal.sellerBusinessName}
                  </p>
                </div>
                <button
                  onClick={() => setBlockModal(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'var(--cream)', color: 'var(--ink-subtle)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div
                className="flex items-center gap-3 px-3.5 py-3 rounded-[9px]"
                style={{ background: 'rgba(184,130,30,0.06)', border: '1px solid rgba(184,130,30,0.18)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.5L12.5 11H1.5L7 1.5Z" stroke="#B8821E" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M7 5.5v3M7 10h.01" stroke="#B8821E" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <p className="text-[11.5px]" style={{ color: '#7A5510' }}>
                  Blocking will move this invoice to dispute review. The lender will be notified.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold" style={{ color: 'var(--ink-subtle)' }}>
                  Reason for blocking
                </label>
                <textarea
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  onFocus={() => setBlockFocused(true)}
                  onBlur={() => setBlockFocused(false)}
                  placeholder="e.g. Suspected bank reversal, payment reference mismatch..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-[13px] text-ink resize-none focus:outline-none rounded-[9px] transition-all"
                  style={{
                    background: 'var(--cream)',
                    border: blockFocused ? '1.5px solid rgba(184,130,30,0.55)' : '1px solid var(--border-2)',
                    boxShadow: blockFocused ? '0 0 0 3px rgba(184,130,30,0.08)' : 'none',
                  }}
                />
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setBlockModal(null)}
                  className="flex-1 h-10 rounded-[9px] text-[12px] font-semibold transition-all"
                  style={{ background: 'var(--cream)', border: '1px solid var(--border-2)', color: 'var(--ink-subtle)' }}
                >
                  Cancel
                </button>
                <button
                  disabled={!blockReason.trim()}
                  onClick={() => {
                    flagInvoiceAdmin(blockModal.id, `[SETTLEMENT BLOCKED] ${blockReason}`);
                    setBlockModal(null);
                  }}
                  className="flex-1 h-10 rounded-[9px] text-[12px] font-semibold text-white transition-all disabled:opacity-35 disabled:cursor-not-allowed active:scale-[0.98]"
                  style={{ background: '#8C1A1A' }}
                >
                  Block settlement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flag modal */}
      {flagModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(13,24,36,0.55)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="w-full max-w-[360px] rounded-[15px] overflow-hidden animate-fade-up"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)', boxShadow: 'var(--shadow-e4)' }}
          >
            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,#8C1A1A,#C44)' }} />
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    className="font-display font-semibold text-ink"
                    style={{ fontSize: '15px', letterSpacing: '-0.018em' }}
                  >
                    Flag invoice
                  </h3>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>
                    {flagModal.id} · {flagModal.sellerBusinessName}
                  </p>
                </div>
                <button
                  onClick={() => setFlagModal(null)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'var(--cream)', color: 'var(--ink-subtle)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold" style={{ color: 'var(--ink-subtle)' }}>
                  Reason for flagging
                </label>
                <textarea
                  value={flagReason}
                  onChange={e => setFlagReason(e.target.value)}
                  onFocus={() => setReasonFocused(true)}
                  onBlur={() => setReasonFocused(false)}
                  placeholder="e.g. Duplicate invoice, suspected fraud, document mismatch..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-[13px] text-ink resize-none focus:outline-none rounded-[9px] transition-all"
                  style={{
                    background: 'var(--cream)',
                    border: reasonFocused ? '1.5px solid rgba(184,130,30,0.55)' : '1px solid var(--border-2)',
                    boxShadow: reasonFocused ? '0 0 0 3px rgba(184,130,30,0.08)' : 'none',
                  }}
                />
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setFlagModal(null)}
                  className="flex-1 h-10 rounded-[9px] text-[12px] font-semibold transition-all"
                  style={{ background: 'var(--cream)', border: '1px solid var(--border-2)', color: 'var(--ink-subtle)' }}
                >
                  Cancel
                </button>
                <button
                  disabled={!flagReason.trim()}
                  onClick={() => { flagInvoiceAdmin(flagModal.id, flagReason); setFlagModal(null); }}
                  className="flex-1 h-10 rounded-[9px] text-[12px] font-semibold text-white transition-all disabled:opacity-35 disabled:cursor-not-allowed active:scale-[0.98]"
                  style={{ background: '#8C1A1A' }}
                >
                  Confirm flag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
