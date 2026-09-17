import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const InvoiceOversightTable: React.FC = () => {
  const { invoices, approveInvoiceAdmin, flagInvoiceAdmin, setAdminView } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'published' | 'funded' | 'flagged'>('all');

  const filteredInvoices = invoices.filter((inv) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return inv.status === 'pending_admin_approval';
    if (filter === 'published') return inv.status === 'published_marketplace';
    if (filter === 'funded') return inv.status === 'funded';
    if (filter === 'flagged') return inv.status === 'flagged';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 flex flex-col gap-6 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-2xl font-bold text-primary tracking-tight">Invoice Risk Oversight Grid</h1>
          <span className="text-xs text-secondary">Monitor & verify commercial invoices across the Vesto ecosystem</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdminView('queue')}
            className="px-3 py-1.5 bg-surface-card border border-border-subtle rounded-xl text-xs font-semibold text-primary hover:bg-surface-container"
          >
            KYC Queue
          </button>
          <button
            onClick={() => setAdminView('dispute')}
            className="px-3 py-1.5 bg-surface-card border border-border-subtle rounded-xl text-xs font-semibold text-primary hover:bg-surface-container"
          >
            Disputes
          </button>
          <button
            onClick={() => setAdminView('analytics')}
            className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {(['all', 'pending', 'published', 'funded', 'flagged'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
              filter === tab
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-card text-secondary hover:text-primary border border-border-subtle'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Oversight Table */}
      <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle text-secondary font-label-sm uppercase tracking-wider">
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-4">Seller Merchant</th>
                <th className="py-3 px-4">Buyer Offtaker</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-secondary">
                    No invoices match this filter category.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">{inv.id}</td>
                    <td className="py-3 px-4 font-semibold text-primary">{inv.sellerBusinessName}</td>
                    <td className="py-3 px-4 text-secondary">{inv.buyerName}</td>
                    <td className="py-3 px-4 font-headline font-bold text-primary">${inv.amount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className="bg-success-shamrock/10 text-success-shamrock px-2 py-0.5 rounded font-bold">
                        {inv.riskScore}/100 ({inv.riskTier})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        inv.status === 'published_marketplace' ? 'bg-success-shamrock/10 text-success-shamrock' :
                        inv.status === 'funded' ? 'bg-primary/10 text-primary' :
                        inv.status === 'flagged' ? 'bg-error-container text-error' : 'bg-warning-amber-soft text-on-tertiary-container'
                      }`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {inv.status === 'pending_admin_approval' && (
                        <button
                          onClick={() => approveInvoiceAdmin(inv.id)}
                          className="px-2.5 py-1 bg-success-shamrock text-white rounded font-bold text-[11px] hover:bg-success-shamrock/90"
                        >
                          Approve
                        </button>
                      )}

                      {inv.status !== 'flagged' && (
                        <button
                          onClick={() => flagInvoiceAdmin(inv.id)}
                          className="px-2 py-1 bg-surface-container text-error rounded font-bold text-[11px] hover:bg-error-container"
                        >
                          Flag
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
