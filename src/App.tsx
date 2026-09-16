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

import { WalletAuthModal } from './components/auth/WalletAuthModal';

export const AppContent: React.FC = () => {
  const {
    currentRole,
    sellerView,
    setSellerView,
    lenderView,
    setLenderView,
    adminView,
    setAdminView,
  } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Navbar />
      <WalletAuthModal />

      {/* Sub-Navigation Bar per Role */}
      <div className="bg-surface-card border-b border-border-subtle shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 overflow-x-auto no-scrollbar py-2 text-xs">
          {currentRole === 'seller' && (
            <>
              <button
                onClick={() => setSellerView('dashboard')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  sellerView === 'dashboard' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                Seller Dashboard
              </button>
              <button
                onClick={() => setSellerView('submit_invoice')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  sellerView === 'submit_invoice' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                + Submit Invoice
              </button>
              <button
                onClick={() => setSellerView('tier1')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  sellerView === 'tier1' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                Tier 1 ($500)
              </button>
              <button
                onClick={() => setSellerView('tier2')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  sellerView === 'tier2' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                Tier 2 ($5,000)
              </button>
              <button
                onClick={() => setSellerView('in_progress')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  sellerView === 'in_progress' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                Status Tracker
              </button>
              <button
                onClick={() => setSellerView('tutorial')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  sellerView === 'tutorial' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                Tour
              </button>
              <button
                onClick={() => setSellerView('signup')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  sellerView === 'signup' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                Sign Up Form
              </button>
            </>
          )}

          {currentRole === 'lender' && (
            <>
              <button
                onClick={() => setLenderView('browse')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  lenderView === 'browse' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                Browse Marketplace
              </button>
              <button
                onClick={() => setLenderView('batch')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  lenderView === 'batch' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                Batch Funding
              </button>
              <button
                onClick={() => setLenderView('portfolio')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  lenderView === 'portfolio' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                Lender Portfolio
              </button>
              <button
                onClick={() => setLenderView('risk_disclosure')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  lenderView === 'risk_disclosure' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                Risk Disclosure
              </button>
              <button
                onClick={() => setLenderView('guided_tour')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  lenderView === 'guided_tour' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                Guided Tour
              </button>
              <button
                onClick={() => setLenderView('signup')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  lenderView === 'signup' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                Lender Sign Up
              </button>
            </>
          )}

          {currentRole === 'admin' && (
            <>
              <button
                onClick={() => setAdminView('oversight')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  adminView === 'oversight' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                Invoice Oversight Grid
              </button>
              <button
                onClick={() => setAdminView('queue')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  adminView === 'queue' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                KYC Queue
              </button>
              <button
                onClick={() => setAdminView('dispute')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  adminView === 'dispute' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                Dispute Resolution
              </button>
              <button
                onClick={() => setAdminView('analytics')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  adminView === 'analytics' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                Platform Analytics
              </button>
              <button
                onClick={() => setAdminView('2fa')}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  adminView === '2fa' ? 'bg-primary text-white' : 'text-secondary hover:text-primary'
                }`}
              >
                Admin 2FA Screen
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Render */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentRole === 'seller' && (
          <>
            {sellerView === 'signup' && <SellerSignUp />}
            {sellerView === 'tier1' && <Tier1Verification />}
            {sellerView === 'tier2' && <Tier2Verification />}
            {sellerView === 'in_progress' && <VerificationInProgress />}
            {sellerView === 'tutorial' && <SellerOnboardingTutorial />}
            {sellerView === 'submit_invoice' && <SubmitInvoice />}
            {sellerView === 'dashboard' && <SellerDashboard />}
          </>
        )}

        {currentRole === 'lender' && (
          <>
            {lenderView === 'signup' && <LenderSignUp />}
            {lenderView === 'risk_disclosure' && <RiskDisclosure />}
            {lenderView === 'guided_tour' && <MarketplaceGuidedTour />}
            {lenderView === 'browse' && <MarketplaceBrowse />}
            {lenderView === 'batch' && <FundInvoiceBatch />}
            {lenderView === 'portfolio' && <LenderPortfolio />}
          </>
        )}

        {currentRole === 'admin' && (
          <>
            {adminView === '2fa' && <AdminLogin2FA />}
            {adminView === 'queue' && <VerificationQueue />}
            {adminView === 'oversight' && <InvoiceOversightTable />}
            {adminView === 'dispute' && <DisputeResolution />}
            {adminView === 'analytics' && <AnalyticsOverview />}
          </>
        )}
      </main>
    </div>
  );
};
