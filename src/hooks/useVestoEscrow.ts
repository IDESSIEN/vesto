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

export function useFundInvoice() {
  const { chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [step, setStep] = useState<'idle' | 'approving' | 'funding' | 'done' | 'error'>('idle');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [errorMsg, setErrorMsg] = useState<string>('');

  const { writeContractAsync: approve } = useWriteContract();
  const { writeContractAsync: fund } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const execute = useCallback(async (
    invoiceId: string,
    seller: `0x${string}`,
    amountUSDC: number
  ) => {
    setErrorMsg('');
    try {
      // 1. Switch chain if needed
      if (chainId !== ARC_TESTNET_CHAIN_ID) {
        switchChain({ chainId: ARC_TESTNET_CHAIN_ID as 5454 });
        return;
      }

      const amountRaw = parseUSDC(amountUSDC);

      // 2. Approve USDC spend
      setStep('approving');
      await approve({
        address: ARC_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [VESTO_ESCROW_ADDRESS, amountRaw],
        chainId: ARC_TESTNET_CHAIN_ID as 5454,
      });

      // 3. Fund invoice
      setStep('funding');
      const idBytes = invoiceId.padEnd(66, '0').slice(0, 66) as `0x${string}`;
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
        setErrorMsg(message.slice(0, 100));
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

export { USDC_DECIMALS };
