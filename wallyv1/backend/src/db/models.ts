// Type definitions for Redis-stored data structures
// No Sequelize/PostgreSQL dependencies - pure TypeScript interfaces for Redis storage

export interface MiniAppSessionAttributes {
    id: number;
    userAddress: string;
    delegate: string;
    expiresAt: Date;
    allowedTokens: string[];
    allowEntireWallet: boolean;
    active: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Permission model for mapping contract permissions (getUserPermission).
 */
export interface PermissionAttributes {
    id?: string; // or number, depending on your Redis keying
    userId: string;
    delegate: string;
    withdrawalAddress: string;
    allowEntireWallet: boolean;
    expiresAt: Date;
    tokenList: string[]; // array of token addresses/symbols
    minBalances: string[]; // array of minimum balances per token
    limits: string[]; // array of transfer limits per token
    isActive: boolean;
    privacyOptions?: object | null; // for privacy-related settings
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * Core contract events for tracking token forwarding & permissions.
 */

export interface TransferPerformedEventAttributes {
    id: number;
    user: string;
    token: string;
    amount: string;
    destination: string;
    userRemaining: string;
    oracleTimestamp: string;
    blockTimestamp: string;
    transactionHash: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PermissionGrantedEventAttributes {
    id: number;
    user: string;
    withdrawalAddress: string;
    allowEntireWallet: boolean;
    expiresAt: Date;
    tokenList: string[];
    minBalances: string[];
    limits: string[];
    transactionHash: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PermissionRevokedEventAttributes {
    id: number;
    user: string;
    transactionHash: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface MiniAppSessionGrantedEventAttributes {
    id: number;
    user: string;
    delegate: string;
    tokens: string[];
    allowEntireWallet: boolean;
    expiresAt: Date;
    transactionHash: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface MiniAppSessionRevokedEventAttributes {
    id: number;
    user: string;
    delegate: string;
    transactionHash: string;
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * Wallet interface for tracking user wallet addresses in Redis.
 */
export interface WalletAttributes {
    id: number;
    address: string;
    userId: number;
    createdAt?: Date;
    updatedAt?: Date;
}

// All data structures are stored in Redis as JSON
// No Sequelize models needed - use interfaces for type safety
