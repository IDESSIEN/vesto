import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';

export const LenderPortfolio: React.FC = () => {
  const { lender, invoices, setLenderView, showToast } = useApp();
  const { address, isConnected } = useAccount();

  const [autoInvest, setAutoInvest] = useState(lender.autoInvestEnabled);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(5000);

  const fundedPositions = invoices.filter((i) => i.status === 'funded');

  const handleToggleAutoInvest = () => {
    setAutoInvest((prev) => !prev);
    showToast(`Auto-Invest rules ${!autoInvest ? 'Enabled' : 'Disabled'}`, 'info');
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      showToast('Connect your wallet to withdraw', 'warning');
      return;
    }
    showToast(`Withdrawal request for $${withdrawAmount.toLocaleString()} USDC submitted!`, 'success');
    setShowWithdrawModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col gap-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-primary tracking-tight">Lender Portfolio</h1>
          <span className="text-xs text-secondary">{lender.fullName} · {lender.investorTier}</span>
        </div>
        <button
          onClick={() => setLenderView('browse')}
          className="px-4 py-2 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">storefront</span>
          <span>Browse Marketplace</span>
        </button>
      </div>

      {/* Wallet status */}
      {!isConnected && (
        <div className="bg-warning-amber-soft border border-warning-amber-soft/80 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-primary">Connect your wallet to fund invoices</p>
            <p className="text-[11px] text-secondary">Arc Testnet USDC required</p>
          </div>
          <ConnectKitButton label="Connect Wallet" />
        </div>
      )}

      {isConnected && (
        <div className="bg-success-shamrock/10 border border-success-shamrock/30 p-3 rounded-xl flex items-center gap-2 text-xs text-success-shamrock font-semibold">
          <span className="w-2 h-2 rounded-full bg-success-shamrock animate-pulse shrink-0"></span>
          <span>Connected: {address?.slice(0, 6)}…{address?.slice(-4)} on Arc Testnet</span>
        </div>
      )}

      {/* Portfolio Performance Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-primary text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-xs text-primary-fixed-dim uppercase tracking-wider font-semibold">Total Invested</span>
          <div className="my-2">
            <span className="font-headline text-3xl font-extrabold text-white">${lender.totalInvested.toLocaleString()}</span>
            <span className="text-[11px] text-primary-fixed-dim block mt-0.5">Active Capital Positions</span>
          </div>
          <span className="text-[11px] text-success-shamrock font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>+14.5% Net APY</span>
          </span>
        </div>

        <div className="bg-surface-card border border-border-subtle p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-xs text-secondary uppercase tracking-wider font-semibold">Total Yield Realized</span>
          <div className="my-2">
            <span className="font-headline text-3xl font-extrabold text-success-shamrock">${lender.totalYieldEarned.toLocaleString()}</span>
            <span className="text-[11px] text-secondary block mt-0.5">Interest Paid to Date</span>
          </div>
          <span className="text-[11px] text-primary font-semibold">0% Loss Record</span>
        </div>

        <div className="bg-surface-card border border-border-subtle p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <span className="text-xs text-secondary uppercase tracking-wider font-semibold">Available Unallocated</span>
          <div className="my-2">
            <span className="font-headline text-3xl font-extrabold text-primary">${lender.availableBalance.toLocaleString()}</span>
            <span className="text-[11px] text-secondary block mt-0.5">USDC on Arc</span>
          </div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="text-xs font-bold text-primary hover:underline text-left"
          >
            Withdraw Unallocated Capital →
          </button>
        </div>
      </div>

      {/* Auto-Invest Strategy Ribbon */}
      <div className="bg-surface-card p-5 rounded-2xl border border-border-subtle shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tertiary-fixed text-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-xl">autorenew</span>
          </div>
          <div>
            <h4 className="font-headline text-sm font-bold text-primary">Automated Re-Investment Engine</h4>
            <p className="text-xs text-secondary">Automatically deploy returned principal & yield into 14%+ APY batches.</p>
          </div>
        </div>
        <button
          onClick={handleToggleAutoInvest}
          className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
            autoInvest ? 'bg-success-shamrock' : 'bg-surface-container-high'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${
              autoInvest ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Active Funded Positions */}
      <div className="bg-surface-card rounded-2xl p-5 border border-border-subtle shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-bold text-base text-primary">Active Pool Positions ({fundedPositions.length})</h3>
          <span className="text-xs text-secondary font-semibold">Real-Time Maturity Schedule</span>
        </div>

        <div className="flex flex-col gap-3">
          {fundedPositions.length === 0 ? (
            <div className="text-center py-8 text-secondary text-xs">
              No active funded positions yet. Browse marketplace to deploy capital.
            </div>
          ) : (
            fundedPositions.map((pos) => (
              <div
                key={pos.id}
                className="p-4 rounded-xl border border-border-subtle bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-10 rounded-full bg-success-shamrock"></div>
                  <div>
                    <span className="font-bold text-sm text-primary block">{pos.sellerBusinessName}</span>
                    <span className="text-xs text-secondary">{pos.buyerName} · Due {pos.dueDate} ({pos.termDays}d term)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6">
                  <div className="text-right">
                    <span className="font-headline font-bold text-sm text-primary block">${pos.advanceAmount.toLocaleString()}</span>
                    <span className="text-xs text-success-shamrock font-semibold">
                      Yield: +${Math.round(pos.advanceAmount * (pos.expectedYieldPct / 100) * (pos.termDays / 365))}
                    </span>
                  </div>
                  <span className="bg-success-shamrock/10 text-success-shamrock px-2.5 py-1 rounded-full text-xs font-bold">
                    {pos.expectedYieldPct}% APY
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-2xl max-w-md w-full p-6 shadow-xl border border-border-subtle">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-bold text-lg text-primary">Withdraw Unallocated Funds</h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-secondary hover:text-primary">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <form onSubmit={handleWithdrawSubmit} className="flex flex-col gap-4">
              <div className="bg-surface-container-low p-4 rounded-xl flex items-center justify-between text-xs">
                <span className="text-secondary">Available Wallet:</span>
                <span className="font-bold text-primary">${lender.availableBalance.toLocaleString()} USDC</span>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <label className="font-semibold text-on-surface-variant">Amount to Withdraw ($ USD)</label>
                <input
                  type="number"
                  min="100"
                  max={lender.availableBalance}
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full h-12 px-3 rounded-lg bg-surface-container-lowest font-headline font-bold text-lg text-primary border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary-container text-white font-label-lg font-bold rounded-xl shadow-md transition-all mt-2"
              >
                Withdraw to Connected Wallet
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
