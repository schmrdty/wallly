export interface Permission {
  withdrawalAddress: string;
  allowEntireWallet: boolean;
  expiresAt: string; // Changed from number to string to match ContractPermission
  isActive: boolean;
  tokenList: string[];
  minBalances: string[]; // Changed from number[] to string[] to match ContractPermission
  limits: string[]; // Changed from number[] to string[] to match ContractPermission
}
