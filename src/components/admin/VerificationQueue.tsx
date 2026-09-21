import React, { useState } from 'react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { VerificationRequest } from '../../types';
import { supabaseService } from '../../services/supabaseService';

const tierColor = (tier: number) => tier === 2
  ? { dot: '#1E4DB8', bg: 'rgba(30,77,184,0.08)', text: '#1E4DB8' }
  : { dot: '#1A7A46', bg: 'rgba(26,122,70,0.08)', text: '#1A7A46' };

export const VerificationQueue: React.FC = () => {
  const { verifications, approveVerificationAdmin, rejectVerificationAdmin, setAdminView } = useApp();
  const [selectedDoc, setSelectedDoc] = useState<VerificationRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [noteFocused, setNoteFocused] = useState(false);

  const pending = verifications.filter(v => v.status === 'pending');

  return (
    <div
      className="mx-auto py-7 px-4 flex flex-col gap-6 pb-28 animate-fade-up"
      style={{ maxWidth: '760px' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p
            className="text-[9px] uppercase font-semibold mb-1.5"
            style={{ color: 'var(--ink-faint)', letterSpacing: '0.12em' }}
          >
            Identity & compliance
          </p>
          <h1
            className="font-display font-bold text-ink"
            style={{ fontSize: '20px', letterSpacing: '-0.028em', lineHeight: 1.1 }}
          >
            KYC Verification Queue
          </h1>
          <p className="text-[12px] mt-1" style={{ color: 'var(--ink-subtle)' }}>
            {pending.length} pending {pending.length === 1 ? 'submission' : 'submissions'}
          </p>
        </div>
        <button
          onClick={() => setAdminView('oversight')}
          className="self-start sm:self-auto px-3 py-1.5 text-[11px] font-semibold rounded-[7px] transition-colors"
          style={{ background: 'var(--cream)', border: '1px solid var(--border-2)', color: 'var(--ink-subtle)' }}
        >
          Invoice grid
        </button>
      </div>

      {/* Queue */}
      {pending.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-[15px] gap-3"
          style={{ border: '1px dashed var(--border-2)' }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ color: 'var(--ink-faint)' }}>
            <path d="M16 4l10 5.5v11L16 26 6 20.5v-11L16 4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            <path d="M16 4v22M6 9.5l10 6 10-6" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M12 17l2.5 2.5L20 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <p className="text-[13px] font-medium" style={{ color: 'var(--ink-subtle)' }}>
            Queue clear
          </p>
          <p className="text-[11px]" style={{ color: 'var(--ink-faint)' }}>
            All submissions have been reviewed.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map(req => {
            const tc = tierColor(req.tier);
            return (
              <div
                key={req.id}
                className="rounded-[15px] overflow-hidden transition-all duration-150"
                style={{
                  background: 'var(--surface-1)',
                  border: '1px solid var(--border-2)',
                  boxShadow: 'var(--shadow-e1)',
                }}
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: identity */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className="w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0 font-display font-bold text-[13px]"
                      style={{ background: tc.bg, color: tc.text }}
                    >
                      T{req.tier}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="font-display font-semibold text-ink"
                          style={{ fontSize: '14px', letterSpacing: '-0.018em' }}
                        >
                          {req.businessName}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase"
                          style={{ background: tc.bg, color: tc.text, letterSpacing: '0.06em' }}
                        >
                          <span className="w-1 h-1 rounded-full" style={{ background: tc.dot }} />
                          Tier {req.tier} · {req.tier === 2 ? '$5,000' : '$500'}
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-subtle)' }}>
                        {req.sellerName} · {req.submittedAt}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>
                          {req.documentType}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[9px] font-semibold"
                          style={{ background: 'rgba(184,130,30,0.08)', color: '#7A5510', letterSpacing: '0.04em' }}
                        >
                          AI: Uncertain (68%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => setSelectedDoc(req)}
                      className="h-9 px-3.5 rounded-[9px] text-[11px] font-semibold transition-all active:scale-[0.97]"
                      style={{
                        background: 'var(--cream)',
                        border: '1px solid var(--border-2)',
                        color: 'var(--ink-subtle)',
                      }}
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => {
                        let undone = false;
                        toast(`Rejected ${req.businessName}`, {
                          duration: 4000,
                          action: { label: 'Undo', onClick: () => { undone = true; } },
                          onDismiss: () => { if (!undone) rejectVerificationAdmin(req.id); },
                          onAutoClose: () => { if (!undone) rejectVerificationAdmin(req.id); },
                        });
                      }}
                      className="h-9 px-3.5 rounded-[9px] text-[11px] font-semibold transition-all active:scale-[0.97]"
                      style={{ background: 'rgba(140,26,26,0.07)', color: '#8C1A1A', border: '1px solid rgba(140,26,26,0.15)' }}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        let undone = false;
                        toast.success(`Approved Tier ${req.tier} - ${req.businessName}`, {
                          duration: 4000,
                          action: { label: 'Undo', onClick: () => { undone = true; } },
                          onDismiss: () => { if (!undone) approveVerificationAdmin(req.id); },
                          onAutoClose: () => { if (!undone) approveVerificationAdmin(req.id); },
                        });
                      }}
                      className="h-9 px-3.5 rounded-[9px] text-[11px] font-semibold text-white transition-all active:scale-[0.97]"
                      style={{ background: '#1A7A46' }}
                    >
                      Approve T{req.tier}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect doc modal */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(13,24,36,0.55)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className="w-full max-w-[440px] rounded-[15px] overflow-hidden animate-fade-up"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border-2)', boxShadow: 'var(--shadow-e4)' }}
          >
            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,#B8821E,#E9BE68)' }} />
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    className="font-display font-semibold text-ink"
                    style={{ fontSize: '15px', letterSpacing: '-0.018em' }}
                  >
                    {selectedDoc.businessName}
                  </h3>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-faint)' }}>
                    Document inspection · {selectedDoc.documentType}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedDoc(null); setAdminNote(''); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--cream)', color: 'var(--ink-subtle)' }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Doc preview */}
              <div
                className="w-full h-44 rounded-[11px] overflow-hidden flex items-center justify-center"
                style={{ background: 'var(--cream)', border: '1px solid var(--border-2)' }}
              >
                <img
                  src={selectedDoc.documentUrl}
                  alt="Document"
                  className="max-h-full object-contain"
                />
              </div>

              {/* Audit note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold" style={{ color: 'var(--ink-subtle)' }}>
                  Audit note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Identity verified against government tax registry"
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  onFocus={() => setNoteFocused(true)}
                  onBlur={() => setNoteFocused(false)}
                  className="w-full h-[42px] px-3.5 text-[13px] text-ink focus:outline-none rounded-[9px] transition-all"
                  style={{
                    background: 'var(--cream)',
                    border: noteFocused ? '1.5px solid rgba(184,130,30,0.55)' : '1px solid var(--border-2)',
                    boxShadow: noteFocused ? '0 0 0 3px rgba(184,130,30,0.08)' : 'none',
                  }}
                />
              </div>

              <button
                onClick={() => {
                  if (adminNote) supabaseService.addAdminNote('verification', selectedDoc.id, adminNote);
                  approveVerificationAdmin(selectedDoc.id);
                  setSelectedDoc(null);
                  setAdminNote('');
                }}
                className="w-full h-[48px] rounded-[11px] text-[13px] font-semibold text-white transition-all active:scale-[0.98]"
                style={{ background: '#1A7A46' }}
              >
                Approve and record note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
