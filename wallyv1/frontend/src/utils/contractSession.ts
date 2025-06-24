import { api } from './api.ts';

export async function createContractSession(data: {
  userId: string;
  walletAddress: string;
  delegate: string;
  allowedTokens: string[];
  allowWholeWallet: boolean;
  expiresAt: number;
  txHash: string;
}) {
  const res = await api.post('/contract-sessions', data);
  return res.data.session;
}

export async function getUserContractSession(userId: string) {
  const res = await api.get(`/contract-sessions/user/${userId}`);
  return res.data.session;
}

export async function revokeContractSession(contractSessionId: string) {
  const res = await api.post(`/contract-sessions/${contractSessionId}/revoke`);
  return res.data;
}
