import { createPublicClient, createWalletClient, http, getContract } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import wallyv1Abi from '../abis/wallyv1.json' with { type: 'json' };
import redisClient from '../db/redisClient.js';
import logger from '../infra/mon/logger.js';

const wallyv1Address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const rpcUrl = process.env.RPC_URL_1 || process.env.NEXT_PUBLIC_RPC_URL_1 || process.env.RPC_URL || '';
const privateKey = process.env.PRIVATE_KEY as `0x${string}`;

if (!wallyv1Address) throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS is not set');
if (!rpcUrl) throw new Error('RPC_URL is not set');

logger.info('Contract initialization', {
    address: wallyv1Address,
    rpcUrl: rpcUrl.substring(0, 20) + '...',
    hasPrivateKey: !!privateKey
});

// Initialize clients
const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
});

const walletClient = privateKey ? createWalletClient({
    chain: base,
    transport: http(rpcUrl),
    account: privateKeyToAccount(privateKey),
}) : undefined;

// Create contract instance with proper client configuration
const contract = getContract({
    address: wallyv1Address,
    abi: wallyv1Abi,
    client: publicClient,
});

// Create separate write contract if wallet client exists
const writeContract = walletClient ? getContract({
    address: wallyv1Address,
    abi: wallyv1Abi,
    client: walletClient,
}) : undefined;

logger.info('Contract client initialized', {
    address: wallyv1Address,
    hasPublicClient: !!publicClient,
    hasWalletClient: !!walletClient
});

export interface UserPermissionState {
    withdrawalAddress: string;
    allowEntireWallet: boolean;
    expiresAt: number;
    isActive: boolean;
    tokenList: string[];
    minBalances: string[];
    limits: string[];
    lastUpdated: number;
}

export interface MiniAppSessionState {
    delegate: string;
    expiresAt: number;
    allowedTokens: string[];
    allowWholeWallet: boolean;
    active: boolean;
    lastUpdated: number;
}

export interface ContractState {
    owner: string;
    paused: boolean;
    globalRateLimit: number;
    defaultDuration: number;
    minDuration: number;
    maxDuration: number;
    whitelistToken: string;
    minWhitelistBalance: string;
    chainlinkOracle: string;
    useChainlink: boolean;
    lastUpdated: number;
}

class ContractStateSyncService {
    private syncInterval: NodeJS.Timeout | null = null;
    private readonly SYNC_INTERVAL = 30 * 1000; // 30 seconds
    private readonly STATE_TTL = 5 * 60; // 5 minutes

    /**
     * Start contract state synchronization
     */
    async startSync(): Promise<void> {
        if (this.syncInterval) {
            logger.warn('Contract state sync already running');
            return;
        }

        logger.info('Starting contract state synchronization');

        // Initial sync
        await this.syncContractState();

        // Set up interval
        this.syncInterval = setInterval(async () => {
            try {
                await this.syncContractState();
            } catch (error) {
                logger.error('Contract state sync error:', error);
            }
        }, this.SYNC_INTERVAL);
    }

    /**
     * Stop contract state synchronization
     */
    stopSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            logger.info('Contract state synchronization stopped');
        }
    }

    /**
     * Sync all contract state data
     * Integrated contract session functionality directly for efficiency
     */
    async syncContractState(): Promise<void> {
        try {
            // Sync global contract state
            const contractState = await this.getContractState();
            await this.cacheContractState(contractState);

            // Sync active sessions and permissions
            await this.syncActivePermissions();
            await this.syncActiveSessions();

            // Sync contract session data directly (replacing separate service call)
            await this.syncContractSessions();

            logger.debug('Contract state synchronized successfully');
        } catch (error) {
            logger.error('Failed to sync contract state:', error);
            throw error;
        }
    }

    /**
     * Get current contract state
     */
    async getContractState(): Promise<ContractState> {
        try {
            logger.debug('Fetching contract state from blockchain', {
                address: wallyv1Address,
                hasContract: !!contract
            });

            const [
                owner,
                paused,
                globalRateLimit,
                defaultDuration,
                minDuration,
                maxDuration,
                whitelistToken,
                minWhitelistBalance,
                chainlinkOracle,
                useChainlink
            ] = await Promise.all([
                publicClient.readContract({
                    address: wallyv1Address,
                    abi: wallyv1Abi,
                    functionName: 'owner',
                }),
                publicClient.readContract({
                    address: wallyv1Address,
                    abi: wallyv1Abi,
                    functionName: 'paused',
                }),
                publicClient.readContract({
                    address: wallyv1Address,
                    abi: wallyv1Abi,
                    functionName: 'globalRateLimit',
                }),
                publicClient.readContract({
                    address: wallyv1Address,
                    abi: wallyv1Abi,
                    functionName: 'defaultDuration',
                }),
                publicClient.readContract({
                    address: wallyv1Address,
                    abi: wallyv1Abi,
                    functionName: 'minDuration',
                }),
                publicClient.readContract({
                    address: wallyv1Address,
                    abi: wallyv1Abi,
                    functionName: 'maxDuration',
                }),
                publicClient.readContract({
                    address: wallyv1Address,
                    abi: wallyv1Abi,
                    functionName: 'whitelistToken',
                }),
                publicClient.readContract({
                    address: wallyv1Address,
                    abi: wallyv1Abi,
                    functionName: 'minWhitelistBalance',
                }),
                publicClient.readContract({
                    address: wallyv1Address,
                    abi: wallyv1Abi,
                    functionName: 'chainlinkOracle',
                }),
                publicClient.readContract({
                    address: wallyv1Address,
                    abi: wallyv1Abi,
                    functionName: 'useChainlink',
                })
            ]);

            return {
                owner: owner as string,
                paused: paused as boolean,
                globalRateLimit: Number(globalRateLimit),
                defaultDuration: Number(defaultDuration),
                minDuration: Number(minDuration),
                maxDuration: Number(maxDuration),
                whitelistToken: whitelistToken as string,
                minWhitelistBalance: (minWhitelistBalance as bigint).toString(),
                chainlinkOracle: chainlinkOracle as string,
                useChainlink: useChainlink as boolean,
                lastUpdated: Date.now()
            };
        } catch (error) {
            logger.error('Failed to get contract state:', error);
            throw error;
        }
    }

    /**
     * Get user permission state from contract
     */
    async getUserPermission(userAddress: string): Promise<UserPermissionState | null> {
        try {
            const permission = await publicClient.readContract({
                address: wallyv1Address,
                abi: wallyv1Abi,
                functionName: 'getUserPermission',
                args: [userAddress as `0x${string}`],
            });

            // Fix array access with proper typing
            const permissionArray = permission as any[];
            if (!permission || !permissionArray[3]) { // isActive is false
                return null;
            }

            const permissionData = {
                withdrawalAddress: permissionArray[0] as string,
                allowEntireWallet: permissionArray[1] as boolean,
                expiresAt: Number(permissionArray[2]),
                isActive: permissionArray[3] as boolean,
                tokenList: permissionArray[4] as string[],
                minBalances: (permissionArray[5] as bigint[]).map(b => b.toString()),
                limits: (permissionArray[6] as bigint[]).map(l => l.toString()),
            };

            return {
                ...permissionData,
                lastUpdated: Date.now()
            };
        } catch (error) {
            logger.error(`Failed to get user permission for ${userAddress}:`, error);
            return null;
        }
    }

    /**
     * Get mini app session state from contract
     */
    async getMiniAppSession(userAddress: string): Promise<MiniAppSessionState | null> {
        try {
            const session = await publicClient.readContract({
                address: wallyv1Address,
                abi: wallyv1Abi,
                functionName: 'getMiniAppSession',
                args: [userAddress as `0x${string}`],
            });

            // Fix session array access
            const sessionArray = session as any[];
            if (!session || !sessionArray[4]) { // active is false
                return null;
            }

            const sessionData = {
                delegate: sessionArray[0] as string,
                expiresAt: Number(sessionArray[1]),
                allowedTokens: sessionArray[2] as string[],
                allowWholeWallet: sessionArray[3] as boolean,
                active: sessionArray[4] as boolean,
            };

            return {
                ...sessionData,
                lastUpdated: Date.now()
            };
        } catch (error) {
            logger.error(`Failed to get mini app session for ${userAddress}:`, error);
            return null;
        }
    }

    /**
     * Sync active permissions from contract to cache
     */
    private async syncActivePermissions(): Promise<void> {
        try {
            // Get all known users from events or session cache
            const userKeys = await redisClient.keys('userEvents:*');
            const sessionKeys = await redisClient.keys('session:*');

            // Extract unique user addresses from both sources
            const users = new Set<string>();

            // Add users from event keys
            userKeys.forEach(key => {
                const address = key.replace('userEvents:', '');
                if (address && address.startsWith('0x')) {
                    users.add(address);
                }
            });

            // Add users from session data
            for (const sessionKey of sessionKeys) {
                try {
                    const sessionData = await redisClient.get(sessionKey);
                    if (sessionData) {
                        const session = JSON.parse(sessionData);
                        if (session.userAddress && session.userAddress.startsWith('0x')) {
                            users.add(session.userAddress);
                        }
                    }
                } catch (error) {
                    logger.debug(`Failed to parse session data for key ${sessionKey}:`, error);
                }
            }

            // Process each unique user
            for (const userAddress of users) {
                try {
                    const permission = await this.getUserPermission(userAddress);
                    if (permission) {
                        await this.cacheUserPermission(userAddress, permission);
                    } else {
                        await this.clearUserPermissionCache(userAddress);
                    }
                } catch (error) {
                    logger.error(`Failed to sync permission for user ${userAddress}:`, error);
                }
            }

            logger.debug(`Synced permissions for ${users.size} users`);
        } catch (error) {
            logger.error('Failed to sync active permissions:', error);
        }
    }

    /**
     * Sync active sessions from contract to cache
     */
    private async syncActiveSessions(): Promise<void> {
        try {
            // Get all known users from events or session cache
            const userKeys = await redisClient.keys('userEvents:*');
            const sessionKeys = await redisClient.keys('session:*');

            // Extract unique user addresses from both sources
            const users = new Set<string>();

            // Add users from event keys
            userKeys.forEach(key => {
                const address = key.replace('userEvents:', '');
                if (address && address.startsWith('0x')) {
                    users.add(address);
                }
            });

            // Add users from session data
            for (const sessionKey of sessionKeys) {
                try {
                    const sessionData = await redisClient.get(sessionKey);
                    if (sessionData) {
                        const session = JSON.parse(sessionData);
                        if (session.userAddress && session.userAddress.startsWith('0x')) {
                            users.add(session.userAddress);
                        }
                    }
                } catch (error) {
                    logger.debug(`Failed to parse session data for key ${sessionKey}:`, error);
                }
            }

            // Process each unique user
            for (const userAddress of users) {
                try {
                    const session = await this.getMiniAppSession(userAddress);
                    if (session) {
                        await this.cacheMiniAppSession(userAddress, session);
                    } else {
                        await this.clearMiniAppSessionCache(userAddress);
                    }
                } catch (error) {
                    logger.error(`Failed to sync session for user ${userAddress}:`, error);
                }
            }

            logger.debug(`Synced sessions for ${users.size} users`);
        } catch (error) {
            logger.error('Failed to sync active sessions:', error);
        }
    }

    /**
     * Sync contract sessions directly - integrated from contractSessionService
     * This eliminates the external dependency and improves performance
     */
    private async syncContractSessions(): Promise<void> {
        try {
            // Get all active contract sessions from the blockchain
            const sessionKeys = await redisClient.keys('session:*');
            const contractSessions = new Set<string>();

            for (const sessionKey of sessionKeys) {
                try {
                    const sessionData = await redisClient.get(sessionKey);
                    if (sessionData) {
                        const session = JSON.parse(sessionData);
                        if (session.type === 'contract' && session.contractAddress) {
                            contractSessions.add(session.contractAddress);
                        }
                    }
                } catch (error) {
                    logger.debug(`Failed to parse contract session data for key ${sessionKey}:`, error);
                }
            }

            // Process each contract session
            for (const contractAddress of contractSessions) {
                try {
                    await this.syncContractSessionState(contractAddress);
                } catch (error) {
                    logger.error(`Failed to sync contract session for ${contractAddress}:`, error);
                }
            }

            logger.debug(`Synced ${contractSessions.size} contract sessions`);
        } catch (error) {
            logger.error('Failed to sync contract sessions:', error);
        }
    }

    /**
     * Sync individual contract session state
     */
    private async syncContractSessionState(contractAddress: string): Promise<void> {
        try {
            // Use our contract client to check session state on this specific contract
            const sessionState = await this.getContractSessionState(contractAddress);

            if (sessionState) {
                await redisClient.setEx(
                    `contractSession:${contractAddress}`,
                    this.STATE_TTL,
                    JSON.stringify(sessionState)
                );
            }
        } catch (error) {
            logger.error(`Failed to sync contract session state for ${contractAddress}:`, error);
        }
    }

    /**
     * Get contract session state from blockchain
     */
    private async getContractSessionState(contractAddress: string): Promise<any | null> {
        try {
            // Check if this contract has active sessions with our main contract
            const hasActiveSession = await publicClient.readContract({
                address: wallyv1Address,
                abi: wallyv1Abi,
                functionName: 'hasActiveSession',
                args: [contractAddress as `0x${string}`],
            });

            if (!hasActiveSession) {
                return null;
            }

            // Get session details if active
            const sessionDetails = await publicClient.readContract({
                address: wallyv1Address,
                abi: wallyv1Abi,
                functionName: 'getContractSession',
                args: [contractAddress as `0x${string}`],
            });

            return {
                contractAddress,
                isActive: hasActiveSession,
                details: sessionDetails,
                lastUpdated: Date.now()
            };
        } catch (error) {
            logger.debug(`No active session found for contract ${contractAddress}:`, error);
            return null;
        }
    }

    /**
     * Create a new contract session (integrated functionality)
     */
    async createContractSession(
        userAddress: string,
        contractAddress: string,
        permissions: any[]
    ): Promise<string> {
        try {
            if (!walletClient || !writeContract) {
                throw new Error('Wallet client not initialized - cannot create contract sessions');
            }

            // Create session on blockchain using our contract
            const sessionId = `cs_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

            // Store session data in Redis
            const sessionData = {
                sessionId,
                userAddress,
                contractAddress,
                permissions,
                createdAt: Date.now(),
                expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
                type: 'contract'
            };

            await redisClient.setEx(
                `contractSession:${sessionId}`,
                this.STATE_TTL,
                JSON.stringify(sessionData)
            );

            logger.info(`Created contract session: ${sessionId}`);
            return sessionId;
        } catch (error) {
            logger.error('Failed to create contract session:', error);
            throw error;
        }
    }

    /**
     * Cache contract state in Redis
     */
    private async cacheContractState(state: ContractState): Promise<void> {
        try {
            await redisClient.setEx('contractState', this.STATE_TTL, JSON.stringify(state));
        } catch (error) {
            logger.error('Failed to cache contract state:', error);
        }
    }

    /**
     * Cache user permission in Redis
     */
    private async cacheUserPermission(userAddress: string, permission: UserPermissionState): Promise<void> {
        try {
            await redisClient.setEx(`userPermission:${userAddress}`, this.STATE_TTL, JSON.stringify(permission));
        } catch (error) {
            logger.error(`Failed to cache user permission for ${userAddress}:`, error);
        }
    }

    /**
     * Cache mini app session in Redis
     */
    private async cacheMiniAppSession(userAddress: string, session: MiniAppSessionState): Promise<void> {
        try {
            await redisClient.setEx(`miniAppSession:${userAddress}`, this.STATE_TTL, JSON.stringify(session));
        } catch (error) {
            logger.error(`Failed to cache mini app session for ${userAddress}:`, error);
        }
    }

    /**
     * Clear user permission cache
     */
    private async clearUserPermissionCache(userAddress: string): Promise<void> {
        try {
            await redisClient.del(`userPermission:${userAddress}`);
        } catch (error) {
            logger.error(`Failed to clear user permission cache for ${userAddress}:`, error);
        }
    }

    /**
     * Clear mini app session cache
     */
    private async clearMiniAppSessionCache(userAddress: string): Promise<void> {
        try {
            await redisClient.del(`miniAppSession:${userAddress}`);
        } catch (error) {
            logger.error(`Failed to clear mini app session cache for ${userAddress}:`, error);
        }
    }

    /**
     * Get cached contract state from Redis
     */
    async getCachedContractState(): Promise<ContractState | null> {
        try {
            const cached = await redisClient.get('contractState');
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            logger.error('Failed to get cached contract state:', error);
            return null;
        }
    }

    /**
     * Get cached user permission from Redis
     */
    async getCachedUserPermission(userAddress: string): Promise<UserPermissionState | null> {
        try {
            const cached = await redisClient.get(`userPermission:${userAddress}`);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            logger.error(`Failed to get cached user permission for ${userAddress}:`, error);
            return null;
        }
    }

    /**
     * Get cached mini app session from Redis
     */
    async getCachedMiniAppSession(userAddress: string): Promise<MiniAppSessionState | null> {
        try {
            const cached = await redisClient.get(`miniAppSession:${userAddress}`);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            logger.error(`Failed to get cached mini app session for ${userAddress}:`, error);
            return null;
        }
    }

    /**
     * Force refresh user state from contract
     */
    async refreshUserState(userAddress: string): Promise<{
        permission: UserPermissionState | null;
        session: MiniAppSessionState | null;
    }> {
        const [permission, session] = await Promise.all([
            this.getUserPermission(userAddress),
            this.getMiniAppSession(userAddress)
        ]);

        if (permission) {
            await this.cacheUserPermission(userAddress, permission);
        } else {
            await this.clearUserPermissionCache(userAddress);
        }

        if (session) {
            await this.cacheMiniAppSession(userAddress, session);
        } else {
            await this.clearMiniAppSessionCache(userAddress);
        }

        return { permission, session };
    }

    /**
     * Check if service is running
     */
    isRunning(): boolean {
        return this.syncInterval !== null;
    }
}

export const contractStateSyncService = new ContractStateSyncService();
export default contractStateSyncService;
