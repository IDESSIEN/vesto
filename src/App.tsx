import React from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';

// Seller Components
import { SellerSignUp } from './components/seller/SellerSignUp';
import { Tier1Verification } from './components/seller/Tier1Verification';
import { Tier2Verification } from './components/seller/Tier2Verification';
import { VerificationInProgress } from './components/seller/VerificationInProgress';
import { SellerOnboardingTutorial } from './components/seller/SellerOnboardingTutorial';
import { SubmitInvoice } from './components/seller/SubmitInvoice';
import { SellerDashboard } from './components/seller/SellerDashboard';
import { SellerStatus } from './components/seller/SellerStatus';

// Lender Components
import { LenderSignUp } from './components/lender/LenderSignUp';
import { LenderWelcome } from './components/lender/LenderWelcome';
import { RiskDisclosure } from './components/lender/RiskDisclosure';
import { MarketplaceGuidedTour } from './components/lender/MarketplaceGuidedTour';
import { MarketplaceBrowse } from './components/lender/MarketplaceBrowse';
import { FundInvoiceBatch } from './components/lender/FundInvoiceBatch';
import { LenderPortfolio } from './components/lender/LenderPortfolio';

// Admin Components
import { AdminLogin2FA } from './components/admin/AdminLogin2FA';
import { VerificationQueue } from './components/admin/VerificationQueue';
import { InvoiceOversightTable } from './components/admin/InvoiceOversightTable';
import { DisputeResolution } from './components/admin/DisputeResolution';
import { AnalyticsOverview } from './components/admin/AnalyticsOverview';

export const AppContent: React.FC = () => {
  const {
    currentRole,
    sellerView, setSellerView,
    lenderView, setLenderView,
    adminView, setAdminView,
    sellerOnboarded, lenderOnboarded, adminOnboarded,
    seller,
  } = useApp();

  const navBtn = (active: boolean, onClick: () => void, label: string) => (
    <button
      onClick={onClick}
      className={`px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full font-semibold whitespace-nowrap transition-all duration-150 text-[11px] sm:text-xs relative ${
        active
          ? 'text-primary font-bold shadow-xs'
          : 'text-secondary hover:text-primary'
      }`}
      style={active ? { background: 'linear-gradient(135deg, #C9922A 0%, #E8B96A 100%)', color: '#FFFFFF' } : {}}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-dvh flex flex-col bg-surface text-on-surface">
      <Navbar />

      {/* Sub-Navigation */}
      <div className="border-b border-border-subtle" style={{ background: 'var(--surface-strong)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-end gap-0.5 sm:gap-1 overflow-x-auto py-1.5 sm:py-2 no-scrollbar">
          {currentRole === 'seller' && (
            <>
              {navBtn(sellerView === 'signup' && !sellerOnboarded, () => setSellerView('signup'), 'Sign Up')}
              {sellerOnboarded && navBtn(sellerView === 'dashboard', () => setSellerView('dashboard'), 'Dashboard')}
              {sellerOnboarded && navBtn(sellerView === 'submit_invoice', () => setSellerView('submit_invoice'), '+ Invoice')}
              {sellerOnboarded && navBtn(
                sellerView === 'tier1' || sellerView === 'tier2' || sellerView === 'in_progress',
                () => {
                  // Route to the correct tier based on current verification state
                  if (seller.kycStatusTier1 === 'verified') {
                    setSellerView('tier2');
                  } else if (seller.kycStatusTier1 === 'pending') {
                    setSellerView('in_progress');
                  } else {
                    setSellerView('tier1');
                  }
                },
                'Verify ID'
              )}
              {sellerOnboarded && navBtn(sellerView === 'status', () => setSellerView('status'), 'Status')}
            </>
          )}
          {currentRole === 'lender' && (
            <>
              {navBtn(lenderView === 'signup' && !lenderOnboarded, () => setLenderView('signup'), 'Sign Up')}
              {lenderOnboarded && navBtn(lenderView === 'browse' || lenderView === 'welcome', () => setLenderView('browse'), 'Marketplace')}
              {lenderOnboarded && navBtn(lenderView === 'batch',          () => setLenderView('batch'),          'Batch Funding')}
              {lenderOnboarded && navBtn(lenderView === 'portfolio',      () => setLenderView('portfolio'),      'Portfolio')}
            </>
          )}
          {currentRole === 'admin' && (
            <>
              {navBtn(adminView === '2fa' && !adminOnboarded, () => setAdminView('2fa'), 'Sign In')}
              {adminOnboarded && navBtn(adminView === 'oversight',  () => setAdminView('oversight'),  'Invoices')}
              {adminOnboarded && navBtn(adminView === 'queue',      () => setAdminView('queue'),      'KYC Queue')}
              {adminOnboarded && navBtn(adminView === 'dispute',    () => setAdminView('dispute'),    'Disputes')}
              {adminOnboarded && navBtn(adminView === 'analytics',  () => setAdminView('analytics'),  'Analytics')}
              {adminOnboarded && navBtn(adminView === '2fa',        () => setAdminView('2fa'),        '⚙ Security')}
            </>
          )}
        </div>
      </div>

      {/* Main Content - fade-in on every view switch */}
      <main
        className="flex-1 max-w-7xl w-full mx-auto p-0 sm:p-2"
        key={`${currentRole}:${sellerView}:${lenderView}:${adminView}`}
        style={{ animation: 'vesto-fade-in 0.18s ease-out both' }}
      >
        {currentRole === 'seller' && (
          <>
            {(!sellerOnboarded || sellerView === 'signup') && <SellerSignUp />}
            {sellerOnboarded && sellerView === 'tier1'          && <Tier1Verification />}
            {sellerOnboarded && sellerView === 'tier2'          && <Tier2Verification />}
            {sellerOnboarded && sellerView === 'in_progress'    && <VerificationInProgress />}
            {sellerOnboarded && sellerView === 'tutorial'       && <SellerOnboardingTutorial />}
            {sellerOnboarded && sellerView === 'submit_invoice' && <SubmitInvoice />}
            {sellerOnboarded && sellerView === 'dashboard'      && <SellerDashboard />}
            {sellerOnboarded && sellerView === 'status'         && <SellerStatus />}
          </>
        )}
        {currentRole === 'lender' && (
          <>
            {(!lenderOnboarded || lenderView === 'signup')   && <LenderSignUp />}
            {lenderOnboarded && lenderView === 'welcome'        && <LenderWelcome />}
            {lenderOnboarded && lenderView === 'risk_disclosure'&& <RiskDisclosure />}
            {lenderOnboarded && lenderView === 'guided_tour'    && <MarketplaceGuidedTour />}
            {lenderOnboarded && lenderView === 'browse'         && <MarketplaceBrowse />}
            {lenderOnboarded && lenderView === 'batch'          && <FundInvoiceBatch />}
            {lenderOnboarded && lenderView === 'portfolio'      && <LenderPortfolio />}
          </>
        )}
        {currentRole === 'admin' && (
          <>
            {(!adminOnboarded || adminView === '2fa')        && <AdminLogin2FA />}
            {adminOnboarded && adminView === 'queue'         && <VerificationQueue />}
            {adminOnboarded && adminView === 'oversight'     && <InvoiceOversightTable />}
            {adminOnboarded && adminView === 'dispute'       && <DisputeResolution />}
            {adminOnboarded && adminView === 'analytics'     && <AnalyticsOverview />}
          </>
        )}
      </main>
    </div>
  );
};
