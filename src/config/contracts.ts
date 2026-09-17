import artifact from '../../contracts/out/VestoEscrow.sol/VestoEscrow.json';

export const VESTO_ESCROW_ADDRESS = (
  import.meta.env.VITE_VESTO_ESCROW_ADDRESS ||
  '0x6b3a34d3dbf8986560ccf67bae7aff0cfbe82e6b'
) as `0x${string}`;

export const VESTO_ESCROW_ABI = artifact.abi;

// USDC on Arc Testnet (6 decimals, ERC-20 view)
export const ARC_USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`;
export const USDC_DECIMALS = 6;

export const ARC_TESTNET_CHAIN_ID = 5454;
export const ARC_TESTNET_EXPLORER = 'https://explorer.testnet.arc.io';

export function formatUSDC(raw: bigint): string {
  const value = Number(raw) / 10 ** USDC_DECIMALS;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function parseUSDC(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** USDC_DECIMALS));
}

export function formatAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function explorerTxUrl(txHash: string): string {
  return `${ARC_TESTNET_EXPLORER}/tx/${txHash}`;
}
