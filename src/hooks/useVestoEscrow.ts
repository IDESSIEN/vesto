import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { useState, useCallback } from 'react';
import {
  VESTO_ESCROW_ADDRESS,
  VESTO_ESCROW_ABI,
  ARC_USDC_ADDRESS,
  USDC_DECIMALS,
  ARC_TESTNET_CHAIN_ID,
  parseUSDC,
} from '../config/contracts';

// ─────────────────────────────────────────────── USDC balance ──

export function useUSDCBalance() {
  const { address } = useAccount();
  const { data, isLoading, refetch } = useReadContract({
    address: ARC_USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!address },
  });
  return { raw: data as bigint | undefined, isLoading, refetch };
}

// ─────────────────────────────────────────────── Fund invoice ──

export function useFundInvoice() {
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [step, setStep] = useState<'idle' | 'approving' | 'funding' | 'done' | 'error'>('idle');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [errorMsg, setErrorMsg] = useState<string>('');

  const { writeContractAsync: approve } = useWriteContract();
  const { writeContractAsync: fund }    = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const execute = useCallback(async (
    invoiceId: string,
    seller: `0x${string}`,
    amountUSDC: number
  ) => {
    setErrorMsg('');
    try {
      if (chainId !== ARC_TESTNET_CHAIN_ID) {
        switchChain({ chainId: ARC_TESTNET_CHAIN_ID as 5454 });
        return;
      }
      const amountRaw = parseUSDC(amountUSDC);
      const idBytes   = invoiceId.padEnd(66, '0').slice(0, 66) as `0x${string}`;

      setStep('approving');
      await approve({
        address: ARC_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [VESTO_ESCROW_ADDRESS, amountRaw],
        chainId: ARC_TESTNET_CHAIN_ID as 5454,
      });

      setStep('funding');
      const hash = await fund({
        address: VESTO_ESCROW_ADDRESS,
        abi: VESTO_ESCROW_ABI,
        functionName: 'fundInvoice',
        args: [idBytes, seller, amountRaw],
        chainId: ARC_TESTNET_CHAIN_ID as 5454,
      });
      setTxHash(hash);
      setStep('done');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('user rejected') || message.includes('4001')) {
        setStep('idle');
      } else {
        setErrorMsg(message.slice(0, 120));
        setStep('error');
      }
    }
  }, [chainId, switchChain, approve, fund]);

  const reset = useCallback(() => {
    setStep('idle');
    setTxHash(undefined);
    setErrorMsg('');
  }, []);

  return { execute, step, txHash, isConfirming, isSuccess, errorMsg, reset };
}

// ─────────────────────────────────────────────── Claim payout ──

export function useClaimPayout() {
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claim = useCallback(async () => {
    if (chainId !== ARC_TESTNET_CHAIN_ID) {
      switchChain({ chainId: ARC_TESTNET_CHAIN_ID as 5454 });
      return;
    }
    await writeContractAsync({
      address: VESTO_ESCROW_ADDRESS,
      abi: VESTO_ESCROW_ABI,
      functionName: 'claimPayout',
      chainId: ARC_TESTNET_CHAIN_ID as 5454,
    });
  }, [chainId, switchChain, writeContractAsync]);

  return { claim, isPending, isConfirming, isSuccess };
}

// ─────────────────────── L5: Lender refund after deadline ──

export function useClaimRefund() {
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [txHash, setTxHash]   = useState<`0x${string}` | undefined>();
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isPending, setIsPending] = useState(false);

  const { writeContractAsync } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const claimRefund = useCallback(async (invoiceId: string) => {
    setErrorMsg('');
    setIsPending(true);
    try {
      if (chainId !== ARC_TESTNET_CHAIN_ID) {
        switchChain({ chainId: ARC_TESTNET_CHAIN_ID as 5454 });
        return;
      }
      const idBytes = invoiceId.padEnd(66, '0').slice(0, 66) as `0x${string}`;
      const hash = await writeContractAsync({
        address: VESTO_ESCROW_ADDRESS,
        abi: VESTO_ESCROW_ABI,
        functionName: 'claimRefund',
        args: [idBytes],
        chainId: ARC_TESTNET_CHAIN_ID as 5454,
      });
      setTxHash(hash);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setErrorMsg(message.slice(0, 120));
    } finally {
      setIsPending(false);
    }
  }, [chainId, switchChain, writeContractAsync]);

  return { claimRefund, isPending, isConfirming, isSuccess, txHash, errorMsg };
}

// ─────────────────────── L6: Buyer direct USDC repayment ──

export function useBuyerRepay() {
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [step, setStep]       = useState<'idle' | 'approving' | 'repaying' | 'done' | 'error'>('idle');
  const [txHash, setTxHash]   = useState<`0x${string}` | undefined>();
  const [errorMsg, setErrorMsg] = useState<string>('');

  const { writeContractAsync: approve } = useWriteContract();
  const { writeContractAsync: repay }   = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  /**
   * amountUSDC should be the full repayment amount the contract expects:
   * advanceAmount + lenderYield + discountedFee
   * The UI should compute this from getInvoice() before calling.
   */
  const execute = useCallback(async (invoiceId: string, amountUSDC: number) => {
    setErrorMsg('');
    try {
      if (chainId !== ARC_TESTNET_CHAIN_ID) {
        switchChain({ chainId: ARC_TESTNET_CHAIN_ID as 5454 });
        return;
      }
      const amountRaw = parseUSDC(amountUSDC);
      const idBytes   = invoiceId.padEnd(66, '0').slice(0, 66) as `0x${string}`;

      setStep('approving');
      await approve({
        address: ARC_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [VESTO_ESCROW_ADDRESS, amountRaw],
        chainId: ARC_TESTNET_CHAIN_ID as 5454,
      });

      setStep('repaying');
      const hash = await repay({
        address: VESTO_ESCROW_ADDRESS,
        abi: VESTO_ESCROW_ABI,
        functionName: 'buyerRepay',
        args: [idBytes],
        chainId: ARC_TESTNET_CHAIN_ID as 5454,
      });
      setTxHash(hash);
      setStep('done');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message.includes('user rejected') || message.includes('4001')) {
        setStep('idle');
      } else {
        setErrorMsg(message.slice(0, 120));
        setStep('error');
      }
    }
  }, [chainId, switchChain, approve, repay]);

  const reset = useCallback(() => {
    setStep('idle');
    setTxHash(undefined);
    setErrorMsg('');
  }, []);

  return { execute, step, txHash, isConfirming, isSuccess, errorMsg, reset };
}

// ─────────────────────────── Read pending claim ──

export function usePendingClaim(address: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: VESTO_ESCROW_ADDRESS,
    abi: VESTO_ESCROW_ABI,
    functionName: 'pendingClaims',
    args: address ? [address] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!address },
  });
  return { raw: data as bigint | undefined, isLoading, refetch };
}

// ─────────────────────── Read invoice repayment deadline ──

export function useRepaymentDeadline(invoiceId: string | undefined) {
  const idBytes = invoiceId ? (invoiceId.padEnd(66, '0').slice(0, 66) as `0x${string}`) : undefined;
  const { data, isLoading } = useReadContract({
    address: VESTO_ESCROW_ADDRESS,
    abi: VESTO_ESCROW_ABI,
    functionName: 'getRepaymentDeadline',
    args: idBytes ? [idBytes] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!idBytes },
  });
  return { deadline: data as bigint | undefined, isLoading };
}

// ─────────────────────── Read invoice defaulted status ──

export function useIsDefaulted(invoiceId: string | undefined) {
  const idBytes = invoiceId ? (invoiceId.padEnd(66, '0').slice(0, 66) as `0x${string}`) : undefined;
  const { data, isLoading } = useReadContract({
    address: VESTO_ESCROW_ADDRESS,
    abi: VESTO_ESCROW_ABI,
    functionName: 'isDefaulted',
    args: idBytes ? [idBytes] : undefined,
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: !!idBytes },
  });
  return { isDefaulted: data as boolean | undefined, isLoading };
}

export { USDC_DECIMALS };
