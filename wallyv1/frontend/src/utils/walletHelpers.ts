import { api } from './api';

// Returns [{ address, symbol, balance }]
export async function getWalletTokensAndBalances(walletAddress: string): Promise<{ address: string, symbol: string, balance: number }[]> {
  // Backend endpoint should return all tokens and balances for the wallet
  const res = await api.get(`/wallets/${walletAddress}/tokens`);
  return res.data.tokens;
}
