export type AgoraChain =
  | 'arbitrum'
  | 'avalanche'
  | 'base'
  | 'ethereum'
  | 'immutable'
  | 'monad'
  | 'polygon-pos'
  | 'solana';

export type AgoraCurrency = 'ausd' | 'usd' | 'usdc' | 'stablecoin';

export type AgoraRouteDirection =
  | 'mint-fiat'
  | 'mint-stablecoin'
  | 'redeem-fiat'
  | 'redeem-stablecoin';

export interface AgoraWireInstruction {
  memo: string;
  beneficiaryName: string;
  beneficiaryAddress: string;
  accountNumber: string;
  bankName: string;
  bankAddress: string;
  routingNumber: string;
  swiftCode?: string;
  supportedCurrencies: AgoraCurrency[];
}

export interface AgoraOnChainInstruction {
  chain: AgoraChain;
  depositAddress: string;
  supportedCurrencies: AgoraCurrency[];
}

export type AgoraRouteInstruction = AgoraWireInstruction | AgoraOnChainInstruction;

export interface AgoraRoute {
  id: string;
  name?: string | null;
  createdAt: string;
  direction: AgoraRouteDirection;
  from: { currency: AgoraCurrency };
  to: {
    currency: AgoraCurrency;
    accountId: string;
    chain?: AgoraChain;
  };
  instructions: AgoraRouteInstruction[];
}

export interface AgoraWalletAccount {
  id: string;
  kind: 'wallet';
  address: string;
  name?: string;
  networks: Array<{ chain: AgoraChain } | AgoraChain>;
}

export interface AgoraBankAccount {
  id: string;
  kind: 'bank';
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  beneficiary: string;
  name?: string;
}

export type AgoraAccount = AgoraWalletAccount | AgoraBankAccount;

export interface AgoraPayoutResult {
  route: AgoraRoute;
  status: 'initiated' | 'simulated';
  message: string;
}

export interface AgoraDepositSetup {
  route: AgoraRoute;
  walletAccount: AgoraWalletAccount;
  status: 'ready' | 'simulated';
}

/** How the lender pays before USDC enters escrow. Card and bank both settle on Agora's USD fiat rail. */
export type LenderFundingPaymentMethod = 'card' | 'bank' | 'usdc_wallet';

export type SellerLocalPayoutChannel = 'bank' | 'mobile_money';

export interface AgoraInvoiceFundingSession {
  invoiceId: string;
  amountUsd: number;
  method: LenderFundingPaymentMethod;
  depositSetup: AgoraDepositSetup | null;
  /** Human-readable step for card vs ACH/wire */
  fundingLabel: string;
  status: 'awaiting_fiat' | 'ready_for_escrow' | 'simulated';
}

export interface AgoraLocalPayoutRequest {
  walletAddress: string;
  sellerName: string;
  amountUsd: number;
  localCurrency: string;
  channel: SellerLocalPayoutChannel;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  beneficiary: string;
}
