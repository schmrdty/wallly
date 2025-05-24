export interface AuthUser {
  id: string;
  authProvider?: string;
  username?: string;
  email?: string;
  telegram?: string;
  purgeMode?: boolean;         // Purge Mode On or Off
  autoRenew?: boolean;         // Auto Renew On or Off
  reminderOption?: string;     // Reminder Option
  dateOfFirstGrant?: string;   // Date of First Grant
  dateOfRevoke?: string;       // Date of Revoke

  // Wallet-related fields
  watchedWallets?: string[];
  allowEntireWallet?: boolean;
  allowedTokenList?: string[];
  watchedTokens?: string[];
  destinationAddress?: string;

  // Notification preferences
  allowEmail?: boolean;
  allowTelegram?: boolean;
  allowFarcaster?: boolean;
  allowFarcasterNotifications?: boolean;

  // Add more fields here ONLY if you use them in your UI/components
}