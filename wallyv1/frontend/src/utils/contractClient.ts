import { Address, Hash } from 'viem';

// Backend API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ContractCallOptions {
    priority?: 'critical' | 'high' | 'medium' | 'low';
    timeout?: number;
    retryCount?: number;
    estimateGas?: boolean;
    dryRun?: boolean;
    userId?: string;
    metadata?: Record<string, any>;
}

export interface ContractPermission {
    withdrawalAddress: Address;
    allowEntireWallet: boolean;
    expiresAt: string;
    isActive: boolean;
    tokenList: Address[];
    minBalances: string[];
    limits: string[];
}

export interface MiniAppSession {
    delegate: Address;
    expiresAt: string;
    allowedTokens: Address[];
    allowWholeWallet: boolean;
    active: boolean;
    miniAppId?: string; // Optional for compatibility
    permissions?: string[]; // Optional for compatibility
}

export interface ContractState {
    owner: Address;
    paused: boolean;
    defaultDuration: string;
    minDuration: string;
    maxDuration: string;
    globalRateLimit: string;
    whitelistToken: Address;
    minWhitelistBalance: string;
    chainlinkOracle: Address;
    useChainlink: boolean;
    maxOracleDelay: string;
    ecdsaSigner: Address;
    gnosisSafe: Address;
    entryPoint: Address;
}

export interface UserNonces {
    permission: string;
    session: string;
    delegation: string;
    metaTx: string;
    transferAuth: string;
    aa: string;
}

export interface BatchContractCall {
    functionName: string;
    args: any[];
    options?: ContractCallOptions;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Frontend Contract Integration Client
 * 
 * Provides client-side interface to interact with the contract integration backend service.
 * Handles all contract operations, state management, and error handling.
 */
class FrontendContractClient {
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    // ===========================================
    // UTILITY METHODS
    // ===========================================

    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseUrl}/api/contract${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                ...options,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error: any) {
            console.error(`API request failed for ${endpoint}:`, error);
            return {
                success: false,
                error: error.message || 'Network error',
            };
        }
    }    // ===========================================
    // CONTRACT STATE AND INFO
    // ===========================================

    /**
     * Get complete contract state information (returns enhanced contract state with aggregate stats)
     */
    async getContractState(): Promise<ApiResponse<{
        isActive: boolean;
        isPaused: boolean;
        totalUsers: string;
        totalPermissions: string;
        totalSessions: string;
        oracleTimestamp: string;
        lastUpdated: number;
        // Additional backend fields
        owner?: Address;
        defaultDuration?: string;
        minDuration?: string;
        maxDuration?: string;
        globalRateLimit?: string;
        whitelistToken?: Address;
        [key: string]: any; // For other backend fields
    }>> {
        return this.makeRequest('/state');
    }

    /**
     * Get contract integration service health status
     */
    async getHealthStatus(): Promise<ApiResponse<any>> {
        return this.makeRequest<any>('/health');
    }

    /**
     * Get current oracle timestamp
     */
    async getOracleTimestamp(): Promise<ApiResponse<{ timestamp: string; blockTime: number }>> {
        return this.makeRequest<{ timestamp: string; blockTime: number }>('/oracle-timestamp');
    }

    // ===========================================
    // USER DATA METHODS
    // ===========================================

    /**
     * Get user's permission details
     */
    async getUserPermission(userAddress: Address): Promise<ApiResponse<ContractPermission>> {
        return this.makeRequest<ContractPermission>(`/user/${userAddress}/permission`);
    }

    /**
     * Get user's mini app session details
     */
    async getUserSession(userAddress: Address): Promise<ApiResponse<MiniAppSession>> {
        return this.makeRequest<MiniAppSession>(`/user/${userAddress}/session`);
    }

    /**
     * Get user's nonces for different operation types
     */
    async getUserNonces(userAddress: Address): Promise<ApiResponse<UserNonces>> {
        return this.makeRequest<UserNonces>(`/user/${userAddress}/nonces`);
    }

    /**
     * Check if user has specific role
     */
    async checkUserRole(userAddress: Address, role: string): Promise<ApiResponse<{ address: Address; role: string; hasRole: boolean }>> {
        return this.makeRequest<{ address: Address; role: string; hasRole: boolean }>(`/user/${userAddress}/role/${role}`);
    }

    /**
     * Check if user is admin (has ADMIN_ROLE)
     */
    async isUserAdmin(userAddress: Address): Promise<boolean> {
        try {
            const response = await this.checkUserRole(userAddress, 'ADMIN_ROLE');
            return response.success && response.data?.hasRole || false;
        } catch (error) {
            console.error('Failed to check admin status:', error);
            return false;
        }
    }

    /**
     * Get all roles for a user
     */
    async getUserRoles(userAddress: Address): Promise<ApiResponse<{ address: Address; roles: string[] }>> {
        return this.makeRequest<{ address: Address; roles: string[] }>(`/user/${userAddress}/roles`);
    }

    /**
     * Grant role to user (admin only)
     */
    async grantRole(params: {
        userAddress: Address;
        role: string;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; userAddress: Address; role: string }>> {
        return this.makeRequest<any>('/admin/grant-role', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    /**
     * Revoke role from user (admin only)
     */
    async revokeRole(params: {
        userAddress: Address;
        role: string;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; userAddress: Address; role: string }>> {
        return this.makeRequest<any>('/admin/revoke-role', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    // ===========================================
    // PERMISSION MANAGEMENT
    // ===========================================

    /**
     * Grant or update user permission
     */
    async grantPermission(params: {
        withdrawalAddress: Address;
        allowEntireWallet?: boolean;
        duration: string;
        tokenList?: Address[];
        minBalances?: string[];
        limits?: string[];
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; withdrawalAddress: Address; allowEntireWallet: boolean; duration: string }>> {
        return this.makeRequest<any>('/permission/grant', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    /**
     * Grant permission using signature
     */
    async grantPermissionBySig(params: {
        user: Address;
        withdrawalAddress: Address;
        allowEntireWallet?: boolean;
        expiresAt: string;
        nonce: string;
        signature: `0x${string}`;
        tokenList?: Address[];
        minBalances?: string[];
        limits?: string[];
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; user: Address; withdrawalAddress: Address }>> {
        return this.makeRequest<any>('/permission/grant-by-sig', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    /**
     * Update permission
     */
    async updatePermission(params: {
        user: Address;
        withdrawalAddress: Address;
        allowEntireWallet: boolean;
        tokenList: Address[];
        minBalances: bigint[];
        limits: bigint[];
        expiresAt: bigint;
        signature?: string;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; user: Address; withdrawalAddress: Address }>> {
        // Convert bigint arrays to string arrays for transport
        const payload = {
            ...params,
            minBalances: params.minBalances.map(b => b.toString()),
            limits: params.limits.map(l => l.toString()),
            expiresAt: params.expiresAt.toString(),
        };

        return this.makeRequest<any>('/permission/update', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    /**
     * Revoke permission
     */
    async revokePermission(params: {
        user: Address;
        signature?: string;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; user: Address }>> {
        return this.makeRequest<any>('/permission/revoke', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    // ===========================================
    // SESSION MANAGEMENT
    // ===========================================

    /**
     * Grant mini app session
     */
    async grantSession(params: {
        delegate: Address;
        tokens?: Address[];
        allowWholeWallet?: boolean;
        durationSeconds: string;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; delegate: Address; allowWholeWallet: boolean; durationSeconds: string }>> {
        return this.makeRequest<any>('/session/grant', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    /**
     * Activate session using signature
     */
    async activateSessionBySig(params: {
        user: Address;
        app: Address;
        expiresAt: string;
        nonce: string;
        signature: `0x${string}`;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; user: Address; app: Address }>> {
        return this.makeRequest<any>('/session/activate-by-sig', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    /**
     * Delegate session using signature
     */
    async delegateSessionBySig(params: {
        delegator: Address;
        delegatee: Address;
        expiresAt: string;
        nonce: string;
        signature: `0x${string}`;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; delegator: Address; delegatee: Address }>> {
        return this.makeRequest<any>('/session/delegate-by-sig', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    /**
     * Create mini app session
     */
    async createMiniAppSession(params: {
        user: Address;
        miniAppId: string;
        permissions: string[];
        expiresAt: bigint;
        signature?: string;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; user: Address; miniAppId: string }>> {
        const payload = {
            ...params,
            expiresAt: params.expiresAt.toString(),
        };

        return this.makeRequest<any>('/session/create', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    /**
     * Activate session
     */
    async activateSession(params: {
        user: Address;
        signature?: string;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; user: Address }>> {
        return this.makeRequest<any>('/session/activate', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    /**
     * Deactivate session
     */
    async deactivateSession(params: {
        user: Address;
        signature?: string;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; user: Address }>> {
        return this.makeRequest<any>('/session/deactivate', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    /**
     * Revoke mini app session
     */
    async revokeSession(params: {
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    } = {}): Promise<ApiResponse<{ txHash: Hash }>> {
        return this.makeRequest<any>('/session/revoke', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    // ===========================================
    // TRANSFER OPERATIONS
    // ===========================================

    /**
     * Trigger transfers for a user
     */
    async triggerTransfers(params: {
        user: Address;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; user: Address }>> {
        return this.makeRequest<any>('/transfer/trigger', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    /**
     * Trigger transfer (individual transfer)
     */
    async triggerTransfer(params: {
        user: Address;
        to: Address;
        token: Address;
        amount: bigint;
        signature?: string;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; user: Address; to: Address; token: Address; amount: string }>> {
        const payload = {
            ...params,
            amount: params.amount.toString(),
        };

        return this.makeRequest<any>('/transfer/trigger-single', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    /**
     * Trigger transfers via mini app
     */
    async triggerMiniAppTransfers(params: {
        user: Address;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; user: Address }>> {
        return this.makeRequest<any>('/transfer/mini-app-trigger', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    /**
     * Execute transfer by authorization
     */
    async transferByAuthorization(params: {
        owner: Address;
        spender: Address;
        amount: string;
        deadline: string;
        nonce: string;
        signature: `0x${string}`;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; owner: Address; spender: Address; amount: string }>> {
        return this.makeRequest<any>('/transfer/by-authorization', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    // ===========================================
    // TRANSACTION EXECUTION
    // ===========================================

    /**
     * Execute single transaction
     */
    async executeTransaction(params: {
        target: Address;
        value?: string;
        data: `0x${string}`;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; target: Address; value: string }>> {
        return this.makeRequest<any>('/execute', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    /**
     * Execute batch transactions
     */
    async executeBatchTransactions(params: {
        calls: Array<{ target: Address; value?: string; data: `0x${string}` }>;
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHash: Hash; callCount: number }>> {
        return this.makeRequest<any>('/execute-batch', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    // ===========================================
    // BATCH OPERATIONS
    // ===========================================

    /**
     * Execute multiple contract calls in batch
     */
    async executeBatchContractCalls(params: {
        calls: BatchContractCall[];
        priority?: 'critical' | 'high' | 'medium' | 'low';
        userId?: string;
    }): Promise<ApiResponse<{ txHashes: Hash[]; callCount: number }>> {
        return this.makeRequest<any>('/batch/execute', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    // ===========================================
    // SIGNATURE VERIFICATION
    // ===========================================

    /**
     * Verify permission signature
     */
    async verifyPermissionSignature(params: {
        withdrawalAddress: Address;
        allowEntireWallet?: boolean;
        expiresAt: string;
        nonce: string;
        signature: `0x${string}`;
    }): Promise<ApiResponse<{ signer: Address; valid: boolean }>> {
        return this.makeRequest<any>('/verify/permission-signature', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    /**
     * Verify session signature
     */
    async verifySessionSignature(params: {
        user: Address;
        app: Address;
        expiresAt: string;
        nonce: string;
        signature: `0x${string}`;
    }): Promise<ApiResponse<{ signer: Address; valid: boolean }>> {
        return this.makeRequest<any>('/verify/session-signature', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    // ===========================================
    // UTILITY OPERATIONS
    // ===========================================
    /**
     * Estimate gas for a contract function call (supports both legacy and hook-compatible signatures)
     */
    async estimateGas(params: {
        functionName?: string;
        args?: any[];
        operation?: string;
        params?: any;
    }): Promise<ApiResponse<{ functionName: string; gasEstimate: string }> | { gasEstimate: bigint }> {
        // Handle hook-compatible signature
        if (params.operation && params.params !== undefined) {
            const result = await this.makeRequest<{ functionName: string; gasEstimate: string }>('/estimate-gas', {
                method: 'POST',
                body: JSON.stringify({
                    functionName: params.operation,
                    args: [params.params],
                }),
            });

            if (!result.success || !result.data) {
                throw new Error(result.error || 'Gas estimation failed');
            }

            return {
                gasEstimate: BigInt(result.data.gasEstimate),
            };
        }

        // Handle legacy signature
        return this.makeRequest<{ functionName: string; gasEstimate: string }>('/estimate-gas', {
            method: 'POST',
            body: JSON.stringify({
                functionName: params.functionName,
                args: params.args,
            }),
        });
    }

    /**
     * Simulate transaction (hook-compatible signature)
     */
    async simulateTransaction(params: {
        operation: string;
        params: any;
    }): Promise<{ success: boolean; gasUsed?: bigint; result?: any }> {
        const result = await this.makeRequest<{ functionName: string; result: any }>('/simulate', {
            method: 'POST',
            body: JSON.stringify({
                functionName: params.operation,
                args: [params.params],
            }),
        });

        if (!result.success) {
            return {
                success: false,
                result: result.error,
            };
        }

        return {
            success: true,
            result: result.data?.result,
            gasUsed: result.data?.result?.gasUsed ? BigInt(result.data.result.gasUsed) : undefined,
        };
    }

    /**
     * Get transaction status
     */
    async getTransactionStatus(params: {
        transactionId: string;
    }): Promise<{ status: string; hash?: string; error?: string }> {
        const result = await this.makeRequest<{ status: string; hash?: string; error?: string }>(`/transaction/${params.transactionId}/status`);

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to get transaction status');
        }

        return result.data;
    }

    /**
     * Simulate a contract function call (dry run)
     */
    async simulateContractCall(params: {
        functionName: string;
        args?: any[];
    }): Promise<ApiResponse<{ functionName: string; result: any }>> {
        return this.makeRequest<any>('/simulate', {
            method: 'POST',
            body: JSON.stringify(params),
        });
    }

    /**
     * Get contract events within a block range
     */
    async getContractEvents(params: {
        eventName: string;
        fromBlock: string;
        toBlock?: string;
        userAddress?: Address;
    }): Promise<ApiResponse<{ eventName: string; fromBlock: string; toBlock: string; events: any[] }>> {
        const queryParams = new URLSearchParams({
            fromBlock: params.fromBlock,
            ...(params.toBlock && { toBlock: params.toBlock }),
            ...(params.userAddress && { userAddress: params.userAddress }),
        });

        return this.makeRequest<any>(`/events/${params.eventName}?${queryParams}`);
    }

    // ===========================================
    // EVENT MONITORING METHODS
    // ===========================================

    /**
     * Get contract events with filtering (hook-compatible)
     */
    async getEvents(params: {
        filter?: {
            categories?: string[];
            types?: string[];
            users?: Address[];
            severities?: string[];
            fromBlock?: bigint;
            toBlock?: bigint;
            fromTimestamp?: number;
            toTimestamp?: number;
        };
        limit?: number;
        offset?: number;
    }): Promise<{ events: any[] }> {
        const queryParams = new URLSearchParams();

        if (params.limit) queryParams.set('limit', params.limit.toString());
        if (params.offset) queryParams.set('offset', params.offset.toString());

        if (params.filter) {
            if (params.filter.categories) queryParams.set('categories', params.filter.categories.join(','));
            if (params.filter.types) queryParams.set('types', params.filter.types.join(','));
            if (params.filter.users) queryParams.set('users', params.filter.users.join(','));
            if (params.filter.severities) queryParams.set('severities', params.filter.severities.join(','));
            if (params.filter.fromBlock) queryParams.set('fromBlock', params.filter.fromBlock.toString());
            if (params.filter.toBlock) queryParams.set('toBlock', params.filter.toBlock.toString());
            if (params.filter.fromTimestamp) queryParams.set('fromTimestamp', params.filter.fromTimestamp.toString());
            if (params.filter.toTimestamp) queryParams.set('toTimestamp', params.filter.toTimestamp.toString());
        }

        const result = await this.makeRequest<{ events: any[] }>(`/events?${queryParams}`);

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to fetch events');
        }

        return result.data;
    }

    // ===========================================
    // BATCH AND META TRANSACTION METHODS
    // ===========================================

    /**
     * Execute batch transactions (hook-compatible)
     */
    async executeBatch(params: {
        user: Address;
        transactions?: Array<{ operation: string; params: any; }>;
        priority?: 'low' | 'medium' | 'high' | 'critical';
        failureStrategy?: 'fail_fast' | 'continue' | 'retry';
    }): Promise<{ results?: Array<{ operation: string; success: boolean; transactionHash?: string; error?: string; }>; transactionHash?: string; }> {
        const result = await this.makeRequest<any>('/execute-batch', {
            method: 'POST',
            body: JSON.stringify(params),
        });

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Batch execution failed');
        }

        return result.data;
    }

    /**
     * Execute meta transaction (hook-compatible)
     */
    async executeMetaTransaction(params: {
        user: Address;
        to: Address;
        value?: string;
        data: `0x${string}`;
        fee?: string;
        feeToken: Address;
        relayer: Address;
        nonce: string;
        signature: `0x${string}`;
        priority?: 'low' | 'medium' | 'high' | 'critical';
    }): Promise<{ transactionHash: string; }> {
        const result = await this.makeRequest<any>('/execute-meta-tx', {
            method: 'POST',
            body: JSON.stringify({
                from: params.user,
                to: params.to,
                value: params.value || '0',
                data: params.data,
                fee: params.fee || '0',
                feeToken: params.feeToken,
                relayer: params.relayer,
                nonce: params.nonce,
                signature: params.signature,
                priority: params.priority || 'medium',
                userId: params.user,
            }),
        });

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Meta transaction failed');
        }

        return { transactionHash: result.data.txHash };
    }

    /**
     * Cancel transaction (hook-compatible)
     */
    async cancelTransaction(params: {
        transactionId: string;
    }): Promise<{ success: boolean; }> {
        const result = await this.makeRequest<any>(`/transaction/${params.transactionId}/cancel`, {
            method: 'POST',
        });

        return { success: result.success };
    }

    /**
     * Trigger MiniApp transfer (hook-compatible)
     */    async triggerMiniAppTransfer(params: {
        user: Address;
        destination: Address;
        amount: string | bigint;
        token?: Address;
        priority?: 'low' | 'medium' | 'high' | 'critical';
    }): Promise<{ transactionHash: string; }> {
        // Convert amount to string for transport (it's likely a bigint)
        const amountStr = typeof params.amount === 'bigint' ? params.amount.toString() : params.amount;

        const result = await this.makeRequest<any>('/trigger-miniapp-transfer', {
            method: 'POST',
            body: JSON.stringify({
                user: params.user,
                destination: params.destination,
                amount: amountStr,
                token: params.token,
                priority: params.priority || 'medium',
                userId: params.user,
            }),
        });

        if (!result.success || !result.data) {
            throw new Error(result.error || 'MiniApp transfer failed');
        }

        return { transactionHash: result.data.txHash };
    }

    // ...existing code...
}

// Export singleton instance
export const contractClient = new FrontendContractClient();
export default contractClient;

// Export utility functions for common operations
export const contractUtils = {
    /**
     * Convert bigint string to number (safe for display)
     */
    bigintToNumber: (value: string): number => {
        try {
            return Number(value);
        } catch {
            return 0;
        }
    },

    /**
     * Format timestamp for display
     */
    formatTimestamp: (timestamp: string): string => {
        try {
            const date = new Date(Number(timestamp) * 1000);
            return date.toLocaleString();
        } catch {
            return 'Invalid date';
        }
    },

    /**
     * Check if permission is expired
     */
    isPermissionExpired: (expiresAt: string): boolean => {
        try {
            const expiry = Number(expiresAt) * 1000;
            return Date.now() > expiry;
        } catch {
            return true;
        }
    },

    /**
     * Check if session is expired
     */
    isSessionExpired: (expiresAt: string): boolean => {
        try {
            const expiry = Number(expiresAt) * 1000;
            return Date.now() > expiry;
        } catch {
            return true;
        }
    },

    /**
     * Format address for display (truncated)
     */
    formatAddress: (address: Address): string => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    },

    /**
     * Validate Ethereum address
     */
    isValidAddress: (address: string): boolean => {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    },
};
