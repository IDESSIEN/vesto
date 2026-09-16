import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { cleanverseService, CleanverseResult } from '../../services/cleanverseService';

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
      const result = await cleanverseService.verifyTier1GovernmentId(
        docUrl,
        seller.fullName,
        verificationOutcome
      );

      setIsVerifying(false);

      if (result.status === 'pass') {
        // Clear Pass -> Auto-Unlock Tier 1 ($500)
        submitVerification(1, 'National ID Photo (Tier 1)', docUrl);
        showToast(`Cleanverse Verification Passed (${result.confidenceScore}% Score)! $500 Micro-Limit unlocked automatically.`, 'success');
        setSellerView('dashboard');
      } else if (result.status === 'fail') {
        // Clear Fail -> Friendly rejection message with reason
        setRejectionResult(result);
        showToast('Cleanverse Verification Rejected: See feedback below.', 'warning');
      } else {
        // Uncertain -> Escalate to Admin Queue for human review
        submitVerification(1, 'National ID Photo (Tier 1)', docUrl);
        showToast('Cleanverse flagged item as uncertain. Sent to Admin Queue for human review.', 'info');
        setSellerView('in_progress');
      }
    } catch (err) {
      setIsVerifying(false);
      showToast('Error calling Cleanverse verification service.', 'warning');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setSellerView('signup')}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-on-surface hover:bg-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div className="flex items-center space-x-1 bg-surface-container px-3 py-1 rounded-full">
          <span className="font-label-sm text-xs text-secondary font-semibold">STEP 2 OF 3</span>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-success-shamrock text-white">
            <span className="material-symbols-outlined text-sm">verified</span>
          </span>
          <span className="font-label-md text-xs text-success-shamrock uppercase font-bold tracking-wider">
            Cleanverse AI Powered
          </span>
        </div>
        <h1 className="font-headline text-2xl font-bold text-primary-container">Tier 1 Verification</h1>
        <p className="font-body-md text-sm text-secondary mt-1">
          Government-issued ID verification using Cleanverse AI. Clear passes unlock $500 instantly.
        </p>
      </div>

      {/* Test Outcome Selector for Demonstration */}
      <div className="bg-surface-container-low p-3 rounded-xl border border-border-subtle mb-6 flex items-center justify-between text-xs">
        <span className="text-secondary font-semibold">Cleanverse API Simulation:</span>
        <div className="flex gap-2">
          {(['pass', 'fail', 'uncertain'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setVerificationOutcome(mode)}
              className={`px-2.5 py-1 rounded-md font-bold uppercase text-[10px] transition-all ${
                verificationOutcome === mode
                  ? mode === 'pass'
                    ? 'bg-success-shamrock text-white'
                    : mode === 'fail'
                    ? 'bg-error text-white'
                    : 'bg-on-tertiary-container text-white'
                  : 'bg-surface-card text-secondary border border-border-subtle'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Rejection Feedback Banner if Clear Fail */}
      {rejectionResult && (
        <div className="bg-error-container/80 border border-error text-error p-5 rounded-xl mb-6 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className="material-symbols-outlined text-xl">error</span>
            <span>Cleanverse Verification Rejected</span>
          </div>
          <p className="text-xs text-on-error-container leading-relaxed">
            {rejectionResult.failureReason || 'Document photo was too dark or blurry.'}
          </p>
          <div className="pt-2 border-t border-error/30 text-[11px] font-medium text-error flex justify-between">
            <span>Confidence Score: {rejectionResult.confidenceScore}%</span>
            <span>Action Required: Please re-upload a clear, bright photo of your ID.</span>
          </div>
        </div>
      )}

      {/* Micro-Limit Summary Card */}
      <div className="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle mb-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-label-sm text-xs text-secondary uppercase tracking-wider font-semibold">Micro-Limit Target</span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="font-headline text-3xl font-extrabold text-success-shamrock">$500</span>
              <span className="font-body-sm text-xs text-secondary">USD instant advance</span>
            </div>
          </div>
          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-sm text-xs font-semibold">
            Tier 1 Limit
          </span>
        </div>
      </div>

      {/* ID Document Preview */}
      <div className="bg-surface-card rounded-xl p-4 shadow-sm border border-border-subtle mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-label-md text-xs font-semibold text-primary-container">Government ID (Front)</span>
          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold">
            Ready for Cleanverse Scan
          </span>
        </div>

        <div className="relative w-full rounded-lg bg-surface-container-high p-3 flex items-center gap-4">
          <div className="w-20 h-24 rounded-lg overflow-hidden shrink-0 bg-surface-variant border border-border-subtle">
            <img src={docUrl} alt="ID Document" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col gap-1 flex-1 text-xs">
            <span className="font-bold text-primary">{seller.fullName}</span>
            <span className="text-secondary text-[11px]">ID No: KEN-849201948</span>
            <span className="text-success-shamrock font-semibold text-[11px]">Cleanverse AI Ready</span>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <button
        onClick={handleCleanverseCheck}
        disabled={isVerifying}
        className="w-full h-13 bg-primary text-white font-label-lg font-bold rounded-xl hover:bg-primary-container shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 py-3"
      >
        {isVerifying ? (
          <>
            <span className="material-symbols-outlined text-lg animate-spin">autorenew</span>
            <span>Sending to Cleanverse AI...</span>
          </>
        ) : (
          <>
            <span>Verify with Cleanverse & Unlock $500</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </>
        )}
      </button>
    </div>
  );
};
