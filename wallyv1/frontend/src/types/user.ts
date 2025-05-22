export interface AuthUser {
  id: string;
    username?: string;  //- Greetings...
    farcasterId?: string;  //- Farcaster ID
    email?: string;  //- Email for data removal
    telegram?: string;  //- Telegram for data removal
    purgeMode?: boolean;  //- Purge Mode On or Off
    autoRenew?: boolean;  //- Auto Renew On or Off
    allowEmail?: boolean;  //- Allow Email
    allowTelegram?: boolean;  //- Allow Telegram
    allowFarcaster?: boolean;  //- Allow Farcaster
    dateOfFirstGrant?: string;  //- Date of First Grant
    dateOfRevoke?: string;  //- Date of Revoke
    reminderOption?: string;  //- Reminder Option
    methodForRevokedInfoSentToUser?: string;
    allowFarcasterNotifications?: boolean;
    //- Wallet fields
    allowWallet?: boolean;
    allowWallets?: string[];
    watchedWallets?: string[];
    allowEntireWallet?: boolean;  //- Allow Entire Wallet
    allowedTokenList?: string[];  //- Allowed Tokens
    allowTokens?: string[];
    watchedTokens?: string[];
    destinationAddress?: string;
    destinationAddressType?: string;
    destinationAddressTypeName?: string;
    //- Potential future implementations
    //- Telegram fields
/*  allowTelegramNotifications?: boolean;
    allowTelegramAlerts?: boolean;
    allowTelegramReminders?: boolean;    
    allowTelegramMessages?: boolean;
    //- Email fields
    allowEmailMessages?: boolean;
    allowEmailNotifications?: boolean;
    allowEmailReminders?: boolean;
    allowEmailAlerts?: boolean;
    //- Farcaster fields *Note: Farcaster in App notifications are implemented by default
    allowFarcasterMessages?: boolean;
    allowFarcasterReminders?: boolean;
    allowFarcasterAlerts?: boolean;
    farcasterAddress?: string;
    farcasterUsername?: string;
    farcasterProfile?: string;
    farcasterProfileCreatedAt?: string;
    //- Future NFT Fields
    tokenAddressNFT?: string;
    tokenIdNFT?: string;
    tokenStandardNFT?: string;
    tokenTypeNFT?: string;
    tokenNameNFT?: string;
    tokenSymbolNFT?: string;
    tokenImageNFT?: string;
    tokenDescriptionNFT?: string;

    //- MiniApp fields
    miniAppAllowanceGranted?: string;
    miniAppAllowanceRevoked?: string;
    miniAppAllowanceRevokedReason?: string;
    miniAppGrantedDate?: string;
    miniAppRevokedDate?: string;
    miniAppRevokedReason?: string;
    miniAppRevokedBy?: string;
    miniAppRevokedMethod?: string;
    miniAppRevokedMethodName?: string;
    miniAppRevokedMethodType?: string;
    miniAppTransferDate?: string;
    miniAppTransferMethod?: string;
    miniAppBatch: string;
    miniAppBatchTokens?: string[];
    miniAppBatchWalletOrigin?: string[];
    miniAppBatchWalletDestination?: string[];
*/
  // Add other user fields as needed
}