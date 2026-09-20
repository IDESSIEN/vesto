import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';

export const InvoiceOversightTable: React.FC = () => {
  const { invoices, approveInvoiceAdmin, flagInvoiceAdmin, setAdminView } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'published' | 'funded' | 'flagged'>('all');
  const [flagModal, setFlagModal] = useState<Invoice | null>(null);
  const [flagReason, setFlagReason] = useState('');

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
                          onClick={() => { setFlagModal(inv); setFlagReason(''); }}
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
      {/* Flag Reason Modal */}
      {flagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,22,40,0.6)', backdropFilter: 'blur(6px)' }}>
          <div className="bg-surface-card rounded-2xl max-w-sm w-full shadow-xl border border-border-subtle overflow-hidden">
            <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#EF4444,#F87171)' }} />
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-headline font-bold text-base text-primary">Flag Invoice</h3>
                  <p className="text-xs text-secondary mt-0.5">{flagModal.id} · {flagModal.sellerBusinessName}</p>
                </div>
                <button onClick={() => setFlagModal(null)} className="text-secondary hover:text-primary">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-secondary">Reason for Flagging (required)</label>
                <textarea
                  value={flagReason}
                  onChange={e => setFlagReason(e.target.value)}
                  placeholder="e.g. Duplicate invoice, suspected fraud, document mismatch..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-primary border resize-none focus:outline-none focus:ring-2"
                  style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setFlagModal(null)}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold text-secondary border"
                  style={{ background: 'var(--canvas)', borderColor: 'var(--border)' }}
                >
                  Cancel
                </button>
                <button
                  disabled={!flagReason.trim()}
                  onClick={() => { flagInvoiceAdmin(flagModal.id, flagReason); setFlagModal(null); }}
                  className="flex-1 h-11 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: '#DC2626' }}
                >
                  Confirm Flag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
