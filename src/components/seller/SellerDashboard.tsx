import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { useApp } from '../../context/AppContext';
import { useUSDCBalance, useClaimPayout, usePendingClaim, USDC_DECIMALS } from '../../hooks/useVestoEscrow';
import { formatUSDC, explorerTxUrl } from '../../config/contracts';

export const SellerDashboard: React.FC = () => {
  const { seller, invoices, setSellerView, repayInvoiceSeller, showToast } = useApp();
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'funded' | 'repaid'>('all');

  const { raw: usdcBalance } = useUSDCBalance();
  const { raw: pendingClaim, refetch: refetchClaim } = usePendingClaim(address);
  const { claim, isPending: claiming, isConfirming: claimConfirming, isSuccess: claimSuccess } = useClaimPayout();

  const sellerInvoices = invoices;
  const filteredInvoices = sellerInvoices.filter((inv) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return inv.status === 'pending_admin_approval' || inv.status === 'published_marketplace';
    if (activeTab === 'funded') return inv.status === 'funded';
    if (activeTab === 'repaid') return inv.status === 'repaid';
    return true;
  });

  const hasClaim = pendingClaim !== undefined && pendingClaim > 0n;

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
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col gap-6 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center shadow-sm text-white font-bold text-lg">
            {seller.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-headline text-lg font-bold text-primary tracking-tight">
                {seller.fullName}
              </span>
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-success-shamrock text-white">
                <span className="material-symbols-outlined text-[11px]">verified</span>
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-secondary">
              <span className="truncate max-w-[160px]">{seller.businessName}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed-dim"></span>
              <span className="font-semibold text-on-tertiary-container">Tier {seller.verificationTier}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setSellerView('tutorial')}
          className="px-3 py-1.5 rounded-lg bg-surface-card border border-border-subtle text-xs font-semibold text-primary hover:bg-surface-container flex items-center gap-1 shadow-sm"
        >
          <span className="material-symbols-outlined text-base">help</span>
          <span>Tour</span>
        </button>
      </header>

      {/* Hero Card */}
      <section className="relative w-full rounded-2xl bg-gradient-to-br from-primary-container via-[#1a3b5c] to-primary p-6 text-white shadow-md overflow-hidden">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-xs uppercase tracking-wider text-primary-fixed-dim font-medium">
              {isConnected ? 'USDC Balance — Arc Testnet' : 'Connect wallet to see balance'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed/20 text-secondary-fixed text-xs font-semibold">
              Credit Limit: ${seller.creditLimit.toLocaleString()}
            </span>
          </div>

          <div className="flex items-baseline space-x-2 my-2">
            {isConnected ? (
              <>
                <span className="font-headline text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-tnum">
                  {usdcBalance !== undefined ? formatUSDC(usdcBalance) : '—'}
                </span>
                <span className="font-body-sm text-xs text-primary-fixed-dim">USDC wallet</span>
              </>
            ) : (
              <ConnectKitButton label="Connect Wallet" />
            )}
          </div>

          {/* Pending Claim */}
          {isConnected && hasClaim && (
            <div className="bg-success-shamrock/20 border border-success-shamrock/40 rounded-xl px-4 py-3 mb-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-success-shamrock font-bold block">Pending Payout Available</span>
                <span className="text-white font-headline font-extrabold text-xl font-tnum">
                  {pendingClaim !== undefined ? formatUSDC(pendingClaim) : '—'}
                </span>
              </div>
              <button
                onClick={handleClaim}
                disabled={claiming || claimConfirming}
                className="px-4 py-2 bg-success-shamrock hover:bg-success-shamrock/90 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-all"
              >
                {claiming ? 'Sign in wallet…' : claimConfirming ? 'Confirming…' : 'Claim USDC'}
              </button>
            </div>
          )}
          {claimSuccess && (
            <p className="text-xs text-success-shamrock font-semibold mb-2">Payout claimed successfully!</p>
          )}

          {/* Progress Bar */}
          <div className="w-full bg-black/25 h-2 rounded-full overflow-hidden my-2 p-0.5">
            <div
              className="bg-gradient-to-r from-tertiary-fixed-dim to-on-tertiary-container h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (seller.availablePayout / seller.creditLimit) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between pt-2 mb-4 text-xs text-primary-fixed">
            <div className="flex items-center space-x-1">
              <span className="material-symbols-outlined text-sm text-success-shamrock">payments</span>
              <span>Total Financed:</span>
              <strong className="text-white ml-1">${seller.totalFinanced.toLocaleString()}</strong>
            </div>
            <div className="flex items-center space-x-1">
              <span className="material-symbols-outlined text-sm text-success-shamrock">bolt</span>
              <span>Arc Speed:</span>
              <strong className="text-white ml-1">&lt;1s</strong>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSellerView('submit_invoice')}
              className="h-12 bg-on-tertiary-container hover:bg-tertiary-fixed-dim text-white font-label-lg font-bold rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span>Submit Invoice</span>
            </button>
            <button
              onClick={() => setSellerView('tier2')}
              className="h-12 bg-surface-card/20 hover:bg-surface-card/30 border border-white/20 text-white font-label-lg font-bold rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">stars</span>
              <span>Upgrade Tier</span>
            </button>
          </div>
        </div>
      </section>

      {/* Capital Strip */}
      <section className="grid grid-cols-3 gap-3">
        <div className="bg-surface-card p-4 rounded-xl shadow-sm border border-border-subtle flex flex-col">
          <span className="text-xs text-secondary truncate">Active Capital</span>
          <span className="font-headline text-lg font-bold text-primary mt-1 font-tnum">
            ${invoices.filter(i => i.status === 'funded').reduce((s, i) => s + i.advanceAmount, 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-success-shamrock font-medium mt-0.5">In escrow</span>
        </div>
        <div className="bg-surface-card p-4 rounded-xl shadow-sm border border-border-subtle flex flex-col">
          <span className="text-xs text-secondary truncate">Cash Received</span>
          <span className="font-headline text-lg font-bold text-primary mt-1 font-tnum">
            ${seller.totalFinanced.toLocaleString()}
          </span>
          <span className="text-[11px] text-secondary mt-0.5">All time</span>
        </div>
        <div className="bg-surface-card p-4 rounded-xl shadow-sm border border-border-subtle flex flex-col">
          <span className="text-xs text-secondary truncate">Open Invoices</span>
          <span className="font-headline text-lg font-bold text-on-tertiary-container mt-1 font-tnum">
            {invoices.filter(i => i.status === 'published_marketplace').length}
          </span>
          <span className="text-[11px] text-secondary mt-0.5">On marketplace</span>
        </div>
      </section>

      {/* Tier Upgrade Banner */}
      {seller.verificationTier < 2 && (
        <div className="bg-warning-amber-soft border border-warning-amber-soft/80 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-on-tertiary-container">stars</span>
            <div>
              <h4 className="font-label-md text-xs font-bold text-primary">Unlock Tier 2 ($5,000 Limit)</h4>
              <p className="text-[11px] text-secondary">Upload your Tax PIN and Bank Statement to expand credit.</p>
            </div>
          </div>
          <button
            onClick={() => setSellerView('tier2')}
            className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-container shadow-sm shrink-0"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {/* Invoices Ledger */}
      <section className="bg-surface-card rounded-2xl p-5 shadow-sm border border-border-subtle flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-headline text-base font-bold text-primary">Invoices Ledger</h3>
            <span className="text-xs text-secondary">Track real-time status of submitted invoices</span>
          </div>
          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg">
            {(['all', 'pending', 'funded', 'repaid'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-secondary text-xs">No invoices found in this view.</div>
          ) : (
            filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-xl border border-border-subtle bg-surface-container-lowest hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-12 rounded-full shrink-0 ${
                    inv.status === 'funded' ? 'bg-success-shamrock' :
                    inv.status === 'repaid' ? 'bg-primary' :
                    inv.status === 'flagged' ? 'bg-error' : 'bg-tertiary-fixed-dim'
                  }`} />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-primary">{inv.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'funded' ? 'bg-success-shamrock/10 text-success-shamrock' :
                        inv.status === 'repaid' ? 'bg-primary/10 text-primary' :
                        inv.status === 'flagged' ? 'bg-error-container text-error' : 'bg-warning-amber-soft text-on-tertiary-container'
                      }`}>
                        {inv.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-on-surface-variant mt-0.5">{inv.buyerName}</span>
                    <span className="text-[11px] text-secondary">Due: {inv.dueDate} · {inv.termDays}d term</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                  <div className="text-right">
                    <div className="font-headline font-extrabold text-base text-primary font-tnum">
                      ${inv.amount.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-success-shamrock font-medium">
                      Advance: ${inv.advanceAmount.toLocaleString()} ({inv.advanceRatePct}%)
                    </div>
                  </div>
                  {inv.status === 'funded' && (
                    <button
                      onClick={() => repayInvoiceSeller(inv.id)}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-lg shadow-sm"
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
