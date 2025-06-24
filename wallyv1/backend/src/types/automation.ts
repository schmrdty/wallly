// Backend automation types
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
    ZERO_OUT_WALLET = 'ZERO_OUT_WALLET'
}

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

export interface TransferRequest {
    wallet: string;
    token: string;
    recipient: string;
    amount: string;
}

export interface AutoSaveConfig extends AutomationConfig {
    metadata: {
        thresholdAmount: string;
        targetSavingsAddress: string;
        tokenAddress: string;
        checkInterval: number;
    };
}

export interface BillConfig extends AutomationConfig {
    metadata: {
        billType: string;
        providerName: string;
        accountNumber: string;
        recipientAddress: string;
        amount: string;
        dueDay: number;
        autoPayEnabled: boolean;
        notificationDays: number;
    };
}

export interface SubscriptionConfig extends AutomationConfig {
    metadata: {
        serviceName: string;
        recipientAddress: string;
        amount: string;
        tokenAddress: string;
        frequency: 'monthly' | 'yearly';
        nextPaymentDate: number;
        dayOfMonth?: number;
        monthOfYear?: number;
    };
}

export interface DCAConfig extends AutomationConfig {
    metadata: {
        strategyName: string;
        sourceToken: string;
        targetToken: string;
        amount: string;
        frequency: string;
        exchangeAddress: string;
        slippageTolerance: number;
        priceImpactLimit: number;
        startDate: number;
        endDate?: number;
        totalInvested: string;
        averagePrice: string;
        executionTimes: number[];
    };
}

export interface EmergencyFundConfig extends AutomationConfig {
    metadata: {
        targetAmount: string;
        currentAmount: string;
        monthlyContribution: string;
        emergencyThreshold: string;
        autoWithdraw: boolean;
        fundPurpose: string;
    };
}

export interface CharityConfig extends AutomationConfig {
    metadata: {
        charityName: string;
        charityAddress: string;
        donationType: 'fixed' | 'percentage' | 'roundup';
        amount?: string;
        percentage?: number;
        frequency: string;
        category: string;
        taxReceiptEmail?: string;
    };
}

export interface ConsolidationConfig extends AutomationConfig {
    metadata: {
        sourceWallets: string[];
        targetWallet: string;
        tokenFilter: string[];
        minThreshold: string;
        frequency: string;
        gasOptimization: boolean;
    };
}

export interface ZeroOutConfig extends AutomationConfig {
    metadata: {
        sourceWallet: string;
        targetWallet: string;
        includeNFTs: boolean;
        gasReserve: string;
        scanDepth: number;
        excludeTokens: string[];
    };
}
