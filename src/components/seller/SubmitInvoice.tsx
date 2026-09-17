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
        <div className="bg-primary text-white rounded-xl p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-primary-fixed-dim">
            <span>Advance Rate Tier</span>
            <span className="font-bold text-white">{advanceRatePct}% Advance</span>
          </div>

          <div className="flex items-baseline justify-between border-t border-primary-container pt-3">
            <div>
              <span className="text-xs text-primary-fixed-dim uppercase tracking-wider">Immediate Payout Cash</span>
              <div className="font-headline text-3xl font-extrabold text-white">${netPayout.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-primary-fixed-dim block">Platform Fee (2%): ${feeAmount}</span>
              <span className="text-[11px] text-success-shamrock font-bold">100% Guaranteed Settlement</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full h-13 bg-success-shamrock text-white font-label-lg font-bold rounded-xl hover:bg-success-shamrock/90 shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 py-3"
        >
          <span className="material-symbols-outlined text-lg">payments</span>
          <span>Submit Invoice to Vesto Marketplace</span>
        </button>
      </form>
    </div>
  );
};
