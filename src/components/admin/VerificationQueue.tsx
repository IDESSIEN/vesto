import React, { useState } from 'react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { VerificationRequest } from '../../types';
import { supabaseService } from '../../services/supabaseService';

export const VerificationQueue: React.FC = () => {
  const { verifications, approveVerificationAdmin, rejectVerificationAdmin, setAdminView } = useApp();
  const [selectedDoc, setSelectedDoc] = useState<VerificationRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const pendingRequests = verifications.filter((v) => v.status === 'pending');

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 flex flex-col gap-6 pb-28">
      {/* Admin Header Nav */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-primary tracking-tight">KYC & Business Verification Queue</h1>
          <span className="text-xs text-secondary">{pendingRequests.length} Pending Seller Submissions</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setAdminView('oversight')}
            className="px-3 py-1.5 bg-surface-card border border-border-subtle rounded-xl text-xs font-semibold text-primary hover:bg-surface-container"
          >
            Invoice Oversight
          </button>
          <button
            onClick={() => setAdminView('analytics')}
            className="px-3 py-1.5 bg-surface-card border border-border-subtle rounded-xl text-xs font-semibold text-primary hover:bg-surface-container"
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Queue List */}
      <div className="flex flex-col gap-4">
        {pendingRequests.length === 0 ? (
          <div className="text-center py-12 bg-surface-card rounded-2xl border border-border-subtle text-secondary text-xs">
            Queue empty! All seller verification requests have been reviewed.
          </div>
        ) : (
          pendingRequests.map((req) => (
            <div
              key={req.id}
              className="bg-surface-card rounded-2xl p-5 shadow-sm border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className={`w-3 h-12 rounded-full shrink-0 ${req.tier === 2 ? 'bg-tertiary-fixed-dim' : 'bg-success-shamrock'}`}></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline font-bold text-base text-primary">{req.businessName}</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-primary font-bold text-[10px]">
                      Tier {req.tier} ({req.tier === 2 ? '$5,000' : '$500'})
                    </span>
                  </div>
                  <span className="text-xs text-secondary block">{req.sellerName} · Submitted: {req.submittedAt}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-on-surface-variant font-medium">
                      Document: {req.documentType}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-warning-amber-soft text-on-tertiary-container text-[10px] font-bold">
                      Cleanverse AI: Uncertain (68% Confidence)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                <button
                  onClick={() => setSelectedDoc(req)}
                  className="px-3 py-2 bg-surface-container hover:bg-surface-variant text-primary text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">visibility</span>
                  <span>Inspect Doc</span>
                </button>

                <button
                  onClick={() => {
                    let undone = false;
                    toast(`Rejected ${req.businessName}`, {
                      duration: 4000,
                      action: {
                        label: 'Undo',
                        onClick: () => { undone = true; },
                      },
                      onDismiss: () => { if (!undone) rejectVerificationAdmin(req.id); },
                      onAutoClose: () => { if (!undone) rejectVerificationAdmin(req.id); },
                    });
                  }}
                  className="px-3 py-2 bg-error-container text-error hover:bg-error-container/80 text-xs font-bold rounded-xl"
                >
                  Reject
                </button>

                <button
                  onClick={() => {
                    let undone = false;
                    toast.success(`Approved Tier ${req.tier} - ${req.businessName}`, {
                      duration: 4000,
                      action: {
                        label: 'Undo',
                        onClick: () => { undone = true; },
                      },
                      onDismiss: () => { if (!undone) approveVerificationAdmin(req.id); },
                      onAutoClose: () => { if (!undone) approveVerificationAdmin(req.id); },
                    });
                  }}
                  className="px-4 py-2 bg-success-shamrock hover:bg-success-shamrock/90 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>Approve Tier {req.tier}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inspect Doc Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-card rounded-2xl max-w-lg w-full p-6 shadow-xl border border-border-subtle animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-headline font-bold text-lg text-primary">{selectedDoc.businessName}</h3>
                <span className="text-xs text-secondary">Document Inspection · {selectedDoc.documentType}</span>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="text-secondary hover:text-primary">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="w-full h-56 rounded-xl bg-surface-container-high overflow-hidden mb-4 flex items-center justify-center border border-border-subtle">
              <img
                src={selectedDoc.documentUrl}
                alt="Document Preview"
                className="max-h-full object-contain"
              />
            </div>

            <div className="flex flex-col gap-1 mb-4 text-xs">
              <label className="font-semibold text-on-surface-variant">Admin Audit Note (Saved to Supabase)</label>
              <input
                type="text"
                placeholder="e.g. Identity verified against government tax registry"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-container-lowest border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary text-xs"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (adminNote) {
                    supabaseService.addAdminNote('verification', selectedDoc.id, adminNote);
                  }
                  approveVerificationAdmin(selectedDoc.id);
                  setSelectedDoc(null);
                  setAdminNote('');
                }}
                className="flex-1 h-12 bg-success-shamrock hover:bg-success-shamrock/90 text-white font-label-lg font-bold rounded-xl shadow-md"
              >
                Approve & Record Audit Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
