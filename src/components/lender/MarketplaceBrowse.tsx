import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';

export const MarketplaceBrowse: React.FC = () => {
  const { invoices, fundInvoiceLender, setLenderView, lender } = useApp();

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

  const handleSingleFundConfirm = () => {
    if (fundingModalInvoice) {
      fundInvoiceLender(fundingModalInvoice.id);
      setFundingModalInvoice(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col gap-6 pb-32">
      {/* Header Banner */}
      <div className="bg-primary-container text-on-primary rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-xs text-on-primary-container uppercase tracking-wider font-semibold">
            Monad Marketplace Liquidity Pool
          </span>
          <span className="bg-success-shamrock/20 text-success-shamrock px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success-shamrock animate-pulse"></span>
            <span>{openInvoices.length} Active Batches</span>
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div>
            <span className="text-xs text-on-primary-container block">Total Pool Volume</span>
            <span className="font-headline text-3xl font-extrabold text-white">$142,500 USDC</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-on-primary-container block">Yield Range APY</span>
            <span className="font-headline text-xl font-bold text-success-shamrock">13.5% - 18.0%</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search seller, buyer, maize, coffee, spices..."
              className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-card font-body-md text-sm text-primary border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>

          {selectedInvoices.length > 0 && (
            <button
              onClick={() => setLenderView('batch')}
              className="px-4 py-2 bg-on-tertiary-container hover:bg-tertiary-fixed-dim text-white font-label-md text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-base">layers</span>
              <span>Fund Batch ({selectedInvoices.length})</span>
            </button>
          )}
        </div>

        {/* Category Pills */}
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

      {/* Invoices List */}
      <div className="flex flex-col gap-4">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12 bg-surface-card rounded-xl border border-border-subtle text-secondary text-xs">
            No active invoices match your filter criteria.
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
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-success-shamrock"></div>

                {/* Card Header */}
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

                {/* Details */}
                <div className="pl-9 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-container-low p-3 rounded-xl border border-border-subtle text-xs">
                  <div>
                    <span className="text-secondary block text-[11px]">Buyer Offtaker</span>
                    <span className="font-semibold text-primary truncate block">{inv.buyerName}</span>
                  </div>
                  <div>
                    <span className="text-secondary block text-[11px]">Invoice Total</span>
                    <span className="font-bold text-primary block">${inv.amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-secondary block text-[11px]">Advance Capital</span>
                    <span className="font-bold text-success-shamrock block">${inv.advanceAmount.toLocaleString()} ({inv.advanceRatePct}%)</span>
                  </div>
                  <div>
                    <span className="text-secondary block text-[11px]">Term Duration</span>
                    <span className="font-semibold text-primary block">{inv.termDays} Days ({inv.dueDate})</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pl-9 flex items-center justify-between pt-1">
                  <span className="text-[11px] text-secondary flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">description</span>
                    <span>{inv.docName || 'Bill_of_lading.pdf'}</span>
                  </span>

                  <button
                    onClick={() => setFundingModalInvoice(inv)}
                    className="px-4 py-2 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1"
                  >
                    <span>Fund ${inv.advanceAmount.toLocaleString()}</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Single Invoice Funding Confirmation Modal */}
      {fundingModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-2xl max-w-md w-full p-6 shadow-xl border border-border-subtle animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline font-bold text-lg text-primary">Confirm Liquidity Funding</h3>
              <button onClick={() => setFundingModalInvoice(null)} className="text-secondary hover:text-primary">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs">
              <div className="bg-surface-container-low p-4 rounded-xl border border-border-subtle flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-secondary">Seller Merchant:</span>
                  <span className="font-bold text-primary">{fundingModalInvoice.sellerBusinessName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Buyer Offtaker:</span>
                  <span className="font-bold text-primary">{fundingModalInvoice.buyerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Target Yield APY:</span>
                  <span className="font-bold text-success-shamrock">{fundingModalInvoice.expectedYieldPct}% APY</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">Term Duration:</span>
                  <span className="font-semibold text-primary">{fundingModalInvoice.termDays} Days</span>
                </div>
              </div>

              <div className="bg-primary text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-primary-fixed-dim text-[11px] uppercase tracking-wider block">Capital Required</span>
                  <span className="font-headline font-extrabold text-2xl">${fundingModalInvoice.advanceAmount.toLocaleString()} USDC</span>
                </div>
                <div className="text-right">
                  <span className="text-primary-fixed-dim text-[11px] block">Available Wallet</span>
                  <span className="font-bold text-success-shamrock">${lender.availableBalance.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleSingleFundConfirm}
                className="w-full h-12 bg-success-shamrock hover:bg-success-shamrock/90 text-white font-label-lg font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">bolt</span>
                <span>Execute On-Chain Funding</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
