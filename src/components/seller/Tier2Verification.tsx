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

  const isRecording = videoState === 'recording';
  const isRecorded  = videoState === 'recorded';

  return (
    <div className="max-w-[520px] mx-auto px-4 py-7 pb-20 flex flex-col gap-4 view-enter">

      {/* Nav row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSellerView('tier1')}
          className="w-9 h-9 rounded-[9px] flex items-center justify-center transition-all duration-150 hover:bg-[rgba(13,24,36,0.06)] active:scale-[0.97]"
          style={{ background: 'var(--cream)', border: '1px solid var(--border-2)', color: 'var(--ink-muted)' }}
        ><ArrowLeft /></button>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1,2,3].map(i => (
              <div
                key={i}
                className="h-[3px] rounded-full transition-all duration-300"
                style={{ width: i === 3 ? '28px' : '18px', background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }}
              />
            ))}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.10em]" style={{ color: 'var(--ink-subtle)' }}>
            Step 3 of 3
          </span>
        </div>
        <div className="w-9" />
      </div>

      {/* Header */}
      <div>
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.06em] mb-3"
          style={{ background: 'rgba(201,146,42,0.09)', border: '1px solid rgba(201,146,42,0.20)', color: '#C9922A' }}
        >
          <BuildingIcon /> Cleanverse Commercial
        </div>
        <h1
          className="font-display font-extrabold text-ink mb-2"
          style={{ fontSize: '26px', letterSpacing: '-0.03em', lineHeight: 1.05 }}
        >
          Tier 2 Business Check
        </h1>
        <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-subtle)' }}>
          Business document verification. A clear pass unlocks your{' '}
          <strong className="text-ink">$5,000 advance limit</strong> automatically.
        </p>
      </div>

      {/* Credit hero */}
      <div
        className="relative rounded-[13px] p-5 overflow-hidden grain-overlay"
        style={{ background: 'linear-gradient(135deg,#0A1628,#112240)', border: '1px solid rgba(201,146,42,0.22)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.022, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] mb-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
              Commercial advance limit
            </p>
            <p className="font-mono font-extrabold text-white font-tnum leading-none" style={{ fontSize: '34px', letterSpacing: '-0.04em' }}>
              $5,000
            </p>
            <p className="text-[10.5px] font-semibold mt-1.5" style={{ color: '#E8B96A' }}>
              Unlocked on clear pass
            </p>
          </div>
          <div
            className="w-[52px] h-[52px] rounded-[13px] flex items-center justify-center font-display font-extrabold"
            style={{ fontSize: '18px', color: '#E8B96A', background: 'rgba(201,146,42,0.13)', border: '1px solid rgba(201,146,42,0.28)' }}
          >
            T2
          </div>
        </div>
      </div>

      {/* Demo sim */}
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
                border: 'none', cursor: 'pointer',
                background: verificationOutcome === mode
                  ? (mode === 'pass' ? '#047857' : mode === 'fail' ? '#DC2626' : '#7C3AED')
                  : 'var(--bg)',
                color: verificationOutcome === mode ? '#fff' : 'var(--ink-muted)',
                boxShadow: verificationOutcome === mode ? 'none' : 'inset 0 0 0 1px var(--border)',
              }}
            >{mode}</button>
          ))}
        </div>
      </div>

      {/* Rejection */}
      {rejectionResult && (
        <div
          className="rounded-[11px] px-4 py-3.5 flex flex-col gap-2"
          style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)' }}
        >
          <div className="flex items-center gap-2 text-[13px] font-bold" style={{ color: '#EF4444' }}>
            <ErrorIcon /> Verification rejected
          </div>
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--ink-subtle)' }}>
            {rejectionResult.failureReason || 'Tax PIN could not be verified against the jurisdiction registry.'}
          </p>
          <div
            className="flex justify-between text-[10.5px] font-semibold pt-2"
            style={{ borderTop: '1px solid rgba(239,68,68,0.12)', color: '#EF4444' }}
          >
            <span>PIN verified: {rejectionResult.taxIdVerified ? 'Yes' : 'No'}</span>
            <span>Upload a valid tax certificate</span>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleCleanverseCheck} className="flex flex-col gap-3">
        <div
          className="relative rounded-[13px] overflow-hidden"
          style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
          <div className="p-5 pt-6 flex flex-col gap-4">

            {/* Tax ID */}
            <div>
              <label className="field-label">KRA / National Tax PIN</label>
              <input
                type="text" required value={taxId}
                onChange={e => setTaxId(e.target.value)}
                placeholder="e.g. P051928401Z"
                className="input font-mono"
                style={{ fontSize: '13px' }}
              />
            </div>

            {/* Document upload */}
            <div>
              <label className="field-label">Business Tax Cert / Bank Statement</label>
              <label
                className="relative flex items-center gap-2.5 p-3.5 rounded-[9px] cursor-pointer transition-all duration-200"
                style={{
                  border: `1.5px dashed ${fileName ? '#C9922A' : 'var(--border-2)'}`,
                  background: fileName ? 'rgba(201,146,42,0.03)' : 'var(--bg)',
                }}
              >
                <input
                  type="file" accept=".pdf,.jpg,.png"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span style={{ color: fileName ? '#C9922A' : 'var(--ink-subtle)', flexShrink: 0 }}>
                  {fileName ? <FileCheckIcon /> : <UploadIcon />}
                </span>
                <div>
                  <p className="text-[12.5px] font-semibold text-ink">{fileName || 'Click to upload document'}</p>
                  <p className="text-[10.5px]" style={{ color: 'var(--ink-faint)' }}>PDF, PNG, JPG up to 15 MB</p>
                </div>
              </label>
            </div>

            {/* Video toggle row */}
            <div className="flex flex-col gap-2.5">
              <div
                className="flex items-center justify-between px-3.5 py-3 rounded-[9px] transition-all duration-200"
                style={{
                  background: videoEnabled ? 'rgba(4,120,87,0.05)' : 'var(--bg)',
                  border: `1px solid ${videoEnabled ? 'rgba(4,120,87,0.22)' : 'var(--border)'}`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    style={{
                      color: isRecording ? '#EF4444' : isRecorded ? '#047857' : '#C9922A',
                      flexShrink: 0,
                    }}
                  >
                    {isRecording ? <RecordIcon /> : isRecorded ? <CheckIcon /> : <VideocamIcon />}
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-ink">Shop / farm walkthrough</p>
                    <p
                      className="text-[10.5px]"
                      style={{
                        color: isRecording ? '#EF4444' : isRecorded ? '#047857' : 'var(--ink-subtle)',
                        fontWeight: videoState !== 'idle' ? 600 : 400,
                      }}
                    >
                      {videoState === 'requesting'  && 'Opening camera…'}
                      {isRecording                  && `Recording ${fmtTime(recordingSeconds)}`}
                      {isRecorded                   && `Recorded (${fmtTime(recordingSeconds)}) · boosts score +15%`}
                      {videoState === 'error'        && 'Camera error — tap to retry'}
                      {videoState === 'idle'         && 'Boosts confidence score by up to 15%'}
                    </p>
                  </div>
                </div>
                {/* Toggle */}
                <button
                  type="button"
                  onClick={handleVideoToggle}
                  className="relative shrink-0 transition-all duration-200"
                  style={{
                    width: '40px', height: '22px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                    background: videoEnabled ? 'linear-gradient(135deg,#047857,#10B981)' : 'var(--border)',
                  }}
                >
                  <div
                    className="absolute top-[3px] w-4 h-4 rounded-full transition-all duration-200"
                    style={{
                      background: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      left: videoEnabled ? '21px' : '3px',
                    }}
                  />
                </button>
              </div>

              {/* Camera error */}
              {videoState === 'error' && cameraError && (
                <div
                  className="flex items-start gap-2 px-3 py-2.5 rounded-[9px] text-[12px]"
                  style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', color: '#EF4444' }}
                >
                  <ErrorIcon /><span className="leading-relaxed">{cameraError}</span>
                </div>
              )}

              {/* Live viewfinder — always mounted, shown only when recording */}
              <div
                className="relative rounded-[11px] overflow-hidden bg-black"
                style={{
                  border: '1.5px solid #EF4444',
                  aspectRatio: '16/9',
                  display: isRecording ? 'block' : 'none',
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay playsInline muted
                  className="w-full h-full object-cover block"
                />
                <div
                  className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9.5px] font-extrabold text-white"
                  style={{ background: '#EF4444' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
                  REC {fmtTime(recordingSeconds)}
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full text-white font-bold text-[11.5px]"
                  style={{ background: '#EF4444', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(239,68,68,0.4)' }}
                >
                  <span className="w-2.5 h-2.5 bg-white rounded-[2px] shrink-0" />
                  Stop recording
                </button>
              </div>

              {/* Playback */}
              {isRecorded && videoPreviewUrl && (
                <div className="flex flex-col gap-2">
                  <div
                    className="relative rounded-[11px] overflow-hidden bg-black"
                    style={{ border: '1px solid rgba(4,120,87,0.28)', aspectRatio: '16/9' }}
                  >
                    <video
                      src={videoPreviewUrl}
                      controls playsInline
                      className="w-full h-full object-cover block"
                    />
                    <div
                      className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9.5px] font-extrabold text-white"
                      style={{ background: 'rgba(4,120,87,0.82)', backdropFilter: 'blur(4px)' }}
                    >
                      <CheckIcon /> Recorded · {fmtTime(recordingSeconds)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={retakeVideo}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-[9px] text-[11.5px] font-semibold transition-all duration-150 active:scale-[0.97]"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--ink-subtle)', cursor: 'pointer' }}
                  >
                    <ReplayIcon /> Retake
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={isVerifying}
          className="btn-primary w-full h-[50px] rounded-[11px] text-[13.5px] justify-center active:scale-[0.98]"
          style={isVerifying ? { opacity: 0.75, cursor: 'wait' } : {}}
        >
          {isVerifying
            ? <><SpinnerIcon /> Verifying with Cleanverse</>
            : <><BuildingIcon /> Verify business and unlock $5,000 <ArrowRight /></>
          }
        </button>
      </form>
    </div>
  );
};
