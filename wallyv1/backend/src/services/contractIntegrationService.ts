import { createPublicClient, createWalletClient, http, getContract, type Address, type Hash, type PublicClient, type WalletClient } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import wallyv1Abi from '../abis/wallyv1.json' with { type: 'json' };
import { transactionStatusTrackingService } from './transactionStatusTrackingService.js';
import { enhancedEventMonitoringService } from './enhancedEventMonitoringService.js';
import { contractStateSyncService } from './contractStateSyncService.js';
import { contractErrorHandler } from './contractErrorHandler.js';
import redisClient from '../db/redisClient.js';
import logger from '../infra/mon/logger.js';

export interface ContractCallOptions {
    priority?: 'critical' | 'high' | 'medium' | 'low';
    timeout?: number;
    retryCount?: number;
    estimateGas?: boolean;
    dryRun?: boolean;
    userId?: string;
    metadata?: Record<string, any>;
}

export interface BatchContractCall {
    functionName: string;
    args: any[];
    options?: ContractCallOptions;
}

export interface ContractPermission {
    withdrawalAddress: Address;
    allowEntireWallet: boolean;
    expiresAt: bigint;
    isActive: boolean;
    tokenList: Address[];
    minBalances: bigint[];
    limits: bigint[];
}

export interface MiniAppSession {
    delegate: Address;
    expiresAt: bigint;
    allowedTokens: Address[];
    allowWholeWallet: boolean;
    active: boolean;
}

export interface ContractState {
    owner: Address;
    paused: boolean;
    defaultDuration: bigint;
    minDuration: bigint;
    maxDuration: bigint;
    globalRateLimit: bigint;
    whitelistToken: Address;
    minWhitelistBalance: bigint;
    chainlinkOracle: Address;
    useChainlink: boolean;
    maxOracleDelay: bigint;
    ecdsaSigner: Address;
    gnosisSafe: Address;
    entryPoint: Address;
}

/**
 * Comprehensive Contract Integration Service
 * 
 * Provides complete integration with wallyv1 contract including:
 * - All contract read/write functions
 * - Transaction management and status tracking
 * - Event monitoring integration
 * - State synchronization
 * - Batch operations
 * - Error handling and recovery
 */
class ContractIntegrationService {
    private publicClient: PublicClient;
    private walletClient: WalletClient | null = null;
    private contractAddress: Address;
    private contract: any;
    private account: any;

    constructor() {
        const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
        const contractAddr = process.env.CONTRACT_ADDRESS;
        const privateKey = process.env.WALLET_PRIVATE_KEY;

        if (!contractAddr) {
            throw new Error('CONTRACT_ADDRESS environment variable is required');
        }

        this.contractAddress = contractAddr as Address;        // Initialize public client
        this.publicClient = createPublicClient({
            chain: base,
            transport: http(rpcUrl),
        }) as PublicClient;

        // Initialize wallet client if private key is provided
        if (privateKey) {
            this.account = privateKeyToAccount(privateKey as `0x${string}`);
            this.walletClient = createWalletClient({
                account: this.account,
                chain: base,
                transport: http(rpcUrl),
            });
        }

        // Initialize contract instance
        this.contract = getContract({
            address: this.contractAddress,
            abi: wallyv1Abi,
            client: this.publicClient,
        });

        logger.info('ContractIntegrationService initialized', {
            contractAddress: this.contractAddress,
            hasWallet: !!this.walletClient,
        });
    }

  // ===========================================
  // CONTRACT READ FUNCTIONS (View/Pure)
  // ===========================================

  /**
   * Get contract state information
   */  async getContractState(): Promise<ContractState> {
        return contractErrorHandler.executeWithRetry(
            async () => {
                const [
                    owner,
                    paused,
                    defaultDuration,
                    minDuration,
                    maxDuration,
                    globalRateLimit,
                    whitelistToken,
                    minWhitelistBalance,
                    chainlinkOracle,
                    useChainlink,
                    maxOracleDelay,
                    ecdsaSigner,
                    gnosisSafe,
                    entryPoint,
                ] = await Promise.all([
                    this.publicClient.readContract({
                        address: this.contractAddress,
                        abi: wallyv1Abi,
                        functionName: 'owner',
                    }),
                    this.publicClient.readContract({
                        address: this.contractAddress,
                        abi: wallyv1Abi,
                        functionName: 'paused',
                    }),
                    this.publicClient.readContract({
                        address: this.contractAddress,
                        abi: wallyv1Abi,
                        functionName: 'defaultDuration',
                    }),
                    this.publicClient.readContract({
                        address: this.contractAddress,
                        abi: wallyv1Abi,
                        functionName: 'minDuration',
                    }),
                    this.publicClient.readContract({
                        address: this.contractAddress,
                        abi: wallyv1Abi,
                        functionName: 'maxDuration',
                    }),
                    this.publicClient.readContract({
                        address: this.contractAddress,
                        abi: wallyv1Abi,
                        functionName: 'globalRateLimit',
                    }),
                    this.publicClient.readContract({
                        address: this.contractAddress,
                        abi: wallyv1Abi,
                        functionName: 'whitelistToken',
                    }),
                    this.publicClient.readContract({
                        address: this.contractAddress,
                        abi: wallyv1Abi,
                        functionName: 'minWhitelistBalance',
                    }),
                    this.publicClient.readContract({
                        address: this.contractAddress,
                        abi: wallyv1Abi,
                        functionName: 'chainlinkOracle',
                    }),
                    this.publicClient.readContract({
                        address: this.contractAddress,
                        abi: wallyv1Abi,
                        functionName: 'useChainlink',
                    }),
                    this.publicClient.readContract({
                        address: this.contractAddress,
                        abi: wallyv1Abi,
                        functionName: 'maxOracleDelay',
                    }),
                    this.publicClient.readContract({
                        address: this.contractAddress,
                        abi: wallyv1Abi,
                        functionName: 'ecdsaSigner',
                    }),
                    this.publicClient.readContract({
                        address: this.contractAddress,
                        abi: wallyv1Abi,
                        functionName: 'gnosisSafe',
                    }),
                    this.publicClient.readContract({
                        address: this.contractAddress,
                        abi: wallyv1Abi,
                        functionName: 'entryPoint',
                    }),
                ]);

                return {
                    owner: owner as Address,
                    paused: paused as boolean,
                    defaultDuration: defaultDuration as bigint,
                    minDuration: minDuration as bigint,
                    maxDuration: maxDuration as bigint,
                    globalRateLimit: globalRateLimit as bigint,
                    whitelistToken: whitelistToken as Address,
                    minWhitelistBalance: minWhitelistBalance as bigint,
                    chainlinkOracle: chainlinkOracle as Address,
                    useChainlink: useChainlink as boolean,
                    maxOracleDelay: maxOracleDelay as bigint,
                    ecdsaSigner: ecdsaSigner as Address,
                    gnosisSafe: gnosisSafe as Address,
                    entryPoint: entryPoint as Address,
                };
            },
            {
                service: 'contractIntegration',
                functionName: 'getContractState'
            },
            { maxRetries: 3 }
        );
    }

    /**
     * Get user permission details
     */
    async getUserPermission(userAddress: Address): Promise<ContractPermission> {
        try {
            const result = await this.publicClient.readContract({
                address: this.contractAddress,
                abi: wallyv1Abi,
                functionName: 'getUserPermission',
                args: [userAddress],
            });

            const resultArray = result as any[];
            return {
                withdrawalAddress: resultArray[0] as Address,
                allowEntireWallet: resultArray[1] as boolean,
                expiresAt: resultArray[2] as bigint,
                isActive: resultArray[3] as boolean,
                tokenList: resultArray[4] as Address[],
                minBalances: resultArray[5] as bigint[],
                limits: resultArray[6] as bigint[],
            };
        } catch (error) {
            logger.error('Failed to get user permission', { userAddress, error });
            throw error;
        }
    }

    /**
     * Get mini app session details
     */
    async getMiniAppSession(userAddress: Address): Promise<MiniAppSession> {
        try {
            const result = await this.contract.read.getMiniAppSession([userAddress]);
            return {
                delegate: result[0],
                expiresAt: result[1],
                allowedTokens: result[2],
                allowWholeWallet: result[3],
                active: result[4],
            };
        } catch (error) {
            logger.error('Failed to get mini app session', { userAddress, error });
            throw error;
        }
    }

    /**
     * Get user's current nonce for different operation types
     */
    async getUserNonces(userAddress: Address): Promise<{
        permission: bigint;
        session: bigint;
        delegation: bigint;
        metaTx: bigint;
        transferAuth: bigint;
        aa: bigint;
    }> {
        try {
            const [permission, session, delegation, metaTx, transferAuth, aa] = await Promise.all([
                this.contract.read.permissionNonces([userAddress]),
                this.contract.read.sessionNonces([userAddress]),
                this.contract.read.delegationNonces([userAddress]),
                this.contract.read.metaTxNonces([userAddress]),
                this.contract.read.transferAuthNonces([userAddress]),
                this.contract.read.aaNonces([userAddress]),
            ]);

            return { permission, session, delegation, metaTx, transferAuth, aa };
        } catch (error) {
            logger.error('Failed to get user nonces', { userAddress, error });
            throw error;
        }
    }

    /**
     * Get oracle timestamp
     */
    async getOracleTimestamp(): Promise<bigint> {
        try {
            return await this.contract.read.getOracleTimestamp();
        } catch (error) {
            logger.error('Failed to get oracle timestamp', error);
            throw error;
        }
    }

    /**
     * Check if user has specific role
     */
    async hasRole(role: string, userAddress: Address): Promise<boolean> {
        try {
            return await this.contract.read.hasRole([role, userAddress]);
        } catch (error) {
            logger.error('Failed to check user role', { role, userAddress, error });
            throw error;
        }
    }

    /**
     * Get function rate limit override
     */
    async getFunctionRateLimit(functionSelector: string): Promise<bigint> {
        try {
            return await this.contract.read.functionRateLimitOverrides([functionSelector]);
        } catch (error) {
            logger.error('Failed to get function rate limit', { functionSelector, error });
            throw error;
        }
    }

    // ===========================================
    // CONTRACT WRITE FUNCTIONS
    // ===========================================

    /**
     * Grant or update user permission
     */
    async grantOrUpdatePermission(
        withdrawalAddress: Address,
        allowEntireWallet: boolean,
        duration: bigint,
        tokenList: Address[],
        minBalances: bigint[],
        limits: bigint[],
        options: ContractCallOptions = {}
    ): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite(
                'grantOrUpdatePermission',
                [withdrawalAddress, allowEntireWallet, duration, tokenList, minBalances, limits],
                options
            );

            logger.info('Permission granted/updated', {
                withdrawalAddress,
                allowEntireWallet,
                duration: duration.toString(),
                tokenCount: tokenList.length,
                txHash,
            });

            return txHash;
        } catch (error) {
            logger.error('Failed to grant/update permission', { withdrawalAddress, error });
            throw error;
        }
    }

    /**
     * Grant permission by signature
     */
    async grantPermissionBySig(
        user: Address,
        withdrawalAddress: Address,
        allowEntireWallet: boolean,
        expiresAt: bigint,
        nonce: bigint,
        signature: `0x${string}`,
        tokenList: Address[],
        minBalances: bigint[],
        limits: bigint[],
        options: ContractCallOptions = {}
    ): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite(
                'grantPermissionBySig',
                [user, withdrawalAddress, allowEntireWallet, expiresAt, nonce, signature, tokenList, minBalances, limits],
                options
            );

            logger.info('Permission granted by signature', {
                user,
                withdrawalAddress,
                expiresAt: expiresAt.toString(),
                txHash,
            });

            return txHash;
        } catch (error) {
            logger.error('Failed to grant permission by signature', { user, error });
            throw error;
        }
    }

    /**
     * Grant mini app session
     */
    async grantMiniAppSession(
        delegate: Address,
        tokens: Address[],
        allowWholeWallet: boolean,
        durationSeconds: bigint,
        options: ContractCallOptions = {}
    ): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite(
                'grantMiniAppSession',
                [delegate, tokens, allowWholeWallet, durationSeconds],
                options
            );

            logger.info('Mini app session granted', {
                delegate,
                tokenCount: tokens.length,
                allowWholeWallet,
                duration: durationSeconds.toString(),
                txHash,
            });

            return txHash;
        } catch (error) {
            logger.error('Failed to grant mini app session', { delegate, error });
            throw error;
        }
    }

    /**
     * Activate session by signature
     */
    async activateSessionBySig(
        user: Address,
        app: Address,
        expiresAt: bigint,
        nonce: bigint,
        signature: `0x${string}`,
        options: ContractCallOptions = {}
    ): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite(
                'activateSessionBySig',
                [user, app, expiresAt, nonce, signature],
                options
            );

            logger.info('Session activated by signature', {
                user,
                app,
                expiresAt: expiresAt.toString(),
                txHash,
            });

            return txHash;
        } catch (error) {
            logger.error('Failed to activate session by signature', { user, app, error });
            throw error;
        }
    }

    /**
     * Delegate mini app session by signature
     */
    async delegateMiniAppSessionBySig(
        delegator: Address,
        delegatee: Address,
        expiresAt: bigint,
        nonce: bigint,
        signature: `0x${string}`,
        options: ContractCallOptions = {}
    ): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite(
                'delegateMiniAppSessionBySig',
                [delegator, delegatee, expiresAt, nonce, signature],
                options
            );

            logger.info('Mini app session delegated by signature', {
                delegator,
                delegatee,
                expiresAt: expiresAt.toString(),
                txHash,
            });

            return txHash;
        } catch (error) {
            logger.error('Failed to delegate mini app session by signature', { delegator, delegatee, error });
            throw error;
        }
    }

    /**
     * Revoke mini app session
     */
    async revokeMiniAppSession(options: ContractCallOptions = {}): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('revokeMiniAppSession', [], options);

            logger.info('Mini app session revoked', { txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to revoke mini app session', error);
            throw error;
        }
    }

    /**
     * Trigger transfers for a user
     */
    async triggerTransfers(user: Address, options: ContractCallOptions = {}): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('triggerTransfers', [user], options);

            logger.info('Transfers triggered', { user, txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to trigger transfers', { user, error });
            throw error;
        }
    }

    /**
     * Mini app trigger transfers
     */
    async miniAppTriggerTransfers(user: Address, options: ContractCallOptions = {}): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('miniAppTriggerTransfers', [user], options);

            logger.info('Mini app transfers triggered', { user, txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to trigger mini app transfers', { user, error });
            throw error;
        }
    }

    /**
     * Trigger MiniApp transfer for a specific destination and amount
     */
    async triggerMiniAppTransfer(
        user: Address,
        destination: Address,
        amount: bigint,
        token?: Address,
        options: ContractCallOptions = {}
    ): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            // Use the existing miniAppTriggerTransfers function but add specific transfer logic
            // This might need to be adjusted based on the actual contract method signature
            const args = token
                ? [user, destination, amount, token]
                : [user, destination, amount];

            const txHash = await this.executeContractWrite('miniAppTriggerTransfer', args, options);

            logger.info('Mini app transfer triggered', {
                user,
                destination,
                amount: amount.toString(),
                token,
                txHash
            });

            return txHash;
        } catch (error) {
            logger.error('Failed to trigger mini app transfer', {
                user,
                destination,
                amount: amount.toString(),
                token,
                error
            });
            throw error;
        }
    }

    /**
     * Transfer by authorization (permit-style)
     */
    async transferByAuthorization(
        owner: Address,
        spender: Address,
        amount: bigint,
        deadline: bigint,
        nonce: bigint,
        signature: `0x${string}`,
        options: ContractCallOptions = {}
    ): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite(
                'transferByAuthorization',
                [owner, spender, amount, deadline, nonce, signature],
                options
            );

            logger.info('Transfer by authorization executed', {
                owner,
                spender,
                amount: amount.toString(),
                txHash,
            });

            return txHash;
        } catch (error) {
            logger.error('Failed to execute transfer by authorization', { owner, spender, error });
            throw error;
        }
    }

    /**
     * Execute transaction
     */
    async execute(
        target: Address,
        value: bigint,
        data: `0x${string}`,
        options: ContractCallOptions = {}
    ): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('execute', [target, value, data], options);

            logger.info('Transaction executed', { target, value: value.toString(), txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to execute transaction', { target, error });
            throw error;
        }
    }

    /**
     * Execute batch transactions
     */
    async executeBatch(
        calls: Array<{ target: Address; value: bigint; data: `0x${string}` }>,
        options: ContractCallOptions = {}
    ): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('executeBatch', [calls], options);

            logger.info('Batch transactions executed', { callCount: calls.length, txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to execute batch transactions', { callCount: calls.length, error });
            throw error;
        }
    }

    /**
     * Execute meta transaction
     */
    async executeMetaTx(
        from: Address,
        to: Address,
        value: bigint,
        data: `0x${string}`,
        fee: bigint,
        feeToken: Address,
        relayer: Address,
        nonce: bigint,
        signature: `0x${string}`,
        options: ContractCallOptions = {}
    ): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite(
                'executeMetaTx',
                [from, to, value, data, fee, feeToken, relayer, nonce, signature],
                options
            );

            logger.info('Meta transaction executed', { from, to, value: value.toString(), txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to execute meta transaction', { from, to, error });
            throw error;
        }
    }

    // ===========================================
    // ADMIN FUNCTIONS
    // ===========================================

    /**
     * Force revoke user permission (admin only)
     */
    async forceRevokeUserPermission(user: Address, options: ContractCallOptions = {}): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('forceRevokeUserPermission', [user], options);

            logger.info('User permission force revoked', { user, txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to force revoke user permission', { user, error });
            throw error;
        }
    }

    /**
     * Set whitelist token and minimum balance
     */
    async setWhitelist(token: Address, minBalance: bigint, options: ContractCallOptions = {}): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('setWhitelist', [token, minBalance], options);

            logger.info('Whitelist updated', { token, minBalance: minBalance.toString(), txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to set whitelist', { token, error });
            throw error;
        }
    }

    /**
     * Set default durations
     */
    async setDefaultDurations(
        defaultDur: bigint,
        minDur: bigint,
        maxDur: bigint,
        options: ContractCallOptions = {}
    ): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('setDefaultDurations', [defaultDur, minDur, maxDur], options);

            logger.info('Default durations updated', {
                default: defaultDur.toString(),
                min: minDur.toString(),
                max: maxDur.toString(),
                txHash,
            });

            return txHash;
        } catch (error) {
            logger.error('Failed to set default durations', error);
            throw error;
        }
    }

    /**
     * Set global rate limit
     */
    async setGlobalRateLimit(rateSeconds: bigint, options: ContractCallOptions = {}): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('setGlobalRateLimit', [rateSeconds], options);

            logger.info('Global rate limit updated', { rateSeconds: rateSeconds.toString(), txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to set global rate limit', error);
            throw error;
        }
    }

    /**
     * Set function-specific rate limit
     */
    async setFunctionRateLimit(
        selector: `0x${string}`,
        rateSeconds: bigint,
        options: ContractCallOptions = {}
    ): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('setFunctionRateLimit', [selector, rateSeconds], options);

            logger.info('Function rate limit updated', { selector, rateSeconds: rateSeconds.toString(), txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to set function rate limit', { selector, error });
            throw error;
        }
    }

    /**
     * Set Chainlink oracle
     */
    async setChainlinkOracle(newOracle: Address, options: ContractCallOptions = {}): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('setChainlinkOracle', [newOracle], options);

            logger.info('Chainlink oracle updated', { newOracle, txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to set Chainlink oracle', { newOracle, error });
            throw error;
        }
    }

    /**
     * Set ECDSA signer
     */
    async setECDSASigner(newSigner: Address, options: ContractCallOptions = {}): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('setECDSASigner', [newSigner], options);

            logger.info('ECDSA signer updated', { newSigner, txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to set ECDSA signer', { newSigner, error });
            throw error;
        }
    }

    /**
     * Set Gnosis Safe
     */
    async setGnosisSafe(newSafe: Address, options: ContractCallOptions = {}): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('setGnosisSafe', [newSafe], options);

            logger.info('Gnosis Safe updated', { newSafe, txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to set Gnosis Safe', { newSafe, error });
            throw error;
        }
    }

    /**
     * Set Entry Point
     */
    async setEntryPoint(newEntryPoint: Address, options: ContractCallOptions = {}): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('setEntryPoint', [newEntryPoint], options);

            logger.info('Entry Point updated', { newEntryPoint, txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to set Entry Point', { newEntryPoint, error });
            throw error;
        }
    }

    /**
     * Set max oracle delay
     */
    async setMaxOracleDelay(newDelay: bigint, options: ContractCallOptions = {}): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('setMaxOracleDelay', [newDelay], options);

            logger.info('Max oracle delay updated', { newDelay: newDelay.toString(), txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to set max oracle delay', error);
            throw error;
        }
    }

    /**
     * Grant role to address
     */
    async grantRole(role: `0x${string}`, account: Address, options: ContractCallOptions = {}): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('grantRole', [role, account], options);

            logger.info('Role granted', { role, account, txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to grant role', { role, account, error });
            throw error;
        }
    }

    /**
     * Revoke role from address
     */
    async revokeRole(role: `0x${string}`, account: Address, options: ContractCallOptions = {}): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const txHash = await this.executeContractWrite('revokeRole', [role, account], options);

            logger.info('Role revoked', { role, account, txHash });
            return txHash;
        } catch (error) {
            logger.error('Failed to revoke role', { role, account, error });
            throw error;
        }
    }

    // ===========================================
    // SIGNATURE VERIFICATION FUNCTIONS
    // ===========================================

    /**
     * Verify permission signature
     */
    async verifyPermissionSignature(
        withdrawalAddress: Address,
        allowEntireWallet: boolean,
        expiresAt: bigint,
        nonce: bigint,
        signature: `0x${string}`
    ): Promise<Address> {
        try {
            return await this.contract.read.verifyPermissionSignature([
                withdrawalAddress,
                allowEntireWallet,
                expiresAt,
                nonce,
                signature,
            ]);
        } catch (error) {
            logger.error('Failed to verify permission signature', error);
            throw error;
        }
    }

    /**
     * Verify session signature
     */
    async verifySessionSignature(
        user: Address,
        app: Address,
        expiresAt: bigint,
        nonce: bigint,
        signature: `0x${string}`
    ): Promise<Address> {
        try {
            return await this.contract.read.verifySessionSignature([user, app, expiresAt, nonce, signature]);
        } catch (error) {
            logger.error('Failed to verify session signature', error);
            throw error;
        }
    }

    /**
     * Verify delegation signature
     */
    async verifyDelegationSignature(
        delegator: Address,
        delegatee: Address,
        expiresAt: bigint,
        nonce: bigint,
        signature: `0x${string}`
    ): Promise<Address> {
        try {
            return await this.contract.read.verifyDelegationSignature([delegator, delegatee, expiresAt, nonce, signature]);
        } catch (error) {
            logger.error('Failed to verify delegation signature', error);
            throw error;
        }
    }

    /**
     * Verify meta transaction signature
     */
    async verifyMetaTxSignature(
        from: Address,
        to: Address,
        value: bigint,
        data: `0x${string}`,
        fee: bigint,
        feeToken: Address,
        relayer: Address,
        nonce: bigint,
        signature: `0x${string}`
    ): Promise<Address> {
        try {
            return await this.contract.read.verifyMetaTxSignature([
                from,
                to,
                value,
                data,
                fee,
                feeToken,
                relayer,
                nonce,
                signature,
            ]);
        } catch (error) {
            logger.error('Failed to verify meta tx signature', error);
            throw error;
        }
    }

    /**
     * Verify transfer authorization signature
     */
    async verifyTransferAuthSignature(
        owner: Address,
        spender: Address,
        amount: bigint,
        deadline: bigint,
        nonce: bigint,
        signature: `0x${string}`
    ): Promise<Address> {
        try {
            return await this.contract.read.verifyTransferAuthSignature([owner, spender, amount, deadline, nonce, signature]);
        } catch (error) {
            logger.error('Failed to verify transfer auth signature', error);
            throw error;
        }
    }

    // ===========================================
    // BATCH OPERATIONS
    // ===========================================

    /**
     * Execute multiple contract calls in a single transaction
     */
    async executeBatchContractCalls(
        calls: BatchContractCall[],
        options: ContractCallOptions = {}
    ): Promise<Hash[]> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        const txHashes: Hash[] = [];
        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Track batch in transaction service
            await transactionStatusTrackingService.createBatch(batchId, calls.length, options.userId);

            for (const call of calls) {
                const callOptions = { ...options, ...call.options };
                const txHash = await this.executeContractWrite(call.functionName, call.args, callOptions);
                txHashes.push(txHash);

                // Add transaction to batch
                await transactionStatusTrackingService.addTransactionToBatch(batchId, txHash);
            }

            logger.info('Batch contract calls executed', { batchId, count: calls.length, txHashes });
            return txHashes;
        } catch (error) {
            logger.error('Failed to execute batch contract calls', { batchId, error });
            throw error;
        }
    }

    // ===========================================
    // UTILITY FUNCTIONS
    // ===========================================

    /**
     * Estimate gas for a contract function call
     */
    async estimateGas(functionName: string, args: any[]): Promise<bigint> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        try {
            const gas = await this.publicClient.estimateContractGas({
                address: this.contractAddress,
                abi: wallyv1Abi,
                functionName,
                args,
                account: this.account,
            });

            return gas;
        } catch (error) {
            logger.error('Failed to estimate gas', { functionName, error });
            throw error;
        }
    }

    /**
     * Simulate a contract call (dry run)
     */
    async simulateContractCall(functionName: string, args: any[]): Promise<any> {
        try {
            const result = await this.publicClient.simulateContract({
                address: this.contractAddress,
                abi: wallyv1Abi,
                functionName,
                args,
                account: this.account,
            });

            return result.result;
        } catch (error) {
            logger.error('Failed to simulate contract call', { functionName, error });
            throw error;
        }
    }

    /**
     * Get contract events within a block range
     */
    async getContractEvents(
        eventName: string,
        fromBlock: bigint,
        toBlock: bigint = BigInt('latest'),
        userAddress?: Address
    ) {
        try {
            const eventAbi = wallyv1Abi.find((item: any) => item.type === 'event' && item.name === eventName);
            if (!eventAbi) {
                throw new Error(`Event ${eventName} not found in ABI`);
            } const logs = await this.publicClient.getLogs({
                address: this.contractAddress,
                event: eventAbi as any,
                fromBlock,
                toBlock,
                args: userAddress ? { user: userAddress } : undefined,
            });

            return logs;
        } catch (error) {
            logger.error('Failed to get contract events', { eventName, fromBlock, toBlock, error });
            throw error;
        }
    }
    /**
     * Execute a contract write function with full tracking and monitoring
     */
    private async executeContractWrite(
        functionName: string,
        args: any[],
        options: ContractCallOptions = {}
    ): Promise<Hash> {
        if (!this.walletClient) {
            throw new Error('Wallet client not initialized');
        }

        return contractErrorHandler.executeWithRetry(
            async () => {
                const startTime = Date.now();
                const { priority = 'medium', timeout = 30000, retryCount = 3, estimateGas = false, dryRun = false } = options;

                // Dry run simulation if requested
                if (dryRun) {
                    await this.simulateContractCall(functionName, args);
                    logger.info('Dry run successful', { functionName, args });
                    return '0x0' as Hash;
                }

                // Gas estimation if requested
                let gasLimit: bigint | undefined;
                if (estimateGas) {
                    gasLimit = await this.estimateGas(functionName, args);
                    logger.info('Gas estimated', { functionName, gasLimit: gasLimit.toString() });
                }

                // Execute the contract write using writeContract with proper parameters
                const txHash = await this.walletClient!.writeContract({
                    address: this.contractAddress,
                    abi: wallyv1Abi,
                    functionName,
                    args,
                    gas: gasLimit,
                    account: this.account,
                    chain: base,
                });

                // Track transaction
                await transactionStatusTrackingService.trackTransaction(
                    txHash,
                    options.userId,
                    'other',
                    priority,
                    {
                        type: 'contract_call',
                        functionName,
                        args,
                        contractAddress: this.contractAddress,
                        ...options.metadata,
                    }
                );

                // Trigger state sync after transaction
                if (options.userId) {
                    await contractStateSyncService.refreshUserState(options.userId);
                }

                const executionTime = Date.now() - startTime;
                logger.info('Contract write executed', {
                    functionName,
                    txHash,
                    executionTime,
                    priority,
                });

                return txHash;
            },
            {
                service: 'contractIntegration',
                functionName,
                args,
                priority: options.priority,
                userId: options.userId
            },
            {
                maxRetries: options.retryCount || 3,
                baseDelay: 2000,
                maxDelay: 30000
            }
        );
    }

    /**
     * Cache frequently accessed data
     */
    private async cacheData(key: string, data: any, ttl: number = 300): Promise<void> {
        try {
            await redisClient.setEx(key, ttl, JSON.stringify(data));
        } catch (error) {
            logger.warn('Failed to cache data', { key, error });
        }
    }

    /**
     * Get cached data
     */
    private async getCachedData(key: string): Promise<any | null> {
        try {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.warn('Failed to get cached data', { key, error });
            return null;
        }
    }    /**
     * Health check for the service
     */
    async healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: Record<string, any>;
    }> {
        const checks = {
            publicClient: false,
            walletClient: false,
            contract: false,
            latestBlock: null as string | null,
        };

        try {
            // Check public client
            const blockNumber = await this.publicClient.getBlockNumber();
            checks.latestBlock = blockNumber.toString();
            checks.publicClient = true;

            // Check wallet client
            if (this.walletClient) {
                checks.walletClient = true;
            }

            // Check contract
            await this.contract.read.owner();
            checks.contract = true;

            const healthyChecks = Object.values(checks).filter(Boolean).length;
            const totalChecks = Object.keys(checks).length;

            let status: 'healthy' | 'degraded' | 'unhealthy';
            if (healthyChecks === totalChecks) {
                status = 'healthy';
            } else if (healthyChecks >= totalChecks * 0.5) {
                status = 'degraded';
            } else {
                status = 'unhealthy';
            }

            return { status, details: checks };
        } catch (error) {
            logger.error('Health check failed', error);
            return {
                status: 'unhealthy',
                details: {
                    ...checks,
                    latestBlock: checks.latestBlock?.toString() || null,
                    error: error instanceof Error ? error.message : 'Unknown error'
                },
            };
        }
    }
}

// Export singleton instance
export const contractIntegrationService = new ContractIntegrationService();
export default contractIntegrationService;
