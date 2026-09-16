import React from 'react';
import { useApp } from '../../context/AppContext';

export const DisputeResolution: React.FC = () => {
  const { invoices, resolveDisputeAdmin, setAdminView } = useApp();

  const flaggedOrOverdue = invoices.filter((i) => i.status === 'flagged' || i.status === 'disputed');

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 flex flex-col gap-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-primary tracking-tight">Dispute & Default Resolution Hub</h1>
          <span className="text-xs text-secondary">Manage delinquent invoices & first-loss reserve payouts</span>
        </div>

        <button
          onClick={() => setAdminView('oversight')}
          className="px-3 py-1.5 bg-surface-card border border-border-subtle rounded-xl text-xs font-semibold text-primary hover:bg-surface-container"
        >
          Invoice Grid
        </button>
      </div>

      <div className="bg-warning-amber-soft border border-warning-amber-soft/80 p-4 rounded-xl flex items-center gap-3">
        <span className="material-symbols-outlined text-2xl text-on-tertiary-container">shield</span>
        <div className="text-xs">
          <span className="font-bold text-primary block">Protocol Liquidity Guarantee Pool Active</span>
          <span className="text-secondary">$25,000 USDC First-Loss reserve available to absorb defaults.</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {flaggedOrOverdue.length === 0 ? (
          <div className="text-center py-12 bg-surface-card rounded-2xl border border-border-subtle text-secondary text-xs">
            Zero disputed or overdue invoices! All platform invoices are performing clean.
          </div>
        ) : (
          flaggedOrOverdue.map((inv) => (
            <div
              key={inv.id}
              className="bg-surface-card rounded-2xl p-5 shadow-sm border border-error/30 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono font-bold text-sm text-error">{inv.id}</span>
                  <h4 className="font-bold text-base text-primary mt-0.5">{inv.sellerBusinessName}</h4>
                  <span className="text-xs text-secondary">Buyer Offtaker: {inv.buyerName} ({inv.buyerCountry})</span>
                </div>
                <span className="bg-error-container text-error px-3 py-1 rounded-full text-xs font-bold uppercase">
                  Flagged for Audit
                </span>
              </div>

              <div className="bg-surface-container-low p-3 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <span className="text-secondary block text-[11px]">Invoice Value</span>
                  <span className="font-bold text-primary">${inv.amount.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-secondary block text-[11px]">Funded Advance</span>
                  <span className="font-bold text-error">${inv.advanceAmount.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => resolveDisputeAdmin(inv.id)}
                className="w-full h-11 bg-success-shamrock hover:bg-success-shamrock/90 text-white font-label-md font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">verified</span>
                <span>Resolve via First-Loss Reserve ($25K Reserve)</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
