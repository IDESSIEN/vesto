import React from 'react';
import { useApp } from '../../context/AppContext';

export const VerificationInProgress: React.FC = () => {
  const { setSellerView, verifications, seller } = useApp();

  const pendingItem = verifications.find((v) => v.sellerId === seller.id && v.status === 'pending') || verifications[0];

  return (
    <div className="max-w-xl mx-auto py-8 px-4 text-center">
      {/* Animated Pulse Badge */}
      <div className="w-20 h-20 mx-auto rounded-full bg-warning-amber-soft border border-on-tertiary-container/30 flex items-center justify-center mb-6 relative">
        <span className="material-symbols-outlined text-4xl text-on-tertiary-container animate-pulse">hourglass_top</span>
        <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-tertiary-fixed-dim border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary">
          !
        </span>
      </div>

      <h1 className="font-headline text-2xl font-bold text-primary-container mb-2">
        Verification In Progress
      </h1>
      <p className="font-body-md text-sm text-secondary max-w-md mx-auto mb-6">
        Your document ({pendingItem?.documentType || 'Business Credential'}) has been submitted to the Admin Risk Oversight Queue.
      </p>

      {/* Status Tracker Box */}
      <div className="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle text-left mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-xs text-secondary uppercase font-semibold">Queue ID</span>
          <span className="font-mono text-xs font-bold text-primary">{pendingItem?.id || 'VR-901'}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-label-sm text-xs text-secondary uppercase font-semibold">Submitted</span>
          <span className="font-body-sm text-xs text-primary">{pendingItem?.submittedAt || 'Just now'}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-label-sm text-xs text-secondary uppercase font-semibold">Target Tier Limit</span>
          <span className="font-headline text-sm font-bold text-success-shamrock">
            {pendingItem?.tier === 2 ? '$5,000 USD' : '$500 USD'}
          </span>
        </div>

        <div className="pt-3 border-t border-border-subtle flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-tertiary-fixed-dim animate-ping shrink-0"></span>
          <span className="text-xs text-on-tertiary-fixed-variant font-medium">
            Admin review takes ~5 minutes. You will receive SMS confirmation.
          </span>
        </div>
      </div>

      {/* Quick Navigation Buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => setSellerView('submit_invoice')}
          className="w-full h-12 bg-primary text-white font-label-lg font-bold rounded-xl hover:bg-primary-container shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>Submit Invoice Now (Draft)</span>
        </button>

        <button
          onClick={() => setSellerView('dashboard')}
          className="w-full h-12 bg-surface-container text-primary font-label-lg font-semibold rounded-xl hover:bg-surface-variant transition-all flex items-center justify-center gap-2"
        >
          <span>Go to Seller Dashboard</span>
        </button>
      </div>
    </div>
  );
};
