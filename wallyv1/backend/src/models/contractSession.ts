export interface ContractSessionData {
  contractSessionId: string;
  userId: string; // dApp user id (from auth session)
  walletAddress: string;
  delegate: string;
  allowedTokens: string[];
  allowWholeWallet: boolean;
  expiresAt: number;
  createdAt: number;
  revoked?: boolean;
  revokedAt?: number;
  txHash?: string;
}
