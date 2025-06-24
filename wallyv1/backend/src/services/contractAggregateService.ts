import redisClient from '../db/redisClient.js';
import logger from '../infra/mon/logger.js';
import { contractStateSyncService } from './contractStateSyncService.js';
import { enhancedEventMonitoringService } from './enhancedEventMonitoringService.js';

// Enhanced ContractState interface that matches frontend expectations
export interface EnhancedContractState {
    // Frontend expected fields
    isActive: boolean;
    isPaused: boolean;
    totalUsers: bigint;
    totalPermissions: bigint;
    totalSessions: bigint;
    oracleTimestamp: bigint;
    lastUpdated: number;

    // Additional backend fields (optional for frontend)
    owner?: string;
    defaultDuration?: bigint;
    minDuration?: bigint;
    maxDuration?: bigint;
    globalRateLimit?: bigint;
    whitelistToken?: string;
    minWhitelistBalance?: bigint;
    chainlinkOracle?: string;
    useChainlink?: boolean;
    maxOracleDelay?: bigint;
    ecdsaSigner?: string;
    gnosisSafe?: string;
    entryPoint?: string;
}

export interface AggregateStats {
    totalUsers: number;
    totalPermissions: number;
    totalSessions: number;
    activeUsers: number;
    activePermissions: number;
    activeSessions: number;
    lastCalculated: number;
}

class ContractAggregateService {
    private readonly CACHE_TTL = 5 * 60; // 5 minutes
    private readonly STATS_KEY = 'contract:aggregate:stats';
    private updateInterval: NodeJS.Timeout | null = null;

    /**
     * Start aggregate stats calculation service
     */
    async startAggregateUpdates(): Promise<void> {
        if (this.updateInterval) {
            logger.warn('Aggregate updates already running');
            return;
        }

        logger.info('Starting contract aggregate stats updates');

        // Initial calculation
        await this.calculateAggregateStats();

        // Set up interval for updates every 2 minutes
        this.updateInterval = setInterval(async () => {
            try {
                await this.calculateAggregateStats();
            } catch (error) {
                logger.error('Aggregate stats calculation error:', error);
            }
        }, 2 * 60 * 1000); // 2 minutes
    }

    /**
     * Stop aggregate stats updates
     */
    stopAggregateUpdates(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            logger.info('Contract aggregate stats updates stopped');
        }
    }

    /**
     * Calculate aggregate statistics from Redis cache
     */
    async calculateAggregateStats(): Promise<AggregateStats> {
        try {
            // Get all user permission keys
            const permissionKeys = await redisClient.keys('userPermission:*');

            // Get all mini app session keys
            const sessionKeys = await redisClient.keys('miniAppSession:*');

            // Get all user event keys to count total users
            const userEventKeys = await redisClient.keys('userEvents:*');

            // Count active permissions and sessions
            let activePermissions = 0;
            let activeSessions = 0;

            // Check active permissions
            for (const key of permissionKeys) {
                try {
                    const permissionData = await redisClient.get(key);
                    if (permissionData) {
                        const permission = JSON.parse(permissionData);
                        if (permission.isActive && permission.expiresAt > Date.now() / 1000) {
                            activePermissions++;
                        }
                    }
                } catch (error) {
                    logger.error(`Error processing permission key ${key}:`, error);
                }
            }

            // Check active sessions
            for (const key of sessionKeys) {
                try {
                    const sessionData = await redisClient.get(key);
                    if (sessionData) {
                        const session = JSON.parse(sessionData);
                        if (session.active && session.expiresAt > Date.now() / 1000) {
                            activeSessions++;
                        }
                    }
                } catch (error) {
                    logger.error(`Error processing session key ${key}:`, error);
                }
            }

            const stats: AggregateStats = {
                totalUsers: userEventKeys.length,
                totalPermissions: permissionKeys.length,
                totalSessions: sessionKeys.length,
                activeUsers: Math.max(activePermissions, activeSessions), // Users with active permissions or sessions
                activePermissions,
                activeSessions,
                lastCalculated: Date.now()
            };

            // Cache the stats
            await this.cacheAggregateStats(stats);

            logger.debug('Aggregate stats calculated:', stats);
            return stats;

        } catch (error) {
            logger.error('Failed to calculate aggregate stats:', error);
            throw error;
        }
    }

    /**
     * Get enhanced contract state that matches frontend expectations
     */
    async getEnhancedContractState(): Promise<EnhancedContractState> {
        try {
            // Get base contract state from sync service
            const baseState = await contractStateSyncService.getCachedContractState();

            // Get aggregate stats
            const stats = await this.getCachedAggregateStats();

            if (!baseState) {
                throw new Error('Base contract state not available');
            }

            // Get oracle timestamp (if available)
            let oracleTimestamp = BigInt(0);
            try {
                const oracleData = await redisClient.get('oracle:timestamp');
                if (oracleData) {
                    oracleTimestamp = BigInt(JSON.parse(oracleData).timestamp || 0);
                }
            } catch (error) {
                logger.debug('Oracle timestamp not available:', error);
            }

            const enhancedState: EnhancedContractState = {
                // Frontend expected fields
                isActive: !baseState.paused,
                isPaused: baseState.paused,
                totalUsers: BigInt(stats?.totalUsers || 0),
                totalPermissions: BigInt(stats?.totalPermissions || 0),
                totalSessions: BigInt(stats?.totalSessions || 0),
                oracleTimestamp,
                lastUpdated: baseState.lastUpdated,

                // Additional backend fields
                owner: baseState.owner,
                defaultDuration: BigInt(baseState.defaultDuration),
                minDuration: BigInt(baseState.minDuration),
                maxDuration: BigInt(baseState.maxDuration),
                globalRateLimit: BigInt(baseState.globalRateLimit),
                whitelistToken: baseState.whitelistToken,
                minWhitelistBalance: BigInt(baseState.minWhitelistBalance),
                chainlinkOracle: baseState.chainlinkOracle,
                useChainlink: baseState.useChainlink,
            };

            return enhancedState;

        } catch (error) {
            logger.error('Failed to get enhanced contract state:', error);
            throw error;
        }
    }

    /**
     * Cache aggregate stats
     */
    private async cacheAggregateStats(stats: AggregateStats): Promise<void> {
        try {
            await redisClient.setEx(this.STATS_KEY, this.CACHE_TTL, JSON.stringify(stats));
        } catch (error) {
            logger.error('Failed to cache aggregate stats:', error);
        }
    }

    /**
     * Get cached aggregate stats
     */
    async getCachedAggregateStats(): Promise<AggregateStats | null> {
        try {
            const cached = await redisClient.get(this.STATS_KEY);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            logger.error('Failed to get cached aggregate stats:', error);
            return null;
        }
    }

    /**
     * Force refresh of aggregate stats
     */
    async refreshAggregateStats(): Promise<AggregateStats> {
        return await this.calculateAggregateStats();
    }

    /**
     * Get detailed user statistics
     */
    async getUserStatistics(): Promise<{
        totalUsers: number;
        usersWithPermissions: number;
        usersWithSessions: number;
        usersWithBoth: number;
        activeUsers: number;
    }> {
        try {
            const userEventKeys = await redisClient.keys('userEvents:*');
            const users = userEventKeys.map(key => key.replace('userEvents:', ''));

            let usersWithPermissions = 0;
            let usersWithSessions = 0;
            let usersWithBoth = 0;
            let activeUsers = 0;

            for (const userAddress of users) {
                const hasPermission = await redisClient.exists(`userPermission:${userAddress}`);
                const hasSession = await redisClient.exists(`miniAppSession:${userAddress}`);

                if (hasPermission) usersWithPermissions++;
                if (hasSession) usersWithSessions++;
                if (hasPermission && hasSession) usersWithBoth++;

                // Check if user is active (has active permission or session)
                if (hasPermission || hasSession) {
                    try {
                        let isActive = false;

                        if (hasPermission) {
                            const permissionData = await redisClient.get(`userPermission:${userAddress}`);
                            if (permissionData) {
                                const permission = JSON.parse(permissionData);
                                if (permission.isActive && permission.expiresAt > Date.now() / 1000) {
                                    isActive = true;
                                }
                            }
                        }

                        if (!isActive && hasSession) {
                            const sessionData = await redisClient.get(`miniAppSession:${userAddress}`);
                            if (sessionData) {
                                const session = JSON.parse(sessionData);
                                if (session.active && session.expiresAt > Date.now() / 1000) {
                                    isActive = true;
                                }
                            }
                        }

                        if (isActive) activeUsers++;

                    } catch (error) {
                        logger.error(`Error checking user activity for ${userAddress}:`, error);
                    }
                }
            }

            return {
                totalUsers: users.length,
                usersWithPermissions,
                usersWithSessions,
                usersWithBoth,
                activeUsers
            };

        } catch (error) {
            logger.error('Failed to get user statistics:', error);
            throw error;
        }
    }

    /**
     * Check if service is running
     */
    isRunning(): boolean {
        return this.updateInterval !== null;
    }
}

export const contractAggregateService = new ContractAggregateService();
export default contractAggregateService;
