import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { cleanverseService, CleanverseResult } from '../../services/cleanverseService';

const ArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 3L5 8l5 5"/>
  </svg>
);
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7h8M7 3l4 4-4 4"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2L3 5v4c0 3.87 2.52 6.87 6 7.5 3.48-.63 6-3.63 6-7.5V5L9 2z"/>
    <path d="M6.5 9l2 2 3-3"/>
  </svg>
);
const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="animate-spin">
    <circle cx="8" cy="8" r="6" strokeOpacity="0.25"/>
    <path d="M8 2a6 6 0 0 1 6 6" strokeOpacity="1"/>
  </svg>
);
const ErrorIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.5"/><path d="M8 5v4"/><circle cx="8" cy="11" r="0.7" fill="currentColor" stroke="none"/>
  </svg>
);
const VerifiedBadge = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 1L1.5 3.5V6c0 2.9 1.89 5.15 4.5 5.63 2.61-.48 4.5-2.73 4.5-5.63V3.5L6 1z"/>
    <path d="M4 6l1.5 1.5 2.5-2.5"/>
  </svg>
);

export const Tier1Verification: React.FC = () => {
  const { setSellerView, submitVerification, showToast, seller } = useApp();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationOutcome, setVerificationOutcome] = useState<'pass' | 'fail' | 'uncertain'>('pass');
  const [rejectionResult, setRejectionResult] = useState<CleanverseResult | null>(null);

  const docUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuChP_Oslw2qMuh5bd2tcx9zj5kjSF7v_-iaDTnr91VIWCYs4uByYBKSpApEGff-h3SWoL4rhAhGE-ZhMuCvQw3n4IzHgI8IUHaRpgFHbRay1FIhFRhK-QCoVrGUJASOziVbldbFi6hojbMatzzuqaUKp-_TphUKJKJUaYfOzRWpTSK4cQIKL4RPNSAboBg4aCeMll5BCPi_v0cQt-GhG5Rcb3lBeBuaJX_iAAuika0sYNZzZyXAW8hS1g';

  const handleCleanverseCheck = async () => {
    setIsVerifying(true);
    setRejectionResult(null);
    try {
      const result = await cleanverseService.verifyTier1GovernmentId(docUrl, seller.fullName, verificationOutcome);
      setIsVerifying(false);
      if (result.status === 'pass') {
        submitVerification(1, 'National ID Photo (Tier 1)', docUrl);
        showToast(`ID verified at ${result.confidenceScore}% confidence. $500 limit unlocked — submit your first invoice.`, 'success');
        setSellerView('dashboard');
      } else if (result.status === 'fail') {
        setRejectionResult(result);
        showToast('Verification rejected. See details below.', 'warning');
      } else {
        submitVerification(1, 'National ID Photo (Tier 1)', docUrl);
        showToast("Flagged for human review. You'll hear back within 24 hours.", 'info');
        setSellerView('in_progress');
      }
    } catch {
      setIsVerifying(false);
      showToast('Could not reach Cleanverse. Please try again.', 'warning');
    }
  };

  return (
    <div className="max-w-[520px] mx-auto px-4 py-7 pb-20 flex flex-col gap-4 view-enter">

      {/* Nav row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSellerView('signup')}
          className="w-9 h-9 rounded-[9px] flex items-center justify-center transition-all duration-150 hover:bg-[rgba(13,24,36,0.06)] active:scale-[0.97]"
          style={{ background: 'var(--cream)', border: '1px solid var(--border-2)', color: 'var(--ink-muted)' }}
        ><ArrowLeft /></button>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1,2,3].map(i => (
              <div
                key={i}
                className="h-[3px] rounded-full transition-all duration-300"
                style={{
                  width: i === 2 ? '28px' : '18px',
                  background: i <= 2 ? 'linear-gradient(90deg,#C9922A,#E8B96A)' : 'var(--border)',
                }}
              />
            ))}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.10em]" style={{ color: 'var(--ink-subtle)' }}>
            Step 2 of 3
          </span>
        </div>
        <div className="w-9" />
      </div>

      {/* Header */}
      <div>
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.06em] mb-3"
          style={{ background: 'rgba(4,120,87,0.10)', border: '1px solid rgba(4,120,87,0.18)', color: '#047857' }}
        >
          <VerifiedBadge /> Cleanverse AI
        </div>
        <h1
          className="font-display font-extrabold text-ink mb-2"
          style={{ fontSize: '26px', letterSpacing: '-0.03em', lineHeight: 1.05 }}
        >
          Tier 1 Identity Check
        </h1>
        <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-subtle)' }}>
          Government-issued ID check. A clear pass unlocks your{' '}
          <strong className="text-ink">$500 advance limit</strong> instantly.
        </p>
      </div>

      {/* Credit hero — dark cinema card */}
      <div
        className="relative rounded-[13px] p-5 overflow-hidden grain-overlay"
        style={{
          background: 'linear-gradient(135deg,#0A1628,#112240)',
          border: '1px solid rgba(201,146,42,0.22)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.022, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Micro advance limit
            </p>
            <p className="font-mono font-extrabold text-white font-tnum leading-none" style={{ fontSize: '34px', letterSpacing: '-0.04em' }}>
              $500
            </p>
            <p className="text-[10.5px] font-semibold mt-1.5" style={{ color: '#E8B96A' }}>
              Unlocked on clear pass
            </p>
          </div>
          <div
            className="w-[52px] h-[52px] rounded-[13px] flex items-center justify-center font-display font-extrabold"
            style={{ fontSize: '18px', color: '#E8B96A', background: 'rgba(201,146,42,0.13)', border: '1px solid rgba(201,146,42,0.28)' }}
          >
            T1
          </div>
        </div>
      </div>

      {/* Demo simulation selector */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5 rounded-[11px]"
        style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}
      >
        <span className="text-[11.5px] font-semibold" style={{ color: 'var(--ink-subtle)' }}>Demo simulation</span>
        <div className="flex gap-1">
          {(['pass', 'fail', 'uncertain'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setVerificationOutcome(mode)}
              className="px-3 py-1 rounded-[6px] text-[9.5px] font-bold uppercase tracking-[0.06em] transition-all duration-150 active:scale-[0.97]"
              style={{
                border: 'none',
                cursor: 'pointer',
                background: verificationOutcome === mode
                  ? (mode === 'pass' ? '#047857' : mode === 'fail' ? '#DC2626' : '#7C3AED')
                  : 'var(--bg)',
                color: verificationOutcome === mode ? '#fff' : 'var(--ink-muted)',
                boxShadow: verificationOutcome === mode ? 'none' : 'inset 0 0 0 1px var(--border)',
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Rejection card */}
      {rejectionResult && (
        <div
          className="rounded-[11px] px-4 py-3.5 flex flex-col gap-2"
          style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)' }}
        >
          <div className="flex items-center gap-2 text-[13px] font-bold" style={{ color: '#EF4444' }}>
            <ErrorIcon /> Verification rejected
          </div>
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--ink-subtle)' }}>
            {rejectionResult.failureReason || 'Document photo was too dark or blurry.'}
          </p>
          <div
            className="flex justify-between text-[10.5px] font-semibold pt-2"
            style={{ borderTop: '1px solid rgba(239,68,68,0.12)', color: '#EF4444' }}
          >
            <span>Confidence: {rejectionResult.confidenceScore}%</span>
            <span>Re-upload a clear photo</span>
          </div>
        </div>
      )}

      {/* ID preview */}
      <div
        className="relative rounded-[13px] overflow-hidden"
        style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
        <div className="p-4 pt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-ink">Government ID (Front)</span>
            <span
              className="text-[9.5px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(4,120,87,0.09)', color: '#047857', border: '1px solid rgba(4,120,87,0.18)' }}
            >
              Ready
            </span>
          </div>
          <div
            className="flex items-center gap-3 p-2.5 rounded-[9px]"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <div className="w-[72px] h-[88px] rounded-[8px] overflow-hidden shrink-0">
              <img src={docUrl} alt="ID Document" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col gap-1.5 text-[12px]">
              <span className="font-bold text-ink">{seller.fullName || 'Your Name'}</span>
              <span className="font-mono text-[11px]" style={{ color: 'var(--ink-subtle)' }}>
                ID No: KEN-849201948
              </span>
              <div className="flex items-center gap-1.5 text-[10.5px] font-semibold mt-0.5" style={{ color: '#047857' }}>
                <VerifiedBadge /> Cleanverse AI Ready
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleCleanverseCheck}
        disabled={isVerifying}
        className="btn-primary w-full h-[50px] rounded-[11px] text-[13.5px] justify-center active:scale-[0.98]"
        style={isVerifying ? { opacity: 0.75, cursor: 'wait' } : {}}
      >
        {isVerifying
          ? <><SpinnerIcon /> Sending to Cleanverse AI</>
          : <><ShieldIcon /> Verify identity and unlock $500 <ArrowRight /></>
        }
      </button>
    </div>
  );
};
