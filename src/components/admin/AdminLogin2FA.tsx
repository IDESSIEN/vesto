import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2L3.5 4.5v5.5c0 4 2.8 7 6.5 8 3.7-1 6.5-4 6.5-8V4.5L10 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M7 10l2.2 2.2L13 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconKey = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="6" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M8.5 9.5L14 15M11 12.5l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const IconAt = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M10.5 8c0 1.5.7 2.5 2 2.5s2-1.2 2-2.5a6.5 6.5 0 1 0-2 4.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

export const AdminLogin2FA: React.FC = () => {
  const { completeAdminOnboarding, showToast } = useApp();
  const [adminUser, setAdminUser] = useState('');
  const [passcode, setPasscode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);

  const DEMO_PASSCODE = '123456';

  const validateEmail = (val: string) => {
    if (val && !val.endsWith('@vesto.finance')) {
      setEmailError('Only @vesto.finance accounts permitted.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(adminUser)) return;
    if (passcode.length < 6) { setCodeError('Enter all 6 digits.'); return; }
    if (passcode !== DEMO_PASSCODE) {
      setCodeError(`Wrong code. Use ${DEMO_PASSCODE} for the demo.`);
      setPasscode('');
      return;
    }
    setCodeError('');
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 500));
    showToast('Identity confirmed. Welcome to the oversight portal.', 'success');
    completeAdminOnboarding();
    setSubmitting(false);
  };

  const slots = Array.from({ length: 6 }, (_, i) => passcode[i] || '');
  const canSubmit = adminUser.endsWith('@vesto.finance') && passcode.length === 6 && !submitting;

  return (
    <div
      className="flex animate-fade-up"
      style={{ background: 'var(--canvas)', minHeight: 'calc(100dvh - 96px)' }}
    >
      {/* ── Left dark editorial panel ─────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[380px] shrink-0 relative overflow-hidden"
        style={{ background: '#0D1824', padding: '44px 40px' }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg,transparent,#B8821E 30%,#E9BE68 55%,#B8821E 80%,transparent)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.022) 1px,transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="grain-overlay absolute inset-0 pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[9px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#B8821E,#D4A032)' }}
          >
            <span className="font-display text-[13px] font-bold text-white" style={{ letterSpacing: '-0.01em' }}>V</span>
          </div>
          <span className="font-display text-[17px] font-semibold text-white" style={{ letterSpacing: '-0.025em' }}>Vesto</span>
        </div>

        {/* Headline */}
        <div className="relative">
          <p
            className="text-[10px] uppercase font-semibold mb-5"
            style={{ color: 'rgba(255,255,255,0.26)', letterSpacing: '0.12em' }}
          >
            Admin portal
          </p>
          <h1
            className="font-display font-bold text-white mb-5"
            style={{ fontSize: '30px', letterSpacing: '-0.035em', lineHeight: '0.96' }}
          >
            Governance.<br />
            Precision.<br />
            <em className="not-italic" style={{ color: '#E9BE68' }}>Trust.</em>
          </h1>
          <p
            className="text-[13px] mb-8 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.38)', maxWidth: '260px' }}
          >
            Institutional-grade oversight for every invoice, verification, and settlement on the Vesto platform.
          </p>

          <div className="flex flex-col gap-4">
            {[
              { label: 'KYC verification queue' },
              { label: 'Invoice risk oversight' },
              { label: 'Dispute & default resolution' },
              { label: 'Platform analytics & health' },
            ].map(({ label }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: '#B8821E' }}
                />
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.48)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="relative flex items-center gap-2 text-[10px] uppercase font-semibold"
          style={{ color: 'rgba(255,255,255,0.18)', letterSpacing: '0.10em' }}
        >
          <IconShield />
          <span>Vesto Governance Portal</span>
        </div>
      </div>

      {/* ── Right form panel ───────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-10">
        <div className="w-full max-w-[340px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-7 h-7 rounded-[7px] flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#B8821E,#D4A032)' }}
            >
              <span className="font-display text-[11px] font-bold text-white">V</span>
            </div>
            <span className="font-display text-[15px] font-semibold text-ink" style={{ letterSpacing: '-0.02em' }}>Vesto Admin</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-4 text-[10px] font-semibold uppercase"
              style={{
                background: 'rgba(184,130,30,0.08)',
                border: '1px solid rgba(184,130,30,0.20)',
                color: '#B8821E',
                letterSpacing: '0.08em',
              }}
            >
              <IconShield />
              Restricted access
            </div>
            <h2
              className="font-display font-bold text-ink mb-1"
              style={{ fontSize: '22px', letterSpacing: '-0.028em', lineHeight: 1.1 }}
            >
              Sign in to oversight
            </h2>
            <p
              className="text-[13px]"
              style={{ color: 'var(--ink-subtle)', lineHeight: 1.5 }}
            >
              Vesto admin accounts only.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold" style={{ color: 'var(--ink-subtle)' }}>
                Admin identifier
              </label>
              <div
                className="relative h-[46px] flex items-center rounded-[9px] transition-all duration-150"
                style={{
                  background: 'var(--cream)',
                  border: emailError
                    ? '1.5px solid rgba(140,26,26,0.45)'
                    : emailFocused
                    ? '1.5px solid rgba(184,130,30,0.55)'
                    : '1px solid var(--border-2)',
                  boxShadow: emailFocused && !emailError ? '0 0 0 3px rgba(184,130,30,0.08)' : 'none',
                }}
              >
                <span
                  className="absolute left-3.5 pointer-events-none"
                  style={{ color: 'var(--ink-faint)' }}
                >
                  <IconAt />
                </span>
                <input
                  type="email" required value={adminUser}
                  onChange={e => { setAdminUser(e.target.value); if (emailError) validateEmail(e.target.value); }}
                  onBlur={e => { setEmailFocused(false); validateEmail(e.target.value); }}
                  onFocus={() => setEmailFocused(true)}
                  placeholder="admin@vesto.finance"
                  className="w-full h-full bg-transparent pl-9 pr-4 text-[13px] text-ink focus:outline-none rounded-[9px]"
                />
              </div>
              {emailError && (
                <p className="text-[10px] font-medium" style={{ color: '#8C1A1A' }}>{emailError}</p>
              )}
            </div>

            {/* TOTP */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold" style={{ color: 'var(--ink-subtle)' }}>
                  Authenticator code
                </label>
                <span className="text-[9px] font-semibold uppercase" style={{ color: 'var(--ink-faint)', letterSpacing: '0.10em' }}>
                  6 digits
                </span>
              </div>

              {/* Slot display */}
              <div className="flex gap-1.5">
                {slots.map((ch, i) => (
                  <div
                    key={i}
                    className="flex-1 h-12 rounded-[9px] flex items-center justify-center font-mono font-bold text-lg transition-all duration-100"
                    style={{
                      background: ch
                        ? 'linear-gradient(135deg,#0D1824,#152035)'
                        : 'var(--cream)',
                      border: ch
                        ? '1.5px solid rgba(184,130,30,0.35)'
                        : codeFocused
                        ? '1.5px solid rgba(184,130,30,0.35)'
                        : '1px solid var(--border-2)',
                      color: ch ? '#E9BE68' : 'var(--ink-faint)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {ch || (codeFocused && i === passcode.length ? '|' : '')}
                  </div>
                ))}
              </div>

              {/* Real input (visible, keyboard-accessible) */}
              <input
                type="text" inputMode="numeric" pattern="[0-9]*"
                maxLength={6} required value={passcode}
                onChange={e => { setPasscode(e.target.value.replace(/\D/g, '').slice(0, 6)); if (codeError) setCodeError(''); }}
                onFocus={() => setCodeFocused(true)}
                onBlur={() => setCodeFocused(false)}
                placeholder="Enter code"
                className="w-full h-[46px] px-4 rounded-[9px] text-[13px] font-mono font-semibold text-center font-tnum tracking-[0.20em] focus:outline-none transition-all duration-150"
                style={{
                  background: 'var(--cream)',
                  border: codeError
                    ? '1.5px solid rgba(140,26,26,0.45)'
                    : codeFocused
                    ? '1.5px solid rgba(184,130,30,0.55)'
                    : '1px solid var(--border-2)',
                  boxShadow: codeFocused && !codeError ? '0 0 0 3px rgba(184,130,30,0.08)' : 'none',
                  color: 'var(--ink)',
                }}
              />

              {codeError && (
                <p className="text-[10px] font-medium" style={{ color: '#8C1A1A' }}>{codeError}</p>
              )}

              <div className="flex items-center justify-between">
                <p className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>
                  Open your authenticator app
                </p>
                <p
                  className="text-[10px] font-semibold font-mono font-tnum"
                  style={{ color: '#B8821E' }}
                >
                  Demo: 123456
                </p>
              </div>
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-[52px] rounded-[11px] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] mt-1 disabled:opacity-35 disabled:cursor-not-allowed"
              style={{
                background: canSubmit ? 'var(--ink)' : 'var(--border)',
                color: canSubmit ? '#fff' : 'var(--ink-faint)',
                boxShadow: canSubmit ? 'var(--shadow-e2)' : 'none',
                letterSpacing: '-0.01em',
              }}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
                    <path d="M7 1a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Verifying
                </>
              ) : (
                <>
                  <IconKey />
                  Authenticate
                </>
              )}
            </button>
          </form>

          <p
            className="text-center text-[9px] mt-6 uppercase"
            style={{ color: 'var(--ink-faint)', letterSpacing: '0.10em' }}
          >
            Vesto Governance Portal · Arc Testnet
          </p>
        </div>
      </div>
    </div>
  );
};
