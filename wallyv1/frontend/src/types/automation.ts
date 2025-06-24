// Shared types for frontend and backend automations
export interface UserPermission {
    withdrawalAddress: string;
    allowEntireWallet: boolean;
    expiresAt: number;
    isActive: boolean;
    tokenList: string[];
    minBalances: string[];
    limits: string[];
}

export interface MiniAppSession {
    delegate: string;
    expiresAt: number;
    allowedTokens: string[];
    allowWholeWallet: boolean;
    active: boolean;
}

export interface AutomationConfig {
    id: string;
    type: AutomationType;
    walletAddress: string;
    enabled: boolean;
    createdAt: number;
    updatedAt: number;
    metadata: Record<string, any>;
}

export enum AutomationType {
    AUTO_SAVE = 'AUTO_SAVE',
    SUBSCRIPTION = 'SUBSCRIPTION',
    BILL_PAYMENT = 'BILL_PAYMENT',
    DCA_INVESTMENT = 'DCA_INVESTMENT',
    EMERGENCY_FUND = 'EMERGENCY_FUND',
    CHARITY_DONATION = 'CHARITY_DONATION',
    WALLET_CONSOLIDATION = 'WALLET_CONSOLIDATION',
    ZERO_OUT = 'ZERO_OUT'
}

export interface TransferRequest {
    wallet: string;
    token: string;
    recipient: string;
    amount: string;
}
