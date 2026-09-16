import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  SellerProfile,
  LenderProfile,
  Invoice,
  VerificationRequest,
  PlatformAnalytics,
} from '../types';
import { supabaseService } from '../services/supabaseService';
import { agoraService } from '../services/agoraService';
import { AgoraDepositSetup, AgoraPayoutResult, AgoraRoute } from '../types/agora';

interface AppContextType {
  // Role & Auth State
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  sellerView: string;
  setSellerView: (view: string) => void;
  lenderView: string;
  setLenderView: (view: string) => void;
  adminView: string;
  setAdminView: (view: string) => void;

  // Profiles
  seller: SellerProfile;
  lender: LenderProfile;

  // Invoices & Marketplace
  invoices: Invoice[];
  submitInvoice: (invoiceData: Partial<Invoice>) => void;
  approveInvoiceAdmin: (invoiceId: string) => void;
  flagInvoiceAdmin: (invoiceId: string, reason?: string) => void;
  fundInvoiceLender: (invoiceId: string) => void;
  fundBatchLender: (invoiceIds: string[]) => void;
  repayInvoiceSeller: (invoiceId: string) => void;
  resolveDisputeAdmin: (invoiceId: string) => void;

  // Verification Queue
  verifications: VerificationRequest[];
  submitVerification: (tier: 1 | 2, docType: string, docUrl: string) => void;
  approveVerificationAdmin: (reqId: string) => void;
  rejectVerificationAdmin: (reqId: string) => void;

  // Seller Limit Withdrawal (Agora cross-border payout)
  withdrawSellerFunds: (
    amount: number,
    destination?: 'bank' | 'mobile_money' | 'wallet'
  ) => Promise<void>;
  agoraLenderDeposit: AgoraDepositSetup | null;
  agoraSellerPayoutRoute: AgoraRoute | null;
  setupLenderAgoraDeposit: () => Promise<void>;
  isAgoraLoading: boolean;

  // Web3 / Monad Wallet & Embedded Auth
  walletConnected: boolean;
  walletAddress: string;
  monadBalance: string;
  walletType: 'embedded' | 'external';
  userHandle: string;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  loginWithEmailOrPhone: (handle: string) => void;
  connectExternalWallet: (walletName?: string) => void;
  connectWallet: () => void;
  disconnectWallet: () => void;

  // System Notifications
  notification: { message: string; type: 'success' | 'info' | 'warning' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;

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
  const [sellerView, setSellerView] = useState<string>('dashboard');
  const [lenderView, setLenderView] = useState<string>('browse');
  const [adminView, setAdminView] = useState<string>('oversight');

  const [seller, setSeller] = useState<SellerProfile>(initialSeller);
  const [lender, setLender] = useState<LenderProfile>(initialLender);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [verifications, setVerifications] = useState<VerificationRequest[]>(initialVerifications);

  // Web3 & Privy/Para Embedded MPC Wallet State
  const [walletConnected, setWalletConnected] = useState<boolean>(true);
  const [walletAddress, setWalletAddress] = useState<string>('0x71C...89Fa');
  const [monadBalance, setMonadBalance] = useState<string>('42.50 MON');
  const [walletType, setWalletType] = useState<'embedded' | 'external'>('embedded');
  const [userHandle, setUserHandle] = useState<string>('amina@nairobfresh.co');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Notifications
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const [agoraLenderDeposit, setAgoraLenderDeposit] = useState<AgoraDepositSetup | null>(null);
  const [agoraSellerPayoutRoute, setAgoraSellerPayoutRoute] = useState<AgoraRoute | null>(null);
  const [isAgoraLoading, setIsAgoraLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const loginWithEmailOrPhone = (handle: string) => {
    setUserHandle(handle);
    setWalletType('embedded');
    setWalletConnected(true);
    const hash = Array.from(handle).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockAddr = `0x${hash.toString(16).padStart(4, '0')}...${(hash * 3).toString(16).slice(0, 4)}`;
    setWalletAddress(mockAddr);
    setMonadBalance('50.00 MON');
    showToast(`Embedded MPC Wallet created & authenticated for ${handle}! Zero seed phrases required.`, 'success');
  };

  const connectExternalWallet = (walletName = 'MetaMask') => {
    setWalletType('external');
    setWalletConnected(true);
    setWalletAddress('0x38B...99C1');
    setMonadBalance('128.40 MON');
    showToast(`Connected External ${walletName} Wallet on Monad Testnet!`, 'success');
  };

  const connectWallet = () => {
    setShowAuthModal(true);
  };

  const disconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress('');
    setUserHandle('');
    showToast('Wallet disconnected', 'info');
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
      docName: invoiceData.docName || 'commercial_invoice_document.pdf',
    };

    setInvoices((prev) => [newInv, ...prev]);
    supabaseService.saveInvoiceOffchain(newInv);
    showToast(`Invoice ${newInv.id} submitted! Saved off-chain to Supabase.`, 'info');
  };

  const approveInvoiceAdmin = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'published_marketplace' } : inv))
    );
    showToast(`Invoice ${invoiceId} approved by Admin and published to Marketplace!`, 'success');
  };

  const flagInvoiceAdmin = (invoiceId: string, _reason?: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'flagged' } : inv))
    );
    showToast(`Invoice ${invoiceId} flagged for audit review`, 'warning');
  };

  const fundInvoiceLender = (invoiceId: string) => {
    const target = invoices.find((i) => i.id === invoiceId);
    if (!target) return;

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: 'funded',
              fundedByLenderId: lender.id,
              fundedAt: new Date().toISOString().split('T')[0],
            }
          : inv
      )
    );

    // Update Lender capital
    setLender((prev) => ({
      ...prev,
      totalInvested: prev.totalInvested + target.advanceAmount,
      availableBalance: Math.max(0, prev.availableBalance - target.advanceAmount),
    }));

    // Update Seller available payout balance
    if (target.sellerId === seller.id) {
      setSeller((prev) => ({
        ...prev,
        availablePayout: prev.availablePayout + target.advanceAmount,
        totalFinanced: prev.totalFinanced + target.amount,
      }));
    }

    showToast(`Successfully funded ${invoiceId} for $${target.advanceAmount.toLocaleString()} on Monad!`, 'success');
  };

  const fundBatchLender = (invoiceIds: string[]) => {
    const targets = invoices.filter((i) => invoiceIds.includes(i.id));
    const totalAdvance = targets.reduce((sum, i) => sum + i.advanceAmount, 0);

    setInvoices((prev) =>
      prev.map((inv) =>
        invoiceIds.includes(inv.id)
          ? {
              ...inv,
              status: 'funded',
              fundedByLenderId: lender.id,
              fundedAt: new Date().toISOString().split('T')[0],
            }
          : inv
      )
    );

    setLender((prev) => ({
      ...prev,
      totalInvested: prev.totalInvested + totalAdvance,
      availableBalance: Math.max(0, prev.availableBalance - totalAdvance),
    }));

    showToast(`Batch Funding Executed! ${invoiceIds.length} Invoices funded for $${totalAdvance.toLocaleString()}!`, 'success');
  };

  const repayInvoiceSeller = (invoiceId: string) => {
    const target = invoices.find((i) => i.id === invoiceId);
    if (!target) return;

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: 'repaid',
              repaidAt: new Date().toISOString().split('T')[0],
            }
          : inv
      )
    );

    // Reward lender yield
    const yieldAmount = (target.advanceAmount * (target.expectedYieldPct / 100) * (target.termDays / 365));
    setLender((prev) => ({
      ...prev,
      totalYieldEarned: prev.totalYieldEarned + yieldAmount,
      availableBalance: prev.availableBalance + target.advanceAmount + yieldAmount,
      totalInvested: Math.max(0, prev.totalInvested - target.advanceAmount),
    }));

    showToast(`Invoice ${invoiceId} repaid! Lender received principal + yield.`, 'success');
  };

  const resolveDisputeAdmin = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: 'repaid' } : inv))
    );
    showToast(`Dispute resolved for ${invoiceId} via Liquidity Protection Reserve!`, 'success');
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
    showToast(`Tier ${tier} Verification Submitted! Persisted off-chain to Supabase.`, 'info');
  };

  const approveVerificationAdmin = (reqId: string) => {
    const req = verifications.find((v) => v.id === reqId);
    if (!req) return;

    setVerifications((prev) =>
      prev.map((v) => (v.id === reqId ? { ...v, status: 'approved' } : v))
    );

    const newLimit = req.tier === 2 ? 5000 : 500;
    if (req.sellerId === seller.id) {
      setSeller((prev) => ({
        ...prev,
        verificationTier: (req.tier === 2 ? 2 : Math.max(prev.verificationTier, 1)) as 0 | 1 | 2,
        creditLimit: newLimit,
        kycStatusTier1: req.tier === 1 ? 'verified' : prev.kycStatusTier1,
        kycStatusTier2: req.tier === 2 ? 'verified' : prev.kycStatusTier2,
      }));
    }

    supabaseService.updateSellerTierOffchain(req.sellerId, req.tier as 1 | 2, newLimit);
    showToast(`Approved Tier ${req.tier} Verification for ${req.businessName}! Limit increased.`, 'success');
  };

  const rejectVerificationAdmin = (reqId: string) => {
    const req = verifications.find((v) => v.id === reqId);
    if (!req) return;

    setVerifications((prev) =>
      prev.map((v) => (v.id === reqId ? { ...v, status: 'rejected' } : v))
    );

    showToast(`Rejected Tier ${req.tier} Verification for ${req.businessName}`, 'warning');
  };

  const setupLenderAgoraDeposit = async () => {
    setIsAgoraLoading(true);
    try {
      const depositAddress = walletAddress || '0x0000000000000000000000000000000000000001';
      const setup = await agoraService.setupLenderDepositRoute(depositAddress, lender.fullName);
      setAgoraLenderDeposit(setup);
      showToast(
        setup.status === 'simulated'
          ? 'Agora deposit route ready (simulation mode — configure Agora proxy or API key).'
          : 'Agora deposit route created. Use the wire and Monad instructions in the deposit modal.',
        'success'
      );
    } catch (err) {
      showToast(`Agora deposit setup failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'warning');
    } finally {
      setIsAgoraLoading(false);
    }
  };

  const withdrawSellerFunds = async (
    amount: number,
    destination: 'bank' | 'mobile_money' | 'wallet' = 'bank'
  ) => {
    if (amount > seller.availablePayout) {
      showToast('Requested amount exceeds available payout balance', 'warning');
      return;
    }

    setIsAgoraLoading(true);
    try {
      let payoutResult: AgoraPayoutResult;

      if (destination === 'wallet') {
        showToast('USDC sent directly to your connected Monad wallet.', 'success');
        setSeller((prev) => ({
          ...prev,
          availablePayout: prev.availablePayout - amount,
        }));
        return;
      }

      const bankDetails =
        destination === 'mobile_money'
          ? {
              bankName: 'Safaricom M-Pesa (via Equity Bank Kenya)',
              accountNumber: seller.phoneNumber.replace(/\s/g, ''),
              routingNumber: 'EQBLKENA',
              beneficiary: seller.fullName,
            }
          : {
              bankName: 'Equity Bank Kenya',
              accountNumber: '01928491823',
              routingNumber: 'EQBLKENA',
              beneficiary: seller.businessName,
            };

      payoutResult = await agoraService.initiateSellerPayout({
        walletAddress: walletAddress || '0x0000000000000000000000000000000000000002',
        sellerName: seller.fullName,
        amountUsd: amount,
        ...bankDetails,
      });

      setAgoraSellerPayoutRoute(payoutResult.route);
      setSeller((prev) => ({
        ...prev,
        availablePayout: prev.availablePayout - amount,
      }));

      const onChain = agoraService.getMonadRedeemInstruction(payoutResult.route);
      showToast(
        onChain
          ? `${payoutResult.message} Redeem: ${onChain.depositAddress.slice(0, 10)}…`
          : payoutResult.message,
        'success'
      );
    } catch (err) {
      showToast(`Agora payout failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'warning');
    } finally {
      setIsAgoraLoading(false);
    }
  };

  // Dynamic Analytics Calculation
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
        currentRole,
        setCurrentRole,
        sellerView,
        setSellerView,
        lenderView,
        setLenderView,
        adminView,
        setAdminView,
        seller,
        lender,
        invoices,
        submitInvoice,
        approveInvoiceAdmin,
        flagInvoiceAdmin,
        fundInvoiceLender,
        fundBatchLender,
        repayInvoiceSeller,
        resolveDisputeAdmin,
        verifications,
        submitVerification,
        approveVerificationAdmin,
        rejectVerificationAdmin,
        withdrawSellerFunds,
        agoraLenderDeposit,
        agoraSellerPayoutRoute,
        setupLenderAgoraDeposit,
        isAgoraLoading,
        walletConnected,
        walletAddress,
        monadBalance,
        walletType,
        userHandle,
        showAuthModal,
        setShowAuthModal,
        loginWithEmailOrPhone,
        connectExternalWallet,
        connectWallet,
        disconnectWallet,
        notification,
        showToast,
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
