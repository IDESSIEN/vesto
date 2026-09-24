import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Buyer, Invoice } from '../../types';

/* ── helpers ── */
const alertLevel = (daysToDeadline: number, frozen: boolean): 'frozen' | 'red' | 'amber' | 'green' | 'none' => {
  if (frozen) return 'frozen';
  if (daysToDeadline < 0) return 'red';
  if (daysToDeadline <= 3) return 'red';
  if (daysToDeadline <= 14) return 'amber';
  return 'green';
};

const ALERT_COLORS = {
  frozen: { bg: 'rgba(100,60,160,0.08)', border: 'rgba(100,60,160,0.22)', dot: '#7C3AED', text: '#5B21B6', label: 'Frozen' },
  red:    { bg: 'rgba(140,26,26,0.07)',  border: 'rgba(140,26,26,0.20)',  dot: '#DC2626', text: '#8C1A1A', label: 'Overdue' },
  amber:  { bg: 'rgba(184,130,30,0.07)', border: 'rgba(184,130,30,0.20)', dot: '#D97706', text: '#92570D', label: 'Due soon' },
  green:  { bg: 'rgba(26,102,69,0.07)',  border: 'rgba(26,102,69,0.18)',  dot: '#059669', text: '#1A6645', label: 'On track' },
  none:   { bg: 'var(--cream)',           border: 'var(--border)',          dot: 'var(--ink-faint)', text: 'var(--ink-subtle)', label: 'No activity' },
};

const daysUntil = (dateStr?: string): number => {
  if (!dateStr) return 999;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
};

const tierColor = (tier: string) => {
  if (tier === 'A+') return { color: '#1A6645', bg: 'rgba(26,102,69,0.08)', border: 'rgba(26,102,69,0.18)' };
  if (tier === 'A')  return { color: '#1E4DB8', bg: 'rgba(30,77,184,0.07)', border: 'rgba(30,77,184,0.14)' };
  if (tier === 'B+') return { color: '#92570D', bg: 'rgba(184,130,30,0.08)', border: 'rgba(184,130,30,0.18)' };
  return               { color: '#8C1A1A', bg: 'rgba(140,26,26,0.07)', border: 'rgba(140,26,26,0.18)' };
};

/* ── sub-components ── */
const TierBadge: React.FC<{ tier: string }> = ({ tier }) => {
  const c = tierColor(tier);
  return (
    <span
      className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-[4px]"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {tier}
    </span>
  );
};

const OnTimeBar: React.FC<{ rate: number }> = ({ rate }) => {
  const color = rate >= 90 ? '#1A6645' : rate >= 75 ? '#B8821E' : '#8C1A1A';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-[4px] rounded-full overflow-hidden" style={{ background: 'rgba(13,24,36,0.08)', minWidth: '52px' }}>
        <div className="h-full rounded-full" style={{ width: `${rate}%`, background: color, transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)' }} />
      </div>
      <span className="font-mono text-[11px] font-semibold font-tnum shrink-0" style={{ color }}>{rate.toFixed(0)}%</span>
    </div>
  );
};

/* ── drill-down panel ── */
const BuyerDrillDown: React.FC<{
  buyer: Buyer;
  invoices: Invoice[];
  onFreeze: (id: string, reason: string) => void;
  onUnfreeze: (id: string) => void;
  onClose: () => void;
}> = ({ buyer, invoices, onFreeze, onUnfreeze, onClose }) => {
  const [freezeReason, setFreezeReason] = useState('');
  const [showFreezeInput, setShowFreezeInput] = useState(false);

  const buyerInvoices = invoices.filter(i => i.buyerId === buyer.id || i.buyerName === buyer.companyName);
  const tc = tierColor(buyer.creditTier);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(5,11,20,0.80)', backdropFilter: 'blur(10px)' }}
    >
      <div
        className="w-full max-w-[520px] rounded-[20px] overflow-hidden"
        style={{ background: 'var(--canvas)', boxShadow: '0 40px 100px rgba(5,11,20,0.60)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
        <div className="px-5 pt-5 pb-6 flex flex-col gap-5">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-[18px] font-bold text-ink" style={{ letterSpacing: '-0.022em' }}>
                  {buyer.companyName}
                </h3>
                <TierBadge tier={buyer.creditTier} />
                {buyer.frozen && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[4px]" style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.22)' }}>
                    Frozen
                  </span>
                )}
              </div>
              <p className="text-[12px]" style={{ color: 'var(--ink-subtle)' }}>
                {buyer.taxId} · {buyer.country} · {buyer.paymentTerms}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ border: '1px solid var(--border-2)', color: 'var(--ink-muted)' }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Total advanced', value: `$${buyer.totalAdvanced.toLocaleString()}`, mono: true },
              { label: 'Total repaid', value: `$${buyer.totalRepaid.toLocaleString()}`, mono: true },
              { label: 'On-time pays', value: `${buyer.onTimeCount}`, mono: true },
              { label: 'Late pays', value: `${buyer.lateCount}`, mono: true, warn: buyer.lateCount > 2 },
              { label: 'Defaults', value: `${buyer.defaultCount}`, mono: true, danger: buyer.defaultCount > 0 },
              { label: 'Credit score', value: `${buyer.creditScore}/100`, mono: true },
            ].map(({ label, value, mono, warn, danger }) => (
              <div
                key={label}
                className="flex flex-col gap-1 px-3.5 py-3 rounded-[11px]"
                style={{ background: danger ? 'rgba(140,26,26,0.06)' : warn ? 'rgba(184,130,30,0.06)' : 'var(--cream)', border: '1px solid var(--border)' }}
              >
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-faint)' }}>{label}</span>
                <span
                  className={`text-[16px] font-bold leading-tight ${mono ? 'font-mono font-tnum' : ''}`}
                  style={{ color: danger ? '#8C1A1A' : warn ? '#92570D' : 'var(--ink)' }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* On-time rate */}
          <div className="px-4 py-3.5 rounded-[11px]" style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-faint)' }}>On-time repayment rate</span>
              <span className="text-[10px]" style={{ color: 'var(--ink-subtle)' }}>{buyer.onTimeCount + buyer.lateCount + buyer.defaultCount} total</span>
            </div>
            <OnTimeBar rate={buyer.onTimeRate} />
          </div>

          {/* Active invoices */}
          {buyerInvoices.length > 0 && (
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.09em] mb-2" style={{ color: 'var(--ink-faint)' }}>
                Active invoices ({buyerInvoices.length})
              </p>
              <div className="flex flex-col gap-2">
                {buyerInvoices.map(inv => {
                  const days = daysUntil(inv.repaymentDeadline || inv.dueDate);
                  const al = alertLevel(days, false);
                  const ac = ALERT_COLORS[al];
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-[9px]"
                      style={{ background: ac.bg, border: `1px solid ${ac.border}` }}
                    >
                      <div>
                        <p className="text-[12px] font-semibold text-ink">{inv.id}</p>
                        <p className="text-[10.5px] font-mono font-tnum" style={{ color: 'var(--ink-subtle)' }}>
                          ${inv.advanceAmount.toLocaleString()} · due {inv.dueDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className="text-[9.5px] font-bold px-2 py-0.5 rounded-[5px] mb-1"
                          style={{ background: ac.bg, color: ac.text, border: `1px solid ${ac.border}` }}
                        >
                          {days < 0 ? `${Math.abs(days)}d overdue` : days === 999 ? 'No deadline' : `${days}d left`}
                        </div>
                        <p className="text-[10px] capitalize" style={{ color: 'var(--ink-faint)' }}>{inv.status.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Freeze / unfreeze */}
          {buyer.frozen ? (
            <div>
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-[11px] mb-3"
                style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                  <path d="M7 1v12M1 7h12M3 3l8 8M11 3L3 11" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <div>
                  <p className="text-[12px] font-semibold mb-0.5" style={{ color: '#7C3AED' }}>Account frozen</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: '#7C3AED', opacity: 0.75 }}>
                    {buyer.frozenReason || 'No reason recorded.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onUnfreeze(buyer.id)}
                className="w-full h-11 rounded-[9px] text-[12.5px] font-semibold transition-all duration-150 active:scale-[0.97]"
                style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.22)' }}
              >
                Unfreeze buyer account
              </button>
            </div>
          ) : (
            <div>
              {showFreezeInput ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={freezeReason}
                    onChange={e => setFreezeReason(e.target.value)}
                    placeholder="Reason for freeze (required)"
                    className="input w-full h-11 text-[13px]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { if (freezeReason.trim()) onFreeze(buyer.id, freezeReason); }}
                      disabled={!freezeReason.trim()}
                      className="flex-1 h-10 rounded-[9px] text-[12px] font-semibold transition-all duration-150 active:scale-[0.97]"
                      style={{ background: '#8C1A1A', color: '#fff', opacity: freezeReason.trim() ? 1 : 0.4 }}
                    >
                      Confirm freeze
                    </button>
                    <button
                      onClick={() => setShowFreezeInput(false)}
                      className="h-10 px-4 rounded-[9px] text-[12px] font-semibold"
                      style={{ background: 'var(--cream)', border: '1px solid var(--border)', color: 'var(--ink-subtle)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowFreezeInput(true)}
                  className="w-full h-11 rounded-[9px] text-[12.5px] font-semibold transition-all duration-150 active:scale-[0.97]"
                  style={{ background: 'rgba(140,26,26,0.07)', color: '#8C1A1A', border: '1px solid rgba(140,26,26,0.18)' }}
                >
                  Freeze buyer account
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── main component ── */
export const BuyerMonitoring: React.FC = () => {
  const { invoices, buyers, freezeBuyer, unfreezeBuyer } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'alert' | 'frozen'>('all');
  const [drill, setDrill] = useState<Buyer | null>(null);

  // Derive per-buyer stats from live invoices
  const buyerRows = useMemo(() => {
    return buyers.map(b => {
      const active = invoices.filter(i =>
        (i.buyerId === b.id || i.buyerName === b.companyName) &&
        i.status === 'funded'
      );
      const totalOutstanding = active.reduce((s, i) => s + i.advanceAmount, 0);
      const earliest = active
        .map(i => i.repaymentDeadline || i.dueDate)
        .filter(Boolean)
        .sort()[0];
      const days = daysUntil(earliest);
      const al = alertLevel(days, b.frozen);
      return { buyer: b, active, totalOutstanding, earliest, days, alertLvl: al };
    });
  }, [buyers, invoices]);

  const filtered = buyerRows.filter(r => {
    const q = search.toLowerCase();
    const textMatch = r.buyer.companyName.toLowerCase().includes(q) || r.buyer.taxId.toLowerCase().includes(q);
    if (!textMatch) return false;
    if (filter === 'alert') return r.alertLvl === 'red' || r.alertLvl === 'amber';
    if (filter === 'frozen') return r.buyer.frozen;
    return true;
  });

  const totalPlatformOutstanding = buyerRows.reduce((s, r) => s + r.totalOutstanding, 0);

  // Concentration risk flag
  const concentrationWarning = buyerRows.find(r => {
    if (totalPlatformOutstanding === 0) return false;
    return (r.totalOutstanding / totalPlatformOutstanding) > 0.25;
  });

  const alertCounts = {
    red: buyerRows.filter(r => r.alertLvl === 'red').length,
    amber: buyerRows.filter(r => r.alertLvl === 'amber').length,
    frozen: buyerRows.filter(r => r.alertLvl === 'frozen').length,
  };

  return (
    <div className="flex flex-col gap-6 view-enter">

      {/* Concentration risk banner */}
      {concentrationWarning && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-[13px]"
          style={{ background: 'rgba(140,26,26,0.07)', border: '1px solid rgba(140,26,26,0.22)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
            <path d="M8 1.5L14.5 13.5H1.5L8 1.5z" stroke="#DC2626" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M8 6v4" stroke="#DC2626" strokeWidth="1.4" strokeLinecap="round"/>
            <circle cx="8" cy="11.5" r="0.7" fill="#DC2626"/>
          </svg>
          <div>
            <p className="text-[12.5px] font-semibold mb-0.5" style={{ color: '#8C1A1A' }}>
              Concentration risk: {concentrationWarning.buyer.companyName}
            </p>
            <p className="text-[11.5px] leading-relaxed" style={{ color: '#8C1A1A', opacity: 0.80 }}>
              ${concentrationWarning.totalOutstanding.toLocaleString()} outstanding — {((concentrationWarning.totalOutstanding / totalPlatformOutstanding) * 100).toFixed(0)}% of all active advances.
              Standard practice caps single-buyer exposure at 25%.
            </p>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total buyers', value: buyers.length.toString(), mono: false },
          { label: 'Outstanding', value: `$${totalPlatformOutstanding.toLocaleString()}`, mono: true },
          { label: 'Overdue / due soon', value: `${alertCounts.red} / ${alertCounts.amber}`, mono: true, warn: alertCounts.red > 0 },
          { label: 'Frozen', value: alertCounts.frozen.toString(), mono: true, danger: alertCounts.frozen > 0 },
        ].map(({ label, value, mono, warn, danger }) => (
          <div
            key={label}
            className="px-4 py-3.5 rounded-[13px] flex flex-col gap-1"
            style={{
              background: danger ? 'rgba(140,26,26,0.06)' : warn ? 'rgba(184,130,30,0.06)' : 'var(--cream)',
              border: `1px solid ${danger ? 'rgba(140,26,26,0.18)' : warn ? 'rgba(184,130,30,0.18)' : 'var(--border)'}`,
            }}
          >
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-faint)' }}>{label}</span>
            <span
              className={`text-[22px] font-bold leading-tight ${mono ? 'font-mono font-tnum' : 'font-display'}`}
              style={{ color: danger ? '#8C1A1A' : warn ? '#92570D' : 'var(--ink)', letterSpacing: '-0.03em' }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-2.5">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4.5" stroke="rgba(13,24,36,0.28)" strokeWidth="1.2"/>
            <path d="M9.5 9.5l2.5 2.5" stroke="rgba(13,24,36,0.28)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by company or tax ID"
            className="input w-full h-[44px] pl-9 text-[13px]"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all','alert','frozen'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-[7px] text-[11px] font-semibold transition-all duration-150 capitalize"
              style={filter === f
                ? { background: 'var(--ink)', color: '#fff' }
                : { background: 'var(--cream)', color: 'var(--ink-subtle)', border: '1px solid var(--border-2)' }
              }
            >
              {f === 'alert' ? `Alert (${alertCounts.red + alertCounts.amber})` : f === 'frozen' ? `Frozen (${alertCounts.frozen})` : 'All buyers'}
            </button>
          ))}
        </div>
      </div>

      {/* Buyer table */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center py-14 rounded-[15px] text-center"
            style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}
          >
            <p className="text-[13px] font-semibold text-ink mb-1">No buyers match this filter</p>
            <p className="text-[11.5px]" style={{ color: 'var(--ink-faint)' }}>All buyer payments are on track.</p>
          </div>
        ) : (
          filtered.map(({ buyer, active, totalOutstanding, days, alertLvl }) => {
            const ac = ALERT_COLORS[alertLvl];
            return (
              <button
                key={buyer.id}
                onClick={() => setDrill(buyer)}
                className="w-full text-left rounded-[13px] px-4 py-3.5 transition-all duration-150 hover:shadow-md active:scale-[0.99]"
                style={{ background: 'var(--cream)', border: `1px solid ${alertLvl !== 'none' && alertLvl !== 'green' ? ac.border : 'var(--border)'}` }}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: buyer info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-display text-[14.5px] font-semibold text-ink" style={{ letterSpacing: '-0.018em' }}>
                        {buyer.companyName}
                      </span>
                      <TierBadge tier={buyer.creditTier} />
                    </div>
                    <p className="text-[11px]" style={{ color: 'var(--ink-subtle)' }}>
                      {buyer.country} · {buyer.paymentTerms} · {active.length} active invoice{active.length !== 1 ? 's' : ''}
                    </p>
                    <div className="mt-2 max-w-[180px]">
                      <OnTimeBar rate={buyer.onTimeRate} />
                    </div>
                  </div>

                  {/* Right: outstanding + alert */}
                  <div className="text-right shrink-0">
                    <p
                      className="font-mono text-[16px] font-bold font-tnum mb-1"
                      style={{ color: 'var(--ink)', letterSpacing: '-0.025em' }}
                    >
                      ${totalOutstanding.toLocaleString()}
                    </p>
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[9.5px] font-semibold"
                      style={{ background: ac.bg, color: ac.text, border: `1px solid ${ac.border}` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ac.dot }} />
                      {alertLvl === 'none' || alertLvl === 'green'
                        ? days === 999 ? 'No active invoices' : `${days}d to deadline`
                        : days < 0 ? `${Math.abs(days)}d overdue` : alertLvl === 'frozen' ? 'Frozen' : `${days}d left`
                      }
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Drill-down panel */}
      {drill && (
        <BuyerDrillDown
          buyer={drill}
          invoices={invoices}
          onFreeze={(id, reason) => { freezeBuyer(id, reason); setDrill(null); }}
          onUnfreeze={(id) => { unfreezeBuyer(id); setDrill(null); }}
          onClose={() => setDrill(null)}
        />
      )}
    </div>
  );
};
