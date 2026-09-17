import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConnectKitButton } from 'connectkit';

const InputField: React.FC<{
  id: string; label: string; hint?: string; icon?: string;
  type?: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}> = ({ id, label, hint, icon, type = 'text', value, onChange, placeholder, required }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between">
      <label htmlFor={id} className="text-xs font-semibold text-primary">{label}</label>
      {hint && <span className="text-[10px] text-secondary">{hint}</span>}
    </div>
    <div className="relative">
      {icon && (
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-[18px] pointer-events-none">{icon}</span>
      )}
      <input
        id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full h-12 rounded-xl text-sm text-primary transition-all focus:outline-none focus:ring-2 focus:ring-offset-0"
        style={{
          paddingLeft: icon ? '42px' : '14px',
          paddingRight: '14px',
          background: 'var(--canvas)',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 2px rgba(10,22,40,0.04)',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#C9922A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,146,42,0.10)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(10,22,40,0.04)'; }}
      />
    </div>
  </div>
);

export const SellerSignUp: React.FC = () => {
  const { setSellerView, showToast } = useApp();
  const [fullName, setFullName] = useState('Amina Diallo');
  const [email, setEmail] = useState('amina@nairobifresh.co');
  const [phonePrefix, setPhonePrefix] = useState('+254');
  const [phoneNumber, setPhoneNumber] = useState('712 345 678');
  const [businessName, setBusinessName] = useState('Nairobi Fresh Produce Co.');
  const [operatingCountry, setOperatingCountry] = useState('Kenya');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Account created! Connect your wallet to submit invoices on Arc.', 'success');
    setSellerView('tier1');
  };

  return (
    <div className="min-h-screen flex items-stretch" style={{ background: 'var(--canvas)' }}>

      {/* ── Left panel — editorial ───────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg,#0A1628 0%,#112240 60%,#0D1F3C 100%)',
        }}
      >
        {/* Top gold strip */}
        <div className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A,#C9922A)' }}
        />
        {/* Dot matrix */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }}
        />
        {/* Radial glow */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(201,146,42,0.08) 0%,transparent 60%)', transform: 'translate(30%,30%)' }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-headline font-extrabold text-sm"
            style={{ background: 'linear-gradient(135deg,#C9922A,#E8B96A)', color: '#fff' }}
          >V</div>
          <span className="font-headline font-extrabold text-white text-xl" style={{ letterSpacing: '-0.02em' }}>Vesto</span>
        </div>

        {/* Editorial headline */}
        <div className="relative">
          <h1
            className="font-headline font-extrabold text-white leading-tight mb-4"
            style={{ fontSize: '36px', letterSpacing: '-0.03em' }}
          >
            Turn invoices<br />
            into capital<br />
            <span style={{ color: '#E8B96A' }}>in minutes.</span>
          </h1>
          <p className="text-sm font-medium leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Real-world invoice financing, settled onchain with USDC on Arc. No banks. No delays.
          </p>

          {/* Social proof */}
          <div className="flex flex-col gap-3">
            {[
              { icon: 'bolt',         text: 'Sub-second settlement on Arc' },
              { icon: 'shield',       text: 'Escrow-protected advances' },
              { icon: 'trending_up',  text: 'Up to $5,000 credit limit' },
            ].map(({ icon, text }) => (
              <div key={icon} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(201,146,42,0.12)', border: '1px solid rgba(201,146,42,0.20)' }}>
                  <span className="material-symbols-outlined text-[16px]" style={{ color: '#E8B96A' }}>{icon}</span>
                </div>
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="relative text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Secured by USDC · Powered by Arc
        </p>
      </div>

      {/* ── Right panel — form ───────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex gap-1.5">
              <div className="w-6 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
              <div className="w-6 h-1.5 rounded-full" style={{ background: 'var(--border)' }} />
              <div className="w-6 h-1.5 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <span className="text-[10px] text-secondary uppercase tracking-widest font-semibold">Step 1 of 3</span>
          </div>

          {/* Heading */}
          <h2 className="font-headline font-extrabold text-primary mb-1" style={{ fontSize: '26px', letterSpacing: '-0.025em' }}>
            Create Seller Account
          </h2>
          <p className="text-sm text-secondary mb-8">Start earning advances on your invoices today.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputField id="fullName"   label="Full Legal Name"        hint="As on photo ID"   icon="person"         value={fullName}    onChange={setFullName}    placeholder="Amina Diallo"                required />
            <InputField id="email"      label="Email Address"          hint="Wallet creation"  icon="mail"           value={email}       onChange={setEmail}       placeholder="amina@nairobifresh.co"        required type="email" />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-primary">Mobile Number</label>
              <div className="flex gap-2">
                <select
                  value={phonePrefix}
                  onChange={e => setPhonePrefix(e.target.value)}
                  className="w-28 h-12 px-3 rounded-xl text-sm text-primary cursor-pointer focus:outline-none"
                  style={{ background: 'var(--canvas)', border: '1px solid var(--border)' }}
                >
                  <option value="+254">🇰🇪 +254</option>
                  <option value="+234">🇳🇬 +234</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                </select>
                <input
                  type="tel" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                  placeholder="712 345 678"
                  className="flex-1 h-12 px-3.5 rounded-xl text-sm text-primary focus:outline-none"
                  style={{ background: 'var(--canvas)', border: '1px solid var(--border)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#C9922A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,146,42,0.10)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <InputField id="businessName" label="Registered Business Name" icon="corporate_fare" value={businessName} onChange={setBusinessName} placeholder="Nairobi Fresh Produce Co." required />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-primary">Operating Jurisdiction</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-[18px] pointer-events-none">public</span>
                <select
                  value={operatingCountry}
                  onChange={e => setOperatingCountry(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 rounded-xl text-sm text-primary cursor-pointer focus:outline-none"
                  style={{ background: 'var(--canvas)', border: '1px solid var(--border)' }}
                >
                  <option value="Kenya">Kenya (KSh / USD)</option>
                  <option value="Nigeria">Nigeria (NGN / USD)</option>
                  <option value="Ghana">Ghana (GHS / USD)</option>
                  <option value="United States">United States (USD)</option>
                  <option value="United Kingdom">United Kingdom (GBP)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-14 rounded-2xl text-sm font-extrabold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
              style={{
                background: 'linear-gradient(135deg,#0A1628 0%,#112240 100%)',
                boxShadow: '0 8px 24px rgba(10,22,40,0.25)',
                border: '1px solid rgba(201,146,42,0.25)',
              }}
            >
              Create Account
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-[11px] text-secondary font-medium">or</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-secondary">
              <span>Already have a wallet?</span>
              <ConnectKitButton label="Connect" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
