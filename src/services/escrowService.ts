import { Invoice } from '../types';

const ESCROW_CONTRACT =
  import.meta.env.VITE_ESCROW_CONTRACT_ADDRESS || '0xAdvanceInvoiceEscrow00000000000000000001';

export interface EscrowFundResult {
  txHash: string;
  invoiceId: string;
  amountUsdc: number;
  escrowAddress: string;
}

export interface EscrowReleaseResult {
  txHash: string;
  invoiceId: string;
  sellerAdvanceUsdc: number;
}

export interface RepaymentSplit {
  lenderPrincipalUsdc: number;
  lenderYieldUsdc: number;
  platformFeeUsdc: number;
}

function mockTxHash(label: string): string {
  const seed = `${label}-${Date.now().toString(16)}`;
  return `0x${seed.padEnd(64, '0').slice(0, 64)}`;
}

async function simulateChainDelay(ms = 350): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * On-chain escrow for invoice advances. Agora sits outside this layer (fiat/USDC in, local fiat out).
 */
export const escrowService = {
  contractAddress: ESCROW_CONTRACT,

  async fundInvoice(params: {
    invoiceId: string;
    amountUsdc: number;
    lenderAddress: string;
  }): Promise<EscrowFundResult> {
    await simulateChainDelay();
    return {
      txHash: mockTxHash(`fund-${params.invoiceId}`),
      invoiceId: params.invoiceId,
      amountUsdc: params.amountUsdc,
      escrowAddress: ESCROW_CONTRACT,
    };
  },

  async fundInvoiceBatch(params: {
    invoiceIds: string[];
    totalUsdc: number;
    lenderAddress: string;
  }): Promise<EscrowFundResult> {
    await simulateChainDelay(500);
    return {
      txHash: mockTxHash(`batch-${params.invoiceIds.join('-')}`),
      invoiceId: params.invoiceIds.join(','),
      amountUsdc: params.totalUsdc,
      escrowAddress: ESCROW_CONTRACT,
    };
  },

  /** Escrow releases the seller advance (USDC) - Agora converts this leg to local currency. */
  async releaseSellerAdvance(params: {
    invoiceId: string;
    amountUsdc: number;
  }): Promise<EscrowReleaseResult> {
    await simulateChainDelay();
    return {
      txHash: mockTxHash(`release-${params.invoiceId}`),
      invoiceId: params.invoiceId,
      sellerAdvanceUsdc: params.amountUsdc,
    };
  },

  computeRepaymentSplit(invoice: Invoice): RepaymentSplit {
    const lenderYieldUsdc =
      invoice.advanceAmount * (invoice.expectedYieldPct / 100) * (invoice.termDays / 365);
    return {
      lenderPrincipalUsdc: invoice.advanceAmount,
      lenderYieldUsdc,
      platformFeeUsdc: invoice.feeAmount,
    };
  },

  /** Buyer repayment: escrow returns principal + yield to lender (USDC on Monad). */
  async settleRepayment(params: {
    invoiceId: string;
    split: RepaymentSplit;
    lenderAddress: string;
  }): Promise<{ txHash: string }> {
    await simulateChainDelay();
    return { txHash: mockTxHash(`repay-${params.invoiceId}`) };
  },
};
