import React from 'react';
import { useApp } from '../../context/AppContext';

export const FundInvoiceBatch: React.FC = () => {
  const { invoices, fundBatchLender, setLenderView, lender } = useApp();

  const openInvoices = invoices.filter((i) => i.status === 'published_marketplace' || i.status === 'pending_admin_approval');
  const batchInvoices = openInvoices.length >= 2 ? openInvoices.slice(0, 3) : openInvoices;

  const totalDeployment = batchInvoices.reduce((sum, i) => sum + i.advanceAmount, 0);
  const blendedApy =
    batchInvoices.length > 0
      ? (batchInvoices.reduce((sum, i) => sum + i.expectedYieldPct, 0) / batchInvoices.length).toFixed(1)
      : '14.5';
  const avgTerm =
    batchInvoices.length > 0
      ? Math.round(batchInvoices.reduce((sum, i) => sum + i.termDays, 0) / batchInvoices.length)
      : 45;

  const handleExecuteBatch = () => {
    const ids = batchInvoices.map((i) => i.id);
    fundBatchLender(ids);
    setLenderView('portfolio');
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setLenderView('browse')}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-on-surface hover:bg-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <span className="font-label-sm text-xs font-bold text-primary uppercase tracking-wider">
          Batch Funding Wizard
        </span>
        <div className="w-10"></div>
      </div>

      <div className="mb-6">
        <h1 className="font-headline text-2xl font-bold text-primary-container">
          Execute Batch Invoice Deployment
        </h1>
        <p className="font-body-md text-sm text-secondary mt-1">
          Diversify capital across multiple verified merchant invoices in a single transaction.
        </p>
      </div>

      {/* Batch Summary Hero Card */}
      <div className="bg-gradient-to-br from-primary-container to-primary text-white rounded-2xl p-6 shadow-md mb-6 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs text-primary-fixed-dim uppercase tracking-wider font-semibold">Total Batch Capital Deployment</span>
            <div className="font-headline text-3xl font-extrabold text-white mt-1">
              ${totalDeployment.toLocaleString()} USDC
            </div>
          </div>
          <span className="bg-success-shamrock text-white px-3 py-1 rounded-full text-xs font-bold">
            {batchInvoices.length} Invoices
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-primary-container pt-4">
          <div>
            <span className="text-[11px] text-primary-fixed-dim block">Blended Annual Yield</span>
            <span className="font-headline font-bold text-xl text-success-shamrock">{blendedApy}% APY</span>
          </div>
          <div>
            <span className="text-[11px] text-primary-fixed-dim block">Weighted Average Term</span>
            <span className="font-headline font-bold text-xl text-white">{avgTerm} Days</span>
          </div>
        </div>
      </div>

      {/* Batch Invoice Cards */}
      <div className="flex flex-col gap-3 mb-6">
        <h3 className="font-headline font-bold text-base text-primary">Invoices Included in Batch</h3>

        {batchInvoices.map((inv) => (
          <div
            key={inv.id}
            className="bg-surface-card p-4 rounded-xl border border-border-subtle flex items-center justify-between shadow-xs text-xs"
          >
            <div className="flex flex-col">
              <span className="font-bold text-primary">{inv.sellerBusinessName}</span>
              <span className="text-secondary">{inv.buyerName} · Due {inv.dueDate}</span>
            </div>
            <div className="text-right">
              <span className="font-headline font-bold text-sm text-primary block">${inv.advanceAmount.toLocaleString()}</span>
              <span className="text-success-shamrock font-bold text-[11px]">{inv.expectedYieldPct}% APY</span>
            </div>
          </div>
        ))}
      </div>

      {/* Action CTA */}
      <div className="bg-surface-card p-5 rounded-2xl border border-border-subtle shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center text-xs">
          <span className="text-secondary">Available Wallet Balance:</span>
          <span className="font-bold text-primary">${lender.availableBalance.toLocaleString()} USDC</span>
        </div>

        <button
          onClick={handleExecuteBatch}
          className="w-full h-13 bg-success-shamrock hover:bg-success-shamrock/90 text-white font-label-lg font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 py-3"
        >
          <span className="material-symbols-outlined text-lg">bolt</span>
          <span>Confirm & Execute Batch Funding</span>
        </button>
      </div>
    </div>
  );
};
