import React, { useState, useRef, useCallback } from 'react';
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
const BuildingIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="3" width="10" height="9" rx="1.5"/>
    <path d="M4.5 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"/>
    <path d="M1.5 7h10"/><path d="M5 10h3"/>
  </svg>
);
const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 14V7"/><path d="M7 10l3-3 3 3"/><rect x="3" y="3" width="14" height="11" rx="2"/><path d="M3 17h14"/>
  </svg>
);
const FileCheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8l-4-6z"/>
    <path d="M12 2v6h6"/><path d="M8 13l1.5 1.5L13 11"/>
  </svg>
);
const VideocamIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="10" height="8" rx="1.5"/>
    <path d="M11 6.5l4-2v7l-4-2V6.5z"/>
  </svg>
);
const RecordIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="7" cy="7" r="3.5" fill="currentColor"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7" cy="7" r="6"/><path d="M4.5 7l2 2 3-3"/>
  </svg>
);
const ReplayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 7a4.5 4.5 0 1 0 .8-2.6"/><path d="M2.5 3v2.5H5"/>
  </svg>
);
const ErrorIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="7.5" r="6"/><path d="M7.5 4.5v4"/><circle cx="7.5" cy="10.5" r="0.7" fill="currentColor" stroke="none"/>
  </svg>
);
const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="animate-spin">
    <circle cx="8" cy="8" r="6" strokeOpacity="0.25"/>
    <path d="M8 2a6 6 0 0 1 6 6" strokeOpacity="1"/>
  </svg>
);

export const Tier2Verification: React.FC = () => {
  const { setSellerView, submitVerification, showToast, seller } = useApp();
  const [taxId, setTaxId] = useState('');
  const [fileName, setFileName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationOutcome, setVerificationOutcome] = useState<'pass' | 'fail' | 'uncertain'>('pass');
  const [rejectionResult, setRejectionResult] = useState<CleanverseResult | null>(null);

  type VideoState = 'idle' | 'requesting' | 'recording' | 'recorded' | 'error';
  const [videoState, setVideoState] = useState<VideoState>('idle');
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const docUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuChP_Oslw2qMuh5bd2tcx9zj5kjSF7v_-iaDTnr91VIWCYs4uByYBKSpApEGff-h3SWoL4rhAhGE-ZhMuCvQw3n4IzHgI8IUHaRpgFHbRay1FIhFRhK-QCoVrGUJASOziVbldbFi6hojbMatzzuqaUKp-_TphUKJKJUaYfOzRWpTSK4cQIKL4RPNSAboBg4aCeMll5BCPi_v0cQt-GhG5Rcb3lBeBuaJX_iAAuika0sYNZzZyXAW8hS1g';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFileName(e.target.files[0].name);
  };

  const stopStream = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startRecording = useCallback(async () => {
    setCameraError('');
    setVideoState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true,
      });
      streamRef.current = stream;
      setVideoState('recording');
      await new Promise(r => setTimeout(r, 0));
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        try { await videoRef.current.play(); } catch { /* autoplay policy ok for muted */ }
      }
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setVideoBlob(blob);
        setVideoPreviewUrl(URL.createObjectURL(blob));
        setVideoState('recorded');
        stopStream();
      };
      recorder.start(250);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch (err: unknown) {
      setVideoState('error');
      const msg = err instanceof Error ? err.message : '';
      setCameraError(msg.includes('Permission') || msg.includes('denied')
        ? 'Camera access denied. Allow it in your browser settings and try again.'
        : 'Could not open the camera. Check your device and try again.');
      setVideoEnabled(false);
    }
  }, [stopStream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const retakeVideo = useCallback(() => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoBlob(null); setVideoPreviewUrl(null); setVideoState('idle'); setRecordingSeconds(0);
  }, [videoPreviewUrl]);

  const handleVideoToggle = useCallback(() => {
    const next = !videoEnabled;
    setVideoEnabled(next);
    if (next) startRecording(); else { stopRecording(); retakeVideo(); }
  }, [videoEnabled, startRecording, stopRecording, retakeVideo]);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleCleanverseCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true); setRejectionResult(null);
    try {
      const videoUrl = videoBlob ? URL.createObjectURL(videoBlob) : undefined;
      const result = await cleanverseService.verifyTier2BusinessDocument(docUrl, seller.businessName, videoUrl, verificationOutcome);
      setIsVerifying(false);
      if (result.status === 'pass') {
        submitVerification(2, 'Tax & Bank Registration (Tier 2)', docUrl);
        showToast(`Business verified at ${result.confidenceScore}% confidence. $5,000 limit unlocked.`, 'success');
        setSellerView('dashboard');
      } else if (result.status === 'fail') {
        setRejectionResult(result);
        showToast('Tier 2 rejected. See details below.', 'warning');
      } else {
        submitVerification(2, 'Tax & Bank Registration (Tier 2)', docUrl);
        showToast("Flagged for human review. You'll hear back in 24 hours.", 'info');
        setSellerView('in_progress');
      }
    } catch {
      setIsVerifying(false);
      showToast('Could not reach Cleanverse. Please try again.', 'warning');
    }
  };

  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#C9922A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,146,42,0.08)'; };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; };

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '28px 16px 80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Nav row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => setSellerView('tier1')}
          style={{ width: '36px', height: '36px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-card)', border: '1px solid var(--border)', color: 'var(--secondary)', cursor: 'pointer' }}
        ><ArrowLeft /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: '3px', borderRadius: '999px', background: 'linear-gradient(90deg,#C9922A,#E8B96A)', width: i === 3 ? '28px' : '18px', transition: 'width 300ms' }} />
            ))}
          </div>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step 3 of 3</span>
        </div>
        <div style={{ width: '36px' }} />
      </div>

      {/* Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '999px', background: 'rgba(201,146,42,0.09)', border: '1px solid rgba(201,146,42,0.20)', color: '#C9922A', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px' }}>
          <BuildingIcon /> Cleanverse Commercial
        </div>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '26px', letterSpacing: '-0.03em', color: 'var(--primary)', lineHeight: 1.05, marginBottom: '8px' }}>
          Tier 2 Verification
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--secondary)', lineHeight: 1.55 }}>
          Business document check. Clear passes unlock your <strong style={{ color: 'var(--primary)' }}>$5,000 credit limit</strong> automatically.
        </p>
      </div>

      {/* Credit card */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '13px', padding: '20px', background: 'linear-gradient(135deg,#0A1628,#112240)', border: '1px solid rgba(201,146,42,0.22)' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.022, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.38)', marginBottom: '6px' }}>Commercial credit limit</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '34px', color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>$5,000</p>
            <p style={{ fontSize: '10.5px', fontWeight: 600, color: '#E8B96A', marginTop: '6px' }}>Unlocked on clear pass</p>
          </div>
          <div style={{ width: '52px', height: '52px', borderRadius: '13px', background: 'rgba(201,146,42,0.13)', border: '1px solid rgba(201,146,42,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: '18px', color: '#E8B96A' }}>T2</div>
        </div>
      </div>

      {/* Demo sim */}
      <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: '11px', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--secondary)' }}>Demo simulation</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['pass', 'fail', 'uncertain'] as const).map((mode) => (
            <button key={mode} onClick={() => setVerificationOutcome(mode)}
              style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 150ms', border: 'none', background: verificationOutcome === mode ? (mode === 'pass' ? '#047857' : mode === 'fail' ? '#DC2626' : '#7C3AED') : 'var(--canvas)', color: verificationOutcome === mode ? '#fff' : 'var(--secondary)', boxShadow: verificationOutcome === mode ? 'none' : 'inset 0 0 0 1px var(--border)' }}
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
            {rejectionResult.failureReason || 'Tax PIN could not be verified against the jurisdiction registry.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 600, paddingTop: '8px', borderTop: '1px solid rgba(239,68,68,0.12)', color: '#EF4444' }}>
            <span>PIN verified: {rejectionResult.taxIdVerified ? 'Yes' : 'No'}</span>
            <span>Upload a valid tax certificate</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleCleanverseCheck} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border)', borderRadius: '13px', overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
          <div style={{ padding: '18px', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Tax ID */}
            <div>
              <label style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--secondary)', marginBottom: '5px', display: 'block' }}>KRA / National Tax PIN</label>
              <input type="text" required value={taxId} onChange={e => setTaxId(e.target.value)}
                placeholder="e.g. P051928401Z"
                style={{ width: '100%', height: '46px', padding: '0 12px', borderRadius: '9px', fontSize: '13px', color: 'var(--primary)', fontFamily: 'JetBrains Mono, monospace', background: 'var(--canvas)', border: '1px solid var(--border)', outline: 'none', boxSizing: 'border-box' }}
                onFocus={inputFocus} onBlur={inputBlur}
              />
            </div>

            {/* Document upload */}
            <div>
              <label style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--secondary)', marginBottom: '5px', display: 'block' }}>Business Tax Cert / Bank Statement</label>
              <div style={{ position: 'relative', border: `1.5px dashed ${fileName ? '#C9922A' : 'var(--border)'}`, borderRadius: '9px', padding: '14px', background: fileName ? 'rgba(201,146,42,0.03)' : 'var(--canvas)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 200ms' }}>
                <input type="file" accept=".pdf,.jpg,.png" onChange={handleFileChange}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                <div style={{ color: fileName ? '#C9922A' : 'var(--secondary)', flexShrink: 0 }}>
                  {fileName ? <FileCheckIcon /> : <UploadIcon />}
                </div>
                <div>
                  <p style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--primary)' }}>{fileName || 'Click to upload document'}</p>
                  <p style={{ fontSize: '10.5px', color: 'var(--secondary)', marginTop: '1px' }}>PDF, PNG, JPG up to 15 MB</p>
                </div>
              </div>
            </div>

            {/* Video toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '9px',
                  background: videoEnabled ? 'rgba(4,120,87,0.05)' : 'var(--canvas)',
                  border: `1px solid ${videoEnabled ? 'rgba(4,120,87,0.22)' : 'var(--border)'}`,
                  transition: 'all 200ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ color: videoState === 'recording' ? '#EF4444' : videoState === 'recorded' ? '#047857' : '#C9922A', flexShrink: 0 }}>
                    {videoState === 'recording' ? <RecordIcon /> : videoState === 'recorded' ? <CheckIcon /> : <VideocamIcon />}
                  </div>
                  <div>
                    <p style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--primary)' }}>Shop / Farm walkthrough video</p>
                    <p style={{ fontSize: '10.5px', color: videoState === 'recording' ? '#EF4444' : videoState === 'recorded' ? '#047857' : 'var(--secondary)', fontWeight: videoState !== 'idle' ? 600 : 400 }}>
                      {videoState === 'requesting' && 'Opening camera…'}
                      {videoState === 'recording' && `Recording ${fmtTime(recordingSeconds)}`}
                      {videoState === 'recorded' && `Recorded (${fmtTime(recordingSeconds)}) — boosts score +15%`}
                      {videoState === 'error' && 'Camera error — tap to retry'}
                      {videoState === 'idle' && 'Boosts confidence score by up to 15%'}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={handleVideoToggle}
                  style={{ width: '40px', height: '22px', borderRadius: '999px', position: 'relative', flexShrink: 0, background: videoEnabled ? 'linear-gradient(135deg,#047857,#10B981)' : 'var(--border)', border: 'none', cursor: 'pointer', transition: 'all 200ms' }}>
                  <div style={{ position: 'absolute', top: '3px', width: '16px', height: '16px', background: '#fff', borderRadius: '999px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'all 200ms', left: videoEnabled ? '21px' : '3px' }} />
                </button>
              </div>

              {videoState === 'error' && cameraError && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '11px 13px', borderRadius: '9px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', color: '#EF4444', fontSize: '12px' }}>
                  <ErrorIcon /><span style={{ lineHeight: 1.5 }}>{cameraError}</span>
                </div>
              )}

              {/* Live viewfinder — always mounted */}
              <div style={{ position: 'relative', borderRadius: '11px', overflow: 'hidden', background: '#000', border: '1.5px solid #EF4444', aspectRatio: '16/9', display: videoState === 'recording' ? 'block' : 'none' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '999px', background: '#EF4444', color: '#fff', fontSize: '9.5px', fontWeight: 800 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: '#fff', animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite', display: 'inline-block' }} />
                  REC {fmtTime(recordingSeconds)}
                </div>
                <button type="button" onClick={stopRecording}
                  style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '999px', background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11.5px', fontWeight: 700, boxShadow: '0 4px 14px rgba(239,68,68,0.4)' }}>
                  <span style={{ width: '10px', height: '10px', background: '#fff', borderRadius: '2px', flexShrink: 0 }} />
                  Stop recording
                </button>
              </div>

              {/* Playback */}
              {videoState === 'recorded' && videoPreviewUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ position: 'relative', borderRadius: '11px', overflow: 'hidden', background: '#000', border: '1px solid rgba(4,120,87,0.28)', aspectRatio: '16/9' }}>
                    <video src={videoPreviewUrl} controls playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '999px', background: 'rgba(4,120,87,0.82)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: '9.5px', fontWeight: 800 }}>
                      <CheckIcon /> Recorded · {fmtTime(recordingSeconds)}
                    </div>
                  </div>
                  <button type="button" onClick={retakeVideo}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '9px', background: 'var(--canvas)', border: '1px solid var(--border)', color: 'var(--secondary)', cursor: 'pointer', fontSize: '11.5px', fontWeight: 600 }}>
                    <ReplayIcon /> Retake
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button type="submit" disabled={isVerifying}
          style={{ width: '100%', height: '50px', borderRadius: '11px', fontSize: '13.5px', fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#C9922A,#E8B96A)', border: 'none', cursor: isVerifying ? 'wait' : 'pointer', boxShadow: '0 6px 20px rgba(201,146,42,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isVerifying ? 0.75 : 1, transition: 'all 180ms', letterSpacing: '-0.01em' }}>
          {isVerifying ? <><SpinnerIcon /> Verifying with Cleanverse</> : <><BuildingIcon /> Verify business and unlock $5,000 <ArrowRight /></>}
        </button>
      </form>
    </div>
  );
};
