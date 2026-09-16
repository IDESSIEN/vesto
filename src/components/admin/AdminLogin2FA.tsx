import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const AdminLogin2FA: React.FC = () => {
  const { setAdminView, showToast } = useApp();
  const [adminUser, setAdminUser] = useState('admin@agrarian-capital.io');
  const [passcode, setPasscode] = useState('849201');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Admin 2FA Authentication Successful!', 'success');
    setAdminView('oversight');
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-4 shadow-md font-bold text-2xl">
        A
      </div>

      <h1 className="font-headline text-2xl font-bold text-primary mb-1">
        Institutional Risk Oversight Admin
      </h1>
      <p className="font-body-md text-xs text-secondary mb-6">
        Advance Governance & Smart Contract Execution Portal
      </p>

      <form onSubmit={handleLogin} className="bg-surface-card rounded-2xl p-6 shadow-md border border-border-subtle flex flex-col gap-4 text-left">
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-on-surface-variant">Admin Identifier</label>
          <input
            type="email"
            required
            value={adminUser}
            onChange={(e) => setAdminUser(e.target.value)}
            className="w-full h-12 px-3 rounded-lg bg-surface-container-lowest text-xs text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-on-surface-variant">2FA Authenticator Code (TOTP)</label>
          <input
            type="text"
            required
            maxLength={6}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full h-12 px-3 rounded-lg bg-surface-container-lowest font-mono font-bold text-center text-lg tracking-widest text-primary border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          className="w-full h-12 bg-primary text-white font-label-lg font-bold rounded-xl hover:bg-primary-container shadow-md transition-all mt-2 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
          <span>Authenticate & Access Queue</span>
        </button>
      </form>
    </div>
  );
};
