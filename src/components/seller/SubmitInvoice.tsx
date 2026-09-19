import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const SubmitInvoice: React.FC = () => {
  const { setSellerView, submitInvoice, seller, showToast } = useApp();

  const [buyerName, setBuyerName] = useState('Metro Supermarkets East Africa');
  const [buyerTaxId, setBuyerTaxId] = useState('P051294819X');
  const [buyerCountry, setBuyerCountry] = useState('Kenya');
  const [amount, setAmount] = useState<number>(1200);
  const [dueDate, setDueDate] = useState('2026-10-15');
  const [docName, setDocName] = useState('bill_of_lading_metro_produce.pdf');
  const [docUploaded, setDocUploaded] = useState(true);

  const advanceRatePct = seller.verificationTier === 2 ? 90 : 85;
  const advanceAmount = Math.round(amount * (advanceRatePct / 100));
  const feeAmount = Math.round(amount * 0.02);
  const netPayout = advanceAmount - feeAmount;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocName(e.target.files[0].name);
      setDocUploaded(true);
      showToast(`Uploaded ${e.target.files[0].name}`, 'success');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      showToast('Please enter a valid invoice amount', 'warning');
      return;
    }

    submitInvoice({
      buyerName,
      buyerTaxId,
      buyerCountry,
      amount,
      dueDate,
      docName,
      advanceRatePct,
    });

    setSellerView('dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setSellerView('dashboard')}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container text-on-surface hover:bg-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <span className="font-label-sm text-xs font-bold text-primary uppercase tracking-wider">
          Submit Invoice for Advance
        </span>
        <div className="w-10"></div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-headline text-2xl font-bold text-primary-container">
          Turn Unpaid Invoice into Cash
        </h1>
        <p className="font-body-md text-sm text-secondary mt-1">
          Receive ~85% cash advance immediately upon verification.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Form Container */}
        <div className="bg-surface-card rounded-xl p-5 shadow-sm border border-border-subtle flex flex-col gap-4">
          
          {/* Buyer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-xs font-semibold text-on-surface-variant">
                Buyer / Customer Name
              </label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="e.g. Metro Supermarkets"
                className="w-full h-12 px-3 rounded-lg bg-surface-container-lowest font-body-md text-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-md text-xs font-semibold text-on-surface-variant">
                Buyer Tax PIN / Reg Number
              </label>
              <input
                type="text"
                required
                value={buyerTaxId}
                onChange={(e) => setBuyerTaxId(e.target.value)}
                placeholder="P051294819X"
                className="w-full h-12 px-3 rounded-lg bg-surface-container-lowest font-body-md text-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Amount & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-xs font-semibold text-on-surface-variant">
                Invoice Total Amount ($ USD)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-secondary font-bold text-sm">$</span>
                <input
                  type="number"
                  min="50"
                  max="50000"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-12 pl-8 pr-3 rounded-lg bg-surface-container-lowest font-headline font-bold text-base text-primary border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-label-md text-xs font-semibold text-on-surface-variant">
                Payment Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-12 px-3 rounded-lg bg-surface-container-lowest font-body-md text-sm text-on-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Invoice Document Dropzone */}
          <div className="flex flex-col gap-1 mt-2">
            <label className="font-label-md text-xs font-semibold text-on-surface-variant">
              Upload Official Commercial Invoice (PDF or Scan)
            </label>
            <div className="relative border-2 border-dashed border-border-strong rounded-xl p-5 text-center bg-surface-container-lowest hover:bg-surface-container-low transition-colors cursor-pointer flex flex-col items-center justify-center gap-2">
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <span className="material-symbols-outlined text-3xl text-primary">upload_file</span>
              <div className="flex flex-col">
                <span className="font-label-md text-xs font-bold text-primary">
                  {docUploaded ? docName : 'Click to Upload Invoice File'}
                </span>
                <span className="text-[11px] text-secondary">Accepted formats: PDF, PNG, JPG (Max 15MB)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Calculation Ribbon */}
        <div className="vesto-hero rounded-2xl p-5 text-white relative overflow-hidden shadow-hero">
          <div className="h-[3px] absolute top-0 left-0 right-0" style={{ background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
          <div className="relative">
            {/* Title row */}
            <div className="flex items-center justify-between text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <span className="uppercase tracking-wider font-semibold">Your Payout Breakdown</span>
              <span className="font-bold text-white">Tier {seller.verificationTier} · {advanceRatePct}% Advance</span>
            </div>

            {/* 3-row breakdown */}
            <div className="flex flex-col gap-2.5 mb-4">
              {/* Row 1 — Invoice Total */}
              <div className="flex items-center gap-3">
                <div className="w-28 shrink-0 text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>Invoice Total</div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <div className="h-full rounded-full w-full" style={{ background: 'rgba(255,255,255,0.3)' }} />
                </div>
                <div className="w-20 text-right font-tnum text-xs font-bold text-white">${amount.toLocaleString()}</div>
              </div>

              {/* Row 2 — Advance (advanceRatePct%) */}
              <div className="flex items-center gap-3">
                <div className="w-28 shrink-0 text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>Advance ({advanceRatePct}%)</div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${advanceRatePct}%`, background: 'linear-gradient(90deg,#C9922A,#E8B96A)' }} />
                </div>
                <div className="w-20 text-right font-tnum text-xs font-bold" style={{ color: 'var(--gold-light)' }}>${advanceAmount.toLocaleString()}</div>
              </div>

              {/* Row 3 — Fee deducted */}
              <div className="flex items-center gap-3">
                <div className="w-28 shrink-0 text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>Platform Fee (2%)</div>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                  <div className="h-full rounded-full" style={{ width: '2%', background: '#EF4444' }} />
                </div>
                <div className="w-20 text-right font-tnum text-xs font-semibold" style={{ color: 'rgba(255,100,100,0.9)' }}>−${feeAmount.toLocaleString()}</div>
              </div>
            </div>

            {/* Net payout big number */}
            <div className="flex items-baseline justify-between border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Net Immediate Payout</span>
                <div className="font-headline text-3xl font-extrabold text-white font-tnum" style={{ letterSpacing: '-0.02em' }}>${netPayout.toLocaleString()}</div>
              </div>
              <span className="text-[11px] font-bold" style={{ color: 'var(--gold-light)' }}>100% Guaranteed Settlement</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full h-13 font-bold rounded-xl shadow-gold transition-all active:scale-[0.98] flex items-center justify-center gap-2 py-3 text-white"
          style={{ background: 'linear-gradient(135deg, #C9922A 0%, #E8B96A 100%)' }}
        >
          <span className="material-symbols-outlined text-lg">payments</span>
          <span>Submit Invoice to Vesto Marketplace</span>
        </button>
      </form>
    </div>
  );
};
