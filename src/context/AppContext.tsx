import React, { createContext, useContext, useState } from 'react';
import {
  UserRole,
  SellerProfile,
  LenderProfile,
  Invoice,
  VerificationRequest,
  PlatformAnalytics,
} from '../types';
import { supabaseService } from '../services/supabaseService';

interface AppContextType {
  // Role & View State
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  sellerView: string;
  setSellerView: (view: string) => void;
  lenderView: string;
  setLenderView: (view: string) => void;
  adminView: string;
  setAdminView: (view: string) => void;

  // Onboarding gates
  sellerOnboarded: boolean;
  lenderOnboarded: boolean;
  adminOnboarded: boolean;
  completeSellerOnboarding: (data: Partial<SellerProfile>) => void;
  completeLenderOnboarding: (data: Partial<LenderProfile>) => void;
  completeAdminOnboarding: () => void;
  signOut: () => void;

  // Profiles
  seller: SellerProfile;
  lender: LenderProfile;

  // Invoices & Marketplace
  invoices: Invoice[];
  selectedBatchIds: string[];
  setSelectedBatchIds: (ids: string[]) => void;
  submitInvoice: (invoiceData: Partial<Invoice>) => void;
  approveInvoiceAdmin: (invoiceId: string) => void;
  flagInvoiceAdmin: (invoiceId: string, reason?: string) => void;
  fundInvoiceLender: (invoiceId: string) => void;
  fundBatchLender: (invoiceIds: string[]) => void;
  repayInvoiceSeller: (invoiceId: string) => void;
  resolveDisputeAdmin: (invoiceId: string, resolution?: 'refund_lender' | 'pay_seller') => void;

  // Verification
  verifications: VerificationRequest[];
  submitVerification: (tier: 1 | 2, docType: string, docUrl: string) => void;
  approveVerificationAdmin: (reqId: string) => void;
  rejectVerificationAdmin: (reqId: string) => void;

  // Notifications
  notification: { message: string; type: 'success' | 'info' | 'warning' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;

  // Lender funds
  withdrawFunds: (amount: number) => void;
  setLenderProfile: (data: Partial<LenderProfile>) => void;

  // Seller tour
  sellerTourCompleted: boolean;
  completeSellerTour: () => void;

  // Analytics
  analytics: PlatformAnalytics;
}

const initialSeller: SellerProfile = {
  id: 'sel_101',
  fullName: 'Amina Diallo',
  phonePrefix: '+254',
  phoneNumber: '712 345 678',
  businessName: 'Nairobi Fresh Produce Co.',
  operatingCountry: 'Kenya',
  category: 'Agricultural Produce Exporter',
  verificationTier: 1,
  creditLimit: 500,
  usedLimit: 0,
  availablePayout: 1020,
  totalFinanced: 4500,
  kycStatusTier1: 'verified',
  kycStatusTier2: 'none',
  createdAt: '2026-08-10',
};

const initialLender: LenderProfile = {
  id: 'len_505',
  fullName: 'Standard Agrarian Yield Fund',
  accountType: 'institutional',
  email: 'invest@agrarian-capital.io',
  investorTier: 'Institutional Liquidity Provider',
  targetAllocation: 50000,
  totalInvested: 28400,
  totalYieldEarned: 3120,
  availableBalance: 21600,
  riskAccepted: true,
  autoInvestEnabled: true,
  createdAt: '2026-07-01',
};

const initialInvoices: Invoice[] = [
  {
    id: 'INV-2026-8901',
    sellerId: 'sel_101',
    sellerBusinessName: 'Nairobi Fresh Produce Co.',
    sellerCategory: 'Agri Exporter',
    buyerName: 'Metro Supermarkets East Africa',
    buyerTaxId: 'P051294819X',
    buyerCountry: 'Kenya',
    amount: 1200,
    advanceRatePct: 85,
    advanceAmount: 1020,
    feePct: 2.0,
    feeAmount: 24,
    expectedYieldPct: 14.5,
    dueDate: '2026-10-15',
    termDays: 40,
    riskTier: 'A+',
    riskScore: 94,
    status: 'published_marketplace',
    createdAt: '2026-09-01',
    docName: 'bill_of_lading_metro_produce.pdf',
  },
  {
    id: 'INV-2026-7734',
    sellerId: 'sel_102',
    sellerBusinessName: 'Kilifi Cashew Processors',
    sellerCategory: 'Agri Processing',
    buyerName: 'Global Commodities Direct',
    buyerTaxId: 'GB948102931',
    buyerCountry: 'United Kingdom',
    amount: 3500,
    advanceRatePct: 80,
    advanceAmount: 2800,
    feePct: 2.5,
    feeAmount: 87.5,
    expectedYieldPct: 16.2,
    dueDate: '2026-10-30',
    termDays: 55,
    riskTier: 'A',
    riskScore: 88,
    status: 'published_marketplace',
    createdAt: '2026-09-03',
    docName: 'export_manifest_cashew_shipment.pdf',
  },
  {
    id: 'INV-2026-6102',
    sellerId: 'sel_103',
    sellerBusinessName: 'Rift Valley Logistics',
    sellerCategory: 'Cold Chain Transport',
    buyerName: 'Kabras Sugar Refineries',
    buyerTaxId: 'P091240182Z',
    buyerCountry: 'Kenya',
    amount: 4800,
    advanceRatePct: 85,
    advanceAmount: 4080,
    feePct: 2.0,
    feeAmount: 96,
    expectedYieldPct: 13.8,
    dueDate: '2026-11-10',
    termDays: 66,
    riskTier: 'A+',
    riskScore: 96,
    status: 'funded',
    fundedByLenderId: 'len_505',
    fundedAt: '2026-09-04',
    createdAt: '2026-08-28',
    docName: 'freight_waybill_sugar_route.pdf',
  },
  {
    id: 'INV-2026-5011',
    sellerId: 'sel_104',
    sellerBusinessName: 'Mombasa Spice Traders',
    sellerCategory: 'Spices & Culinary',
    buyerName: 'Zanzibar Spice Imports',
    buyerTaxId: 'TZ88194012',
    buyerCountry: 'Tanzania',
    amount: 850,
    advanceRatePct: 80,
    advanceAmount: 680,
    feePct: 3.0,
    feeAmount: 25.5,
    expectedYieldPct: 18.0,
    dueDate: '2026-09-25',
    termDays: 20,
    riskTier: 'B+',
    riskScore: 81,
    status: 'pending_admin_approval',
    createdAt: '2026-09-04',
    docName: 'spice_invoice_001.pdf',
  },
];

const initialVerifications: VerificationRequest[] = [
  {
    id: 'VR-901',
    sellerId: 'sel_101',
    sellerName: 'Amina Diallo',
    businessName: 'Nairobi Fresh Produce Co.',
    tier: 2,
    documentType: 'Tax Register & Bank Ledger (Tier 2)',
    documentUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChP_Oslw2qMuh5bd2tcx9zj5kjSF7v_-iaDTnr91VIWCYs4uByYBKSpApEGff-h3SWoL4rhAhGE-ZhMuCvQw3n4IzHgI8IUHaRpgFHbRay1FIhFRhK-QCoVrGUJASOziVbldbFi6hojbMatzzuqaUKp-_TphUKJKJUaYfOzRWpTSK4cQIKL4RPNSAboBg4aCeMll5BCPi_v0cQt-GhG5Rcb3lBeBuaJX_iAAuika0sYNZzZyXAW8hS1g',
    submittedAt: '2026-09-04 14:20',
    status: 'pending',
    riskScoreSuggested: 92,
  },
  {
    id: 'VR-899',
    sellerId: 'sel_104',
    sellerName: 'Hassan Omar',
    businessName: 'Mombasa Spice Traders',
    tier: 1,
    documentType: 'National ID Photo (Tier 1)',
    documentUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    submittedAt: '2026-09-04 09:15',
    status: 'pending',
    riskScoreSuggested: 85,
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('seller');
  const [sellerView, setSellerView] = useState<string>('signup');
  const [lenderView, setLenderView] = useState<string>('signup');
  const [adminView, setAdminView] = useState<string>('2fa'); // default: 2fa sign-in gate

  const [sellerOnboarded, setSellerOnboarded] = useState(false);
  const [lenderOnboarded, setLenderOnboarded] = useState(false);
  const [adminOnboarded, setAdminOnboarded] = useState(false);
  const [lenderHasSeenWelcome, setLenderHasSeenWelcome] = useState(false);
  const [sellerTourCompleted, setSellerTourCompleted] = useState(false);

  const [seller, setSeller] = useState<SellerProfile>({ ...initialSeller, fullName: '', businessName: '', creditLimit: 0, verificationTier: 0 });
  const [lender, setLender] = useState<LenderProfile>({ ...initialLender, fullName: '', targetAllocation: 0, totalInvested: 0, totalYieldEarned: 0, availableBalance: 0 });
  // C3: seller registry so admin can approve any seller, not just the signed-in one
  const [sellerRegistry, setSellerRegistry] = useState<Record<string, SellerProfile>>({});
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>(initialVerifications);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const completeSellerOnboarding = (data: Partial<SellerProfile>) => {
    const newSeller: SellerProfile = {
      ...initialSeller,
      ...data,
      id: 'sel_101',
      creditLimit: 0,
      verificationTier: 0,
      kycStatusTier1: 'none',
      kycStatusTier2: 'none',
      usedLimit: 0,
      availablePayout: 0,
      totalFinanced: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSeller(newSeller);
    setSellerRegistry(prev => ({ ...prev, [newSeller.id]: newSeller }));
    setSellerOnboarded(true);
    setSellerView('dashboard');
  };

  const completeAdminOnboarding = () => {
    setAdminOnboarded(true);
    setAdminView('oversight');
  };

  const completeLenderOnboarding = (data: Partial<LenderProfile>) => {
    setLender(prev => ({
      ...initialLender,
      ...prev,
      ...data,
      id: 'len_505',
      totalInvested: 0,
      totalYieldEarned: 0,
      availableBalance: data.targetAllocation ?? 0,
      riskAccepted: false,
      autoInvestEnabled: false,
      createdAt: new Date().toISOString().split('T')[0],
    }));
    setLenderOnboarded(true);
    // H2: skip welcome screen on return login
    setLenderView(lenderHasSeenWelcome ? 'browse' : 'welcome');
    setLenderHasSeenWelcome(true);
  };

  const signOut = () => {
    if (currentRole === 'seller') {
      setSellerOnboarded(false);
      setSellerView('signup');
      setSeller({ ...initialSeller, fullName: '', businessName: '', creditLimit: 0, verificationTier: 0 });
    } else if (currentRole === 'lender') {
      setLenderOnboarded(false);
      setLenderView('signup');
      setLender({ ...initialLender, fullName: '', targetAllocation: 0, totalInvested: 0, totalYieldEarned: 0, availableBalance: 0 });
    } else if (currentRole === 'admin') {
      setAdminOnboarded(false);
      setAdminView('2fa');
    }
    showToastInternal('Signed out successfully.', 'info');
  };

  const showToastInternal = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const submitInvoice = (invoiceData: Partial<Invoice>) => {
    const newInv: Invoice = {
      id: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      sellerId: seller.id,
      sellerBusinessName: seller.businessName,
      sellerCategory: seller.category,
      buyerName: invoiceData.buyerName || 'Metro Supermarkets',
      buyerTaxId: invoiceData.buyerTaxId || 'P051294819X',
      buyerCountry: invoiceData.buyerCountry || seller.operatingCountry,
      amount: invoiceData.amount || 1000,
      advanceRatePct: invoiceData.advanceRatePct || 85,
      advanceAmount: (invoiceData.amount || 1000) * 0.85,
      feePct: 2.0,
      feeAmount: (invoiceData.amount || 1000) * 0.02,
      expectedYieldPct: 14.5,
      dueDate: invoiceData.dueDate || '2026-10-30',
      termDays: 45,
      riskTier: 'A+',
      riskScore: 92,
      status: 'pending_admin_approval',
      createdAt: new Date().toISOString().split('T')[0],
      docName: invoiceData.docName || 'commercial_invoice.pdf',
    };
    setInvoices((prev) => [newInv, ...prev]);
    supabaseService.saveInvoiceOffchain(newInv);
    showToast(`Invoice ${newInv.id} submitted and saved.`, 'info');
  };

  const approveInvoiceAdmin = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => inv.id === invoiceId ? { ...inv, status: 'published_marketplace' } : inv)
    );
    showToast(`Invoice ${invoiceId} approved and published to marketplace.`, 'success');
  };

  const flagInvoiceAdmin = (invoiceId: string, reason?: string) => {
    setInvoices((prev) =>
      prev.map((inv) => inv.id === invoiceId ? { ...inv, status: 'flagged', flagReason: reason ?? '' } : inv)
    );
    showToast(`Invoice ${invoiceId} flagged${reason ? `: ${reason.slice(0, 60)}` : ''}.`, 'warning');
  };

  const fundInvoiceLender = (invoiceId: string) => {
    const target = invoices.find((i) => i.id === invoiceId);
    if (!target) return;

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? { ...inv, status: 'funded', fundedByLenderId: lender.id, fundedAt: new Date().toISOString().split('T')[0] }
          : inv
      )
    );
    setLender((prev) => ({
      ...prev,
      totalInvested: prev.totalInvested + target.advanceAmount,
      availableBalance: Math.max(0, prev.availableBalance - target.advanceAmount),
    }));
    if (target.sellerId === seller.id) {
      setSeller((prev) => ({
        ...prev,
        availablePayout: prev.availablePayout + target.advanceAmount,
        totalFinanced: prev.totalFinanced + target.amount,
      }));
    }
    showToast(`Funded ${invoiceId} - ${target.advanceAmount.toLocaleString()} USDC deployed. → Check Portfolio for yield tracking.`, 'success');
  };

  const fundBatchLender = (invoiceIds: string[]) => {
    const targets = invoices.filter((i) => invoiceIds.includes(i.id));
    const totalAdvance = targets.reduce((sum, i) => sum + i.advanceAmount, 0);

    setInvoices((prev) =>
      prev.map((inv) =>
        invoiceIds.includes(inv.id)
          ? { ...inv, status: 'funded', fundedByLenderId: lender.id, fundedAt: new Date().toISOString().split('T')[0] }
          : inv
      )
    );
    setLender((prev) => ({
      ...prev,
      totalInvested: prev.totalInvested + totalAdvance,
      availableBalance: Math.max(0, prev.availableBalance - totalAdvance),
    }));
    showToast(`Batch funded: ${invoiceIds.length} invoices - $${totalAdvance.toLocaleString()} USDC on Arc. → View Portfolio for returns.`, 'success');
  };

  const repayInvoiceSeller = (invoiceId: string) => {
    const target = invoices.find((i) => i.id === invoiceId);
    if (!target) return;

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: 'repaid', repaidAt: new Date().toISOString().split('T')[0] } : inv
      )
    );
    const yieldAmount = target.advanceAmount * (target.expectedYieldPct / 100) * (target.termDays / 365);
    setLender((prev) => ({
      ...prev,
      totalYieldEarned: prev.totalYieldEarned + yieldAmount,
      availableBalance: prev.availableBalance + target.advanceAmount + yieldAmount,
      totalInvested: Math.max(0, prev.totalInvested - target.advanceAmount),
    }));
    showToast(`Invoice ${invoiceId} repaid. Yield settled. → Claim your USDC from the Dashboard.`, 'success');
  };

  const completeSellerTour = () => {
    setSellerTourCompleted(true);
    setSellerView('dashboard');
    showToast('Tour complete! Your dashboard is ready.', 'success');
  };

  const setLenderProfile = (data: Partial<LenderProfile>) => {
    setLender(prev => ({ ...prev, ...data }));
  };

  const withdrawFunds = (amount: number) => {
    if (amount <= 0 || amount > lender.availableBalance) {
      showToast('Invalid withdrawal amount.', 'warning');
      return;
    }
    setLender(prev => ({ ...prev, availableBalance: Math.max(0, prev.availableBalance - amount) }));
    showToast(`Withdrawal of $${amount.toLocaleString()} USDC submitted to your connected wallet.`, 'success');
  };

  const resolveDisputeAdmin = (invoiceId: string, resolution: 'refund_lender' | 'pay_seller' = 'pay_seller') => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;
    setInvoices((prev) => prev.map((i) => i.id === invoiceId ? { ...i, status: 'repaid' } : i));
    if (resolution === 'refund_lender') {
      setLender(prev => ({ ...prev, availableBalance: prev.availableBalance + inv.advanceAmount }));
      showToast(`Dispute resolved: $${inv.advanceAmount.toLocaleString()} refunded to lender.`, 'success');
    } else {
      setSeller(prev => ({ ...prev, availablePayout: prev.availablePayout + inv.advanceAmount }));
      showToast(`Dispute resolved: $${inv.advanceAmount.toLocaleString()} released to seller.`, 'success');
    }
  };

  const submitVerification = (tier: 1 | 2, docType: string, docUrl: string) => {
    const newReq: VerificationRequest = {
      id: `VR-${Math.floor(900 + Math.random() * 100)}`,
      sellerId: seller.id,
      sellerName: seller.fullName,
      businessName: seller.businessName,
      tier,
      documentType: docType,
      documentUrl: docUrl,
      submittedAt: new Date().toLocaleString(),
      status: 'pending',
      riskScoreSuggested: tier === 1 ? 88 : 95,
    };
    setVerifications((prev) => [newReq, ...prev]);
    setSeller((prev) => ({
      ...prev,
      kycStatusTier1: tier === 1 ? 'pending' : prev.kycStatusTier1,
      kycStatusTier2: tier === 2 ? 'pending' : prev.kycStatusTier2,
    }));
    supabaseService.saveVerificationOffchain(newReq);
    showToast(`Tier ${tier} verification submitted.`, 'info');
  };

  const approveVerificationAdmin = (reqId: string) => {
    const req = verifications.find((v) => v.id === reqId);
    if (!req) return;

    setVerifications((prev) =>
      prev.map((v) => v.id === reqId ? { ...v, status: 'approved' } : v)
    );
    const newLimit = req.tier === 2 ? 5000 : 500;
    const applyApproval = (prev: SellerProfile): SellerProfile => ({
      ...prev,
      verificationTier: (req.tier === 2 ? 2 : Math.max(prev.verificationTier, 1)) as 0 | 1 | 2,
      creditLimit: newLimit,
      kycStatusTier1: req.tier === 1 ? 'verified' : prev.kycStatusTier1,
      kycStatusTier2: req.tier === 2 ? 'verified' : prev.kycStatusTier2,
    });
    // C3: update signed-in seller if it matches, AND update registry for any seller
    if (req.sellerId === seller.id) {
      setSeller(applyApproval);
    }
    setSellerRegistry(prev => {
      if (!prev[req.sellerId]) return prev;
      return { ...prev, [req.sellerId]: applyApproval(prev[req.sellerId]) };
    });
    supabaseService.updateSellerTierOffchain(req.sellerId, req.tier as 1 | 2, newLimit);
    showToast(`Tier ${req.tier} approved for ${req.businessName}. Credit limit updated. → Next: Submit an invoice.`, 'success');
  };

  const rejectVerificationAdmin = (reqId: string) => {
    const req = verifications.find((v) => v.id === reqId);
    if (!req) return;
    setVerifications((prev) =>
      prev.map((v) => v.id === reqId ? { ...v, status: 'rejected' } : v)
    );
    showToast(`Verification rejected for ${req?.businessName}.`, 'warning');
  };

  const totalVol = invoices.reduce((sum, i) => sum + i.amount, 0);
  const activeLiq = invoices.filter((i) => i.status === 'funded').reduce((sum, i) => sum + i.advanceAmount, 0);
  const analytics: PlatformAnalytics = {
    totalVolumeUSD: totalVol + 128500,
    activeLiquidityUSD: activeLiq + 84200,
    averageYieldAPY: 15.2,
    defaultRatePct: 0.12,
    totalSellersCount: 142,
    totalLendersCount: 38,
    fundedInvoicesCount: invoices.filter((i) => i.status === 'funded' || i.status === 'repaid').length + 84,
    systemHealthPct: 99.8,
  };

  return (
    <AppContext.Provider
      value={{
        currentRole, setCurrentRole,
        sellerView, setSellerView,
        lenderView, setLenderView,
        adminView, setAdminView,
        sellerOnboarded, lenderOnboarded, adminOnboarded,
        completeSellerOnboarding, completeLenderOnboarding, completeAdminOnboarding, signOut,
        seller, lender,
        invoices, selectedBatchIds, setSelectedBatchIds,
        submitInvoice, approveInvoiceAdmin, flagInvoiceAdmin,
        fundInvoiceLender, fundBatchLender, repayInvoiceSeller, resolveDisputeAdmin, withdrawFunds,
        setLenderProfile,
        sellerTourCompleted, completeSellerTour,
        verifications,
        submitVerification, approveVerificationAdmin, rejectVerificationAdmin,
        notification, showToast,
        analytics,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
