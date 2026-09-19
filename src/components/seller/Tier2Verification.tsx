import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { cleanverseService, CleanverseResult } from '../../services/cleanverseService';

const GoldStrip: React.FC = () => (
  <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
    style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A,#C9922A)' }} />
);

export const Tier2Verification: React.FC = () => {
  const { setSellerView, submitVerification, showToast, seller } = useApp();
  const [taxId, setTaxId] = useState('');
  const [fileName, setFileName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationOutcome, setVerificationOutcome] = useState<'pass' | 'fail' | 'uncertain'>('pass');
  const [rejectionResult, setRejectionResult] = useState<CleanverseResult | null>(null);

  // Video recording state
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startRecording = useCallback(async () => {
    setCameraError('');
    setVideoState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play();
      }
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoPreviewUrl(url);
        setVideoState('recorded');
        stopStream();
      };
      recorder.start(250);
      setVideoState('recording');
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch (err: unknown) {
      setVideoState('error');
      const msg = err instanceof Error ? err.message : 'Camera access denied';
      setCameraError(msg.includes('Permission') || msg.includes('denied')
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : 'Could not access camera. Please check your device and try again.');
      setVideoEnabled(false);
    }
  }, [stopStream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const retakeVideo = useCallback(() => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoBlob(null);
    setVideoPreviewUrl(null);
    setVideoState('idle');
    setRecordingSeconds(0);
  }, [videoPreviewUrl]);

  const handleVideoToggle = useCallback(() => {
    const next = !videoEnabled;
    setVideoEnabled(next);
    if (next) {
      startRecording();
    } else {
      stopRecording();
      retakeVideo();
    }
  }, [videoEnabled, startRecording, stopRecording, retakeVideo]);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleCleanverseCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setRejectionResult(null);
    try {
      const videoUrl = videoBlob ? URL.createObjectURL(videoBlob) : undefined;
      const result = await cleanverseService.verifyTier2BusinessDocument(
        docUrl, seller.businessName, videoUrl, verificationOutcome
      );
      setIsVerifying(false);
      if (result.status === 'pass') {
        submitVerification(2, 'Tax & Bank Registration (Tier 2)', docUrl);
        showToast(`Business verified (${result.confidenceScore}% confidence). $5,000 limit unlocked!`, 'success');
        setSellerView('dashboard');
      } else if (result.status === 'fail') {
        setRejectionResult(result);
        showToast('Tier 2 verification rejected. See feedback below.', 'warning');
      } else {
        submitVerification(2, 'Tax & Bank Registration (Tier 2)', docUrl);
        showToast("Flagged for human review. You'll hear back within 24h.", 'info');
        setSellerView('in_progress');
      }
    } catch {
      setIsVerifying(false);
      showToast('Error contacting Cleanverse - please try again.', 'warning');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 sm:py-8 px-3 sm:px-4 flex flex-col gap-5 pb-24">

      {/* ── Back + Step ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSellerView('tier1')}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
        >
          <span className="material-symbols-outlined text-[20px] text-secondary">arrow_back</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-6 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
            <div className="w-6 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
            <div className="w-6 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
          </div>
          <span className="text-[10px] text-secondary uppercase tracking-widest font-semibold">Step 3 of 3</span>
        </div>
        <div className="w-10" />
      </div>

      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div
            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ background: 'rgba(201,146,42,0.12)', color: '#C9922A', border: '1px solid rgba(201,146,42,0.20)' }}
          >
            <span className="material-symbols-outlined text-[12px]">stars</span>
            Cleanverse Commercial
          </div>
        </div>
        <h1 className="font-headline font-extrabold text-primary mb-1" style={{ fontSize: '28px', letterSpacing: '-0.025em' }}>
          Tier 2 Verification
        </h1>
        <p className="text-sm text-secondary">
          Business document check. Clear passes unlock your <span className="font-bold text-primary">$5,000 credit limit</span> automatically.
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
            <div className="text-[9px] uppercase tracking-widest font-semibold mb-1 text-white/40">Commercial Credit Limit</div>
            <div className="font-headline font-extrabold font-tnum text-white" style={{ fontSize: '36px', letterSpacing: '-0.03em' }}>
              $5,000
            </div>
            <div className="text-[11px] font-semibold mt-1" style={{ color: '#E8B96A' }}>Unlocked on clear pass</div>
          </div>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-headline font-extrabold text-xl"
            style={{ background: 'rgba(201,146,42,0.15)', border: '1px solid rgba(201,146,42,0.30)', color: '#E8B96A' }}
          >T2</div>
        </div>
      </div>

      {/* ── Demo Selector ───────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl text-xs"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
      >
        <span className="font-semibold text-secondary">Demo simulation:</span>
        <div className="flex gap-1.5">
          {(['pass', 'fail', 'uncertain'] as const).map((mode) => (
            <button key={mode} onClick={() => setVerificationOutcome(mode)}
              className="px-3 py-1 rounded-lg font-bold uppercase text-[10px] transition-all"
              style={verificationOutcome === mode
                ? { background: mode === 'pass' ? '#047857' : mode === 'fail' ? '#DC2626' : '#7C3AED', color: '#fff' }
                : { background: 'var(--canvas)', color: 'var(--secondary)', border: '1px solid var(--border)' }
              }
            >{mode}</button>
          ))}
        </div>
      </div>

      {/* ── Rejection Banner ────────────────────────────────── */}
      {rejectionResult && (
        <div className="flex flex-col gap-2 px-5 py-4 rounded-2xl"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)' }}>
          <div className="flex items-center gap-2 font-bold text-sm" style={{ color: '#EF4444' }}>
            <span className="material-symbols-outlined text-lg">error</span>
            Verification Rejected
          </div>
          <p className="text-xs leading-relaxed text-secondary">
            {rejectionResult.failureReason || 'Tax PIN could not be verified against jurisdiction registry.'}
          </p>
          <div className="flex justify-between text-[11px] font-semibold pt-2 border-t" style={{ borderColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
            <span>PIN Verified: {rejectionResult.taxIdVerified ? 'Yes' : 'No'}</span>
            <span>Upload a valid tax certificate</span>
          </div>
        </div>
      )}

      {/* ── Form ────────────────────────────────────────────── */}
      <form onSubmit={handleCleanverseCheck} className="flex flex-col gap-4">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
        >
          <GoldStrip />
          <div className="p-5 flex flex-col gap-4">

            {/* Tax ID */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-primary">KRA / National Tax PIN</label>
              <input
                type="text" required value={taxId} onChange={e => setTaxId(e.target.value)}
                placeholder="e.g. P051928401Z"
                className="w-full h-12 px-4 rounded-xl text-sm text-primary font-tnum focus:outline-none transition-all"
                style={{ background: 'var(--canvas)', border: '1px solid var(--border)' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#C9922A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,146,42,0.10)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Document Upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-primary">Business Tax Cert / Bank Statement (PDF)</label>
              <div className="relative border-2 border-dashed rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:border-gold"
                style={{ borderColor: fileName ? '#C9922A' : 'var(--border)', background: 'var(--canvas)' }}>
                <input type="file" accept=".pdf,.jpg,.png" onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                <span className="material-symbols-outlined text-2xl shrink-0"
                  style={{ color: fileName ? '#C9922A' : 'var(--secondary)' }}>
                  {fileName ? 'task' : 'upload_file'}
                </span>
                <div>
                  <p className="text-xs font-bold text-primary">
                    {fileName || 'Click to upload document'}
                  </p>
                  <p className="text-[11px] text-secondary">PDF, PNG, JPG · Max 15MB</p>
                </div>
                {fileName && (
                  <span className="ml-auto shrink-0 material-symbols-outlined text-lg" style={{ color: '#10B981' }}>check_circle</span>
                )}
              </div>
            </div>

            {/* Video Recording Section */}
            <div className="flex flex-col gap-3">
              {/* Toggle row */}
              <div className="flex items-center justify-between p-3.5 rounded-xl"
                style={{
                  background: videoEnabled ? 'rgba(4,120,87,0.06)' : 'var(--canvas)',
                  border: `1px solid ${videoEnabled ? 'rgba(4,120,87,0.25)' : 'var(--border)'}`,
                  transition: 'all 0.2s',
                }}>
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg shrink-0"
                    style={{ color: videoState === 'recording' ? '#EF4444' : videoState === 'recorded' ? '#10B981' : '#C9922A' }}>
                    {videoState === 'recording' ? 'radio_button_checked' : videoState === 'recorded' ? 'check_circle' : 'videocam'}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-primary">Shop / Farm Walkthrough Video</p>
                    <p className="text-[10px] text-secondary">
                      {videoState === 'requesting' && 'Requesting camera access…'}
                      {videoState === 'recording' && <span className="text-red-500 font-bold">Recording {fmtTime(recordingSeconds)}</span>}
                      {videoState === 'recorded' && <span style={{ color: '#10B981' }} className="font-bold">Video recorded - boosts score by +15%</span>}
                      {videoState === 'error' && <span className="text-red-500">Camera error - tap to retry</span>}
                      {(videoState === 'idle') && 'Boosts confidence score by up to 15%'}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={handleVideoToggle}
                  className="w-11 h-6 rounded-full relative transition-all shrink-0"
                  style={{ background: videoEnabled ? 'linear-gradient(135deg,#047857,#10B981)' : 'var(--border)' }}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${videoEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {/* Camera error */}
              {videoState === 'error' && cameraError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl text-xs"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)', color: '#EF4444' }}>
                  <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Live camera viewfinder */}
              {videoState === 'recording' && (
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ background: '#000', border: '2px solid #EF4444', aspectRatio: '16/9' }}>
                  <video ref={videoRef} autoPlay playsInline muted
                    className="w-full h-full object-cover" />
                  {/* REC badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold"
                    style={{ background: '#EF4444', color: '#fff' }}>
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    REC {fmtTime(recordingSeconds)}
                  </div>
                  {/* Stop button */}
                  <button type="button" onClick={stopRecording}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs text-white"
                    style={{ background: '#EF4444', boxShadow: '0 4px 16px rgba(239,68,68,0.4)' }}>
                    <span className="w-3 h-3 rounded-sm bg-white" />
                    Stop Recording
                  </button>
                </div>
              )}

              {/* Video preview after recording */}
              {videoState === 'recorded' && videoPreviewUrl && (
                <div className="flex flex-col gap-2">
                  <div className="relative rounded-2xl overflow-hidden"
                    style={{ background: '#000', border: '1px solid rgba(16,185,129,0.30)', aspectRatio: '16/9' }}>
                    <video src={videoPreviewUrl} controls playsInline
                      className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold"
                      style={{ background: 'rgba(16,185,129,0.85)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                      <span className="material-symbols-outlined text-[12px]">check</span>
                      Recorded · {fmtTime(recordingSeconds)}s
                    </div>
                  </div>
                  <button type="button" onClick={retakeVideo}
                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: 'var(--canvas)', border: '1px solid var(--border)', color: 'var(--secondary)' }}>
                    <span className="material-symbols-outlined text-sm">replay</span>
                    Retake video
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
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
              Verifying with Cleanverse…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">business_center</span>
              Verify Business & Unlock $5,000
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
