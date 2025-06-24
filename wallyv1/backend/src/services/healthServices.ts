import os from 'os';
import process from 'process';
import { performance } from 'perf_hooks';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import axios from 'axios';
import redisClient from '../db/redisClient.js';
import logger from '../infra/mon/logger.js';
import { eventListenerService } from './eventListenerService.js';
import { notificationScheduler } from './notificationScheduler.js';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: number;
  details?: Record<string, any>;
  responseTime?: number;
}

interface SystemHealth {
  overall: HealthStatus;
  services: Record<string, HealthStatus>;
}

class HealthServices {
  private readonly CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
  private readonly RPC_URL = process.env.NEXT_PUBLIC_RPC_URL_1 || process.env.RPC_URL;

  /**
   * Get overall system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const startTime = Date.now();

    const services = {
      server: await this.checkServerHealth(),
      redis: await this.checkRedisHealth(),
      blockchain: await this.checkBlockchainHealth(),
      contract: await this.checkContractHealth(),
      wallet: await this.checkWalletHealth(),
      eventListeners: await this.checkEventListenersHealth(),
      notifications: await this.checkNotificationHealth(),
      farcaster: await this.checkFarcasterHealth(),
    };

    const unhealthyServices = Object.values(services).filter(s => s.status === 'unhealthy');
    const degradedServices = Object.values(services).filter(s => s.status === 'degraded');

    let overall: HealthStatus;
    if (unhealthyServices.length > 0) {
      overall = {
        status: 'unhealthy',
        message: `${unhealthyServices.length} service(s) unhealthy`,
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    } else if (degradedServices.length > 0) {
      overall = {
        status: 'degraded',
        message: `${degradedServices.length} service(s) degraded`,
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    } else {
      overall = {
        status: 'healthy',
        message: 'All systems operational',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }

    return { overall, services };
  }

  /**
   * Check server health
   */
  async checkServerHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      return {
        status: 'healthy',
        message: 'Server operational',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        details: {
          uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
          memory: {
            used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          },
          nodeVersion: process.version,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check Redis health
   */
  async checkRedisHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      await redisClient.ping();

      return {
        status: 'healthy',
        message: 'Redis connected',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Redis error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check blockchain connectivity
   */
  async checkBlockchainHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      if (!this.RPC_URL) {
        throw new Error('RPC_URL not configured');
      }

      const client = createPublicClient({
        chain: base,
        transport: http(this.RPC_URL),
      });

      const blockNumber = await client.getBlockNumber();

      return {
        status: 'healthy',
        message: 'Blockchain connected',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        details: {
          blockNumber: blockNumber.toString(),
          chain: 'Base',
          rpcUrl: this.RPC_URL.replace(/\/[^\/]*$/, '/***'), // Hide API key
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Blockchain error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check contract health
   */
  async checkContractHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      if (!this.CONTRACT_ADDRESS) {
        throw new Error('Contract address not configured');
      }

      const client = createPublicClient({
        chain: base,
        transport: http(this.RPC_URL),
      });

      // Check if contract exists by getting bytecode
      const bytecode = await client.getBytecode({
        address: this.CONTRACT_ADDRESS,
      });

      if (!bytecode || bytecode === '0x') {
        throw new Error('Contract not found at address');
      }

      return {
        status: 'healthy',
        message: 'Contract accessible',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        details: {
          address: this.CONTRACT_ADDRESS,
          hasCode: true,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Contract error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check wallet health
   */
  async checkWalletHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const privateKey = process.env.PRIVATE_KEY;

      if (!privateKey) {
        throw new Error('Private key not configured');
      }

      if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
        throw new Error('Invalid private key format');
      }

      return {
        status: 'healthy',
        message: 'Wallet configured',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        details: {
          hasPrivateKey: true,
          keyFormat: 'valid',
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Wallet error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check event listeners health
   */
  async checkEventListenersHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const isRunning = eventListenerService.isRunning();

      if (!isRunning) {
        return {
          status: 'degraded',
          message: 'Event listeners not running',
          timestamp: Date.now(),
          responseTime: Date.now() - startTime,
        };
      }

      return {
        status: 'healthy',
        message: 'Event listeners active',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Event listeners error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check notification service health
   */
  async checkNotificationHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const schedulerRunning = notificationScheduler.isSchedulerRunning();

      return {
        status: schedulerRunning ? 'healthy' : 'degraded',
        message: schedulerRunning ? 'Notification scheduler active' : 'Notification scheduler stopped',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        details: {
          schedulerRunning,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Notification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Check Farcaster API health
   */
  async checkFarcasterHealth(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      // Test Farcaster API connectivity
      const response = await axios.get('https://api.farcaster.xyz/v1/status', {
        timeout: 5000,
      });

      return {
        status: 'healthy',
        message: 'Farcaster API accessible',
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
        details: {
          status: response.status,
          data: response.data,
        },
      };
    } catch (error) {
      return {
        status: 'degraded',
        message: `Farcaster API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get health status for a specific service
   */
  async getServiceHealth(serviceName: string): Promise<HealthStatus> {
    const methodMap: Record<string, () => Promise<HealthStatus>> = {
      server: this.checkServerHealth.bind(this),
      redis: this.checkRedisHealth.bind(this),
      blockchain: this.checkBlockchainHealth.bind(this),
      contract: this.checkContractHealth.bind(this),
      wallet: this.checkWalletHealth.bind(this),
      eventListeners: this.checkEventListenersHealth.bind(this),
      notifications: this.checkNotificationHealth.bind(this),
      farcaster: this.checkFarcasterHealth.bind(this),
    };

    const method = methodMap[serviceName];
    if (!method) {
      return {
        status: 'unhealthy',
        message: 'Unknown service',
        timestamp: Date.now(),
      };
    }

    return await method();
  }
}

export const healthServices = new HealthServices();
