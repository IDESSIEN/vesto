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

// Lender Components
import { LenderSignUp } from './components/lender/LenderSignUp';
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
  } = useApp();

  const navBtn = (active: boolean, onClick: () => void, label: string) => (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all duration-150 text-xs relative ${
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
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-end gap-1 overflow-x-auto py-2 no-scrollbar">
          {currentRole === 'seller' && (
            <>
              {navBtn(sellerView === 'dashboard',     () => setSellerView('dashboard'),     'Dashboard')}
              {navBtn(sellerView === 'submit_invoice',() => setSellerView('submit_invoice'),'+ Submit Invoice')}
              {navBtn(sellerView === 'tier1',         () => setSellerView('tier1'),         'Tier 1 ($500)')}
              {navBtn(sellerView === 'tier2',         () => setSellerView('tier2'),         'Tier 2 ($5,000)')}
              {navBtn(sellerView === 'in_progress',   () => setSellerView('in_progress'),   'Status')}
              {navBtn(sellerView === 'tutorial',      () => setSellerView('tutorial'),      'Tour')}
              {navBtn(sellerView === 'signup',        () => setSellerView('signup'),        'Sign Up')}
            </>
          )}
          {currentRole === 'lender' && (
            <>
              {navBtn(lenderView === 'browse',        () => setLenderView('browse'),        'Marketplace')}
              {navBtn(lenderView === 'batch',         () => setLenderView('batch'),         'Batch Funding')}
              {navBtn(lenderView === 'portfolio',     () => setLenderView('portfolio'),     'Portfolio')}
              {navBtn(lenderView === 'risk_disclosure',()=> setLenderView('risk_disclosure'),'Risk Disclosure')}
              {navBtn(lenderView === 'guided_tour',   () => setLenderView('guided_tour'),   'Guided Tour')}
              {navBtn(lenderView === 'signup',        () => setLenderView('signup'),        'Sign Up')}
            </>
          )}
          {currentRole === 'admin' && (
            <>
              {navBtn(adminView === 'oversight',      () => setAdminView('oversight'),      'Invoice Oversight')}
              {navBtn(adminView === 'queue',          () => setAdminView('queue'),          'KYC Queue')}
              {navBtn(adminView === 'dispute',        () => setAdminView('dispute'),        'Disputes')}
              {navBtn(adminView === 'analytics',      () => setAdminView('analytics'),      'Analytics')}
              {navBtn(adminView === '2fa',            () => setAdminView('2fa'),            'Admin 2FA')}
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentRole === 'seller' && (
          <>
            {sellerView === 'signup'         && <SellerSignUp />}
            {sellerView === 'tier1'          && <Tier1Verification />}
            {sellerView === 'tier2'          && <Tier2Verification />}
            {sellerView === 'in_progress'    && <VerificationInProgress />}
            {sellerView === 'tutorial'       && <SellerOnboardingTutorial />}
            {sellerView === 'submit_invoice' && <SubmitInvoice />}
            {sellerView === 'dashboard'      && <SellerDashboard />}
          </>
        )}
        {currentRole === 'lender' && (
          <>
            {lenderView === 'signup'         && <LenderSignUp />}
            {lenderView === 'risk_disclosure'&& <RiskDisclosure />}
            {lenderView === 'guided_tour'    && <MarketplaceGuidedTour />}
            {lenderView === 'browse'         && <MarketplaceBrowse />}
            {lenderView === 'batch'          && <FundInvoiceBatch />}
            {lenderView === 'portfolio'      && <LenderPortfolio />}
          </>
        )}
        {currentRole === 'admin' && (
          <>
            {adminView === '2fa'             && <AdminLogin2FA />}
            {adminView === 'queue'           && <VerificationQueue />}
            {adminView === 'oversight'       && <InvoiceOversightTable />}
            {adminView === 'dispute'         && <DisputeResolution />}
            {adminView === 'analytics'       && <AnalyticsOverview />}
          </>
        )}
      </main>
    </div>
  );
};
