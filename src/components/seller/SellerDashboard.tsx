import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { useApp } from '../../context/AppContext';
import { useUSDCBalance, useClaimPayout, usePendingClaim } from '../../hooks/useVestoEscrow';
import { formatUSDC } from '../../config/contracts';

/* ─────────────────────────────────────────────────────────────────
   STATUS PILL
   Deliberately narrow — only status colours, no generic grey
───────────────────────────────────────────────────────────────── */
const STATUS: Record<string, { label: string; cls: string; dot?: string }> = {
  funded:                 { label: 'Funded',    cls: 'bg-[#EBF5F0] text-[#1A6645] border border-[rgba(26,102,69,0.15)]', dot: '#1A6645' },
  repaid:                 { label: 'Settled',   cls: 'bg-[#EEF0FB] text-[#4338CA] border border-[rgba(67,56,202,0.15)]' },
  published_marketplace:  { label: 'Live',      cls: 'bg-[#FBF0D8] text-[#B8821E] border border-[rgba(184,130,30,0.18)]', dot: '#B8821E' },
  pending_admin_approval: { label: 'In review', cls: 'bg-[rgba(13,24,36,0.05)] text-[#5E6E82] border border-[rgba(13,24,36,0.09)]' },
  flagged:                { label: 'Flagged',   cls: 'bg-[#FBE8E8] text-[#8C1A1A] border border-[rgba(140,26,26,0.15)]' },
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const s = STATUS[status] ?? { label: status.replace(/_/g, ' '), cls: 'bg-[rgba(13,24,36,0.05)] text-[#5E6E82]' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[10px] font-semibold tracking-wide whitespace-nowrap ${s.cls}`}>
      {s.dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 animate-[pulse-live_2s_ease-in-out_infinite]"
          style={{ background: s.dot }}
        />
      )}
      {s.label}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────────────
   PROGRESS STEP
───────────────────────────────────────────────────────────────── */
const ProgressStep: React.FC<{
  n: number;
  done: boolean;
  active: boolean;
  title: string;
  sub: string;
  cta?: string;
  onCta?: () => void;
}> = ({ n, done, active, title, sub, cta, onCta }) => (
  <div className="flex items-center gap-4 py-4 px-5 transition-colors duration-150"
    style={{ borderBottom: '1px solid var(--border)' }}>
    {/* Step dot */}
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
      style={
        done
          ? { background: '#EBF5F0', border: '1.5px solid rgba(26,102,69,0.25)' }
          : active
          ? { background: 'var(--gold-bg)', border: '1.5px solid var(--gold-border)' }
          : { background: 'rgba(13,24,36,0.04)', border: '1.5px solid var(--border)' }
      }
    >
      {done ? (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M1.5 5.5L4 8L9.5 2.5" stroke="#1A6645" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <span
          className="text-[10px] font-bold"
          style={{ color: active ? 'var(--gold)' : 'var(--ink-faint)' }}
        >{n}</span>
      )}
    </div>

    {/* Text */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold leading-snug"
        style={{ color: done ? 'var(--ink-subtle)' : 'var(--ink)' }}>
        {title}
      </p>
      <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--ink-faint)' }}>{sub}</p>
    </div>

    {/* CTA */}
    {!done && cta && onCta && (
      <button
        onClick={onCta}
        className="shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-[7px] transition-all duration-150 active:scale-[0.97]"
        style={active
          ? { background: 'linear-gradient(135deg,#B8821E,#D4A032)', color: '#fff', boxShadow: 'var(--shadow-gold)' }
          : { background: 'rgba(13,24,36,0.05)', color: 'var(--ink-muted)', cursor: 'not-allowed', opacity: 0.5 }
        }
        disabled={!active}
      >
        {cta}
      </button>
    )}
    {done && (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
        <path d="M1.5 7L5 10.5L12.5 3.5" stroke="#1A6645" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────────────────
   INVOICE ROW
───────────────────────────────────────────────────────────────── */
const ACCENT: Record<string, string> = {
  funded: '#1A6645',
  repaid: '#4338CA',
  published_marketplace: '#B8821E',
  pending_admin_approval: 'rgba(13,24,36,0.18)',
  flagged: '#8C1A1A',
};

const InvoiceRow: React.FC<{
  inv: ReturnType<typeof useApp>['invoices'][0];
  onRepay: () => void;
}> = ({ inv, onRepay }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative rounded-[11px] overflow-hidden transition-all duration-200"
      style={{
        background: 'var(--cream)',
        border: `1px solid ${hovered ? 'rgba(13,24,36,0.14)' : 'var(--border)'}`,
        boxShadow: hovered ? 'var(--shadow-e3)' : 'var(--shadow-e1)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left accent strip */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: ACCENT[inv.status] ?? 'rgba(13,24,36,0.12)' }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pl-5 pr-4 py-4">
        {/* Left: ID + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-[13px] font-semibold text-ink tracking-tight">{inv.id}</span>
            <StatusPill status={inv.status} />
          </div>
          <p className="text-[13px] font-medium text-ink leading-snug truncate">{inv.buyerName}</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>
            Due {inv.dueDate}
            <span className="mx-1.5 opacity-30">·</span>
            {inv.termDays}d term
            <span className="mx-1.5 opacity-30">·</span>
            {inv.riskTier} risk
          </p>
        </div>

        {/* Right: amounts + action */}
        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-5 pt-2 sm:pt-0"
          style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}
          onMouseEnter={() => {}} /* prevent bubbling issues */
        >
          <div className="sm:text-right">
            <div className="font-mono text-[17px] font-bold text-ink leading-tight font-tnum">
              ${inv.amount.toLocaleString()}
            </div>
            <div className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--gold)' }}>
              ${inv.advanceAmount.toLocaleString()} advance ({inv.advanceRatePct}%)
            </div>
          </div>

          {inv.status === 'funded' && (
            <button
              onClick={onRepay}
              className="shrink-0 px-3 py-2 text-[11px] font-semibold rounded-[9px] transition-all duration-150 active:scale-[0.97]"
              style={{
                background: '#EBF5F0',
                color: '#1A6645',
                border: '1.5px solid rgba(26,102,69,0.20)',
              }}
            >
              Mark settled
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export const SellerDashboard: React.FC = () => {
  const {
    seller, invoices, setSellerView,
    repayInvoiceSeller, showToast, sellerTourCompleted,
  } = useApp();

  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'settled'>('all');

  const { raw: usdcBalance } = useUSDCBalance();
  const { raw: pendingClaim, refetch: refetchClaim } = usePendingClaim(address);
  const { claim, isPending: claiming, isConfirming: claimConfirming, isSuccess: claimSuccess } = useClaimPayout();

  /* ── Derived ── */
  const myInvoices = invoices.filter(i => i.sellerId === seller.id);
  const filteredInvoices = myInvoices.filter(inv => {
    if (activeTab === 'active')  return ['pending_admin_approval','published_marketplace','funded'].includes(inv.status);
    if (activeTab === 'settled') return inv.status === 'repaid';
    return true;
  });

  const hasClaim = pendingClaim !== undefined && pendingClaim > 0n;
  const activeCapital = myInvoices.filter(i => i.status === 'funded').reduce((s, i) => s + i.advanceAmount, 0);
  const onMarket = myInvoices.filter(i => i.status === 'published_marketplace').length;
  const totalSettled = myInvoices.filter(i => i.status === 'repaid').length;
  const availableCredit = seller.creditLimit - seller.usedLimit;
  const creditUsedPct = seller.creditLimit > 0 ? Math.min(100, (seller.usedLimit / seller.creditLimit) * 100) : 0;

  const stepsComplete = [
    seller.verificationTier >= 1,
    seller.verificationTier >= 2,
    sellerTourCompleted,
  ].filter(Boolean).length;

  /* ── Handlers ── */
  const handleClaim = async () => {
    try {
      await claim();
      refetchClaim();
      showToast('Payout claimed.', 'success');
    } catch {
      showToast('Claim failed — check your wallet.', 'warning');
    }
  };

  const handleRepay = (invId: string, advance: number) => {
    toast(`Settle invoice ${invId}?`, {
      duration: 6000,
      description: `$${advance.toLocaleString()} USDC — requires explicit confirmation.`,
      action: { label: 'Confirm', onClick: () => repayInvoiceSeller(invId) },
      cancel:  { label: 'Cancel', onClick: () => {} },
    });
  };

  const hasNoInvoices = myInvoices.length === 0;

  return (
    <div className="max-w-[780px] mx-auto px-4 sm:px-6 py-7 sm:py-10 flex flex-col gap-7 pb-28 animate-fade-up">

      {/* ── Identity header ─────────────────────────────────────── */}
      <header className="flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-[46px] h-[46px] rounded-[11px] flex items-center justify-center font-display font-bold text-lg"
              style={{
                background: 'linear-gradient(160deg,#0D1824 0%,#1A2A3E 100%)',
                border: '1.5px solid rgba(184,130,30,0.30)',
                color: '#E9BE68',
                letterSpacing: '-0.02em',
              }}
            >
              {seller.fullName ? seller.fullName.charAt(0).toUpperCase() : '?'}
            </div>
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: '#1A6645', border: '2px solid var(--canvas)' }}
            >
              <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                <path d="M1 3.5L2.8 5.5L6 1.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-lg font-bold text-ink" style={{ letterSpacing: '-0.025em' }}>
                {seller.fullName || 'Your Account'}
              </h2>
              {seller.verificationTier > 0 && (
                <span className="badge badge-gold text-[9px]">
                  T{seller.verificationTier}
                </span>
              )}
            </div>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-subtle)' }}>
              {seller.businessName || 'Complete your profile'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setSellerView('tutorial')}
          className="shrink-0 h-9 px-3.5 rounded-[9px] text-[12px] font-medium flex items-center gap-1.5 transition-all duration-150 hover:bg-[rgba(13,24,36,0.06)] active:scale-[0.97]"
          style={{
            background: 'var(--cream)',
            border: '1px solid var(--border-2)',
            color: 'var(--ink-muted)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M6.5 6v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <circle cx="6.5" cy="4" r="0.6" fill="currentColor"/>
          </svg>
          <span className="hidden sm:inline">Tour</span>
        </button>
      </header>

      {/* ── Balance hero ────────────────────────────────────────── */}
      <section
        className="relative rounded-[20px] overflow-hidden grain-overlay vesto-hero gold-strip"
        style={{ minHeight: '210px' }}
      >
        {/* Radial glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-80px', right: '-80px',
            width: '360px', height: '360px',
            background: 'radial-gradient(circle, rgba(184,130,30,0.09) 0%, transparent 65%)',
          }}
        />
        {/* Dot matrix */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        <div className="relative px-6 pt-7 pb-6">
          {/* Meta row */}
          <div className="flex items-center justify-between mb-5">
            <p
              className="text-[9px] uppercase tracking-[0.14em] font-semibold"
              style={{ color: 'rgba(255,255,255,0.38)' }}
            >
              {isConnected ? 'Arc Testnet · USDC balance' : 'Wallet not connected'}
            </p>
            <span
              className="text-[9px] font-semibold px-2.5 py-1 rounded-[5px]"
              style={{
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.40)',
                border: '1px solid rgba(255,255,255,0.09)',
                letterSpacing: '0.04em',
              }}
            >
              LIMIT ${seller.creditLimit > 0 ? seller.creditLimit.toLocaleString() : '--'}
            </span>
          </div>

          {/* Balance number */}
          {isConnected ? (
            <div className="flex items-end gap-2 mb-6">
              <span
                className="font-mono font-bold text-white leading-[0.95] font-tnum"
                style={{ fontSize: 'clamp(44px,9vw,66px)', letterSpacing: '-0.045em' }}
              >
                {usdcBalance !== undefined
                  ? formatUSDC(usdcBalance)
                  : (
                    <span
                      className="inline-block rounded-[7px] skeleton-dark"
                      style={{ width: '160px', height: '52px' }}
                    />
                  )
                }
              </span>
              <span className="text-[13px] font-medium mb-2.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                USDC
              </span>
            </div>
          ) : (
            <div className="mb-6 mt-1">
              <ConnectKitButton label="Connect wallet" />
            </div>
          )}

          {/* Perforation */}
          <div className="relative my-5">
            <div
              className="absolute rounded-full"
              style={{
                left: '-26px', top: '-10px',
                width: '20px', height: '20px',
                background: 'var(--canvas)',
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                right: '-26px', top: '-10px',
                width: '20px', height: '20px',
                background: 'var(--canvas)',
              }}
            />
            <div className="perforation" />
          </div>

          {/* Stats strip */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Credit bar */}
            <div className="flex-1">
              <div
                className="flex justify-between text-[9px] font-semibold uppercase tracking-[0.09em] mb-2"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                <span>Credit used</span>
                <span className="font-mono font-tnum">{creditUsedPct.toFixed(0)}%</span>
              </div>
              <div
                className="h-[3px] rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${creditUsedPct}%`,
                    background: 'linear-gradient(90deg,#B8821E,#E9BE68)',
                    transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
                  }}
                />
              </div>
            </div>

            {/* Mini stats */}
            <div className="flex items-center gap-5">
              <div>
                <p className="stat-label-dark mb-1">Financed</p>
                <p className="stat-num text-[13px] font-semibold text-white">
                  ${seller.totalFinanced.toLocaleString()}
                </p>
              </div>
              <div
                className="w-px h-8 self-center"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              />
              <div>
                <p className="stat-label-dark mb-1">Available</p>
                <p className="stat-num text-[13px] font-semibold text-white">
                  ${availableCredit.toLocaleString()}
                </p>
              </div>
              <div
                className="w-px h-8 self-center hidden sm:block"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              />
              <div className="hidden sm:block">
                <p className="stat-label-dark mb-1">Finality</p>
                <p className="text-[13px] font-semibold text-white">&lt;1s</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Payout claim ────────────────────────────────────────── */}
      {isConnected && hasClaim && (
        <div
          className="flex items-center justify-between gap-4 px-5 py-4 rounded-[15px] animate-fade-in"
          style={{
            background: 'linear-gradient(135deg,rgba(26,102,69,0.07),rgba(26,102,69,0.03))',
            border: '1.5px solid rgba(26,102,69,0.22)',
          }}
        >
          <div>
            <p
              className="text-[9px] uppercase tracking-[0.12em] font-semibold mb-1"
              style={{ color: '#1A6645' }}
            >
              Payout ready
            </p>
            <p className="font-mono text-2xl font-bold text-ink font-tnum" style={{ letterSpacing: '-0.03em' }}>
              {pendingClaim !== undefined ? formatUSDC(pendingClaim) : '--'}
              <span className="text-[13px] font-normal ml-1.5" style={{ color: 'var(--ink-subtle)' }}>USDC</span>
            </p>
          </div>
          <button
            onClick={handleClaim}
            disabled={claiming || claimConfirming}
            className="btn-primary text-[13px] px-5 py-2.5"
            style={{ background: 'linear-gradient(135deg,#1A6645,#2D9966)', color: '#fff' }}
          >
            {claiming ? 'Signing...' : claimConfirming ? 'Confirming...' : 'Claim USDC'}
          </button>
        </div>
      )}
      {claimSuccess && (
        <p
          className="text-center text-[12px] font-semibold py-2.5 rounded-[9px]"
          style={{ color: '#1A6645', background: '#EBF5F0', border: '1px solid rgba(26,102,69,0.15)' }}
        >
          Payout claimed successfully.
        </p>
      )}

      {/* ── Stat tiles or first-invoice prompt ─────────────────── */}
      {hasNoInvoices && seller.verificationTier > 0 ? (
        <div
          className="flex flex-col sm:flex-row items-center gap-4 px-5 py-5 rounded-[15px] animate-fade-up-1"
          style={{ background: 'var(--cream)', border: '1.5px solid rgba(184,130,30,0.20)' }}
        >
          <div
            className="w-11 h-11 rounded-[11px] flex items-center justify-center shrink-0"
            style={{ background: 'var(--gold-bg)' }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="4" width="14" height="12" rx="2" stroke="#B8821E" strokeWidth="1.5"/>
              <path d="M7 8h6M7 11h4" stroke="#B8821E" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[14px] font-semibold text-ink">Submit your first invoice</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-subtle)' }}>
              Your account is active. Upload an invoice to receive your advance.
            </p>
          </div>
          <button
            onClick={() => setSellerView('submit_invoice')}
            className="btn-primary text-[13px] shrink-0"
          >
            + New invoice
          </button>
        </div>
      ) : !hasNoInvoices ? (
        <div className="grid grid-cols-3 gap-3 animate-fade-up-1">
          {[
            { label: 'In escrow', value: `$${activeCapital.toLocaleString()}`, sub: 'Active capital', color: '#1A6645' },
            { label: 'On market', value: String(onMarket), sub: 'Open invoices', color: '#B8821E' },
            { label: 'Settled', value: String(totalSettled), sub: 'Invoices repaid', color: '#4338CA' },
          ].map(({ label, value, sub, color }) => (
            <div
              key={label}
              className="relative flex flex-col gap-1 px-4 py-4 rounded-[11px] overflow-hidden"
              style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(90deg,${color}88,${color}44)` }}
              />
              <span className="stat-label">{label}</span>
              <span
                className="font-mono text-[22px] font-bold font-tnum leading-tight"
                style={{ color, letterSpacing: '-0.03em' }}
              >{value}</span>
              <span className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>{sub}</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Progress checklist ──────────────────────────────────── */}
      <section
        className="rounded-[15px] overflow-hidden animate-fade-up-2"
        style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-[0.10em]"
            style={{ color: 'var(--ink-muted)' }}
          >
            Your progress
          </span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-[5px]"
            style={{ background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}
          >
            {stepsComplete}/3
          </span>
        </div>

        <ProgressStep
          n={1}
          done={seller.verificationTier >= 1}
          active={seller.verificationTier < 1}
          title="Verify your identity"
          sub="Tier 1 · unlocks $500 advance limit"
          cta="Start"
          onCta={() => setSellerView('tier1')}
        />
        <ProgressStep
          n={2}
          done={seller.verificationTier >= 2}
          active={seller.verificationTier === 1}
          title="Upgrade to Tier 2"
          sub="Tax PIN + bank statement · unlocks $5,000"
          cta="Upgrade"
          onCta={() => setSellerView('tier2')}
        />
        <div style={{ borderBottom: 'none' }}>
          <ProgressStep
            n={3}
            done={sellerTourCompleted}
            active={true}
            title="Explore the platform"
            sub="A 3-minute walkthrough of how Vesto works"
            cta="Take tour"
            onCta={() => setSellerView('tutorial')}
          />
        </div>
      </section>

      {/* ── CTA row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 animate-fade-up-3">
        <button
          onClick={() => setSellerView(seller.verificationTier > 0 ? 'submit_invoice' : 'tier1')}
          className="btn-primary h-[52px] rounded-[11px] text-[13px] justify-center"
          style={seller.verificationTier > 0
            ? {}
            : { background: 'linear-gradient(160deg,#0D1824,#1A2A3E)', color: 'rgba(255,255,255,0.85)' }
          }
        >
          {seller.verificationTier > 0 ? (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mr-1.5">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              New invoice
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="mr-1.5">
                <rect x="2" y="6" width="9" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M4 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              Verify first
            </>
          )}
        </button>

        <button
          onClick={() => setSellerView(seller.verificationTier < 2 ? 'tier2' : 'status')}
          className="btn-secondary h-[52px] rounded-[11px] text-[13px] justify-center"
        >
          {seller.verificationTier < 2 ? (
            <>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="mr-1.5">
                <polygon points="6.5,1.5 8,5.5 12.5,5.5 9,8.5 10.5,12.5 6.5,9.5 2.5,12.5 4,8.5 0.5,5.5 5,5.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
              </svg>
              Upgrade tier
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="mr-1.5">
                <path d="M1.5 6.5L4.5 9.5L11.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              View status
            </>
          )}
        </button>
      </div>

      {/* ── Invoice ledger ──────────────────────────────────────── */}
      <section className="animate-fade-up-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3
              className="font-display text-[16px] font-bold text-ink"
              style={{ letterSpacing: '-0.022em' }}
            >
              Invoice ledger
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>
              Live status of your submitted invoices
            </p>
          </div>

          {/* Tab filter */}
          <div
            className="flex items-center gap-0.5 p-1 rounded-[9px] self-start sm:self-auto"
            style={{ background: 'var(--cream)', border: '1px solid var(--border-2)' }}
          >
            {(['all', 'active', 'settled'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-3 py-1 rounded-[7px] text-[11px] font-semibold capitalize transition-all duration-150"
                style={activeTab === tab
                  ? { background: 'var(--ink)', color: '#fff' }
                  : { color: 'var(--ink-subtle)' }
                }
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice list */}
        <div className="flex flex-col gap-2.5">
          {filteredInvoices.length === 0 ? (
            /* Designed empty state */
            <div
              className="flex flex-col items-center py-14 rounded-[15px]"
              style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-12 h-12 rounded-[11px] flex items-center justify-center mb-3"
                style={{ background: 'var(--gold-bg)' }}
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="4" y="3" width="14" height="16" rx="2.5" stroke="#B8821E" strokeWidth="1.4"/>
                  <path d="M8 8h6M8 11.5h6M8 15h3.5" stroke="#B8821E" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-[13px] font-semibold text-ink mb-1">
                {activeTab === 'all'
                  ? 'No invoices submitted yet'
                  : activeTab === 'active'
                  ? 'No active invoices'
                  : 'No settled invoices yet'}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--ink-faint)' }}>
                {activeTab === 'all'
                  ? seller.verificationTier > 0
                    ? 'Submit your first invoice to get a cash advance.'
                    : 'Verify your identity first to unlock invoice submission.'
                  : 'They will appear here when ready.'}
              </p>
              {activeTab === 'all' && seller.verificationTier > 0 && (
                <button
                  onClick={() => setSellerView('submit_invoice')}
                  className="mt-4 btn-primary text-[12px] px-4 py-2"
                >
                  Submit invoice
                </button>
              )}
            </div>
          ) : (
            filteredInvoices.map(inv => (
              <InvoiceRow
                key={inv.id}
                inv={inv}
                onRepay={() => handleRepay(inv.id, inv.advanceAmount)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};
