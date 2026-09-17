import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import { useFundInvoice, useUSDCBalance } from '../../hooks/useVestoEscrow';
import { formatUSDC, explorerTxUrl, USDC_DECIMALS } from '../../config/contracts';

export const MarketplaceBrowse: React.FC = () => {
  const { invoices, fundInvoiceLender, setLenderView } = useApp();
  const { address, isConnected } = useAccount();
  const { raw: usdcBalance } = useUSDCBalance();
  const { execute, step, txHash, isConfirming, isSuccess, errorMsg, reset } = useFundInvoice();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [fundingModalInvoice, setFundingModalInvoice] = useState<Invoice | null>(null);

  const openInvoices = invoices.filter((i) => i.status === 'published_marketplace' || i.status === 'pending_admin_approval');

  const filteredInvoices = openInvoices.filter((inv) => {
    const matchesSearch =
      inv.sellerBusinessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedCategory === 'All') return matchesSearch;
    if (selectedCategory === 'High Yield') return matchesSearch && inv.expectedYieldPct >= 15;
    if (selectedCategory === 'Short Term') return matchesSearch && inv.termDays <= 45;
    return matchesSearch && inv.sellerCategory.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const toggleSelectInvoice = (id: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFundOnChain = async (inv: Invoice) => {
    if (!isConnected) return;
    // Also update local state for UI consistency
    fundInvoiceLender(inv.id);
    // Fire real on-chain tx
    const sellerAddr = ('0x' + inv.sellerId.replace(/[^a-fA-F0-9]/g, '').padStart(40, '0')) as `0x${string}`;
    await execute(inv.id, sellerAddr, inv.advanceAmount);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col gap-6 pb-32">
      {/* Header Banner */}
      <div className="bg-primary-container text-on-primary rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-xs text-on-primary-container uppercase tracking-wider font-semibold">
            Vesto Marketplace — Arc Testnet
          </span>
          <span className="bg-success-shamrock/20 text-success-shamrock px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success-shamrock animate-pulse" />
            <span>{openInvoices.length} Active Batches</span>
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div>
            <span className="text-xs text-on-primary-container block">Total Pool Volume</span>
            <span className="font-headline text-3xl font-extrabold text-white font-tnum">
              ${openInvoices.reduce((s, i) => s + i.amount, 0).toLocaleString()} USDC
            </span>
          </div>
          <div className="text-right">
            {isConnected ? (
              <>
                <span className="text-xs text-on-primary-container block">Your USDC Balance</span>
                <span className="font-headline text-xl font-bold text-success-shamrock font-tnum">
                  {usdcBalance !== undefined ? formatUSDC(usdcBalance) : '—'}
                </span>
              </>
            ) : (
              <ConnectKitButton label="Connect Wallet" />
            )}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search seller, buyer, category..."
              className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-card font-body-md text-sm text-primary border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>
          {selectedInvoices.length > 0 && (
            <button
              onClick={() => setLenderView('batch')}
              className="px-4 py-2 bg-on-tertiary-container hover:bg-tertiary-fixed-dim text-white font-label-md text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-base">layers</span>
              <span>Batch ({selectedInvoices.length})</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {['All', 'Agri Exporter', 'High Yield', 'Short Term', 'Cold Chain'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-card text-secondary hover:text-primary border border-border-subtle'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <div className="flex flex-col gap-4">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 bg-surface-card rounded-xl border border-border-subtle text-secondary text-xs">
            No active invoices match your filter.
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const isSelected = selectedInvoices.includes(inv.id);
            return (
              <div
                key={inv.id}
                className={`bg-surface-card rounded-2xl p-5 shadow-sm border transition-all flex flex-col gap-3 relative overflow-hidden ${
                  isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border-subtle hover:border-primary/40'
                }`}
              >
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-success-shamrock" />

                <div className="flex items-start justify-between pl-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectInvoice(inv.id)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-headline font-bold text-base text-primary">{inv.sellerBusinessName}</span>
                        <span className="material-symbols-outlined text-success-shamrock text-base">verified</span>
                      </div>
                      <span className="text-xs text-secondary">{inv.sellerCategory} · Risk Score: {inv.riskScore}/100</span>
                    </div>
                  </div>
                  <span className="bg-success-shamrock/10 text-success-shamrock px-3 py-1 rounded-full font-headline font-bold text-xs">
                    {inv.expectedYieldPct}% APY
                  </span>
                </div>

                <div className="pl-9 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-container-low p-3 rounded-xl border border-border-subtle text-xs">
                  <div>
                    <span className="text-secondary block text-[11px]">Buyer Offtaker</span>
                    <span className="font-semibold text-primary truncate block">{inv.buyerName}</span>
                  </div>
                  <div>
                    <span className="text-secondary block text-[11px]">Invoice Total</span>
                    <span className="font-bold text-primary font-tnum block">${inv.amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-secondary block text-[11px]">Advance Capital</span>
                    <span className="font-bold text-success-shamrock font-tnum block">${inv.advanceAmount.toLocaleString()} ({inv.advanceRatePct}%)</span>
                  </div>
                  <div>
                    <span className="text-secondary block text-[11px]">Term Duration</span>
                    <span className="font-semibold text-primary block">{inv.termDays}d · {inv.dueDate}</span>
                  </div>
                </div>

                <div className="pl-9 flex items-center justify-between pt-1">
                  <span className="text-[11px] text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">description</span>
                    <span>{inv.docName || 'commercial_invoice.pdf'}</span>
                  </span>
                  <button
                    onClick={() => setFundingModalInvoice(inv)}
                    className="px-4 py-2 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1"
                  >
                    <span className="font-tnum">Fund ${inv.advanceAmount.toLocaleString()}</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Funding Confirmation Modal */}
      {fundingModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-2xl max-w-md w-full p-6 shadow-xl border border-border-subtle animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-bold text-lg text-primary">Confirm Funding on Arc</h3>
              <button onClick={() => { setFundingModalInvoice(null); reset(); }} className="text-secondary hover:text-primary">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="bg-surface-container-low p-4 rounded-xl border border-border-subtle flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-secondary">Seller:</span>
                  <span className="font-bold text-primary">{fundingModalInvoice.sellerBusinessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Buyer:</span>
                  <span className="font-bold text-primary">{fundingModalInvoice.buyerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Expected Yield:</span>
                  <span className="font-bold text-success-shamrock">{fundingModalInvoice.expectedYieldPct}% APY</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Term:</span>
                  <span className="font-semibold text-primary">{fundingModalInvoice.termDays} days</span>
                </div>
              </div>

              <div className="bg-primary text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-primary-fixed-dim text-[11px] uppercase tracking-wider block">Capital Required</span>
                  <span className="font-headline font-extrabold text-2xl font-tnum">${fundingModalInvoice.advanceAmount.toLocaleString()} USDC</span>
                </div>
                <div className="text-right">
                  <span className="text-primary-fixed-dim text-[11px] block">Your Balance</span>
                  <span className="font-bold text-success-shamrock font-tnum">
                    {usdcBalance !== undefined ? formatUSDC(usdcBalance) : '—'}
                  </span>
                </div>
              </div>

              {/* Transaction State */}
              {step === 'approving' && (
                <p className="text-center text-xs text-secondary">Step 1/2: Approve USDC spend in your wallet...</p>
              )}
              {step === 'funding' && (
                <p className="text-center text-xs text-secondary">Step 2/2: Confirm funding transaction...</p>
              )}
              {isConfirming && (
                <p className="text-center text-xs text-secondary">Waiting for confirmation on Arc...</p>
              )}
              {isSuccess && txHash && (
                <div className="bg-success-shamrock/10 border border-success-shamrock/30 p-3 rounded-xl text-center">
                  <p className="text-success-shamrock font-bold text-xs mb-1">Funded on Arc!</p>
                  <a
                    href={explorerTxUrl(txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary underline font-mono"
                  >
                    View on explorer
                  </a>
                </div>
              )}
              {step === 'error' && (
                <p className="text-xs text-error text-center">{errorMsg || 'Transaction failed. Please try again.'}</p>
              )}

              {!isConnected ? (
                <div className="flex justify-center">
                  <ConnectKitButton label="Connect Wallet to Fund" />
                </div>
              ) : step === 'idle' || step === 'error' ? (
                <button
                  onClick={() => handleFundOnChain(fundingModalInvoice)}
                  className="w-full h-12 bg-success-shamrock hover:bg-success-shamrock/90 text-white font-label-lg font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">bolt</span>
                  <span>Fund on Arc</span>
                </button>
              ) : (
                <button disabled className="w-full h-12 bg-success-shamrock/50 text-white font-label-lg font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                  <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                  <span>Processing...</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
