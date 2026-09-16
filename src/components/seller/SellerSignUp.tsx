import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const SellerSignUp: React.FC = () => {
  const { setSellerView, loginWithEmailOrPhone, connectExternalWallet, showToast } = useApp();
  const [fullName, setFullName] = useState('Amina Diallo');
  const [email, setEmail] = useState('amina@nairobfresh.co');
  const [phonePrefix, setPhonePrefix] = useState('+254');
  const [phoneNumber, setPhoneNumber] = useState('712 345 678');
  const [businessName, setBusinessName] = useState('Nairobi Fresh Produce Co.');
  const [operatingCountry, setOperatingCountry] = useState('Kenya');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginWithEmailOrPhone(email || `${phonePrefix}${phoneNumber}`);
    showToast('Seller Account Created! Embedded Monad MPC Wallet provisioned (0 Seed Phrases).', 'success');
    setSellerView('tier1');
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      {/* Context Banner */}
      <div className="flex items-center gap-2 bg-warning-amber-soft px-4 py-3 rounded-xl shadow-sm mb-6 border border-warning-amber-soft/80">
        <span className="material-symbols-outlined text-on-tertiary-container text-lg shrink-0">bolt</span>
        <p className="font-label-sm text-xs text-on-tertiary-fixed-variant leading-snug">
          Front door: Sellers — Turn invoices into immediate working capital.
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-secondary-fixed text-primary text-xs font-semibold">
            1
          </span>
          <span className="font-label-sm text-xs text-secondary uppercase tracking-wider">
            Step 1 of 3 · Onboarding
          </span>
        </div>
        <h1 className="font-headline text-2xl font-bold text-primary tracking-tight">
          Create your Seller Account
        </h1>
        <p className="font-body-md text-sm text-secondary">
          An embedded Monad wallet will be created automatically. Zero seed phrases required.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Step tracker */}
        <div className="grid grid-cols-3 gap-2">
          <div className="h-1.5 rounded-full bg-primary"></div>
          <div className="h-1.5 rounded-full bg-surface-container-high"></div>
          <div className="h-1.5 rounded-full bg-surface-container-high"></div>
        </div>

        <div className="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-xs font-semibold text-on-surface-variant flex justify-between" htmlFor="fullName">
              <span>Full Legal Name</span>
              <span className="text-secondary font-normal">As on photo ID</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-secondary text-lg pointer-events-none">person</span>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Amina Diallo"
                className="w-full h-12 pl-10 pr-3 rounded-lg bg-surface-container-lowest font-body-md text-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-xs font-semibold text-on-surface-variant" htmlFor="email">
              Email Address (Creates Embedded Wallet)
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-secondary text-lg pointer-events-none">mail</span>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="amina@nairobfresh.co"
                className="w-full h-12 pl-10 pr-3 rounded-lg bg-surface-container-lowest font-body-md text-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-xs font-semibold text-on-surface-variant" htmlFor="phoneNumber">
              Mobile Number
            </label>
            <div className="flex gap-2">
              <select
                value={phonePrefix}
                onChange={(e) => setPhonePrefix(e.target.value)}
                className="w-28 h-12 px-3 rounded-lg bg-surface-container-lowest font-body-md text-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="+254">🇰🇪 +254</option>
                <option value="+234">🇳🇬 +234</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
              </select>
              <input
                id="phoneNumber"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="712 345 678"
                className="flex-1 h-12 px-3 rounded-lg bg-surface-container-lowest font-body-md text-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Business Name */}
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-xs font-semibold text-on-surface-variant" htmlFor="businessName">
              Registered Business Name
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-secondary text-lg pointer-events-none">corporate_fare</span>
              <input
                id="businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Nairobi Fresh Produce Co."
                className="w-full h-12 pl-10 pr-3 rounded-lg bg-surface-container-lowest font-body-md text-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Jurisdiction */}
          <div className="flex flex-col gap-1">
            <label className="font-label-md text-xs font-semibold text-on-surface-variant" htmlFor="operatingCountry">
              Primary Operating Jurisdiction
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-secondary text-lg pointer-events-none">public</span>
              <select
                id="operatingCountry"
                value={operatingCountry}
                onChange={(e) => setOperatingCountry(e.target.value)}
                className="w-full h-12 pl-10 pr-8 rounded-lg bg-surface-container-lowest font-body-md text-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="Kenya">Kenya (KSh / USD)</option>
                <option value="Nigeria">Nigeria (NGN / USD)</option>
                <option value="Ghana">Ghana (GHS / USD)</option>
                <option value="United States">United States (USD)</option>
                <option value="United Kingdom">United Kingdom (GBP)</option>
              </select>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          type="submit"
          className="w-full h-13 bg-primary text-white font-label-lg font-bold rounded-xl hover:bg-primary-container shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 py-3"
        >
          <span>Create Account & Embedded Wallet</span>
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </button>

        {/* Existing External Wallet Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => connectExternalWallet('MetaMask')}
            className="text-xs text-secondary font-semibold hover:text-primary transition-colors underline"
          >
            Already have a Web3 wallet? Connect Existing Wallet (MetaMask / Coinbase)
          </button>
        </div>
      </form>
    </div>
  );
};
