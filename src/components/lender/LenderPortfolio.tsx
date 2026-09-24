import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';

const TrendUpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 9l3-3.5 2.5 2L10 2"/><path d="M8 2h2v2"/>
  </svg>
);
const CycleIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7.5A5.5 5.5 0 0 0 12 10.5"/><path d="M13 7.5A5.5 5.5 0 0 0 3 4.5"/>
    <path d="M13 4v3.5h-3.5"/><path d="M2 11V7.5h3.5"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M2 2l8 8M10 2l-8 8"/>
  </svg>
);
const WithdrawIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 2.5v7M4 7l2.5 2.5 2.5-2.5"/><path d="M1.5 11h10"/>
  </svg>
);
const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="16" height="12" rx="2"/><path d="M2 9h16"/>
    <circle cx="14.5" cy="13" r="1.2" fill="currentColor" stroke="none"/>
  </svg>
);

const FEE_PCT = 2.8;

// Settlement countdown — shows days to finalRepaymentDeadline, or detected/settled status
const SettlementCountdown: React.FC<{
  status: string;
  dueDate: string;
  finalRepaymentDeadline?: string;
}> = ({ status, dueDate, finalRepaymentDeadline }) => {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const deadlineDate = finalRepaymentDeadline ?? dueDate;

  useEffect(() => {
    const due = new Date(deadlineDate);
    const diff = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    setDaysLeft(diff);
  }, [deadlineDate]);

  if (status === 'payment_detected') {
    return (
      <span
        className="inline-flex items-center gap-1 text-[9px] font-semibold mt-0.5"
        style={{ color: '#B8821E' }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-[pulse-live_1.5s_ease-in-out_infinite]" style={{ background: '#B8821E', display: 'inline-block' }} />
        Payment detected · settling
      </span>
    );
  }
  if (status === 'repaid') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-semibold mt-0.5" style={{ color: '#1A6645' }}>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2.5L7 1.5" stroke="#1A6645" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Settled
      </span>
    );
  }
  if (status === 'defaulted') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-semibold mt-0.5" style={{ color: '#8C1A1A' }}>
        Defaulted · claim refund
      </span>
    );
  }
  if (daysLeft === null) return null;
  const color = daysLeft <= 7 ? '#8C1A1A' : daysLeft <= 14 ? '#92570D' : 'var(--ink-muted)';
  return (
    <span className="text-[9px] font-semibold mt-0.5" style={{ color }}>
      {daysLeft > 0 ? `Due in ${daysLeft}d` : 'Past due'}
    </span>
  );
};

export const LenderPortfolio: React.FC = () => {
  const { lender, invoices, setLenderView, showToast, withdrawFunds } = useApp();
  const { address, isConnected } = useAccount();
  const [autoInvest, setAutoInvest] = useState(lender.autoInvestEnabled);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(Math.min(5000, lender.availableBalance));

  const fundedPositions = invoices.filter(i => i.status === 'funded' && i.fundedByLenderId === lender.id);

  const handleToggleAutoInvest = () => {
    setAutoInvest(p => !p);
    showToast(`Auto-reinvest ${!autoInvest ? 'enabled' : 'paused'}`, 'info');
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) { showToast('Connect your wallet first.', 'warning'); return; }
    if (withdrawAmount > lender.availableBalance) {
      showToast(`Only $${lender.availableBalance.toLocaleString()} is unallocated.`, 'warning');
      return;
    }
    withdrawFunds(withdrawAmount);
    setShowWithdrawModal(false);
  };

  return (
    <div className="max-w-[880px] mx-auto px-4 sm:px-6 py-7 pb-28 flex flex-col gap-5 view-enter">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className="font-display font-bold text-ink mb-1"
            style={{ fontSize: '23px', letterSpacing: '-0.030em', lineHeight: 1.06 }}
          >
            {lender.fullName ? `${lender.fullName}'s portfolio` : 'Your portfolio'}
          </h1>
          <p className="text-[12px]" style={{ color: 'var(--ink-subtle)' }}>
            {lender.investorTier} · capital deployed on Arc Testnet
          </p>
        </div>
        <button
          onClick={() => setLenderView('browse')}
          className="btn-primary shrink-0 text-[12px] px-4 h-9"
        >
          Browse invoices
        </button>
      </div>

      {/* ── Wallet strip ──────────────────────────────────────────── */}
      {!isConnected ? (
        <div
          className="flex items-center justify-between gap-4 px-4 py-3.5 rounded-[11px]"
          style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)' }}
        >
          <div>
            <p className="text-[12.5px] font-semibold text-ink mb-0.5">Connect a wallet to fund invoices</p>
            <p className="text-[11px]" style={{ color: 'var(--ink-subtle)' }}>Arc Testnet USDC required</p>
          </div>
          <ConnectKitButton label="Connect" />
        </div>
      ) : (
        <div
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-[9px]"
          style={{ background: 'var(--success-bg)', border: '1px solid rgba(26,102,69,0.18)' }}
        >
          <span
            className="w-[7px] h-[7px] rounded-full shrink-0 animate-[pulse-live_2s_ease-in-out_infinite]"
            style={{ background: '#1A6645' }}
          />
          <span className="text-[11.5px] font-semibold" style={{ color: 'var(--success)' }}>
            {address?.slice(0, 6)}…{address?.slice(-4)} connected on Arc Testnet
          </span>
        </div>
      )}

      {/* ── KPI tiles ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Hero dark tile — total deployed */}
        <div
          className="relative rounded-[15px] px-5 pt-5 pb-4 overflow-hidden grain-overlay col-span-1"
          style={{
            background: 'linear-gradient(160deg,#0D1824 0%,#1A2A3E 100%)',
            border: '1px solid rgba(184,130,30,0.18)',
            boxShadow: 'var(--shadow-e3)',
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg,#B8821E,#E9BE68)' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative">
            <p className="text-[8.5px] font-bold uppercase tracking-[0.10em] mb-2" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Capital deployed
            </p>
            <p
              className="font-mono font-bold text-white font-tnum mb-1 leading-none"
              style={{ fontSize: '28px', letterSpacing: '-0.04em' }}
            >
              ${lender.totalInvested.toLocaleString()}
            </p>
            <p className="text-[10px] mb-3" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {fundedPositions.length} active position{fundedPositions.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: '#6EE7B7' }}>
              <TrendUpIcon />
              {(lender.totalInvested > 0
                ? ((lender.totalYieldEarned / lender.totalInvested) * 100).toFixed(1)
                : '—'
              )}% net return to date
            </div>
          </div>
        </div>

        {/* Yield tile — split gross / fee / net */}
        <div
          className="rounded-[15px] px-5 py-4 flex flex-col justify-between"
          style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e1)' }}
        >
          <p className="text-[8.5px] font-bold uppercase tracking-[0.09em] mb-3" style={{ color: 'var(--ink-faint)' }}>
            Yield realized
          </p>
          <div>
            <p
              className="font-mono font-bold font-tnum mb-0.5 leading-none"
              style={{ fontSize: '26px', letterSpacing: '-0.04em', color: 'var(--gold)' }}
            >
              ${lender.totalYieldEarned.toLocaleString()}
            </p>
            <p className="text-[10.5px] mb-2" style={{ color: 'var(--ink-subtle)' }}>Interest paid to date</p>
            {/* Yield split row */}
            <div
              className="flex items-center gap-2.5 px-3 py-2 rounded-[7px] text-[10px]"
              style={{ background: 'rgba(184,130,30,0.06)', border: '1px solid var(--gold-border)' }}
            >
              <span style={{ color: 'var(--ink-subtle)' }}>Gross</span>
              <span className="font-mono font-semibold font-tnum" style={{ color: 'var(--gold)' }}>
                {fundedPositions.length > 0
                  ? (fundedPositions.reduce((s, p) => s + p.expectedYieldPct, 0) / fundedPositions.length).toFixed(1)
                  : '—'}%
              </span>
              <span className="mx-0.5" style={{ color: 'var(--ink-faint)' }}>·</span>
              <span style={{ color: 'var(--ink-subtle)' }}>Fee</span>
              <span className="font-mono font-semibold font-tnum" style={{ color: 'var(--ink-muted)' }}>{FEE_PCT}%</span>
              <span className="mx-0.5" style={{ color: 'var(--ink-faint)' }}>·</span>
              <span style={{ color: 'var(--success)' }}>Net</span>
              <span className="font-mono font-semibold font-tnum" style={{ color: 'var(--success)' }}>
                {fundedPositions.length > 0
                  ? Math.max(0, (fundedPositions.reduce((s, p) => s + p.expectedYieldPct, 0) / fundedPositions.length) - FEE_PCT).toFixed(1)
                  : '—'}%
              </span>
            </div>
          </div>
        </div>

        {/* Unallocated tile */}
        <div
          className="rounded-[15px] px-5 py-4 flex flex-col justify-between"
          style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e1)' }}
        >
          <p className="text-[8.5px] font-bold uppercase tracking-[0.09em] mb-3" style={{ color: 'var(--ink-faint)' }}>
            Unallocated
          </p>
          <div>
            <p
              className="font-mono font-bold text-ink font-tnum mb-0.5 leading-none"
              style={{ fontSize: '26px', letterSpacing: '-0.04em' }}
            >
              ${lender.availableBalance.toLocaleString()}
            </p>
            <p className="text-[10.5px] mb-3" style={{ color: 'var(--ink-subtle)' }}>USDC · not yet deployed</p>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="flex items-center gap-1.5 text-[11px] font-semibold bg-transparent border-none cursor-pointer p-0 transition-opacity duration-150 hover:opacity-70"
              style={{ color: 'var(--gold)' }}
            >
              <WithdrawIcon /> Withdraw to wallet
            </button>
          </div>
        </div>
      </div>

      {/* ── Auto-reinvest toggle ──────────────────────────────────── */}
      <div
        className="flex items-center justify-between gap-4 px-4 py-4 rounded-[13px]"
        style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e1)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-[9px] shrink-0 flex items-center justify-center"
            style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', color: 'var(--gold)' }}
          >
            <CycleIcon />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-ink mb-0.5">Auto-reinvest returns</p>
            <p className="text-[11px]" style={{ color: 'var(--ink-subtle)' }}>
              Settled principal redeploys automatically into invoices yielding {FEE_PCT + 11}%+ net APY.
            </p>
          </div>
        </div>
        {/* Toggle */}
        <button
          onClick={handleToggleAutoInvest}
          aria-label="Toggle auto-reinvest"
          className="relative shrink-0 transition-all duration-200"
          style={{
            width: '40px', height: '22px', borderRadius: '999px',
            background: autoInvest ? '#1A6645' : 'rgba(13,24,36,0.14)',
            border: 'none', cursor: 'pointer',
          }}
        >
          <div
            className="absolute top-[3px] w-4 h-4 bg-white rounded-full transition-all duration-200"
            style={{ left: autoInvest ? '21px' : '3px', boxShadow: '0 1px 3px rgba(0,0,0,0.20)' }}
          />
        </button>
      </div>

      {/* ── Active positions ─────────────────────────────────────── */}
      <section
        className="rounded-[15px] overflow-hidden"
        style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e1)' }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <h3 className="font-display text-[14px] font-bold text-ink" style={{ letterSpacing: '-0.018em' }}>
              Active positions
            </h3>
            <span
              className="font-mono text-[10px] font-bold font-tnum px-2 py-0.5 rounded-[5px]"
              style={{ background: 'rgba(13,24,36,0.06)', color: 'var(--ink-muted)', border: '1px solid var(--border)' }}
            >
              {fundedPositions.length}
            </span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--ink-faint)' }}>
            Maturity schedule
          </span>
        </div>

        {fundedPositions.length === 0 ? (
          <div className="flex flex-col items-center py-14 px-6 text-center">
            <div
              className="w-11 h-11 rounded-[11px] flex items-center justify-center mb-3"
              style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)', color: 'var(--gold)' }}
            >
              <WalletIcon />
            </div>
            <p className="text-[13px] font-semibold text-ink mb-1.5">No capital deployed yet</p>
            <p className="text-[11px] leading-relaxed max-w-[220px]" style={{ color: 'var(--ink-faint)' }}>
              Browse verified seller invoices and deploy capital in seconds. Your first advance lands onchain within 24 hours.
            </p>
            <button
              onClick={() => setLenderView('browse')}
              className="mt-4 btn-primary text-[12px] px-5 py-2"
            >
              Browse live invoices
            </button>
          </div>
        ) : (
          <div>
            {fundedPositions.map((pos, i) => {
              const termYield = Math.round(pos.advanceAmount * (pos.expectedYieldPct / 100) * (pos.termDays / 365));
              const netYield  = Math.round(pos.advanceAmount * (Math.max(0, pos.expectedYieldPct - FEE_PCT) / 100) * (pos.termDays / 365));
              return (
                <div
                  key={pos.id}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-[rgba(13,24,36,0.02)]"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
                >
                  {/* Left accent bar */}
                  <div className="w-[3px] h-9 rounded-full shrink-0" style={{ background: '#1A6645' }} />

                  <div className="flex-1 min-w-0">
                    <p
                      className="font-display text-[13px] font-semibold text-ink mb-0.5 truncate"
                      style={{ letterSpacing: '-0.015em' }}
                    >
                      {pos.sellerBusinessName}
                    </p>
                    {/* One-liner thesis */}
                    <p className="text-[10.5px] truncate" style={{ color: 'var(--ink-subtle)' }}>
                      {pos.buyerName} · {pos.termDays}d · due {pos.dueDate}
                    </p>
                    {/* Settlement countdown using admin-set finalRepaymentDeadline */}
                    <SettlementCountdown
                      status={pos.status}
                      dueDate={pos.dueDate}
                      finalRepaymentDeadline={pos.finalRepaymentDeadline}
                    />
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className="font-mono text-[13px] font-bold text-ink font-tnum mb-0.5"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      ${pos.advanceAmount.toLocaleString()}
                    </p>
                    {/* Yield split inline */}
                    <p className="text-[10px] font-medium" style={{ color: 'var(--ink-subtle)' }}>
                      +${termYield.toLocaleString()} gross ·{' '}
                      <span style={{ color: 'var(--success)' }}>+${netYield.toLocaleString()} net</span>
                    </p>
                  </div>

                  {/* Net APY badge */}
                  <div
                    className="shrink-0 px-2.5 py-1.5 rounded-[7px] flex flex-col items-center"
                    style={{ background: 'rgba(184,130,30,0.07)', border: '1px solid var(--gold-border)', minWidth: '48px' }}
                  >
                    <span className="font-mono text-[12px] font-bold font-tnum leading-none" style={{ color: 'var(--gold)' }}>
                      {Math.max(0, pos.expectedYieldPct - FEE_PCT).toFixed(1)}%
                    </span>
                    <span className="text-[8px] font-semibold uppercase tracking-[0.07em] mt-0.5" style={{ color: 'rgba(184,130,30,0.50)' }}>net</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Withdraw modal ───────────────────────────────────────── */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(5,11,20,0.65)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="w-full max-w-[400px] rounded-[18px] overflow-hidden"
            style={{ background: 'var(--cream)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-e5)' }}
          >
            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,#B8821E 30%,#E9BE68 60%,#B8821E 85%,transparent)' }} />
            <div className="px-5 pt-5 pb-6 flex flex-col gap-4">

              <div className="flex items-center justify-between">
                <h3 className="font-display text-[16px] font-bold text-ink" style={{ letterSpacing: '-0.020em' }}>
                  Withdraw funds
                </h3>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(13,24,36,0.07)]"
                  style={{ border: '1px solid var(--border-2)', color: 'var(--ink-muted)' }}
                >
                  <CloseIcon />
                </button>
              </div>

              {/* Available balance row */}
              <div
                className="flex items-center justify-between px-3.5 py-2.5 rounded-[9px] text-[12px]"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
              >
                <span style={{ color: 'var(--ink-subtle)' }}>Unallocated balance</span>
                <span className="font-mono font-bold font-tnum" style={{ color: 'var(--ink)' }}>
                  ${lender.availableBalance.toLocaleString()} USDC
                </span>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="flex flex-col gap-3">
                <div>
                  <label className="field-label">Amount (USDC)</label>
                  <input
                    type="number" min="100" max={lender.availableBalance} required
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(Number(e.target.value))}
                    className="input font-mono font-bold text-[16px]"
                  />
                </div>
                <button type="submit" className="btn-primary w-full h-[46px] rounded-[9px] text-[13px] justify-center">
                  <WithdrawIcon /> Withdraw to wallet
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
