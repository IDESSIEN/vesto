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

  const sectionStyle: React.CSSProperties = {
    background: 'var(--surface-card)', border: '1px solid var(--border)',
    borderRadius: '13px', overflow: 'hidden', position: 'relative',
  };

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '28px 16px 80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Nav row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => setSellerView('signup')}
          style={{ width: '36px', height: '36px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--secondary)', cursor: 'pointer' }}
        ><ArrowLeft /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: '3px', borderRadius: '999px', background: i <= 2 ? 'linear-gradient(90deg,#C9922A,#E8B96A)' : 'var(--border)', width: i === 2 ? '28px' : '18px', transition: 'width 300ms' }} />
            ))}
          </div>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step 2 of 3</span>
        </div>
        <div style={{ width: '36px' }} />
      </div>

      {/* Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '999px', background: 'rgba(4,120,87,0.10)', border: '1px solid rgba(4,120,87,0.18)', color: '#047857', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px' }}>
          <VerifiedBadge />
          Cleanverse AI
        </div>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '26px', letterSpacing: '-0.03em', color: 'var(--primary)', lineHeight: 1.05, marginBottom: '8px' }}>
          Tier 1 Verification
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--secondary)', lineHeight: 1.55 }}>
          Government-issued ID check. Clear passes unlock your <strong style={{ color: 'var(--primary)' }}>$500 credit limit</strong> instantly.
        </p>
      </div>

      {/* Credit card */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: '13px', padding: '20px',
        background: 'linear-gradient(135deg,#0A1628,#112240)',
        border: '1px solid rgba(201,146,42,0.22)',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.022, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.38)', marginBottom: '6px' }}>Micro credit limit</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '34px', color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>$500</p>
            <p style={{ fontSize: '10.5px', fontWeight: 600, color: '#E8B96A', marginTop: '6px' }}>Unlocked on clear pass</p>
          </div>
          <div style={{
            width: '52px', height: '52px', borderRadius: '13px',
            background: 'rgba(201,146,42,0.13)', border: '1px solid rgba(201,146,42,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '18px', color: '#E8B96A',
          }}>T1</div>
        </div>
      </div>

      {/* Demo sim */}
      <div style={{ ...sectionStyle, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--secondary)' }}>Demo simulation</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['pass', 'fail', 'uncertain'] as const).map((mode) => (
            <button key={mode} onClick={() => setVerificationOutcome(mode)}
              style={{
                padding: '4px 12px', borderRadius: '6px', fontSize: '9.5px', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer',
                transition: 'all 150ms', border: 'none',
                background: verificationOutcome === mode
                  ? (mode === 'pass' ? '#047857' : mode === 'fail' ? '#DC2626' : '#7C3AED')
                  : 'var(--canvas)',
                color: verificationOutcome === mode ? '#fff' : 'var(--secondary)',
                boxShadow: verificationOutcome === mode ? 'none' : 'inset 0 0 0 1px var(--border)',
              }}
            >{mode}</button>
          ))}
        </div>
      </div>

      {/* Rejection */}
      {rejectionResult && (
        <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '11px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#EF4444', fontSize: '13px', fontWeight: 700 }}>
            <ErrorIcon /> Verification rejected
          </div>
          <p style={{ fontSize: '12.5px', lineHeight: 1.55, color: 'var(--secondary)' }}>
            {rejectionResult.failureReason || 'Document photo was too dark or blurry.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 600, paddingTop: '8px', borderTop: '1px solid rgba(239,68,68,0.12)', color: '#EF4444' }}>
            <span>Confidence: {rejectionResult.confidenceScore}%</span>
            <span>Re-upload a clear photo</span>
          </div>
        </div>
      )}

      {/* ID preview */}
      <div style={sectionStyle}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>Government ID (Front)</span>
            <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px', background: 'rgba(4,120,87,0.09)', color: '#047857', border: '1px solid rgba(4,120,87,0.18)' }}>Ready</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--canvas)', border: '1px solid var(--border)', borderRadius: '9px', padding: '10px' }}>
            <div style={{ width: '72px', height: '88px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
              <img src={docUrl} alt="ID Document" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px' }}>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{seller.fullName || 'Your Name'}</span>
              <span style={{ color: 'var(--secondary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>ID No: KEN-849201948</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#047857', fontSize: '10.5px', fontWeight: 600, marginTop: '3px' }}>
                <VerifiedBadge />
                Cleanverse AI Ready
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleCleanverseCheck}
        disabled={isVerifying}
        style={{
          width: '100%', height: '50px', borderRadius: '11px',
          fontSize: '13.5px', fontWeight: 700, color: '#fff',
          background: 'linear-gradient(135deg,#C9922A,#E8B96A)', border: 'none',
          cursor: isVerifying ? 'wait' : 'pointer',
          boxShadow: '0 6px 20px rgba(201,146,42,0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          opacity: isVerifying ? 0.75 : 1, transition: 'all 180ms', letterSpacing: '-0.01em',
        }}
      >
        {isVerifying ? (
          <><SpinnerIcon /> Sending to Cleanverse AI</>
        ) : (
          <><ShieldIcon /> Verify identity and unlock $500 <ArrowRight /></>
        )}
      </button>
    </div>
  );
};
