import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { cleanverseService, CleanverseResult } from '../../services/cleanverseService';

const GoldStrip: React.FC = () => (
  <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
    style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A,#C9922A)' }} />
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
        showToast(`ID Verified (${result.confidenceScore}% confidence). $500 limit unlocked — submit your first invoice!`, 'success');
        setSellerView('dashboard');
      } else if (result.status === 'fail') {
        setRejectionResult(result);
        showToast('Verification rejected. See feedback below.', 'warning');
      } else {
        submitVerification(1, 'National ID Photo (Tier 1)', docUrl);
        showToast("Flagged for human review. You'll hear back within 24h.", 'info');
        setSellerView('in_progress');
      }
    } catch {
      setIsVerifying(false);
      showToast('Error contacting Cleanverse — please try again.', 'warning');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-8 px-3 sm:px-4 flex flex-col gap-5 pb-24">

      {/* ── Back + Step ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSellerView('signup')}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
        >
          <span className="material-symbols-outlined text-[20px] text-secondary">arrow_back</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-6 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
            <div className="w-6 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
            <div className="w-6 h-1.5 rounded-full" style={{ background: 'var(--border)' }} />
          </div>
          <span className="text-[10px] text-secondary uppercase tracking-widest font-semibold">Step 2 of 3</span>
        </div>
        <div className="w-10" />
      </div>

      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div
            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.20)' }}
          >
            <span className="material-symbols-outlined text-[12px]">verified</span>
            Cleanverse AI Powered
          </div>
        </div>
        <h1 className="font-headline font-extrabold text-primary mb-1" style={{ fontSize: '28px', letterSpacing: '-0.025em' }}>
          Tier 1 Verification
        </h1>
        <p className="text-sm text-secondary">
          Government-issued ID check. Clear passes unlock your <span className="font-bold text-primary">$500 credit limit</span> instantly.
        </p>
      </div>

      {/* ── Target Limit Card ───────────────────────────────── */}
      <div
        className="relative rounded-2xl p-5 overflow-hidden text-white"
        style={{
          background: 'linear-gradient(135deg,#0A1628 0%,#112240 100%)',
          boxShadow: '0 0 0 1px rgba(201,146,42,0.22)',
        }}
      >
        <GoldStrip />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="text-[9px] uppercase tracking-widest font-semibold mb-1 text-white/40">Micro Credit Limit</div>
            <div className="font-headline font-extrabold font-tnum text-white" style={{ fontSize: '36px', letterSpacing: '-0.03em' }}>
              $500
            </div>
            <div className="text-[11px] font-semibold mt-1" style={{ color: '#E8B96A' }}>Unlocked on clear pass</div>
          </div>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-headline font-extrabold text-xl"
            style={{ background: 'rgba(201,146,42,0.15)', border: '1px solid rgba(201,146,42,0.30)', color: '#E8B96A' }}
          >T1</div>
        </div>
      </div>

      {/* ── Simulation Selector ─────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl text-xs"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
      >
        <span className="font-semibold text-secondary">Demo simulation:</span>
        <div className="flex gap-1.5">
          {(['pass', 'fail', 'uncertain'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setVerificationOutcome(mode)}
              className="px-3 py-1 rounded-lg font-bold uppercase text-[10px] transition-all"
              style={verificationOutcome === mode
                ? {
                    background: mode === 'pass' ? '#047857' : mode === 'fail' ? '#DC2626' : '#7C3AED',
                    color: '#fff',
                  }
                : { background: 'var(--canvas)', color: 'var(--secondary)', border: '1px solid var(--border)' }
              }
            >{mode}</button>
          ))}
        </div>
      </div>

      {/* ── Rejection Banner ────────────────────────────────── */}
      {rejectionResult && (
        <div
          className="flex flex-col gap-2 px-5 py-4 rounded-2xl"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)' }}
        >
          <div className="flex items-center gap-2 font-bold text-sm" style={{ color: '#EF4444' }}>
            <span className="material-symbols-outlined text-lg">error</span>
            Verification Rejected
          </div>
          <p className="text-xs leading-relaxed text-secondary">
            {rejectionResult.failureReason || 'Document photo was too dark or blurry.'}
          </p>
          <div className="flex justify-between text-[11px] font-semibold pt-2 border-t" style={{ borderColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
            <span>Confidence: {rejectionResult.confidenceScore}%</span>
            <span>Re-upload a clear, bright photo</span>
          </div>
        </div>
      )}

      {/* ── ID Preview Card ─────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
      >
        <GoldStrip />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-extrabold text-primary">Government ID (Front)</span>
            <span
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(16,185,129,0.10)', color: '#10B981', border: '1px solid rgba(16,185,129,0.20)' }}
            >Ready for Scan</span>
          </div>
          <div
            className="flex items-center gap-4 p-3 rounded-xl"
            style={{ background: 'var(--canvas)', border: '1px solid var(--border)' }}
          >
            <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0">
              <img src={docUrl} alt="ID Document" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="font-bold text-primary">{seller.fullName || 'Your Name'}</span>
              <span className="text-secondary font-tnum">ID No: KEN-849201948</span>
              <div className="flex items-center gap-1.5 mt-1" style={{ color: '#10B981' }}>
                <span className="material-symbols-outlined text-[14px]">verified</span>
                <span className="font-semibold text-[11px]">Cleanverse AI Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <button
        onClick={handleCleanverseCheck}
        disabled={isVerifying}
        className="w-full h-14 rounded-2xl text-sm font-extrabold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
        style={{
          background: 'linear-gradient(135deg,#C9922A 0%,#E8B96A 100%)',
          boxShadow: '0 8px 24px rgba(201,146,42,0.35)',
        }}
      >
        {isVerifying ? (
          <>
            <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
            Sending to Cleanverse AI…
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-lg">shield</span>
            Verify ID & Unlock $500
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </>
        )}
      </button>
    </div>
  );
};
