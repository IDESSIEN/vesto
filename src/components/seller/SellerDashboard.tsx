import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { useApp } from '../../context/AppContext';
import { useUSDCBalance, useClaimPayout, usePendingClaim } from '../../hooks/useVestoEscrow';
import { formatUSDC } from '../../config/contracts';

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; color: string; bg: string; pulse?: boolean }> = {
    funded:                   { label: 'Funded',      color: '#10B981', bg: 'rgba(16,185,129,0.12)', pulse: true },
    repaid:                   { label: 'Repaid',      color: '#6366F1', bg: 'rgba(99,102,241,0.12)' },
    published_marketplace:    { label: 'On Market',   color: '#E8B96A', bg: 'rgba(232,185,106,0.12)', pulse: true },
    pending_admin_approval:   { label: 'In Review',   color: '#94A3B8', bg: 'rgba(148,163,184,0.10)' },
    flagged:                  { label: 'Flagged',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  };
  const s = map[status] ?? { label: status.replace(/_/g, ' '), color: '#94A3B8', bg: 'rgba(148,163,184,0.10)' };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ color: s.color, background: s.bg }}
    >
      {s.pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: s.color }} />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: s.color }} />
        </span>
      )}
      {s.label}
    </span>
  );
};

const StatTile: React.FC<{ label: string; value: string; sub: string; accent?: string }> = ({ label, value, sub, accent }) => (
  <div className="relative flex flex-col gap-1 p-4 rounded-2xl overflow-hidden"
    style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
    <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
    <span className="text-[10px] text-secondary uppercase tracking-widest font-semibold">{label}</span>
    <span className="font-headline text-xl font-extrabold font-tnum" style={{ color: accent ?? 'var(--primary)', letterSpacing: '-0.02em' }}>{value}</span>
    <span className="text-[10px] text-secondary">{sub}</span>
  </div>
);

export const SellerDashboard: React.FC = () => {
  const { seller, invoices, setSellerView, repayInvoiceSeller, showToast } = useApp();
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'funded' | 'repaid'>('all');

  const { raw: usdcBalance } = useUSDCBalance();
  const { raw: pendingClaim, refetch: refetchClaim } = usePendingClaim(address);
  const { claim, isPending: claiming, isConfirming: claimConfirming, isSuccess: claimSuccess } = useClaimPayout();

  const filteredInvoices = invoices.filter((inv) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return inv.status === 'pending_admin_approval' || inv.status === 'published_marketplace';
    if (activeTab === 'funded') return inv.status === 'funded';
    if (activeTab === 'repaid') return inv.status === 'repaid';
    return true;
  });

  const hasClaim = pendingClaim !== undefined && pendingClaim > 0n;
  const activeCapital = invoices.filter(i => i.status === 'funded').reduce((s, i) => s + i.advanceAmount, 0);
  const openOnMarket = invoices.filter(i => i.status === 'published_marketplace').length;
  const creditUsed = Math.min(100, (seller.availablePayout / seller.creditLimit) * 100);

  const handleClaim = async () => {
    try {
      await claim();
      refetchClaim();
      showToast('Payout claimed successfully!', 'success');
    } catch {
      showToast('Claim failed — check your wallet.', 'warning');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-3 sm:px-4 flex flex-col gap-5 sm:gap-6 pb-28">

      {/* ── Identity Header ─────────────────────────────────── */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-headline font-extrabold text-xl shadow-gold"
              style={{ background: 'linear-gradient(135deg,#0A1628 0%,#112240 100%)', border: '2px solid rgba(201,146,42,0.4)' }}
            >
              <span style={{ color: '#E8B96A' }}>{seller.fullName.charAt(0)}</span>
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#10B981', border: '2px solid var(--canvas)' }}
            >
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-headline text-xl font-extrabold text-primary" style={{ letterSpacing: '-0.025em' }}>
                {seller.fullName}
              </h2>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{ background: 'rgba(201,146,42,0.12)', color: '#C9922A', border: '1px solid rgba(201,146,42,0.25)' }}
              >
                Tier {seller.verificationTier}
              </span>
            </div>
            <p className="text-xs text-secondary mt-0.5">{seller.businessName}</p>
          </div>
        </div>
        <button
          onClick={() => setSellerView('tutorial')}
          className="h-9 px-4 rounded-full text-xs font-semibold text-secondary transition-all flex items-center gap-1.5"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
        >
          <span className="material-symbols-outlined text-[15px]">help_outline</span>
          <span className="hidden sm:inline">Tour</span>
        </button>
      </header>

      {/* ── Cinema-ticket Balance Hero ───────────────────────── */}
      <section
        className="relative rounded-3xl overflow-hidden text-white"
        style={{
          background: 'linear-gradient(135deg, #0A1628 0%, #0D1F3C 45%, #112240 100%)',
          boxShadow: '0 20px 60px rgba(10,22,40,0.45), 0 0 0 1px rgba(201,146,42,0.18)',
          minHeight: '220px',
        }}
      >
        {/* Gold shimmer bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #C9922A 20%, #E8B96A 50%, #C9922A 80%, transparent 100%)' }}
        />
        {/* Radial glow */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,146,42,0.07) 0%, transparent 65%)', transform: 'translate(30%,-30%)' }}
        />
        {/* Dot matrix */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        <div className="relative p-7">
          {/* Top label row */}
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isConnected ? 'Arc Testnet · USDC Wallet' : 'Connect wallet to view balance'}
            </span>
            <span
              className="text-[10px] font-bold px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              Limit ${seller.creditLimit.toLocaleString()}
            </span>
          </div>

          {/* Balance number */}
          {isConnected ? (
            <div className="flex items-end gap-3 mb-6">
              <span
                className="font-headline font-extrabold text-white leading-none font-tnum"
                style={{ fontSize: 'clamp(42px,8vw,64px)', letterSpacing: '-0.04em' }}
              >
                {usdcBalance !== undefined
                  ? formatUSDC(usdcBalance)
                  : <span className="inline-block w-48 h-14 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
                }
              </span>
              <span className="text-base font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>USDC</span>
            </div>
          ) : (
            <div className="mb-6 mt-2">
              <ConnectKitButton label="Connect Wallet" />
            </div>
          )}

          {/* Dashed separator — cinema ticket perforation */}
          <div className="relative mb-5">
            <div className="absolute -left-7 w-5 h-5 rounded-full" style={{ background: 'var(--canvas)', top: '-10px' }} />
            <div className="absolute -right-7 w-5 h-5 rounded-full" style={{ background: 'var(--canvas)', top: '-10px' }} />
            <div className="border-t border-dashed" style={{ borderColor: 'rgba(255,255,255,0.12)' }} />
          </div>

          {/* Bottom strip: utilisation + stats */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <span>Credit utilised</span>
                <span className="font-tnum">{creditUsed.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${creditUsed}%`,
                    background: 'linear-gradient(90deg,#C9922A,#E8B96A)',
                    transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-5 sm:gap-6">
              <div>
                <div className="text-[9px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Financed</div>
                <div className="font-headline font-bold text-sm font-tnum text-white">${seller.totalFinanced.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Finality</div>
                <div className="font-headline font-bold text-sm text-white">&lt;1s</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Payout Claim Banner ──────────────────────────────── */}
      {isConnected && hasClaim && (
        <div
          className="flex items-center justify-between px-5 py-4 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.04) 100%)',
            border: '1px solid rgba(16,185,129,0.25)',
          }}
        >
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#10B981' }}>
              Payout Ready
            </div>
            <div className="font-headline font-extrabold text-2xl text-primary font-tnum" style={{ letterSpacing: '-0.02em' }}>
              {pendingClaim !== undefined ? formatUSDC(pendingClaim) : '—'}
              <span className="text-sm font-medium text-secondary ml-2">USDC</span>
            </div>
          </div>
          <button
            onClick={handleClaim}
            disabled={claiming || claimConfirming}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg,#047857,#10B981)' }}
          >
            {claiming ? 'Signing…' : claimConfirming ? 'Confirming…' : 'Claim USDC'}
          </button>
        </div>
      )}
      {claimSuccess && (
        <div className="text-center text-xs font-semibold py-2 rounded-xl" style={{ color: '#10B981', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
          ✓ Payout claimed successfully
        </div>
      )}

      {/* ── Stat Tiles ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile label="Active Capital" value={`$${activeCapital.toLocaleString()}`} sub="In escrow" accent="#10B981" />
        <StatTile label="Cash Received"  value={`$${seller.totalFinanced.toLocaleString()}`} sub="All time" />
        <StatTile label="On Marketplace" value={`${openOnMarket}`} sub="Open invoices" accent="#E8B96A" />
      </div>

      {/* ── Tier Upgrade ─────────────────────────────────────── */}
      {seller.verificationTier < 2 && (
        <div
          className="relative flex items-center justify-between px-5 py-4 rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg,rgba(201,146,42,0.08) 0%,rgba(232,185,106,0.04) 100%)', border: '1px solid rgba(201,146,42,0.20)' }}
        >
          <div className="absolute top-0 left-0 bottom-0 w-1 rounded-l-2xl" style={{ background: 'linear-gradient(180deg,#C9922A,#E8B96A)' }} />
          <div className="flex items-center gap-4 pl-2">
            <span className="material-symbols-outlined text-2xl" style={{ color: '#C9922A' }}>stars</span>
            <div>
              <h4 className="text-sm font-extrabold text-primary" style={{ letterSpacing: '-0.01em' }}>Unlock Tier 2 — $5,000 Limit</h4>
              <p className="text-[11px] text-secondary mt-0.5">Upload Tax PIN + Bank Statement to expand.</p>
            </div>
          </div>
          <button
            onClick={() => setSellerView('tier2')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white shrink-0 transition-all active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg,#C9922A,#E8B96A)', boxShadow: '0 4px 12px rgba(201,146,42,0.30)' }}
          >
            Upgrade
          </button>
        </div>
      )}

      {/* ── CTA Buttons ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setSellerView('submit_invoice')}
          className="h-14 rounded-2xl text-sm font-extrabold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg,#C9922A 0%,#E8B96A 100%)',
            boxShadow: '0 8px 24px rgba(201,146,42,0.35)',
          }}
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Submit Invoice
        </button>
        <button
          onClick={() => setSellerView('tier2')}
          className="h-14 rounded-2xl text-sm font-extrabold text-primary flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
        >
          <span className="material-symbols-outlined text-lg">stars</span>
          Upgrade Tier
        </button>
      </div>

      {/* ── Invoices Ledger ──────────────────────────────────── */}
      <section>
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="font-headline text-base font-extrabold text-primary" style={{ letterSpacing: '-0.02em' }}>Invoices Ledger</h3>
            <p className="text-[11px] text-secondary">Live status of submitted invoices</p>
          </div>
          {/* Tab switcher */}
          <div
            className="flex items-center gap-0.5 p-1 rounded-full overflow-x-auto no-scrollbar self-start sm:self-auto"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
          >
            {(['all', 'pending', 'funded', 'repaid'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all"
                style={activeTab === tab
                  ? { background: 'linear-gradient(135deg,#C9922A,#E8B96A)', color: '#fff' }
                  : { color: 'var(--secondary)' }
                }
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice rows */}
        <div className="flex flex-col gap-3">
          {filteredInvoices.length === 0 ? (
            /* Empty state */
            <div
              className="flex flex-col items-center justify-center py-16 rounded-2xl"
              style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(201,146,42,0.08)' }}
              >
                <span className="material-symbols-outlined text-2xl" style={{ color: '#C9922A' }}>receipt_long</span>
              </div>
              <p className="text-sm font-semibold text-primary mb-1">No invoices here yet</p>
              <p className="text-xs text-secondary">Submit your first invoice to get started.</p>
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 rounded-2xl transition-all"
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 1px 3px rgba(10,22,40,0.04)',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(10,22,40,0.10)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(10,22,40,0.04)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                {/* Coloured left accent */}
                <div
                  className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full"
                  style={{
                    background: inv.status === 'funded'
                      ? '#10B981'
                      : inv.status === 'repaid'
                        ? '#6366F1'
                        : inv.status === 'flagged'
                          ? '#EF4444'
                          : '#C9922A',
                  }}
                />

                <div className="flex items-start gap-3 pl-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="mono text-sm font-bold text-primary">{inv.id}</span>
                      <StatusPill status={inv.status} />
                    </div>
                    <div className="text-xs font-semibold text-on-surface-variant">{inv.buyerName}</div>
                    <div className="text-[11px] text-secondary mt-0.5">Due {inv.dueDate} · {inv.termDays}d term</div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 pl-3 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0" style={{ borderColor: 'var(--border)' }}>
                  <div className="text-right">
                    <div className="font-headline font-extrabold text-base text-primary font-tnum" style={{ letterSpacing: '-0.02em' }}>
                      ${inv.amount.toLocaleString()}
                    </div>
                    <div className="text-[11px] font-semibold" style={{ color: '#C9922A' }}>
                      Advance ${inv.advanceAmount.toLocaleString()} ({inv.advanceRatePct}%)
                    </div>
                  </div>
                  {inv.status === 'funded' && (
                    <button
                      onClick={() => repayInvoiceSeller(inv.id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.97]"
                      style={{ background: 'linear-gradient(135deg,#047857,#10B981)' }}
                    >
                      Mark Repaid
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
