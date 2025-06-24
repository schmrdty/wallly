import { useAccount, useBalance } from 'wagmi';

export function useWallet() {
  const { address, isConnected } = useAccount();
  const balanceResult = address ? useBalance({ address }) : { data: undefined };

  return {
    walletAddress: address ?? null,
    balance: balanceResult.data ? balanceResult.data.formatted : null,
    isConnected: !!isConnected,
  };
}

export default useWallet;
export type WalletInfo = {
  walletAddress: string | null;
  balance: string | null;
  isConnected: boolean;
};
