import React from 'react';
import { ConnectKitButton } from 'connectkit';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const { currentRole, setCurrentRole, notification } = useApp();

  const roles = [
    { id: 'seller' as const, label: 'Seller',  icon: 'storefront' },
    { id: 'lender' as const, label: 'Lender',  icon: 'account_balance' },
    { id: 'admin'  as const, label: 'Admin',   icon: 'admin_panel_settings' },
  ];

  return (
    <header className="sticky top-0 z-40 shadow-nav" style={{ background: 'var(--accent)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-18 gap-4">

          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none shrink-0"
            onClick={() => setCurrentRole('seller')}
          >
            {/* Gold mark */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-gold shrink-0"
              style={{ background: 'linear-gradient(135deg, #C9922A 0%, #E8B96A 100%)' }}
            >
              <span className="font-headline font-bold text-white text-lg leading-none" style={{ letterSpacing: '-0.02em' }}>
                V
              </span>
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="font-headline font-bold text-xl tracking-tight text-white"
                style={{ letterSpacing: '-0.03em' }}
              >
                VESTO
              </span>
              <span
                className="text-[9px] uppercase tracking-[0.12em] font-semibold mt-0.5"
                style={{ color: 'var(--gold-light)' }}
              >
                Invoice Capital, Onchain
              </span>
            </div>
          </div>

          {/* Right: Role Switcher + Wallet */}
          <div className="flex items-center gap-3 ml-auto">

            {/* Role pill */}
            <nav
              className="hidden sm:flex items-center gap-0.5 p-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              {roles.map(({ id, label, icon }) => {
                const active = currentRole === id;
                return (
                  <button
                    key={id}
                    onClick={() => setCurrentRole(id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                      active
                        ? 'text-primary shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                    style={active ? { background: 'linear-gradient(135deg, #C9922A 0%, #E8B96A 100%)' } : {}}
                  >
                    <span className="material-symbols-outlined text-[15px]">{icon}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Mobile role pills (icons only) */}
            <nav
              className="flex sm:hidden items-center gap-0.5 p-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              {roles.map(({ id, icon }) => {
                const active = currentRole === id;
                return (
                  <button
                    key={id}
                    onClick={() => setCurrentRole(id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      active ? 'text-primary' : 'text-white/70'
                    }`}
                    style={active ? { background: 'linear-gradient(135deg, #C9922A 0%, #E8B96A 100%)' } : {}}
                  >
                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                  </button>
                );
              })}
            </nav>

            {/* Wallet button */}
            <ConnectKitButton />
          </div>
        </div>
      </div>

      {/* Toast notification strip */}
      {notification && (
        <div
          className={`w-full text-center py-2 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-success-shamrock/90 text-white'
              : notification.type === 'warning'
              ? 'text-primary'
              : 'text-white'
          }`}
          style={
            notification.type === 'warning'
              ? { background: 'var(--gold-bg)', borderTop: '1px solid var(--gold-light)' }
              : notification.type === 'info'
              ? { background: 'rgba(255,255,255,0.10)', borderTop: '1px solid rgba(255,255,255,0.12)' }
              : {}
          }
        >
          <span className="material-symbols-outlined text-[15px]">
            {notification.type === 'success' ? 'check_circle' : notification.type === 'warning' ? 'warning' : 'info'}
          </span>
          <span>{notification.message}</span>
        </div>
      )}
    </header>
  );
};
