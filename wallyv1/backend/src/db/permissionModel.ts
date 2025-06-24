export interface Permission {
  userId: string;
  withdrawalAddress?: string;
  allowEntireWallet?: boolean;
  expiresAt?: string;
  tokenList?: string[];
  minBalances?: any[];
  limits?: any[];
  isActive?: boolean;
}
