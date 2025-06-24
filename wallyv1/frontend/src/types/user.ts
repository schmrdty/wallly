export interface AuthUser {
  id: string;
  userId?: string;
  address: string; // Primary wallet address (custody address for Farcaster users)
  fid?: string | number;
  walletAddress?: string; // Deprecated - use address instead
  isValid?: boolean;
  authProvider?: string;
  hasGrantedPermission?: boolean; // Indicates if the user has granted permission for contract interactions
  displayName?: string;
  farcasterUser?: {
    fid: number;
    username?: string;
    displayName?: string;
    email?: boolean; // Whether the user has a verified email on Farcaster
    pfpUrl?: string;
    custody?: string; // Farcaster custody address (should match address)
    verifications?: string[];
  } | null;
  // For contract interactions - custody address is automatically the wallet
  custodyAddress?: string; // Same as address for Farcaster users
  custody?: string; // Add this for compatibility with backend/session
}