import { createPublicClient, http, Chain } from 'viem';
import { base } from 'viem/chains';
import { watchContractEvent } from 'viem/actions';
import wallyv1Abi from '../abis/wallyv1.json' with { type: 'json' };
import { contractSessionService } from './contractSessionService.js';
import { notificationService } from './notificationService.js';
import redisClient from '../db/redisClient.js';
import logger from '../infra/mon/logger.js';

const wallyv1Address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL_1 || process.env.RPC_URL || '';

if (!wallyv1Address) throw new Error('NEXT_PUBLIC_CONTRACT_ADDRESS is not set');
if (!rpcUrl) throw new Error('RPC_URL is not set');

const client = createPublicClient({
  chain: base,
  transport: http(rpcUrl),
});

interface ContractEvent {
  event: string;
  user?: string;
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
  admin?: string;
  transactionHash: string;
  createdAt: number;
  blockNumber?: bigint;
}

class EventListenerService {
  private isListening = false;
  private unwatchFunctions: (() => void)[] = [];

  async startEventListeners() {
    if (this.isListening) {
      logger.warn('Event listeners already running');
      return;
    }

    try {
      // TransferPerformed
      const unwatchTransfer = watchContractEvent(client, {
        address: wallyv1Address,
        abi: wallyv1Abi,
        eventName: 'TransferPerformed',
        onLogs: async (logs) => {
          for (const log of logs) {
            await this.handleTransferPerformed(log);
          }
        },
        onError: (err) => logger.error('[TransferPerformed Listener Error]:', err),
      });

      // TokenStopped
      const unwatchTokenStopped = watchContractEvent(client, {
        address: wallyv1Address,
        abi: wallyv1Abi,
        eventName: 'TokenStopped',
        onLogs: async (logs) => {
          for (const log of logs) {
            await this.handleTokenStopped(log);
          }
        },
        onError: (err) => logger.error('[TokenStopped Listener Error]:', err),
      });

      // PermissionUpdated
      const unwatchPermissionUpdated = watchContractEvent(client, {
        address: wallyv1Address,
        abi: wallyv1Abi,
        eventName: 'PermissionUpdated',
        onLogs: async (logs) => {
          for (const log of logs) {
            await this.handlePermissionUpdated(log);
          }
        },
        onError: (err) => logger.error('[PermissionUpdated Listener Error]:', err),
      });

      // PermissionGranted
      const unwatchPermissionGranted = watchContractEvent(client, {
        address: wallyv1Address,
        abi: wallyv1Abi,
        eventName: 'PermissionGranted',
        onLogs: async (logs) => {
          for (const log of logs) {
            await this.handlePermissionGranted(log);
          }
        },
        onError: (err) => logger.error('[PermissionGranted Listener Error]:', err),
      });

      // PermissionRevoked
      const unwatchPermissionRevoked = watchContractEvent(client, {
        address: wallyv1Address,
        abi: wallyv1Abi,
        eventName: 'PermissionRevoked',
        onLogs: async (logs) => {
          for (const log of logs) {
            await this.handlePermissionRevoked(log);
          }
        },
        onError: (err) => logger.error('[PermissionRevoked Listener Error]:', err),
      });

      // MiniAppSessionGranted
      const unwatchMiniAppGranted = watchContractEvent(client, {
        address: wallyv1Address,
        abi: wallyv1Abi,
        eventName: 'MiniAppSessionGranted',
        onLogs: async (logs) => {
          for (const log of logs) {
            await this.handleMiniAppSessionGranted(log);
          }
        },
        onError: (err) => logger.error('[MiniAppSessionGranted Listener Error]:', err),
      });

      // MiniAppSessionRevoked
      const unwatchMiniAppRevoked = watchContractEvent(client, {
        address: wallyv1Address,
        abi: wallyv1Abi,
        eventName: 'MiniAppSessionRevoked',
        onLogs: async (logs) => {
          for (const log of logs) {
            await this.handleMiniAppSessionRevoked(log);
          }
        },
        onError: (err) => logger.error('[MiniAppSessionRevoked Listener Error]:', err),
      });

      this.unwatchFunctions = [
        unwatchTransfer,
        unwatchTokenStopped,
        unwatchPermissionUpdated,
        unwatchPermissionGranted,
        unwatchPermissionRevoked,
        unwatchMiniAppGranted,
        unwatchMiniAppRevoked,
      ];

      this.isListening = true;
      logger.info('✅ Event listeners started for WallyV1 contract');
    } catch (error) {
      logger.error('Failed to start event listeners:', error);
      throw error;
    }
  }

  stopEventListeners() {
    this.unwatchFunctions.forEach(unwatch => unwatch());
    this.unwatchFunctions = [];
    this.isListening = false;
    logger.info('Event listeners stopped');
  }

  private async handleTransferPerformed(log: any) {
    const { args, transactionHash, blockNumber } = log;
    if (!args) return;

    const event: ContractEvent = {
      event: 'TransferPerformed',
      user: args.user,
      token: args.token,
      amount: args.amount?.toString(),
      destination: args.destination,
      transactionHash: transactionHash || '',
      createdAt: Date.now(),
      blockNumber,
    };

    logger.info(`[Event] TransferPerformed: user=${args.user}, token=${args.token}, amount=${args.amount}, destination=${args.destination}`);

    await this.storeUserEvent(args.user, event);
    await notificationService.sendInAppNotification(
      args.user,
      'Transfer Completed',
      `Successfully transferred ${args.amount} tokens to ${args.destination}`
    );
  }

  private async handleTokenStopped(log: any) {
    const { args, transactionHash, blockNumber } = log;
    if (!args) return;

    const event: ContractEvent = {
      event: 'TokenStopped',
      user: args.user,
      token: args.token,
      transactionHash: transactionHash || '',
      createdAt: Date.now(),
      blockNumber,
    };

    logger.info(`[Event] TokenStopped: user=${args.user}, token=${args.token}`);

    await this.storeUserEvent(args.user, event);
    await notificationService.sendInAppNotification(
      args.user,
      'Token Monitoring Stopped',
      `Stopped monitoring ${args.token}`
    );
  }

  private async handlePermissionUpdated(log: any) {
    const { args, transactionHash, blockNumber } = log;
    if (!args) return;

    const event: ContractEvent = {
      event: 'PermissionUpdated',
      user: args.user,
      withdrawalAddress: args.withdrawalAddress,
      allowEntireWallet: args.allowEntireWallet,
      expiresAt: args.expiresAt?.toString(),
      tokenList: args.tokenList,
      minBalances: args.minBalances?.map((b: bigint) => b.toString()),
      limits: args.limits?.map((l: bigint) => l.toString()),
      action: args.action,
      transactionHash: transactionHash || '',
      createdAt: Date.now(),
      blockNumber,
    };

    logger.info(`[Event] PermissionUpdated: user=${args.user}, action=${args.action}`);

    await this.storeUserEvent(args.user, event);
    await notificationService.sendInAppNotification(
      args.user,
      'Permissions Updated',
      `Your wallet permissions have been ${args.action}`
    );
  }

  private async handlePermissionGranted(log: any) {
    const { args, transactionHash, blockNumber } = log;
    if (!args) return;

    const event: ContractEvent = {
      event: 'PermissionGranted',
      user: args.user,
      withdrawalAddress: args.withdrawalAddress,
      allowEntireWallet: args.allowEntireWallet,
      expiresAt: args.expiresAt?.toString(),
      tokenList: args.tokenList,
      minBalances: args.minBalances?.map((b: bigint) => b.toString()),
      limits: args.limits?.map((l: bigint) => l.toString()),
      transactionHash: transactionHash || '',
      createdAt: Date.now(),
      blockNumber,
    };

    logger.info(`[Event] PermissionGranted: user=${args.user}, withdrawalAddress=${args.withdrawalAddress}`);

    await this.storeUserEvent(args.user, event);
    await notificationService.sendInAppNotification(
      args.user,
      'Permission Granted',
      'Wally now has permission to monitor and transfer your tokens'
    );
  }

  private async handlePermissionRevoked(log: any) {
    const { args, transactionHash, blockNumber } = log;
    if (!args) return;

    const event: ContractEvent = {
      event: 'PermissionRevoked',
      user: args.user,
      transactionHash: transactionHash || '',
      createdAt: Date.now(),
      blockNumber,
    };

    logger.info(`[Event] PermissionRevoked: user=${args.user}`);

    await this.storeUserEvent(args.user, event);
    await notificationService.sendInAppNotification(
      args.user,
      'Permission Revoked',
      'Your Wally permissions have been revoked'
    );
  }

  private async handleMiniAppSessionGranted(log: any) {
    const { args, transactionHash, blockNumber } = log;
    if (!args) return;

    const event: ContractEvent = {
      event: 'MiniAppSessionGranted',
      user: args.user,
      delegate: args.delegate,
      allowEntireWallet: args.allowEntireWallet,
      expiresAt: args.expiresAt?.toString(),
      transactionHash: transactionHash || '',
      createdAt: Date.now(),
      blockNumber,
    };

    logger.info(`[Event] MiniAppSessionGranted: user=${args.user}, delegate=${args.delegate}`);

    await this.storeUserEvent(args.user, event);

    // Update contract session service
    try {
      await contractSessionService.createContractSession({
        userId: args.user,
        walletAddress: args.user,
        delegate: args.delegate,
        allowedTokens: args.tokens || [],
        allowWholeWallet: args.allowEntireWallet,
        expiresAt: args.expiresAt?.toString() || '',
        txHash: transactionHash || '',
      });
    } catch (error) {
      logger.error('Failed to create contract session:', error);
    }
  }

  private async handleMiniAppSessionRevoked(log: any) {
    const { args, transactionHash, blockNumber } = log;
    if (!args) return;

    const event: ContractEvent = {
      event: 'MiniAppSessionRevoked',
      user: args.user,
      delegate: args.delegate,
      transactionHash: transactionHash || '',
      createdAt: Date.now(),
      blockNumber,
    };

    logger.info(`[Event] MiniAppSessionRevoked: user=${args.user}, delegate=${args.delegate}`);

    await this.storeUserEvent(args.user, event);
    await notificationService.sendInAppNotification(
      args.user,
      'Mini App Session Revoked',
      'Your mini app session has been revoked'
    );
  }

  private async storeUserEvent(userAddress: string, event: ContractEvent) {
    try {
      await redisClient.lPush(`userEvents:${userAddress}`, JSON.stringify(event));
      await redisClient.expire(`userEvents:${userAddress}`, 60 * 60 * 24 * 30); // 30 days
    } catch (error) {
      logger.error('Failed to store user event:', error);
    }
  }

  async getUserEvents(userAddress: string, limit = 50): Promise<ContractEvent[]> {
    try {
      const events = await redisClient.lRange(`userEvents:${userAddress}`, 0, limit - 1);
      return events.map(event => JSON.parse(event));
    } catch (error) {
      logger.error('Failed to get user events:', error);
      return [];
    }
  }

  isRunning(): boolean {
    return this.isListening;
  }
}

export const eventListenerService = new EventListenerService();
