import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const MarketplaceGuidedTour: React.FC = () => {
  const { setLenderView } = useApp();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: 'Real-World Invoice Batches',
      icon: 'fact_check',
      description: 'Invoices are uploaded by verified East African agricultural merchants with attached Bills of Lading.',
      stat: '14 Open Batches Available',
    },
    {
      title: 'Predictable Yield APY',
      icon: 'trending_up',
      description: 'Earn 11.5% - 18.0% APY depending on credit risk score, term duration (15 to 90 days), and sector.',
      stat: '14.8% Average Blended Yield',
    },
    {
      title: 'Single-Click or Batch Funding',
      icon: 'dataset',
      description: 'Fund individual invoices directly or select multiple invoices to deploy capital across diverse pools in one transaction.',
      stat: 'Instant On-Chain Execution',
    },
  ];

  return (
    <div className="max-w-xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <span className="font-label-sm text-xs text-secondary uppercase font-bold">Lender Guided Tour</span>
        <button
          onClick={() => setLenderView('browse')}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Skip to Marketplace
        </button>
      </div>

      <div className="bg-surface-card rounded-2xl p-6 shadow-md border border-border-subtle text-center flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-secondary-container text-primary flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">{steps[activeStep].icon}</span>
        </div>

        <h2 className="font-headline text-xl font-bold text-primary mb-2">
          {steps[activeStep].title}
        </h2>
        <p className="font-body-md text-sm text-secondary mb-4 leading-relaxed">
          {steps[activeStep].description}
        </p>

        <div className="w-full bg-success-shamrock/10 border border-success-shamrock/30 p-3 rounded-xl text-success-shamrock font-bold text-xs">
          {steps[activeStep].stat}
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {steps.map((_, idx) => (
          <div
            key={idx}
            onClick={() => setActiveStep(idx)}
            className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
              idx === activeStep ? 'w-8 bg-primary' : 'w-2 bg-surface-container-high'
            }`}
          />
        ))}
      </div>

      <button
        onClick={() => {
          if (activeStep < steps.length - 1) {
            setActiveStep((prev) => prev + 1);
          } else {
            setLenderView('browse');
          }
        }}
        className="w-full h-12 bg-primary text-white font-label-lg font-bold rounded-xl hover:bg-primary-container shadow-md transition-all flex items-center justify-center gap-2"
      >
        <span>{activeStep < steps.length - 1 ? 'Next' : 'Explore Marketplace'}</span>
        <span className="material-symbols-outlined text-lg">arrow_forward</span>
      </button>
    </div>
  );
};
