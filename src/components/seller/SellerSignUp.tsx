import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConnectKitButton } from 'connectkit';

/* ── Inline SVG icons — no icon library ─────────────────────── */
const IconBolt = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M8 1.5L2.5 8h5L5.5 12.5l6-7H6.5L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
);
const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1.5L2 3.5v4c0 3 2.5 4.5 5 5 2.5-.5 5-2 5-5v-4L7 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconTrend = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M1.5 10.5L5 7l3 2.5L12.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.5 3.5H12.5V6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconWallet = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1.5" y="3.5" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M1.5 6.5h11" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="9.5" cy="9" r="1" fill="currentColor"/>
  </svg>
);

/* ── Input field ─────────────────────────────────────────────── */
const Field: React.FC<{
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}> = ({ id, label, hint, value, onChange, type = 'text', placeholder, required, error }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-[11px] font-semibold"
          style={{ color: 'var(--ink-subtle)', letterSpacing: '0.01em' }}
        >
          {label}
        </label>
        {hint && (
          <span className="text-[10px]" style={{ color: 'var(--ink-faint)' }}>{hint}</span>
        )}
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
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
          boxShadow: focused && !error
            ? '0 0 0 3px rgba(184,130,30,0.08)'
            : error
            ? '0 0 0 3px rgba(140,26,26,0.06)'
            : 'none',
        }}
      />
      {error && (
        <p className="text-[10px] font-medium" style={{ color: '#8C1A1A' }}>{error}</p>
      )}
    </div>
  );
};

/* ── Main component ──────────────────────────────────────────── */
export const SellerSignUp: React.FC = () => {
  const { completeSellerOnboarding, showToast } = useApp();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+254');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [country, setCountry] = useState('Kenya');
  const [nameError, setNameError] = useState('');
  const [bizError, setBizError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!fullName.trim()) { setNameError('Enter your full name.'); valid = false; } else setNameError('');
    if (!businessName.trim()) { setBizError('Enter your business name.'); valid = false; } else setBizError('');
    if (!valid) return;

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    completeSellerOnboarding({
      fullName: fullName.trim(),
      businessName: businessName.trim(),
      operatingCountry: country,
      category: 'Agricultural Produce Exporter',
    });
    showToast(`Welcome, ${fullName.trim()}. Next: verify your identity.`, 'success');
    setSubmitting(false);
  };

  const FEATURES = [
    { icon: <IconBolt />, text: 'Settlement in under a second on Arc' },
    { icon: <IconShield />, text: 'Escrow-protected advances, no middlemen' },
    { icon: <IconTrend />, text: 'Credit limits up to $5,000 after verification' },
  ];

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
        {/* Grain */}
        <div className="grain-overlay absolute inset-0 pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[9px] flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#B8821E,#D4A032)' }}
          >
            <span className="font-display text-[13px] font-bold text-white" style={{ letterSpacing: '-0.01em' }}>V</span>
          </div>
          <span
            className="font-display text-[17px] font-semibold text-white"
            style={{ letterSpacing: '-0.025em' }}
          >
            Vesto
          </span>
        </div>

        {/* Headline */}
        <div className="relative">
          <p
            className="text-[11px] uppercase font-semibold mb-5"
            style={{ color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em' }}
          >
            For sellers
          </p>
          <h1
            className="font-display font-bold text-white mb-5"
            style={{ fontSize: '32px', letterSpacing: '-0.035em', lineHeight: '0.96' }}
          >
            Turn invoices<br />
            into capital<br />
            <em
              className="not-italic"
              style={{ color: '#E9BE68' }}
            >
              in minutes.
            </em>
          </h1>
          <p
            className="text-[13px] mb-8 leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.42)', maxWidth: '280px' }}
          >
            Real invoice financing, settled onchain with USDC. No banks, no delays, no FX risk.
          </p>

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

        {/* Footer */}
        <p className="relative text-[9px] uppercase tracking-[0.10em]" style={{ color: 'rgba(255,255,255,0.18)' }}>
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

          {/* Step indicator — 3 segments, non-uniform widths */}
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
              Step 1 of 3
            </span>
          </div>

          {/* Heading */}
          <h2
            className="font-display font-bold text-ink mb-1"
            style={{ fontSize: '24px', letterSpacing: '-0.028em', lineHeight: 1.1 }}
          >
            Create your seller account
          </h2>
          <p
            className="text-[13px] mb-7"
            style={{ color: 'var(--ink-subtle)', lineHeight: 1.5 }}
          >
            Takes about two minutes.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field
              id="fullName" label="Full legal name" hint="As on photo ID"
              value={fullName}
              onChange={v => { setFullName(v); if (v.trim()) setNameError(''); }}
              placeholder="Amina Diallo" required
              error={nameError}
            />

            <Field
              id="email" label="Email address" hint="For account notifications"
              value={email} onChange={setEmail}
              type="email" placeholder="amina@nairobifresh.co" required
            />

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold" style={{ color: 'var(--ink-subtle)' }}>
                Mobile number
              </label>
              <div className="flex gap-2">
                <select
                  value={phonePrefix}
                  onChange={e => setPhonePrefix(e.target.value)}
                  className="h-[46px] px-3 rounded-[9px] text-[12px] text-ink cursor-pointer focus:outline-none shrink-0"
                  style={{
                    background: 'var(--cream)',
                    border: '1px solid var(--border-2)',
                    width: '96px',
                  }}
                >
                  <option value="+254">+254 KE</option>
                  <option value="+234">+234 NG</option>
                  <option value="+233">+233 GH</option>
                  <option value="+1">+1 US</option>
                  <option value="+44">+44 GB</option>
                </select>
                <input
                  type="tel" required value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="712 345 678"
                  className="flex-1 h-[46px] px-3.5 rounded-[9px] text-[13px] text-ink focus:outline-none"
                  style={{ background: 'var(--cream)', border: '1px solid var(--border-2)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(184,130,30,0.55)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(184,130,30,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <Field
              id="bizName" label="Registered business name"
              value={businessName}
              onChange={v => { setBusinessName(v); if (v.trim()) setBizError(''); }}
              placeholder="Nairobi Fresh Produce Co." required
              error={bizError}
            />

            {/* Country */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold" style={{ color: 'var(--ink-subtle)' }}>
                Operating jurisdiction
              </label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full h-[46px] px-3.5 rounded-[9px] text-[13px] text-ink cursor-pointer focus:outline-none"
                style={{ background: 'var(--cream)', border: '1px solid var(--border-2)' }}
              >
                <option value="Kenya">Kenya</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Ghana">Ghana</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-[52px] rounded-[11px] text-[13px] font-semibold text-ink flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] mt-1"
              style={{
                background: submitting ? 'var(--border)' : 'var(--ink)',
                boxShadow: submitting ? 'none' : 'var(--shadow-e2)',
                color: submitting ? 'var(--ink-faint)' : '#fff',
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
                  Create account
                  <IconArrow />
                </>
              )}
            </button>

            {/* Wallet note */}
            <div
              className="flex items-start gap-3 px-3.5 py-3 rounded-[9px]"
              style={{ background: 'var(--gold-bg)', border: '1px solid var(--gold-border)' }}
            >
              <span style={{ color: '#B8821E', marginTop: '1px', flexShrink: 0 }}>
                <IconWallet />
              </span>
              <div>
                <p className="text-[11px] font-semibold mb-0.5" style={{ color: 'var(--ink)' }}>
                  Wallet connection is next
                </p>
                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--ink-subtle)' }}>
                  Your wallet receives USDC advances. No seed phrase needed — we walk you through it after setup.
                </p>
              </div>
            </div>

            {/* Already have wallet */}
            <div className="flex items-center justify-center gap-2 text-[11px]" style={{ color: 'var(--ink-faint)' }}>
              <span>Already have a wallet?</span>
              <ConnectKitButton label="Connect now" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
