import React from 'react';
import { useApp } from '../../context/AppContext';

const ArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6h8M7 2.5l3.5 3.5L7 9.5"/>
  </svg>
);
const CheckCircleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="9" r="7.5"/><path d="M5.5 9l2.5 2.5 4.5-5"/>
  </svg>
);
const HourglassIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2h10M3 14h10"/><path d="M4 2v2.5l4 3.5-4 3.5V14"/><path d="M12 2v2.5L8 8l4 3.5V14"/>
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7.5" width="10" height="7" rx="1.5"/><path d="M5.5 7.5V5.5a2.5 2.5 0 0 1 5 0v2"/>
    <circle cx="8" cy="11" r="1.1" fill="currentColor" stroke="none"/>
  </svg>
);
const XCircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.5"/><path d="M5.5 5.5l5 5M10.5 5.5l-5 5"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M6.5 2v9M2 6.5h9"/>
  </svg>
);
const GridIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="1" width="4.5" height="4.5" rx="1.2"/><rect x="7.5" y="1" width="4.5" height="4.5" rx="1.2"/>
    <rect x="1" y="7.5" width="4.5" height="4.5" rx="1.2"/><rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1.2"/>
  </svg>
);

export const SellerStatus: React.FC = () => {
  const { seller, invoices, setSellerView } = useApp();

  const myInvoices = invoices.filter(inv => inv.sellerId === seller.id);
  const counts = {
    pending:   myInvoices.filter(i => i.status === 'pending_admin_approval').length,
    published: myInvoices.filter(i => i.status === 'published_marketplace').length,
    funded:    myInvoices.filter(i => i.status === 'funded').length,
    repaid:    myInvoices.filter(i => i.status === 'repaid').length,
  };
  const totalFinanced = myInvoices.reduce((s, i) => s + i.advanceAmount, 0);
  const creditUsedPct = seller.creditLimit > 0 ? Math.min(100, (seller.usedLimit / seller.creditLimit) * 100) : 0;

  const tier1Status = (seller.kycStatusTier1 || 'none') as 'verified' | 'pending' | 'rejected' | 'none';
  const tier2Status = (seller.kycStatusTier2 || 'none') as 'verified' | 'pending' | 'rejected' | 'none';

  const nextAction = (() => {
    if (tier1Status === 'none')     return { label: 'Start identity check', view: 'tier1', desc: 'Takes under two minutes. Unlocks a $500 advance limit immediately on approval.' };
    if (tier1Status === 'pending')  return { label: 'Tier 1 in review', view: 'in_progress', desc: 'Your document is under admin review. Usually cleared in under 5 minutes.' };
    if (tier1Status === 'verified' && tier2Status === 'none') return { label: 'Upgrade to Tier 2', view: 'tier2', desc: 'Submit business documents to unlock a $5,000 advance limit.' };
    if (tier2Status === 'pending')  return { label: 'Tier 2 in review', view: 'in_progress', desc: 'Business documents under review. Typically cleared the same business day.' };
    return { label: 'Submit an invoice', view: 'submit_invoice', desc: 'Your account is fully verified. Request an advance on your next invoice.' };
  })();

  const tierProps = (s: 'verified' | 'pending' | 'rejected' | 'none') => ({
    verified: { icon: <CheckCircleIcon />, color: 'var(--success)',  bg: 'var(--success-bg)',  border: 'rgba(26,102,69,0.20)',  label: 'Verified'    },
    pending:  { icon: <HourglassIcon />,  color: 'var(--warning)',  bg: 'var(--warning-bg)',  border: 'rgba(140,90,0,0.18)',  label: 'In review'   },
    rejected: { icon: <XCircleIcon />,   color: 'var(--danger)',   bg: 'var(--danger-bg)',   border: 'rgba(140,26,26,0.18)', label: 'Not approved' },
    none:     { icon: <LockIcon />,      color: 'var(--ink-faint)', bg: 'var(--bg-2)',        border: 'var(--border)',        label: 'Not started' },
  }[s]);

  const t1 = tierProps(tier1Status);
  const t2 = tierProps(tier2Status);

  return (
    <div className="max-w-[560px] mx-auto px-4 py-7 pb-28 flex flex-col gap-4 view-enter">

      {/* Heading */}
      <div className="mb-1">
        <h1
          className="font-display font-bold text-ink mb-1.5"
          style={{ fontSize: '23px', letterSpacing: '-0.028em', lineHeight: 1.06 }}
        >
          Account status
        </h1>
        <p className="text-[12.5px]" style={{ color: 'var(--ink-subtle)' }}>
          {seller.businessName || 'Your business'} · Vesto Seller
        </p>
      </div>

      {/* Next-step dark card */}
      <div
        className="relative rounded-[15px] px-5 py-5 overflow-hidden grain-overlay"
        style={{
          background: 'linear-gradient(160deg,#0D1824 0%,#1A2A3E 100%)',
          border: '1px solid rgba(184,130,30,0.20)',
          boxShadow: 'var(--shadow-e3)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,#B8821E 25%,#E9BE68 60%,#B8821E 85%,transparent)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[8.5px] font-bold uppercase tracking-[0.11em] mb-1.5" style={{ color: '#E9BE68' }}>
              Recommended next step
            </p>
            <p className="font-display font-bold text-white mb-1.5" style={{ fontSize: '15px', letterSpacing: '-0.018em', lineHeight: 1.2 }}>
              {nextAction.label}
            </p>
            <p className="text-[11.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {nextAction.desc}
            </p>
          </div>
          <button
            onClick={() => setSellerView(nextAction.view)}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-[9px] text-[12px] font-semibold transition-all duration-150 active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg,#B8821E,#D4A032)', color: '#0D1824', boxShadow: 'var(--shadow-gold)' }}
          >
            Go <ArrowRight />
          </button>
        </div>
      </div>

      {/* Verification progress */}
      <section
        className="rounded-[13px] overflow-hidden"
        style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e1)' }}
      >
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="font-display text-[13px] font-bold text-ink" style={{ letterSpacing: '-0.018em' }}>
            Verification progress
          </p>
        </div>

        {/* Tier 1 */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div
            className="w-9 h-9 rounded-[9px] shrink-0 flex items-center justify-center"
            style={{ background: t1.bg, border: `1px solid ${t1.border}`, color: t1.color }}
          >
            {t1.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[13px] font-semibold text-ink">Tier 1 — Identity</p>
              <span
                className="text-[9px] font-bold uppercase tracking-[0.05em] px-2 py-0.5 rounded-[5px]"
                style={{ background: t1.bg, color: t1.color, border: `1px solid ${t1.border}` }}
              >
                {t1.label}
              </span>
            </div>
            <p className="text-[11.5px]" style={{ color: 'var(--ink-subtle)' }}>
              National ID · unlocks $500 advance limit
            </p>
          </div>
          {tier1Status === 'none' && (
            <button
              onClick={() => setSellerView('tier1')}
              className="shrink-0 px-3 py-1.5 rounded-[7px] text-[11.5px] font-semibold transition-all duration-150 active:scale-[0.97]"
              style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', color: 'var(--gold)' }}
            >
              Start
            </button>
          )}
        </div>

        {/* Tier 2 */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ opacity: tier1Status !== 'verified' ? 0.45 : 1 }}
        >
          <div
            className="w-9 h-9 rounded-[9px] shrink-0 flex items-center justify-center"
            style={{ background: t2.bg, border: `1px solid ${t2.border}`, color: t2.color }}
          >
            {t2.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[13px] font-semibold text-ink">Tier 2 — Business</p>
              <span
                className="text-[9px] font-bold uppercase tracking-[0.05em] px-2 py-0.5 rounded-[5px]"
                style={{ background: t2.bg, color: tier1Status !== 'verified' ? 'var(--ink-faint)' : t2.color, border: `1px solid ${t2.border}` }}
              >
                {tier1Status !== 'verified' ? 'Locked' : t2.label}
              </span>
            </div>
            <p className="text-[11.5px]" style={{ color: 'var(--ink-subtle)' }}>
              Business reg + bank ledger · unlocks $5,000 limit
            </p>
          </div>
          {tier1Status === 'verified' && tier2Status === 'none' && (
            <button
              onClick={() => setSellerView('tier2')}
              className="shrink-0 px-3 py-1.5 rounded-[7px] text-[11.5px] font-semibold transition-all duration-150 active:scale-[0.97]"
              style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', color: 'var(--gold)' }}
            >
              Start
            </button>
          )}
        </div>
      </section>

      {/* Credit limit */}
      <section
        className="rounded-[13px] px-5 py-4"
        style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e1)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-display text-[13px] font-bold text-ink" style={{ letterSpacing: '-0.018em' }}>Credit limit</p>
          <p className="font-mono text-[12px] font-bold font-tnum" style={{ color: 'var(--gold)' }}>
            ${(seller.creditLimit - seller.usedLimit).toLocaleString()} available
          </p>
        </div>
        <div className="h-[5px] rounded-full overflow-hidden mb-2" style={{ background: 'var(--bg-2)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${creditUsedPct}%`,
              background: creditUsedPct > 80 ? 'var(--danger)' : 'linear-gradient(90deg,#B8821E,#E9BE68)',
            }}
          />
        </div>
        <div className="flex justify-between text-[10.5px]" style={{ color: 'var(--ink-subtle)' }}>
          <span className="font-tnum">${seller.usedLimit.toLocaleString()} used of ${seller.creditLimit.toLocaleString()}</span>
          <span>
            {seller.verificationTier === 0
              ? 'Verify to unlock'
              : seller.verificationTier === 1
              ? 'Upgrade to Tier 2 for $5,000'
              : 'Max tier reached'}
          </span>
        </div>
      </section>

      {/* Invoice pipeline */}
      <section
        className="rounded-[13px] overflow-hidden"
        style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e1)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <p className="font-display text-[13px] font-bold text-ink" style={{ letterSpacing: '-0.018em' }}>Invoice pipeline</p>
          <span className="font-mono text-[11px] font-bold font-tnum" style={{ color: 'var(--gold)' }}>
            ${totalFinanced.toLocaleString()} total advanced
          </span>
        </div>
        <div className="grid grid-cols-4">
          {([
            { label: 'In review', count: counts.pending,   color: 'var(--warning)' },
            { label: 'On market', count: counts.published, color: '#2563EB' },
            { label: 'Funded',    count: counts.funded,    color: 'var(--success)' },
            { label: 'Settled',   count: counts.repaid,    color: 'var(--ink-subtle)' },
          ] as { label: string; count: number; color: string }[]).map(({ label, count, color }, i) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 py-4 px-2"
              style={{ borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}
            >
              <span
                className="font-mono font-bold font-tnum leading-none"
                style={{ fontSize: '22px', color, letterSpacing: '-0.04em' }}
              >
                {count}
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-[0.07em] text-center"
                style={{ color: 'var(--ink-faint)' }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setSellerView('submit_invoice')}
          className="h-[46px] btn-primary rounded-[9px] text-[13px] justify-center"
          style={{ background: 'linear-gradient(160deg,#0D1824,#1A2A3E)', boxShadow: 'none' }}
        >
          <PlusIcon /> New invoice
        </button>
        <button
          onClick={() => setSellerView('dashboard')}
          className="h-[46px] btn-secondary rounded-[9px] text-[13px] justify-center"
        >
          <GridIcon /> Dashboard
        </button>
      </div>

    </div>
  );
};
