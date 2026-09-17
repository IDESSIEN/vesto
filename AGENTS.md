# Vesto — Invoice Capital, Onchain

Invoice financing marketplace rewritten with Arc/USDC onchain skills.

## Deployed Contracts

### VestoEscrow
- **Network**: Arc Testnet (Chain ID 5454)
- **Address**: `0x6b3a34d3dbf8986560ccf67bae7aff0cfbe82e6b`
- **Explorer**: https://explorer.testnet.arc.io/address/0x6b3a34d3dbf8986560ccf67bae7aff0cfbe82e6b
- **Source**: `contracts/VestoEscrow.sol`
- **Artifact**: `contracts/out/VestoEscrow.sol/VestoEscrow.json`

### Constructor Args
- `_admin`: `0x5B12Ce46C7194aD57d143bC22847224047b1Ef42` (platform deployer)
- `_usdc`: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` (USDC on Arc Testnet)

## Key Files
- `src/config/wagmi.tsx` — wagmi + ConnectKit config, Arc Testnet chain definition
- `src/config/contracts.ts` — contract address, ABI import, USDC helpers
- `src/hooks/useVestoEscrow.ts` — `useFundInvoice`, `useClaimPayout`, `usePendingClaim`, `useUSDCBalance`
- `src/context/AppContext.tsx` — app state (roles, invoices, verifications)
- `src/components/common/Navbar.tsx` — ConnectKit wallet button

## Arc / USDC Notes
- USDC address on Arc Testnet: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` (6 decimals, ERC-20)
- Native gas on Arc IS USDC — do not double-count balances
- Lenders fund invoices via `fundInvoice()` — requires USDC approval first
- Sellers claim via `claimPayout()` after admin calls `approveRepayment()`
- Admin pre-registers invoices via `adminRegisterInvoice()` before lenders can fund
