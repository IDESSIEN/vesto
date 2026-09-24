export type UserRole = 'seller' | 'lender' | 'admin';

export type KYCTier = 0 | 1 | 2;

export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

export interface SellerProfile {
  id: string;
  fullName: string;
  phonePrefix: string;
  phoneNumber: string;
  businessName: string;
  operatingCountry: string;
  category: string;
  verificationTier: KYCTier;
  creditLimit: number; // e.g. $0, $500, $5,000
  usedLimit: number;
  availablePayout: number;
  totalFinanced: number;
  kycStatusTier1: VerificationStatus;
  kycStatusTier2: VerificationStatus;
  tier1DocUrl?: string;
  tier2DocUrl?: string;
  taxId?: string;
  createdAt: string;
}

export interface LenderProfile {
  id: string;
  fullName: string;
  accountType: 'individual' | 'institutional';
  email: string;
  investorTier: string;
  targetAllocation: number;
  totalInvested: number;
  totalYieldEarned: number;
  availableBalance: number;
  riskAccepted: boolean;
  autoInvestEnabled: boolean;
  createdAt: string;
}

export type InvoiceStatus =
  | 'pending_admin_approval'
  | 'published_marketplace'
  | 'funded'
  | 'payment_detected'
  | 'partial_shortfall'
  | 'repaid'
  | 'disputed'
  | 'defaulted'
  | 'flagged';

export interface Invoice {
  id: string;
  sellerId: string;
  sellerBusinessName: string;
  sellerCategory: string;
  buyerName: string;
  buyerTaxId: string;
  buyerCountry: string;
  amount: number;
  advanceRatePct: number; // e.g. 85
  advanceAmount: number;
  feePct: number; // e.g. 2
  feeAmount: number;
  expectedYieldPct: number; // e.g. 14.5
  dueDate: string;
  termDays: number;
  riskTier: 'A+' | 'A' | 'B+' | 'B';
  riskScore: number;
  status: InvoiceStatus;
  docName?: string;
  docUrl?: string;
  fundedByLenderId?: string;
  fundedAt?: string;
  repaidAt?: string;
  flagReason?: string;
  sellerVerificationTier?: 1 | 2;
  buyerId?: string;
  repaymentDeadline?: string;
  gracePeriodDays?: number;           // admin-set, default 14
  finalRepaymentDeadline?: string;    // ISO date locked at approval time
  overrideReasonCode?: string;        // R-01 … R-11 if non-default
  overrideReasonText?: string;        // free text for R-11
  deadlineLocked?: boolean;           // true once a lender has funded
  lenderLockupDays?: number;          // finalRepaymentDeadline - approvedAt
  buyerAcknowledged?: boolean;
  virtualAccountNumber?: string;
  settlementQueuedAt?: string;
  settlementBlocked?: boolean;
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  businessName: string;
  tier: 1 | 2;
  documentType: string;
  documentUrl: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  riskScoreSuggested: number;
  notes?: string;
  cleanverseStatus?: 'pass' | 'fail' | 'uncertain';
  cleanverseConfidence?: number;
  cleanverseReason?: string;
}

export interface Buyer {
  id: string;
  companyName: string;
  taxId: string;
  country: string;
  paymentTerms: string;
  creditTier: 'A+' | 'A' | 'B+' | 'B';
  creditScore: number;
  totalAdvanced: number;
  totalRepaid: number;
  onTimeCount: number;
  lateCount: number;
  defaultCount: number;
  onTimeRate: number; // computed: 0–100
  virtualAccounts: string[];
  frozen: boolean;
  frozenReason?: string;
  lastPaidAt?: string;
  createdAt: string;
}

export interface BuyerConcentration {
  id: string;
  companyName: string;
  creditTier: 'A+' | 'A' | 'B+' | 'B';
  onTimeRate: number;
  frozen: boolean;
  openInvoiceCount: number;
  totalOutstandingUsdc: number;
  earliestDeadline?: string;
  latestDeadline?: string;
  concentrationPct: number;
}

export interface PlatformAnalytics {
  totalVolumeUSD: number;
  activeLiquidityUSD: number;
  averageYieldAPY: number;
  defaultRatePct: number;
  totalSellersCount: number;
  totalLendersCount: number;
  fundedInvoicesCount: number;
  systemHealthPct: number;
}
