import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const AdminLogin2FA: React.FC = () => {
  const { completeAdminOnboarding, showToast } = useApp();
  const [adminUser, setAdminUser] = useState('');
  const [passcode, setPasscode] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Admin authenticated. Welcome to the oversight portal.', 'success');
    completeAdminOnboarding();
  };

  // Split passcode into 6 character slots
  const slots = Array.from({ length: 6 }, (_, i) => passcode[i] || '');

  return (
    <div
      className="flex items-center justify-center px-4 py-12"
      style={{ minHeight: 'calc(100dvh - 96px)', background: 'var(--canvas)' }}
    >
      <div className="w-full max-w-sm">

        {/* ── Logo ──────────────────────────────────────────── */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-4 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg,#0A1628 0%,#112240 100%)',
              boxShadow: '0 0 0 1px rgba(201,146,42,0.30), 0 12px 32px rgba(10,22,40,0.35)',
            }}
          >
            {/* Gold strip */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
            {/* Dot matrix */}
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '14px 14px' }}
            />
            <span
              className="relative font-headline font-extrabold text-2xl"
              style={{ color: '#E8B96A', letterSpacing: '-0.02em' }}
            >V</span>
          </div>
          <h1 className="font-headline font-extrabold text-primary text-center" style={{ fontSize: '22px', letterSpacing: '-0.025em' }}>
            Institutional Risk Portal
          </h1>
          <p className="text-xs text-secondary text-center mt-1">Vesto Governance & Smart Contract Oversight</p>
        </div>

        {/* ── Form Card ─────────────────────────────────────── */}
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(10,22,40,0.08)',
          }}
        >
          {/* Gold strip */}
          <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />

          <form onSubmit={handleLogin} className="p-6 flex flex-col gap-5">

            {/* Admin email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-primary">Admin Identifier</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-[18px] pointer-events-none">
                  admin_panel_settings
                </span>
                <input
                  type="email" required value={adminUser}
                  onChange={e => setAdminUser(e.target.value)}
                  placeholder="admin@vesto.finance"
                  className="w-full h-12 pl-11 pr-4 rounded-xl text-sm text-primary focus:outline-none transition-all"
                  style={{ background: 'var(--canvas)', border: '1px solid var(--border)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#C9922A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,146,42,0.10)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* TOTP - character slot layout */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-primary">2FA Authenticator Code (TOTP)</label>
                <span className="text-[10px] text-secondary uppercase tracking-wider font-semibold">6 digits</span>
              </div>
              {/* Slot display */}
              <div className="flex gap-2 justify-between">
                {slots.map((ch, i) => (
                  <div
                    key={i}
                    className="flex-1 h-14 rounded-xl flex items-center justify-center font-headline font-extrabold text-xl font-tnum transition-all"
                    style={{
                      background: ch ? 'linear-gradient(135deg,#0A1628,#112240)' : 'var(--canvas)',
                      border: ch ? '1px solid rgba(201,146,42,0.35)' : '1px solid var(--border)',
                      color: ch ? '#E8B96A' : 'var(--secondary)',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {ch || '·'}
                  </div>
                ))}
              </div>
              {/* Hidden real input */}
              <input
                type="text" inputMode="numeric" pattern="[0-9]*"
                maxLength={6} required value={passcode}
                onChange={e => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full h-12 px-4 rounded-xl text-sm text-primary font-tnum text-center tracking-[0.25em] font-bold focus:outline-none transition-all"
                style={{ background: 'var(--canvas)', border: '1px solid var(--border)' }}
                placeholder="Enter 6-digit code"
                onFocus={e => { e.currentTarget.style.borderColor = '#C9922A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,146,42,0.10)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <p className="text-[10px] text-secondary text-center">
                Open your authenticator app and enter the current 6-digit code
              </p>
            </div>

            {/* CTA */}
            <button
              type="submit"
              className="w-full h-14 rounded-2xl text-sm font-extrabold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-1"
              style={{
                background: 'linear-gradient(135deg,#0A1628 0%,#112240 100%)',
                boxShadow: '0 8px 24px rgba(10,22,40,0.25)',
                border: '1px solid rgba(201,146,42,0.25)',
              }}
            >
              <span className="material-symbols-outlined text-lg">lock_open</span>
              Authenticate & Enter
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-secondary mt-5">
          Secured by USDC · Vesto Governance Portal · Arc Testnet
        </p>
      </div>
    </div>
  );
};
