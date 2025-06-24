import { createPublicClient, http, parseAbiItem, decodeEventLog, getContract } from 'viem';
import { base } from 'viem/chains';
import wallyv1Abi from '../abis/wallyv1.json' with { type: 'json' };
import { getNextRpcUrl } from '../utils/rpcProvider.js';
import { contractStateSyncService } from './contractStateSyncService.js';
import { contractSessionService } from './contractSessionService.js';
import { notificationService } from './notificationService.js';
import redisClient from '../db/redisClient.js';
import logger from '../infra/mon/logger.js';

const wallyv1Address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

if (!wallyv1Address) throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS is not set');

export interface EnhancedContractEvent {
    event: string;
    eventType: 'transfer' | 'permission' | 'session' | 'admin' | 'oracle' | 'security';
    user?: string;
    admin?: string;
    token?: string;
    amount?: string;
    destination?: string;
    delegate?: string;
    withdrawalAddress?: string;
    allowEntireWallet?: boolean;
    expiresAt?: string;
    tokenList?: string[];
    minBalances?: string[];
    limits?: string[];
    action?: string;
    newValue?: string;
    previousValue?: string;
    role?: string;
    account?: string;
    oracle?: string;
    minBalance?: string;
    rateSeconds?: string;
    selector?: string;
    transactionHash: string;
    blockNumber?: bigint;
    blockTimestamp?: number;
    logIndex?: number;
    createdAt: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    processed: boolean;
}

export interface EventStats {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    recentActivity: number;
    errorCount: number;
    lastProcessed: number;
}

class EnhancedEventMonitoringService {
    private isListening = false;
    private pollingInterval: NodeJS.Timeout | null = null;
    private eventStats: EventStats = {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: { low: 0, medium: 0, high: 0, critical: 0 },
        recentActivity: 0,
        errorCount: 0,
        lastProcessed: 0,
    };
    private lastProcessedBlock: bigint = BigInt(0);

    /**
     * Start enhanced event monitoring using polling
     */
    async startEnhancedMonitoring(): Promise<void> {
        if (this.isListening) {
            logger.warn('Enhanced event monitoring already running');
            return;
        }

        logger.info('Starting enhanced contract event monitoring');

        try {
            // Get initial block to start monitoring from
            const rpcUrl = getNextRpcUrl();
            const client = createPublicClient({
                chain: base,
                transport: http(rpcUrl),
            });

            this.lastProcessedBlock = await client.getBlockNumber();

            // Start polling for events
            this.startEventPolling();

            this.isListening = true;
            logger.info('✅ Enhanced event monitoring started with polling');

            // Start periodic stats update
            setInterval(() => this.updateEventStats(), 60000);
        } catch (error) {
            logger.error('Failed to start enhanced event monitoring:', error);
            throw error;
        }
    }

    /**
     * Start polling for contract events
     */
    private startEventPolling(): void {
        this.pollingInterval = setInterval(async () => {
            try {
                await this.pollForEvents();
            } catch (error) {
                logger.error('Error polling for events:', error);
                this.eventStats.errorCount++;
            }
        }, 5000);
    }

    /**
     * Poll for new events since last processed block
     */
    private async pollForEvents(): Promise<void> {
        try {
            const rpcUrl = getNextRpcUrl();
            const client = createPublicClient({
                chain: base,
                transport: http(rpcUrl),
            });

            const currentBlock = await client.getBlockNumber();

            if (currentBlock <= this.lastProcessedBlock) {
                return;
            }

            const eventNames = [
                'TransferPerformed',
                'PermissionGranted',
                'PermissionGrantedBySig',
                'PermissionUpdated',
                'PermissionRevoked',
                'PermissionForceRevoked',
                'MiniAppSessionGranted',
                'MiniAppSessionRevoked',
                'MiniAppSessionAction',
                'RoleGranted',
                'RoleRevoked',
                'OwnershipTransferred',
                'OwnerChanged',
                'Paused',
                'Unpaused',
                'Upgraded',
                'TokenStopped',
                'TokenRemoved',
                'ChainlinkOracleChanged',
                'WhitelistChanged',
                'OracleFallbackUsed',
                'EntryPointChanged',
                'GnosisSafeChanged',
            ];

            for (const eventName of eventNames) {
                try {
                    const eventAbi = wallyv1Abi.find((item: any) =>
                        item.type === 'event' && item.name === eventName
                    );

                    if (!eventAbi) continue;

                    const logs = await client.getLogs({
                        address: wallyv1Address,
                        event: eventAbi as any,
                        fromBlock: this.lastProcessedBlock + BigInt(1),
                        toBlock: currentBlock,
                    });

                    for (const log of logs) {
                        await this.processEventLog(log, eventName);
                    }
                } catch (eventError) {
                    logger.debug(`Error processing ${eventName} events:`, eventError);
                }
            }

            this.lastProcessedBlock = currentBlock;
        } catch (error) {
            logger.error('Failed to poll for events:', error);
        }
    }

    /**
     * Process a single event log
     */
    private async processEventLog(log: any, eventName: string): Promise<void> {
        try {
            const mockLog = {
                address: log.address,
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
                logIndex: log.logIndex,
                eventName,
                args: log.args,
                removed: false,
            };

            await this.handleEvent(mockLog);
        } catch (error) {
            logger.error(`Failed to process event log for ${eventName}:`, error);
        }
    }

    /**
     * Stop all event monitoring
     */
    stopEnhancedMonitoring(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isListening = false;
        logger.info('Enhanced event monitoring stopped');
    }

    /**
     * Generic event handler that routes to specific handlers
     */
    private async handleEvent(log: {
        address: `0x${string}`;
        blockNumber: bigint;
        transactionHash: `0x${string}`;
        logIndex: number;
        eventName: string;
        args: any;
        removed: boolean;
    }): Promise<void> {
        const eventName = log.eventName;

        try {
            // Route to appropriate specific handler based on event type
            if (eventName === 'TransferPerformed') {
                await this.handleTransferPerformed(log);
            } else if (['PermissionGranted', 'PermissionUpdated', 'PermissionRevoked', 'PermissionForceRevoked', 'PermissionGrantedBySig'].includes(eventName)) {
                await this.handlePermissionEvent(eventName, log);
            } else if (['MiniAppSessionGranted', 'MiniAppSessionRevoked', 'MiniAppSessionAction'].includes(eventName)) {
                await this.handleSessionEvent(eventName, log);
            } else if (['RoleGranted', 'RoleRevoked', 'OwnershipTransferred', 'OwnerChanged', 'Paused', 'Unpaused', 'Upgraded'].includes(eventName)) {
                await this.handleAdminEvent(eventName, log);
            } else if (['TokenStopped', 'TokenRemoved'].includes(eventName)) {
                await this.handleSecurityEvent(eventName, log);
            } else if (['ChainlinkOracleChanged', 'WhitelistChanged', 'OracleFallbackUsed', 'EntryPointChanged', 'GnosisSafeChanged'].includes(eventName)) {
                await this.handleOracleEvent(eventName, log);
            } else {
                logger.warn(`Unknown event type: ${eventName}`);
            }
        } catch (error) {
            logger.error(`Failed to handle event ${eventName}:`, error);
        }
    }

    /**
     * Handle transfer events
     */
    private async handleTransferPerformed(log: any): Promise<void> {
        const { args, transactionHash, blockNumber, logIndex } = log;
        if (!args) return;

        const event: EnhancedContractEvent = {
            event: 'TransferPerformed',
            eventType: 'transfer',
            user: args.user,
            token: args.token,
            amount: args.amount?.toString(),
            destination: args.destination,
            transactionHash: transactionHash || '',
            blockNumber,
            logIndex,
            blockTimestamp: Date.now(),
            createdAt: Date.now(),
            severity: 'medium',
            processed: false,
        };

        await this.storeEnhancedEvent(event);
        await this.processTransferEvent(event);
    }

    /**
     * Handle permission events
     */
    private async handlePermissionEvent(eventName: string, log: any): Promise<void> {
        const { args, transactionHash, blockNumber, logIndex } = log;
        if (!args) return;

        const severity = eventName.includes('Force') ? 'critical' :
            eventName.includes('Revoked') ? 'high' : 'medium';

        const event: EnhancedContractEvent = {
            event: eventName,
            eventType: 'permission',
            user: args.user,
            admin: args.admin,
            withdrawalAddress: args.withdrawalAddress,
            allowEntireWallet: args.allowEntireWallet,
            expiresAt: args.expiresAt?.toString(),
            tokenList: args.tokenList,
            minBalances: args.minBalances?.map((b: bigint) => b.toString()),
            limits: args.limits?.map((l: bigint) => l.toString()),
            action: args.action,
            transactionHash: transactionHash || '',
            blockNumber,
            logIndex,
            blockTimestamp: Date.now(),
            createdAt: Date.now(),
            severity,
            processed: false,
        };

        await this.storeEnhancedEvent(event);
        await this.processPermissionEvent(event);
    }

    /**
     * Handle session events
     */
    private async handleSessionEvent(eventName: string, log: any): Promise<void> {
        const { args, transactionHash, blockNumber, logIndex } = log;
        if (!args) return;

        const event: EnhancedContractEvent = {
            event: eventName,
            eventType: 'session',
            user: args.user,
            delegate: args.delegate,
            expiresAt: args.expiresAt?.toString(),
            tokenList: args.tokens,
            allowEntireWallet: args.allowWholeWallet,
            action: args.action,
            transactionHash: transactionHash || '',
            blockNumber,
            logIndex,
            blockTimestamp: Date.now(),
            createdAt: Date.now(),
            severity: 'medium',
            processed: false,
        };

        await this.storeEnhancedEvent(event);
        await this.processSessionEvent(event);
    }

    /**
     * Handle administrative events
     */
    private async handleAdminEvent(eventName: string, log: any): Promise<void> {
        const { args, transactionHash, blockNumber, logIndex } = log;
        if (!args) return;

        const severity = eventName.includes('Owner') ? 'critical' :
            eventName.includes('Paused') ? 'high' : 'medium';

        const event: EnhancedContractEvent = {
            event: eventName,
            eventType: 'admin',
            admin: args.newOwner || args.previousOwner || args.account,
            role: args.role,
            account: args.account,
            transactionHash: transactionHash || '',
            blockNumber,
            logIndex,
            blockTimestamp: Date.now(),
            createdAt: Date.now(),
            severity,
            processed: false,
        };

        await this.storeEnhancedEvent(event);
        await this.processAdminEvent(event);
    }

    /**
     * Handle security events
     */
    private async handleSecurityEvent(eventName: string, log: any): Promise<void> {
        const { args, transactionHash, blockNumber, logIndex } = log;
        if (!args) return;

        const event: EnhancedContractEvent = {
            event: eventName,
            eventType: 'security',
            user: args.user,
            token: args.token,
            transactionHash: transactionHash || '',
            blockNumber,
            logIndex,
            blockTimestamp: Date.now(),
            createdAt: Date.now(),
            severity: 'high',
            processed: false,
        };

        await this.storeEnhancedEvent(event);
        await this.processSecurityEvent(event);
    }

    /**
     * Handle oracle and system events
     */
    private async handleOracleEvent(eventName: string, log: any): Promise<void> {
        const { args, transactionHash, blockNumber, logIndex } = log;
        if (!args) return;

        const event: EnhancedContractEvent = {
            event: eventName,
            eventType: 'oracle',
            oracle: args.newOracle,
            token: args.token,
            minBalance: args.minBalance?.toString(),
            newValue: args.newOracle || args.newEntryPoint || args.newSafe,
            transactionHash: transactionHash || '',
            blockNumber,
            logIndex,
            blockTimestamp: Date.now(),
            createdAt: Date.now(),
            severity: eventName.includes('Fallback') ? 'high' : 'medium',
            processed: false,
        };

        await this.storeEnhancedEvent(event);
        await this.processOracleEvent(event);
    }

    /**
     * Store enhanced event with categorization
     */
    private async storeEnhancedEvent(event: EnhancedContractEvent): Promise<void> {
        try {
            const eventKey = `enhancedEvent:${event.transactionHash}:${event.logIndex}`;
            await redisClient.setEx(eventKey, 60 * 60 * 24 * 7, JSON.stringify(event)); // 7 days

            // Store in user-specific list if user is involved
            if (event.user) {
                await redisClient.lPush(`userEnhancedEvents:${event.user}`, JSON.stringify(event));
                await redisClient.expire(`userEnhancedEvents:${event.user}`, 60 * 60 * 24 * 30); // 30 days
            }

            // Store in type-specific lists for analytics
            await redisClient.lPush(`eventsByType:${event.eventType}`, JSON.stringify(event));
            await redisClient.expire(`eventsByType:${event.eventType}`, 60 * 60 * 24 * 7); // 7 days

            // Store in severity-specific lists for monitoring
            await redisClient.lPush(`eventsBySeverity:${event.severity}`, JSON.stringify(event));
            await redisClient.expire(`eventsBySeverity:${event.severity}`, 60 * 60 * 24 * 7); // 7 days

            // Update stats
            this.eventStats.totalEvents++;
            this.eventStats.eventsByType[event.eventType] = (this.eventStats.eventsByType[event.eventType] || 0) + 1;
            this.eventStats.eventsBySeverity[event.severity]++;
            this.eventStats.lastProcessed = Date.now();

        } catch (error) {
            logger.error('Failed to store enhanced event:', error);
        }
    }

    /**
     * Process transfer events - trigger state sync and notifications
     */
    private async processTransferEvent(event: EnhancedContractEvent): Promise<void> {
        try {
            // Refresh user state
            if (event.user) {
                await contractStateSyncService.refreshUserState(event.user);
            }

            // Send notifications
            await notificationService.sendInAppNotification(
                event.user!,
                'Transfer Completed',
                `Successfully transferred ${event.amount} tokens to ${event.destination}`
            );

            // Mark as processed
            event.processed = true;
            const eventKey = `enhancedEvent:${event.transactionHash}:${event.logIndex}`;
            await redisClient.setEx(eventKey, 60 * 60 * 24 * 7, JSON.stringify(event));

        } catch (error) {
            logger.error('Failed to process transfer event:', error);
        }
    }

    /**
     * Process permission events - sync state and notify
     */
    private async processPermissionEvent(event: EnhancedContractEvent): Promise<void> {
        try {
            // Refresh user state
            if (event.user) {
                await contractStateSyncService.refreshUserState(event.user);
            }

            // Send appropriate notifications
            const notificationTitle = event.event.includes('Granted') ? 'Permission Granted' :
                event.event.includes('Revoked') ? 'Permission Revoked' :
                    'Permission Updated';

            await notificationService.sendInAppNotification(
                event.user!,
                notificationTitle,
                `Your Wally permissions have been ${event.action || 'updated'}`
            );

            // Mark as processed
            event.processed = true;
            const eventKey = `enhancedEvent:${event.transactionHash}:${event.logIndex}`;
            await redisClient.setEx(eventKey, 60 * 60 * 24 * 7, JSON.stringify(event));

        } catch (error) {
            logger.error('Failed to process permission event:', error);
        }
    }

    /**
     * Process session events - update contract sessions
     */
    private async processSessionEvent(event: EnhancedContractEvent): Promise<void> {
        try {
            if (event.event === 'MiniAppSessionGranted' && event.user && event.delegate) {
                // Create contract session
                await contractSessionService.createContractSession({
                    userId: event.user,
                    walletAddress: event.user,
                    delegate: event.delegate,
                    allowedTokens: event.tokenList || [],
                    allowWholeWallet: event.allowEntireWallet || false,
                    expiresAt: event.expiresAt || '0',
                    txHash: event.transactionHash,
                });
            }

            // Send notifications
            await notificationService.sendInAppNotification(
                event.user!,
                'Mini App Session Updated',
                `Your mini app session has been ${event.action || 'updated'}`
            );

            // Mark as processed
            event.processed = true;
            const eventKey = `enhancedEvent:${event.transactionHash}:${event.logIndex}`;
            await redisClient.setEx(eventKey, 60 * 60 * 24 * 7, JSON.stringify(event));

        } catch (error) {
            logger.error('Failed to process session event:', error);
        }
    }

    /**
     * Process admin events - critical system changes
     */
    private async processAdminEvent(event: EnhancedContractEvent): Promise<void> {
        try {
            // Trigger contract state sync for admin changes
            await contractStateSyncService.syncContractState();

            // Send admin notifications to relevant parties
            logger.warn(`Critical admin event: ${event.event}`, {
                event: event.event,
                admin: event.admin,
                transactionHash: event.transactionHash,
            });

            // Mark as processed
            event.processed = true;
            const eventKey = `enhancedEvent:${event.transactionHash}:${event.logIndex}`;
            await redisClient.setEx(eventKey, 60 * 60 * 24 * 7, JSON.stringify(event));

        } catch (error) {
            logger.error('Failed to process admin event:', error);
        }
    }

    /**
     * Process security events - token stops/removals
     */
    private async processSecurityEvent(event: EnhancedContractEvent): Promise<void> {
        try {
            // Refresh user state
            if (event.user) {
                await contractStateSyncService.refreshUserState(event.user);
            }

            // Send security alerts
            await notificationService.sendInAppNotification(
                event.user!,
                'Security Alert',
                `Token ${event.token} has been ${event.event === 'TokenStopped' ? 'stopped' : 'removed'} from your account`
            );

            // Mark as processed
            event.processed = true;
            const eventKey = `enhancedEvent:${event.transactionHash}:${event.logIndex}`;
            await redisClient.setEx(eventKey, 60 * 60 * 24 * 7, JSON.stringify(event));

        } catch (error) {
            logger.error('Failed to process security event:', error);
        }
    }

    /**
     * Process oracle and system events
     */
    private async processOracleEvent(event: EnhancedContractEvent): Promise<void> {
        try {
            // Trigger contract state sync for system changes
            await contractStateSyncService.syncContractState();

            // Log important system changes
            logger.info(`System configuration updated: ${event.event}`, {
                event: event.event,
                newValue: event.newValue,
                transactionHash: event.transactionHash,
            });

            // Mark as processed
            event.processed = true;
            const eventKey = `enhancedEvent:${event.transactionHash}:${event.logIndex}`;
            await redisClient.setEx(eventKey, 60 * 60 * 24 * 7, JSON.stringify(event));

        } catch (error) {
            logger.error('Failed to process oracle event:', error);
        }
    }

    /**
     * Update event statistics
     */
    private async updateEventStats(): Promise<void> {
        try {
            // Calculate recent activity (last hour)
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            const recentEvents = await this.getEventsSince(oneHourAgo);
            this.eventStats.recentActivity = recentEvents.length;

            // Store stats in Redis
            await redisClient.setEx('eventStats', 300, JSON.stringify(this.eventStats)); // 5 minutes

        } catch (error) {
            logger.error('Failed to update event stats:', error);
        }
    }

    /**
     * Get enhanced events for a user
     */
    async getUserEnhancedEvents(userAddress: string, limit = 50): Promise<EnhancedContractEvent[]> {
        try {
            const events = await redisClient.lRange(`userEnhancedEvents:${userAddress}`, 0, limit - 1);
            return events.map(event => JSON.parse(event));
        } catch (error) {
            logger.error('Failed to get user enhanced events:', error);
            return [];
        }
    }

    /**
     * Get events by type
     */
    async getEventsByType(eventType: string, limit = 50): Promise<EnhancedContractEvent[]> {
        try {
            const events = await redisClient.lRange(`eventsByType:${eventType}`, 0, limit - 1);
            return events.map(event => JSON.parse(event));
        } catch (error) {
            logger.error('Failed to get events by type:', error);
            return [];
        }
    }

    /**
     * Get events by severity
     */
    async getEventsBySeverity(severity: string, limit = 50): Promise<EnhancedContractEvent[]> {
        try {
            const events = await redisClient.lRange(`eventsBySeverity:${severity}`, 0, limit - 1);
            return events.map(event => JSON.parse(event));
        } catch (error) {
            logger.error('Failed to get events by severity:', error);
            return [];
        }
    }

    /**
     * Get events since timestamp
     */
    async getEventsSince(timestamp: number): Promise<EnhancedContractEvent[]> {
        try {
            const keys = await redisClient.keys('enhancedEvent:*');
            const events: EnhancedContractEvent[] = [];

            for (const key of keys) {
                const eventData = await redisClient.get(key);
                if (eventData) {
                    const event: EnhancedContractEvent = JSON.parse(eventData);
                    if (event.createdAt > timestamp) {
                        events.push(event);
                    }
                }
            }

            return events.sort((a, b) => b.createdAt - a.createdAt);
        } catch (error) {
            logger.error('Failed to get events since timestamp:', error);
            return [];
        }
    }

    /**
     * Get current event statistics
     */
    getEventStats(): EventStats {
        return { ...this.eventStats };
    }

    /**
     * Check if monitoring is active
     */
    isMonitoring(): boolean {
        return this.isListening;
    }

    /**
     * Process external event logs (made public to fix access error)
     */
    public async processExternalEventLog(eventData: {
        address: string;
        topics: string[];
        data: string;
        blockNumber: number;
        transactionHash: string;
        logIndex: number;
        eventName?: string; // Add optional eventName
    }): Promise<void> {
        try {
            // Decode the event log
            const decodedEvent = decodeEventLog({
                abi: wallyv1Abi,
                data: eventData.data as `0x${string}`,
                topics: eventData.topics as [`0x${string}`, ...`0x${string}`[]]
            });

            const eventName = eventData.eventName || decodedEvent.eventName || 'UnknownEvent';

            // Process the decoded event with proper parameters
            await this.processEventLog({
                address: eventData.address as `0x${string}`,
                blockNumber: BigInt(eventData.blockNumber),
                transactionHash: eventData.transactionHash as `0x${string}`,
                logIndex: eventData.logIndex,
                eventName,
                args: decodedEvent.args as any,
                removed: false
            }, eventName); // Fix: provide eventName parameter

            logger.info(`Processed external event log: ${eventName} at block ${eventData.blockNumber}`);
        } catch (error) {
            logger.error('Failed to process event log:', error);
            throw error;
        }
    }
}

export const enhancedEventMonitoringService = new EnhancedEventMonitoringService();
