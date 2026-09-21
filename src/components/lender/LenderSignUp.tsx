import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConnectKitButton } from 'connectkit';

/* ── Inline SVGs ─────────────────────────────────────────────── */
const IconVerified = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1.5L2 3.5v4c0 3 2.5 4.5 5 5 2.5-.5 5-2 5-5v-4L7 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconLock = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="3" y="6" width="8" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M4.5 6V5a2.5 2.5 0 0 1 5 0v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="7" cy="9.5" r="0.8" fill="currentColor"/>
  </svg>
);
const IconBuilding = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="2" y="4" width="10" height="9" rx="0.8" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M5 13V9.5h4V13" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M2 7h10" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M7 1.5L2 4h10L7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);
const IconPerson = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M1.5 12.5c0-2.5 2.5-4.5 5.5-4.5s5.5 2 5.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Field ───────────────────────────────────────────────────── */
const Field: React.FC<{
  id: string; label: string; hint?: string;
  value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; error?: string;
}> = ({ id, label, hint, value, onChange, type = 'text', placeholder, required, error }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[11px] font-semibold" style={{ color: 'var(--ink-subtle)' }}>
          {label}
        </label>
        {hint && <span className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>{hint}</span>}
      </div>
      <input
        id={id} type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full h-[46px] px-3.5 rounded-[9px] text-[13px] text-ink transition-all duration-150 focus:outline-none"
        style={{
          background: 'var(--cream)',
          border: error
            ? '1.5px solid rgba(140,26,26,0.50)'
            : focused
            ? '1.5px solid rgba(184,130,30,0.55)'
            : '1px solid var(--border-2)',
          boxShadow: focused && !error ? '0 0 0 3px rgba(184,130,30,0.08)' : 'none',
        }}
      />
      {error && <p className="text-[10px] font-medium" style={{ color: '#8C1A1A' }}>{error}</p>}
    </div>
  );
};

/* ── Main ────────────────────────────────────────────────────── */
export const LenderSignUp: React.FC = () => {
  const { completeLenderOnboarding, showToast } = useApp();
  const [accountType, setAccountType] = useState<'individual' | 'institutional'>('individual');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [targetAllocation, setTargetAllocation] = useState(5000);
  const [nameError, setNameError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) { setNameError('Enter your name.'); return; }
    setNameError('');
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    completeLenderOnboarding({
      fullName: fullName.trim(),
      email,
      accountType,
      targetAllocation,
      investorTier: accountType === 'institutional' ? 'Institutional Liquidity Provider' : 'Retail Investor',
    });
    showToast(`Welcome, ${fullName.trim()}. Read the risk disclosure to start funding.`, 'success');
    setSubmitting(false);
  };

  const FEATURES = [
    { icon: <IconVerified />, text: 'KYC-verified counterparties only' },
    { icon: <IconLock />,     text: 'Escrow-protected, non-custodial' },
    { icon: <IconBuilding />, text: 'Institutional and individual tiers' },
  ];

  /* Format allocation label */
  const allocationLabel = targetAllocation >= 1000
    ? `$${(targetAllocation / 1000).toFixed(targetAllocation % 1000 === 0 ? 0 : 1)}k`
    : `$${targetAllocation}`;

  return (
    <div
      className="flex items-stretch animate-fade-up"
      style={{ background: 'var(--canvas)', minHeight: 'calc(100dvh - 96px)' }}
    >

      {/* ── Left editorial panel ─────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 relative overflow-hidden"
        style={{ background: '#0D1824', padding: '44px 40px' }}
      >
        {/* Gold strip */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg,transparent 0%,#B8821E 25%,#E9BE68 55%,#B8821E 80%,transparent 100%)' }}
        />
        {/* Dot matrix */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 1px)',
            backgroundSize: '26px 26px',
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
          <span className="font-display text-[17px] font-semibold text-white" style={{ letterSpacing: '-0.025em' }}>
            Vesto
          </span>
        </div>

        {/* Headline */}
        <div className="relative">
          <p
            className="text-[11px] uppercase font-semibold mb-5"
            style={{ color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em' }}
          >
            For lenders
          </p>
          <h1
            className="font-display font-bold text-white mb-5"
            style={{ fontSize: '32px', letterSpacing: '-0.035em', lineHeight: '0.96' }}
          >
            Deploy capital<br />
            into real-world<br />
            <em className="not-italic" style={{ color: '#E9BE68' }}>invoice pools.</em>
          </h1>
          <p
            className="text-[13px] mb-7 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.42)', maxWidth: '280px' }}
          >
            Earn yield on verified commodity invoices. Every position settled onchain with USDC, sub-second finality.
          </p>

          {/* APY preview card */}
          <div
            className="rounded-[13px] px-4 py-4 mb-7"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(184,130,30,0.18)',
            }}
          >
            <p
              className="text-[8px] uppercase font-semibold mb-2"
              style={{ color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em' }}
            >
              Current pool yields
            </p>
            <div className="flex items-end gap-1.5 mb-1">
              <span
                className="font-mono font-bold font-tnum"
                style={{ fontSize: '26px', color: '#E9BE68', letterSpacing: '-0.03em', lineHeight: 1 }}
              >
                12–24
              </span>
              <span
                className="text-[15px] font-semibold mb-0.5"
                style={{ color: '#E9BE68' }}
              >
                % APY
              </span>
            </div>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              Agri-export · Cold chain · Commodity trade
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-4">
            {FEATURES.map(({ icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0"
                  style={{
                    background: 'rgba(184,130,30,0.12)',
                    border: '1px solid rgba(184,130,30,0.18)',
                    color: '#E9BE68',
                  }}
                >
                  {icon}
                </div>
                <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p
          className="relative text-[9px] uppercase tracking-[0.10em]"
          style={{ color: 'rgba(255,255,255,0.18)' }}
        >
          Secured by USDC · Powered by Arc
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-10">
        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-7 h-7 rounded-[7px] flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#B8821E,#D4A032)' }}
            >
              <span className="font-display text-[11px] font-bold text-white">V</span>
            </div>
            <span className="font-display text-[15px] font-semibold text-ink" style={{ letterSpacing: '-0.02em' }}>Vesto</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex gap-1">
              <div className="w-8 h-[2px] rounded-full" style={{ background: 'linear-gradient(90deg,#B8821E,#D4A032)' }} />
              <div className="w-4 h-[2px] rounded-full" style={{ background: 'var(--border-2)' }} />
              <div className="w-4 h-[2px] rounded-full" style={{ background: 'var(--border-2)' }} />
            </div>
            <span
              className="text-[9px] font-semibold uppercase"
              style={{ color: 'var(--ink-faint)', letterSpacing: '0.10em' }}
            >
              Step 1 of 3 · Liquidity provider
            </span>
          </div>

          {/* Heading */}
          <h2
            className="font-display font-bold text-ink mb-1"
            style={{ fontSize: '24px', letterSpacing: '-0.028em', lineHeight: 1.1 }}
          >
            Create your LP account
          </h2>
          <p
            className="text-[13px] mb-6"
            style={{ color: 'var(--ink-subtle)', lineHeight: 1.5 }}
          >
            Deploy capital. Earn yield. All onchain.
          </p>

          {/* Account type toggle */}
          <div
            className="grid grid-cols-2 gap-1 p-1 rounded-[11px] mb-6"
            style={{ background: 'var(--cream)', border: '1px solid var(--border-2)' }}
          >
            {(['individual', 'institutional'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setAccountType(type)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-[9px] text-[11px] font-semibold transition-all duration-150"
                style={accountType === type
                  ? {
                      background: 'var(--ink)',
                      color: '#fff',
                      boxShadow: 'var(--shadow-e1)',
                    }
                  : { color: 'var(--ink-muted)' }
                }
              >
                <span style={{ color: accountType === type ? 'rgba(255,255,255,0.7)' : 'var(--ink-faint)' }}>
                  {type === 'individual' ? <IconPerson /> : <IconBuilding />}
                </span>
                {type === 'individual' ? 'Individual' : 'Institutional'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field
              id="fullName"
              label={accountType === 'institutional' ? 'Fund or entity name' : 'Full legal name'}
              value={fullName}
              onChange={v => { setFullName(v); if (v.trim()) setNameError(''); }}
              placeholder={accountType === 'institutional' ? 'Acacia Capital Partners' : 'David Oyelaran'}
              required
              error={nameError}
            />

            <Field
              id="email" label="Email address" hint="For account notifications"
              value={email} onChange={setEmail}
              type="email"
              placeholder={accountType === 'institutional' ? 'ops@acaciacapital.com' : 'david@example.com'}
              required
            />

            {/* Allocation */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold" style={{ color: 'var(--ink-subtle)' }}>
                  Target allocation
                </label>
                <span
                  className="font-mono text-[13px] font-semibold font-tnum"
                  style={{ color: '#B8821E', letterSpacing: '-0.02em' }}
                >
                  {allocationLabel}
                </span>
              </div>

              {/* Slider track */}
              <div className="relative h-[46px] flex items-center">
                <div
                  className="absolute left-0 right-0 h-[3px] rounded-full"
                  style={{ background: 'var(--border-2)' }}
                />
                <div
                  className="absolute left-0 h-[3px] rounded-full"
                  style={{
                    width: `${((targetAllocation - 500) / (100000 - 500)) * 100}%`,
                    background: 'linear-gradient(90deg,#B8821E,#D4A032)',
                    transition: 'width 50ms',
                  }}
                />
                <input
                  type="range" min={500} max={100000} step={500}
                  value={targetAllocation}
                  onChange={e => setTargetAllocation(Number(e.target.value))}
                  className="relative w-full cursor-pointer appearance-none bg-transparent focus:outline-none"
                  style={{ zIndex: 1 }}
                />
              </div>

              <div className="flex justify-between text-[9px]" style={{ color: 'var(--ink-faint)' }}>
                <span>$500</span>
                <span>$100k</span>
              </div>

              {/* Estimated yield preview */}
              <div
                className="flex items-center justify-between px-3.5 py-2.5 rounded-[9px]"
                style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)' }}
              >
                <span className="text-[11px]" style={{ color: 'var(--ink-subtle)' }}>
                  Est. annual yield at 18% avg
                </span>
                <span
                  className="font-mono text-[13px] font-semibold font-tnum"
                  style={{ color: '#B8821E' }}
                >
                  ${Math.round(targetAllocation * 0.18).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-[52px] rounded-[11px] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] mt-1"
              style={{
                background: submitting ? 'var(--border)' : 'var(--ink)',
                color: submitting ? 'var(--ink-faint)' : '#fff',
                boxShadow: submitting ? 'none' : 'var(--shadow-e2)',
                letterSpacing: '-0.01em',
              }}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5"/>
                    <path d="M7 1a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Creating account
                </>
              ) : (
                <>
                  Create LP account
                  <IconArrow />
                </>
              )}
            </button>

            {/* Divider + wallet */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px]" style={{ color: 'var(--ink-faint)' }}>
              <span>Already have a wallet?</span>
              <ConnectKitButton label="Connect" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
