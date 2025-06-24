import type { Address } from 'viem';
import type { ContractPermission, MiniAppSession, UserNonces as ClientUserNonces } from '../utils/contractClient';

// Permission types - using ContractPermission from contractClient for consistency
export type Permission = ContractPermission;

// Session types - using MiniAppSession from contractClient for consistency
export type Session = MiniAppSession;

// Nonce types - re-export from contractClient
export type UserNonces = ClientUserNonces;

// Contract state
export interface ContractState {
    isActive: boolean;
    isPaused: boolean;
    totalUsers: string; // Changed from bigint to string to match backend response
    totalPermissions: string; // Changed from bigint to string to match backend response
    totalSessions: string; // Changed from bigint to string to match backend response
    oracleTimestamp: string; // Changed from bigint to string to match backend response
    lastUpdated: number;
}

// Transaction types
export interface TransactionRequest {
    id: string;
    type: 'permission' | 'session' | 'transfer' | 'batch' | 'meta';
    operation: string;
    params: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
    gasEstimate?: bigint;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    hash?: string;
    error?: string;
    createdAt: number;
    updatedAt: number;
}

export interface BatchTransactionRequest {
    transactions: Omit<TransactionRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    failureStrategy: 'fail_fast' | 'continue' | 'retry';
}

// Event types
export interface ContractEvent {
    id: string;
    type: string;
    category: 'permission' | 'session' | 'transfer' | 'transaction' | 'admin' | 'system';
    severity: 'info' | 'warning' | 'error' | 'critical';
    user?: Address;
    data: any;
    blockNumber: bigint;
    transactionHash: string;
    timestamp: number;
    processed: boolean;
}

export interface EventFilter {
    categories?: ContractEvent['category'][];
    types?: string[];
    users?: Address[];
    severities?: ContractEvent['severity'][];
    fromBlock?: bigint;
    toBlock?: bigint;
    fromTimestamp?: number;
    toTimestamp?: number;
}

export interface EventStats {
    total: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recentCount: number;
    errorRate: number;
}

// API response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

// Operation parameter types
export interface PermissionParams {
    user: Address;
    withdrawalAddress: Address;
    allowEntireWallet: boolean;
    tokenList: Address[];
    minBalances: bigint[];
    limits: bigint[];
    expiresAt: bigint;
    signature?: string;
}

export interface SessionParams {
    user: Address;
    miniAppId: string;
    permissions: string[];
    expiresAt: bigint;
    signature?: string;
}

export interface TransferParams {
    user: Address;
    to: Address;
    token: Address;
    amount: bigint;
    signature?: string;
}

export interface BatchParams {
    user: Address;
    transactions: {
        operation: string;
        params: any;
    }[];
    priority: TransactionRequest['priority'];
    failureStrategy: BatchTransactionRequest['failureStrategy'];
    signature?: string;
}

// Health check types
export interface HealthStatus {
    isHealthy: boolean;
    lastUpdate: number;
    issues: string[];
    services: {
        contract: boolean;
        database: boolean;
        redis: boolean;
        eventListener: boolean;
    };
}

// Gas estimation types
export interface GasEstimate {
    gasEstimate: bigint;
    gasPrice: bigint;
    estimatedCost: bigint;
    confidence: number;
}

// Simulation types
export interface SimulationResult {
    success: boolean;
    gasUsed?: bigint;
    result?: any;
    error?: string;
    warnings?: string[];
}

// User data aggregation
export interface UserContractData {
    permission: Permission | null;
    session: Session | null;
    nonces: UserNonces | null; // Made nullable to match hook definition
    roles: string[];
    isAdmin: boolean;
    hasValidSession: boolean;
    hasActivePermission: boolean;
}

// Contract integration hook state
export interface ContractIntegrationState {
    contractState: ContractState | null;
    userData: UserContractData | null;
    loading: boolean;
    error: string | null;
    isHealthy: boolean;
    realTimeEnabled: boolean;
}

// Transaction manager state
export interface TransactionManagerState {
    transactions: TransactionRequest[];
    loading: boolean;
    error: string | null;
    isTracking: boolean;
}

// Event monitoring state
export interface EventMonitoringState {
    events: ContractEvent[];
    allEvents: ContractEvent[];
    loading: boolean;
    error: string | null;
    isMonitoring: boolean;
    filter: EventFilter;
    stats: EventStats | null;
}

// Form types
export interface TransferFormData {
    recipient: string;
    token: string;
    amount: string;
    priority: TransactionRequest['priority'];
}

export interface PermissionFormData {
    withdrawalAddress: string;
    allowEntireWallet: boolean;
    tokens: {
        address: string;
        minBalance: string;
        limit: string;
    }[];
    duration: number; // in days
}

export interface SessionFormData {
    miniAppId: string;
    permissions: string[];
    duration: number; // in hours
}

// Token information
export interface TokenInfo {
    address: Address;
    symbol: string;
    name: string;
    decimals: number;
    balance?: bigint;
}

// Utility types
export type ContractFunction =
    | 'grantPermission'
    | 'updatePermission'
    | 'revokePermission'
    | 'createMiniAppSession'
    | 'activateSession'
    | 'deactivateSession'
    | 'triggerTransfer'
    | 'executeBatch'
    | 'executeMetaTransaction';

export type PermissionOperation = 'grant' | 'update' | 'revoke';
export type SessionOperation = 'create' | 'activate' | 'deactivate';
export type TransferOperation = 'trigger' | 'miniapp_trigger';

// Error types
export interface ContractError {
    code: string;
    message: string;
    details?: any;
    transaction?: string;
}

// Pagination helpers
export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Export main Permission type for backward compatibility
export type { Permission as DefaultPermission } from './Permission';
