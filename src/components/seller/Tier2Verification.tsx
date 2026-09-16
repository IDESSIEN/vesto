import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { cleanverseService, CleanverseResult } from '../../services/cleanverseService';

export const Tier2Verification: React.FC = () => {
  const { setSellerView, submitVerification, showToast, seller } = useApp();
  const [taxId, setTaxId] = useState('P051928401Z');
  const [fileName, setFileName] = useState('nairobi_fresh_tax_cert_2026.pdf');
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationOutcome, setVerificationOutcome] = useState<'pass' | 'fail' | 'uncertain'>('pass');
  const [rejectionResult, setRejectionResult] = useState<CleanverseResult | null>(null);

  const docUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuChP_Oslw2qMuh5bd2tcx9zj5kjSF7v_-iaDTnr91VIWCYs4uByYBKSpApEGff-h3SWoL4rhAhGE-ZhMuCvQw3n4IzHgI8IUHaRpgFHbRay1FIhFRhK-QCoVrGUJASOziVbldbFi6hojbMatzzuqaUKp-_TphUKJKJUaYfOzRWpTSK4cQIKL4RPNSAboBg4aCeMll5BCPi_v0cQt-GhG5Rcb3lBeBuaJX_iAAuika0sYNZzZyXAW8hS1g';

  const handleCleanverseCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setRejectionResult(null);

    try {
      const result = await cleanverseService.verifyTier2BusinessDocument(
        docUrl,
        seller.businessName,
        videoUploaded ? 'https://cleanverse.io/videos/shop_farm_scan.mp4' : undefined,
        verificationOutcome
      );

      setIsVerifying(false);

      if (result.status === 'pass') {
        // Clear Pass -> Auto-Unlock Tier 2 ($5,000)
        submitVerification(2, 'Tax & Bank Registration (Tier 2)', docUrl);
        showToast(`Cleanverse Verification Passed (${result.confidenceScore}% Score)! $5,000 Limit unlocked automatically.`, 'success');
        setSellerView('dashboard');
      } else if (result.status === 'fail') {
        // Clear Fail -> Friendly rejection message
        setRejectionResult(result);
        showToast('Cleanverse Tier 2 Verification Rejected: See feedback below.', 'warning');
      } else {
        // Uncertain -> Escalate to Admin Queue
        submitVerification(2, 'Tax & Bank Registration (Tier 2)', docUrl);
        showToast('Cleanverse flagged location metadata as uncertain. Sent to Admin Queue for human inspection.', 'info');
        setSellerView('in_progress');
      }
    } catch (err) {
      setIsVerifying(false);
      showToast('Error calling Cleanverse verification service.', 'warning');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setSellerView('tier1')}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-on-surface hover:bg-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div className="flex items-center space-x-1 bg-surface-container px-3 py-1 rounded-full">
          <span className="font-label-sm text-xs text-secondary font-semibold">STEP 3 OF 3</span>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-tertiary-fixed-dim text-primary">
            <span className="material-symbols-outlined text-sm">stars</span>
          </span>
          <span className="font-label-md text-xs text-on-tertiary-container uppercase font-bold tracking-wider">
            Cleanverse Commercial Verification
          </span>
        </div>
        <h1 className="font-headline text-2xl font-bold text-primary-container">Tier 2 Verification ($5,000)</h1>
        <p className="font-body-md text-sm text-secondary mt-1">
          Submit business PIN or shop/farm video for Cleanverse verification. Clear passes unlock $5,000 automatically.
        </p>
      </div>

      {/* Test Outcome Selector */}
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

      {/* Rejection Banner */}
      {rejectionResult && (
        <div className="bg-error-container/80 border border-error text-error p-5 rounded-xl mb-6 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className="material-symbols-outlined text-xl">error</span>
            <span>Cleanverse Verification Rejected</span>
          </div>
          <p className="text-xs text-on-error-container leading-relaxed">
            {rejectionResult.failureReason || 'Tax PIN could not be verified against jurisdiction registry.'}
          </p>
          <div className="pt-2 border-t border-error/30 text-[11px] font-medium text-error flex justify-between">
            <span>Tax PIN Verified: {rejectionResult.taxIdVerified ? 'Yes' : 'No'}</span>
            <span>Action Required: Please verify your PIN or upload a valid tax certificate.</span>
          </div>
        </div>
      )}

      <form onSubmit={handleCleanverseCheck} className="flex flex-col gap-6">
        {/* Target Limit Banner */}
        <div className="bg-gradient-to-r from-primary-container to-primary text-white p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-inverse-primary font-semibold">Target Credit Limit</span>
            <div className="text-3xl font-extrabold text-white mt-1">$5,000.00</div>
            <span className="text-xs text-primary-fixed-dim">Cleanverse Auto-Unlock Enabled</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-primary flex items-center justify-center font-bold text-lg">
            5K
          </div>
        </div>

        {/* Form Controls */}
        <div className="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-xs font-semibold text-on-surface-variant">
              KRA / National Tax PIN Number
            </label>
            <input
              type="text"
              required
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full h-12 px-3 rounded-lg bg-surface-container-lowest font-body-md text-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-md text-xs font-semibold text-on-surface-variant">
              Business Tax Cert or Bank Statement (PDF)
            </label>
            <div className="p-4 rounded-lg border border-border-subtle bg-surface-container-lowest flex items-center justify-between text-xs">
              <span className="font-bold text-primary">{fileName}</span>
              <span className="text-success-shamrock font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>Attached</span>
              </span>
            </div>
          </div>

          {/* Shop / Farm Video Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low border border-border-subtle text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">videocam</span>
              <span className="font-semibold text-primary">Include Shop/Farm Walkthrough Video</span>
            </div>
            <button
              type="button"
              onClick={() => setVideoUploaded((prev) => !prev)}
              className={`w-10 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                videoUploaded ? 'bg-success-shamrock' : 'bg-surface-container-high'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${
                  videoUploaded ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isVerifying}
          className="w-full h-13 bg-primary text-white font-label-lg font-bold rounded-xl hover:bg-primary-container shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 py-3"
        >
          {isVerifying ? (
            <>
              <span className="material-symbols-outlined text-lg animate-spin">autorenew</span>
              <span>Cleanverse Verifying Business Registry...</span>
            </>
          ) : (
            <>
              <span>Verify with Cleanverse & Unlock $5,000</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
