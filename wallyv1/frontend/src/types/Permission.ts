export interface Permission {
  withdrawalAddress: string;
  allowEntireWallet: boolean;
  expiresAt: number;
  isActive: boolean;
  tokenList: string[];
  minBalances: number[];
  limits: number[];
}
