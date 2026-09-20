import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';

export const LenderPortfolio: React.FC = () => {
  const { lender, invoices, setLenderView, showToast, withdrawFunds } = useApp();
  const { address, isConnected } = useAccount();
  const [autoInvest, setAutoInvest] = useState(lender.autoInvestEnabled);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(5000);

  const fundedPositions = invoices.filter(i => i.status === 'funded');

  const handleToggleAutoInvest = () => {
    setAutoInvest(p => !p);
    showToast(`Auto-Invest ${!autoInvest ? 'enabled' : 'disabled'}`, 'info');
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) { showToast('Connect your wallet to withdraw', 'warning'); return; }
    if (withdrawAmount > lender.availableBalance) {
      showToast(`Insufficient balance. Available: $${lender.availableBalance.toLocaleString()}`, 'warning');
      return;
    }
    withdrawFunds(withdrawAmount);
    setShowWithdrawModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-3 sm:px-4 flex flex-col gap-5 pb-28">

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-primary" style={{ letterSpacing: '-0.02em' }}>
            Lender Portfolio
          </h1>
          <span className="text-xs text-secondary">{lender.fullName} · {lender.investorTier}</span>
        </div>
        <button
          onClick={() => setLenderView('browse')}
          className="h-9 px-4 rounded-full text-xs font-bold text-white shadow-xs flex items-center gap-1.5 transition-all active:scale-[0.97]"
          style={{ background: 'var(--accent)' }}
        >
          <span className="material-symbols-outlined text-[15px]">storefront</span>
          Marketplace
        </button>
      </header>

      {/* ── Wallet notice ────────────────────────────────────── */}
      {!isConnected ? (
        <div
          className="flex items-center justify-between p-4 rounded-2xl border"
          style={{ background: 'var(--gold-bg)', borderColor: 'rgba(201,146,42,0.25)' }}
        >
          <div>
            <p className="text-xs font-bold text-primary">Connect your wallet to fund invoices</p>
            <p className="text-[11px] text-secondary">Arc Testnet USDC required</p>
          </div>
          <ConnectKitButton label="Connect Wallet" />
        </div>
      ) : (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold"
          style={{ background: 'rgba(4,120,87,0.08)', border: '1px solid rgba(4,120,87,0.20)', color: 'var(--success)' }}
        >
          <span className="w-2 h-2 rounded-full bg-success-shamrock animate-pulse shrink-0" />
          Connected: {address?.slice(0, 6)}…{address?.slice(-4)} · Arc Testnet
        </div>
      )}

      {/* ── KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Invested - hero dark card */}
        <div className="vesto-hero rounded-2xl p-5 text-white shadow-hero relative overflow-hidden">
          <div className="h-[3px] absolute top-0 left-0 right-0" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
          <div className="relative">
            <span className="text-[10px] uppercase tracking-[0.1em] font-semibold block mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Total Invested</span>
            <span className="font-headline text-3xl font-extrabold text-white font-tnum block mb-1" style={{ letterSpacing: '-0.02em' }}>
              ${lender.totalInvested.toLocaleString()}
            </span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Active Capital Positions</span>
            <div className="flex items-center gap-1 mt-2 text-[11px] font-bold" style={{ color: '#6EE7B7' }}>
              <span className="material-symbols-outlined text-sm">trending_up</span>
              +14.5% Net APY
            </div>
          </div>
        </div>

        {/* Yield Earned */}
        <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-card flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-secondary block mb-2">Total Yield Realized</span>
          <span className="font-headline text-3xl font-extrabold font-tnum" style={{ color: 'var(--gold)', letterSpacing: '-0.02em' }}>
            ${lender.totalYieldEarned.toLocaleString()}
          </span>
          <div>
            <span className="text-[10px] text-secondary block mt-1">Interest Paid to Date</span>
            <span className="text-[11px] text-success-shamrock font-semibold">0% Loss Record</span>
          </div>
        </div>

        {/* Unallocated */}
        <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-card flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-secondary block mb-2">Available Unallocated</span>
          <span className="font-headline text-3xl font-extrabold text-primary font-tnum block" style={{ letterSpacing: '-0.02em' }}>
            ${lender.availableBalance.toLocaleString()}
          </span>
          <div>
            <span className="text-[10px] text-secondary block mt-1">USDC on Arc</span>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="text-[11px] font-bold mt-1 transition-colors hover:opacity-80"
              style={{ color: 'var(--gold)' }}
            >
              Withdraw Capital →
            </button>
          </div>
        </div>
      </div>

      {/* ── Auto-Invest Ribbon ───────────────────────────────── */}
      <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-card flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--gold-bg)', border: '1px solid rgba(201,146,42,0.25)' }}
          >
            <span className="material-symbols-outlined text-xl" style={{ color: 'var(--gold)' }}>autorenew</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-primary">Automated Re-Investment Engine</h4>
            <p className="text-[11px] text-secondary">Auto-deploy returned principal & yield into 14%+ APY batches.</p>
          </div>
        </div>
        <button
          onClick={handleToggleAutoInvest}
          className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors duration-200 shrink-0 ${autoInvest ? 'bg-success-shamrock' : 'bg-surface-container-high'}`}
          aria-label="Toggle auto-invest"
        >
          <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${autoInvest ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* ── Active Positions ─────────────────────────────────── */}
      <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="font-headline font-bold text-base text-primary" style={{ letterSpacing: '-0.02em' }}>
            Active Pool Positions
            <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container text-secondary">
              {fundedPositions.length}
            </span>
          </h3>
          <span className="text-[11px] text-secondary font-semibold">Maturity Schedule</span>
        </div>

        <div className="flex flex-col divide-y divide-border-subtle">
          {fundedPositions.length === 0 ? (
            <div className="text-center py-10 text-secondary text-xs px-5">
              No active positions yet. Browse the marketplace to deploy capital.
            </div>
          ) : (
            fundedPositions.map(pos => (
              <div key={pos.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container-low/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-10 rounded-full bg-success-shamrock shrink-0" />
                  <div>
                    <span className="font-bold text-sm text-primary block">{pos.sellerBusinessName}</span>
                    <span className="text-[11px] text-secondary">{pos.buyerName} · Due {pos.dueDate} · {pos.termDays}d</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="font-headline font-bold text-sm text-primary font-tnum block">${pos.advanceAmount.toLocaleString()}</span>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--gold)' }}>
                      +${Math.round(pos.advanceAmount * (pos.expectedYieldPct / 100) * (pos.termDays / 365))} yield
                    </span>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold font-tnum"
                    style={{ background: 'rgba(201,146,42,0.12)', color: 'var(--gold)' }}
                  >
                    {pos.expectedYieldPct}% APY
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Withdraw Modal ───────────────────────────────────── */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,22,40,0.55)', backdropFilter: 'blur(6px)' }}>
          <div className="bg-surface-card rounded-2xl max-w-md w-full shadow-hero border border-border-subtle overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-headline font-bold text-lg text-primary" style={{ letterSpacing: '-0.02em' }}>Withdraw Funds</h3>
                <button onClick={() => setShowWithdrawModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-primary"
                  style={{ background: 'var(--surface-muted)' }}>
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
              <form onSubmit={handleWithdrawSubmit} className="flex flex-col gap-4">
                <div className="flex justify-between text-xs p-3 rounded-xl" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                  <span className="text-secondary">Available Balance:</span>
                  <span className="font-bold text-primary font-tnum">${lender.availableBalance.toLocaleString()} USDC</span>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-secondary">Amount to Withdraw (USDC)</label>
                  <input
                    type="number"
                    min="100"
                    max={lender.availableBalance}
                    required
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(Number(e.target.value))}
                    className="w-full h-12 px-4 rounded-xl bg-surface-container-lowest font-headline font-bold text-lg text-primary border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/30 font-tnum"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-12 rounded-xl text-sm font-bold text-white shadow-xs transition-all active:scale-[0.98]"
                  style={{ background: 'var(--accent)' }}
                >
                  Withdraw to Connected Wallet
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
