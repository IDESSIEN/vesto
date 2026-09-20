import React from 'react';
import { useApp } from '../../context/AppContext';

const statusColor: Record<string, string> = {
  verified: '#047857',
  pending: '#B45309',
  none: '#64748B',
  rejected: '#B91C1C',
};
const statusLabel: Record<string, string> = {
  verified: 'Verified',
  pending: 'Pending Review',
  none: 'Not Started',
  rejected: 'Rejected',
};
const statusIcon: Record<string, string> = {
  verified: 'verified',
  pending: 'hourglass_top',
  none: 'radio_button_unchecked',
  rejected: 'cancel',
};

export const SellerStatus: React.FC = () => {
  const { seller, invoices, setSellerView } = useApp();

  const myInvoices = invoices.filter(inv => inv.sellerId === seller.id);
  const invoicesByStatus = {
    pending: myInvoices.filter(i => i.status === 'pending_admin_approval').length,
    published: myInvoices.filter(i => i.status === 'published_marketplace').length,
    funded: myInvoices.filter(i => i.status === 'funded').length,
    repaid: myInvoices.filter(i => i.status === 'repaid').length,
  };
  const totalFinanced = myInvoices.reduce((s, i) => s + i.advanceAmount, 0);

  const tier1Status = seller.kycStatusTier1 || 'none';
  const tier2Status = seller.kycStatusTier2 || 'none';

  // Determine next recommended action
  const nextAction = (() => {
    if (tier1Status === 'none') return { label: 'Start Tier 1 Verification', view: 'tier1', desc: 'Verify your identity to unlock a $500 credit limit.' };
    if (tier1Status === 'pending') return { label: 'Check Verification Status', view: 'in_progress', desc: 'Your Tier 1 document is under admin review. Usually takes 5 minutes.' };
    if (tier1Status === 'verified' && tier2Status === 'none') return { label: 'Upgrade to Tier 2', view: 'tier2', desc: 'Submit business documents to unlock a $5,000 credit limit.' };
    if (tier2Status === 'pending') return { label: 'Check Tier 2 Status', view: 'in_progress', desc: 'Your Tier 2 documents are under review.' };
    return { label: 'Submit an Invoice', view: 'submit_invoice', desc: 'Your account is fully verified. Start financing your invoices.' };
  })();

  const creditUsedPct = seller.creditLimit > 0 ? Math.min(100, (seller.usedLimit / seller.creditLimit) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 flex flex-col gap-5">

      {/* Page header */}
      <div>
        <h1
          className="font-headline font-extrabold text-2xl mb-0.5"
          style={{ color: 'var(--primary)', letterSpacing: '-0.03em' }}
        >
          Account Status
        </h1>
        <p className="text-sm" style={{ color: 'var(--secondary)' }}>
          {seller.businessName || 'Your business'} · Vesto Seller Account
        </p>
      </div>

      {/* Next Step CTA */}
      <div
        className="relative rounded-2xl overflow-hidden p-5 flex items-center justify-between gap-4"
        style={{
          background: 'linear-gradient(135deg,#0A1628 0%,#112240 100%)',
          border: '1px solid rgba(201,146,42,0.25)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '14px 14px' }} />
        <div className="relative z-10 flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: '#E8B96A' }}>Recommended Next Step</p>
          <p className="font-headline font-bold text-white text-base leading-tight mb-1">{nextAction.label}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{nextAction.desc}</p>
        </div>
        <button
          onClick={() => setSellerView(nextAction.view)}
          className="relative z-10 shrink-0 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg,#C9922A,#E8B96A)', color: '#0A1628' }}
        >
          Go
          <span className="material-symbols-outlined text-sm ml-1 align-middle">arrow_forward</span>
        </button>
      </div>

      {/* Verification Progress */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: '0 2px 16px rgba(10,22,40,0.06)' }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="font-headline font-bold text-sm" style={{ color: 'var(--primary)', letterSpacing: '-0.02em' }}>
            Verification Progress
          </p>
        </div>

        {/* Tier 1 */}
        <div className="px-5 py-4 flex items-center gap-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: tier1Status === 'verified' ? 'rgba(4,120,87,0.12)' : tier1Status === 'pending' ? 'rgba(180,83,9,0.10)' : 'var(--canvas)', border: `1px solid ${statusColor[tier1Status]}30` }}
          >
            <span className="material-symbols-outlined text-xl" style={{ color: statusColor[tier1Status] }}>
              {statusIcon[tier1Status]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>Tier 1 Verification</p>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background: `${statusColor[tier1Status]}15`, color: statusColor[tier1Status] }}
              >
                {statusLabel[tier1Status]}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--secondary)' }}>
              National ID · Unlocks $500 credit limit
            </p>
          </div>
          {tier1Status === 'none' && (
            <button
              onClick={() => setSellerView('tier1')}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{ background: 'var(--canvas)', border: '1px solid rgba(201,146,42,0.4)', color: '#C9922A' }}
            >
              Start
            </button>
          )}
        </div>

        {/* Tier 2 */}
        <div className="px-5 py-4 flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: tier2Status === 'verified' ? 'rgba(4,120,87,0.12)' : tier2Status === 'pending' ? 'rgba(180,83,9,0.10)' : 'var(--canvas)',
              border: `1px solid ${statusColor[tier2Status]}30`,
              opacity: tier1Status !== 'verified' ? 0.45 : 1,
            }}
          >
            <span className="material-symbols-outlined text-xl" style={{ color: statusColor[tier2Status] }}>
              {statusIcon[tier2Status]}
            </span>
          </div>
          <div className="flex-1 min-w-0" style={{ opacity: tier1Status !== 'verified' ? 0.45 : 1 }}>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>Tier 2 Verification</p>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background: `${statusColor[tier2Status]}15`, color: statusColor[tier2Status] }}
              >
                {tier1Status !== 'verified' ? 'Locked' : statusLabel[tier2Status]}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--secondary)' }}>
              Business documents + bank ledger · Unlocks $5,000 credit limit
            </p>
          </div>
          {tier1Status === 'verified' && tier2Status === 'none' && (
            <button
              onClick={() => setSellerView('tier2')}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold"
              style={{ background: 'var(--canvas)', border: '1px solid rgba(201,146,42,0.4)', color: '#C9922A' }}
            >
              Start
            </button>
          )}
        </div>
      </div>

      {/* Credit Limit */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: '0 2px 16px rgba(10,22,40,0.06)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-headline font-bold text-sm" style={{ color: 'var(--primary)', letterSpacing: '-0.02em' }}>Credit Limit</p>
          <p className="font-tnum text-xs font-bold" style={{ color: 'var(--secondary)' }}>
            <span style={{ color: '#C9922A' }}>${seller.creditLimit.toLocaleString()}</span> available
          </p>
        </div>
        <div className="h-2 rounded-full overflow-hidden mb-2" style={{ background: 'var(--canvas)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${creditUsedPct}%`,
              background: creditUsedPct > 80 ? '#B91C1C' : 'linear-gradient(90deg,#C9922A,#E8B96A)',
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: 'var(--secondary)' }}>
            ${seller.usedLimit.toLocaleString()} used of ${seller.creditLimit.toLocaleString()}
          </span>
          <span className="text-[10px] font-semibold" style={{ color: 'var(--secondary)' }}>
            {seller.verificationTier === 0 ? 'Verify ID to unlock' : seller.verificationTier === 1 ? 'Upgrade to Tier 2 for $5,000' : 'Max tier reached'}
          </span>
        </div>
      </div>

      {/* Invoice Pipeline */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', boxShadow: '0 2px 16px rgba(10,22,40,0.06)' }}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <p className="font-headline font-bold text-sm" style={{ color: 'var(--primary)', letterSpacing: '-0.02em' }}>Invoice Pipeline</p>
          <span className="font-tnum text-xs font-bold" style={{ color: '#C9922A' }}>
            ${totalFinanced.toLocaleString()} total advanced
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0" style={{ borderColor: 'var(--border)' }}>
          {[
            { label: 'Pending', count: invoicesByStatus.pending, color: '#B45309' },
            { label: 'On Market', count: invoicesByStatus.published, color: '#2563EB' },
            { label: 'Funded', count: invoicesByStatus.funded, color: '#047857' },
            { label: 'Repaid', count: invoicesByStatus.repaid, color: '#64748B' },
          ].map(({ label, count, color }) => (
            <div key={label} className="px-4 py-4 flex flex-col items-center justify-center gap-1">
              <span className="font-tnum font-extrabold text-2xl" style={{ color, letterSpacing: '-0.03em' }}>{count}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--secondary)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setSellerView('submit_invoice')}
          className="h-12 rounded-xl text-sm font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,#0A1628,#112240)', color: '#fff', border: '1px solid rgba(201,146,42,0.25)' }}
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          + Invoice
        </button>
        <button
          onClick={() => setSellerView('dashboard')}
          className="h-12 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-2"
          style={{ background: 'var(--canvas)', color: 'var(--primary)', border: '1px solid var(--border)' }}
        >
          <span className="material-symbols-outlined text-base">dashboard</span>
          Dashboard
        </button>
      </div>

    </div>
  );
};
