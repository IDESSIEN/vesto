import React from 'react';
import { ConnectKitButton } from 'connectkit';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const { currentRole, setCurrentRole, notification } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-primary text-white border-b border-primary-container shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">

          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setCurrentRole('seller')}
          >
            <div className="w-9 h-9 rounded-xl bg-tertiary-fixed flex items-center justify-center">
              <span className="font-headline font-bold text-primary text-lg leading-none">V</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-xl tracking-tight leading-none text-white" style={{ letterSpacing: '-0.02em' }}>
                VESTO
              </span>
              <span className="text-[10px] text-on-primary-container uppercase tracking-widest font-semibold mt-0.5">
                Invoice Capital, Onchain
              </span>
            </div>
          </div>

          {/* Right side: Role Switcher + Wallet */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="bg-primary-container p-1 rounded-full border border-secondary/30 flex items-center gap-1 shadow-inner">
            {(['seller', 'lender', 'admin'] as const).map((role) => {
              const icons: Record<string, string> = {
                seller: 'storefront',
                lender: 'account_balance',
                admin: 'admin_panel_settings',
              };
              const labels: Record<string, string> = {
                seller: 'Seller',
                lender: 'Lender',
                admin: 'Admin',
              };
              return (
                <button
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    currentRole === role
                      ? 'bg-tertiary-fixed text-primary shadow-sm'
                      : 'text-on-primary-container hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{icons[role]}</span>
                  <span>{labels[role]}</span>
                </button>
              );
            })}
            </div>

            {/* Wallet Connect */}
            <ConnectKitButton />
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`w-full text-center py-2 px-4 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-success-shamrock text-white'
              : notification.type === 'warning'
              ? 'bg-warning-amber-soft text-primary'
              : 'bg-primary-container text-inverse-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {notification.type === 'success' ? 'check_circle' : notification.type === 'warning' ? 'warning' : 'info'}
          </span>
          <span>{notification.message}</span>
        </div>
      )}
    </header>
  );
};
