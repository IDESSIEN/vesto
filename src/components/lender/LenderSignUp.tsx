import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConnectKitButton } from 'connectkit';

export const LenderSignUp: React.FC = () => {
  const { setLenderView, showToast } = useApp();
  const [accountType, setAccountType] = useState<'individual' | 'institutional'>('institutional');
  const [fullName, setFullName] = useState('Standard Agrarian Yield Fund');
  const [email, setEmail] = useState('invest@agrarian-capital.io');
  const [targetAllocation, setTargetAllocation] = useState<number>(50000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Account created! Connect your wallet to start funding invoices.', 'success');
    setLenderView('risk_disclosure');
  };

  const focusStyle = { borderColor: '#C9922A', boxShadow: '0 0 0 3px rgba(201,146,42,0.10)' };
  const blurStyle  = { borderColor: 'var(--border)', boxShadow: '0 1px 2px rgba(10,22,40,0.04)' };

  return (
    <div className="min-h-screen flex items-stretch" style={{ background: 'var(--canvas)' }}>

      {/* ── Left editorial panel ─────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#0A1628 0%,#112240 60%,#0D1F3C 100%)' }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A,#C9922A)' }}
        />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(201,146,42,0.06) 0%,transparent 60%)', transform: 'translate(-30%,-30%)' }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-headline font-extrabold text-sm"
            style={{ background: 'linear-gradient(135deg,#C9922A,#E8B96A)', color: '#fff' }}
          >V</div>
          <span className="font-headline font-extrabold text-white text-xl" style={{ letterSpacing: '-0.02em' }}>Vesto</span>
        </div>

        {/* Headline */}
        <div className="relative">
          <h1
            className="font-headline font-extrabold text-white leading-tight mb-4"
            style={{ fontSize: '36px', letterSpacing: '-0.03em' }}
          >
            Deploy capital<br />
            into real-world<br />
            <span style={{ color: '#E8B96A' }}>invoice pools.</span>
          </h1>
          <p className="text-sm font-medium leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Earn yield on verified commodity invoices. Every position settled onchain with USDC, sub-second.
          </p>

          {/* APY preview card */}
          <div
            className="rounded-2xl p-4 mb-6"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(201,146,42,0.20)',
            }}
          >
            <div className="text-[9px] uppercase tracking-widest font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Current Pool Yields
            </div>
            <div className="flex items-end gap-1.5 mb-1">
              <span className="font-headline font-extrabold text-3xl font-tnum" style={{ color: '#E8B96A', letterSpacing: '-0.02em' }}>12–24</span>
              <span className="text-base font-bold mb-1" style={{ color: '#E8B96A' }}>% APY</span>
            </div>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Agri-export · Cold chain · Commodity</p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { icon: 'verified',      text: 'KYC-verified counterparties' },
              { icon: 'lock',          text: 'Escrow-protected positions' },
              { icon: 'account_balance', text: 'Institutional and individual tiers' },
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

        <p className="relative text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Secured by USDC · Powered by Arc
        </p>
      </div>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex gap-1.5">
              <div className="w-6 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
              <div className="w-6 h-1.5 rounded-full" style={{ background: 'var(--border)' }} />
              <div className="w-6 h-1.5 rounded-full" style={{ background: 'var(--border)' }} />
            </div>
            <span className="text-[10px] text-secondary uppercase tracking-widest font-semibold">Step 1 of 3 · Liquidity Provider</span>
          </div>

          <h2 className="font-headline font-extrabold text-primary mb-1" style={{ fontSize: '26px', letterSpacing: '-0.025em' }}>
            Create LP Account
          </h2>
          <p className="text-sm text-secondary mb-8">Start deploying capital into verified invoice pools.</p>

          {/* Account type */}
          <div
            className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl mb-6"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}
          >
            {(['individual', 'institutional'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setAccountType(type)}
                className="py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                style={accountType === type
                  ? { background: 'linear-gradient(135deg,#0A1628,#112240)', color: '#fff', boxShadow: '0 4px 12px rgba(10,22,40,0.20)', border: '1px solid rgba(201,146,42,0.20)' }
                  : { color: 'var(--secondary)' }
                }
              >
                <span className="material-symbols-outlined text-[18px]">
                  {type === 'individual' ? 'person' : 'corporate_fare'}
                </span>
                {type === 'individual' ? 'Individual' : 'Institutional'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-primary">
                {accountType === 'institutional' ? 'Fund / Entity Name' : 'Full Legal Name'}
              </label>
              <input
                type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full h-12 px-4 rounded-xl text-sm text-primary focus:outline-none"
                style={{ background: 'var(--canvas)', border: '1px solid var(--border)' }}
                onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-primary">Email Address</label>
                <span className="text-[10px] text-secondary">Wallet creation</span>
              </div>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-xl text-sm text-primary focus:outline-none"
                style={{ background: 'var(--canvas)', border: '1px solid var(--border)' }}
                onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-primary">Target Allocation</label>
                <span className="text-[10px] text-secondary font-semibold font-tnum" style={{ color: '#C9922A' }}>
                  ${targetAllocation.toLocaleString()} USD
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-secondary pointer-events-none">$</span>
                <input
                  type="number" min={500} step={500} required
                  value={targetAllocation}
                  onChange={e => setTargetAllocation(Number(e.target.value))}
                  className="w-full h-12 pl-8 pr-4 rounded-xl font-headline font-extrabold text-base text-primary focus:outline-none font-tnum"
                  style={{ background: 'var(--canvas)', border: '1px solid var(--border)', letterSpacing: '-0.01em' }}
                  onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                  onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}
                />
              </div>
              {/* Allocation slider */}
              <input
                type="range" min={500} max={100000} step={500}
                value={targetAllocation}
                onChange={e => setTargetAllocation(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#C9922A' }}
              />
              <div className="flex justify-between text-[10px] text-secondary">
                <span>$500</span>
                <span>$100k</span>
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
              Create LP Account
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
