import { ethers } from 'ethers';
import wallyV1Abi from '../routes/abis/wallyv1.json';
import redisClient from '../db/redisClient';

// Placeholder for logging function - should be implemented properly
function logError(message: string, error?: any) {
  console.error(message, error);
}

/**
 * WallyService: Handles contract interactions for token/NFT forwarding and session/permission logic.
 * Uses only contract methods present in the ABI and ensures all actions are session-aware and safe.
 * Never takes custody of user funds except for relayer fee scenarios, which are handled separately.
 * 
 * Enhanced with EIP-7702 and EIP-5792 support for temporary contract code execution and 
 * standardized wallet API functions.
 */
export class WallyService {
  private provider: ethers.providers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    this.contract = new ethers.Contract(process.env.WALLY_CONTRACT_ADDRESS!, wallyV1Abi, this.provider);
  }

  // --- Original Mini-App Session Functions ---

  async grantMiniAppSession(userId: string, delegate: string, tokenList: string[], expiresAt: string) {
    try {
      const tx = await this.contract.grantMiniAppSession(userId, delegate, tokenList, expiresAt);
      await tx.wait();
      return { success: true };
    } catch (err: any) {
      logError('grantMiniAppSession failed', err);
      return { success: false, error: { code: err.code, message: err.reason || err.message } };
    }
  }

  async revokeMiniAppSession(userId: string, delegate: string) {
    try {
      const tx = await this.contract.revokeMiniAppSession(userId, delegate);
      await tx.wait();
      return { success: true };
    } catch (err: any) {
      logError('revokeMiniAppSession failed', err);
      return { success: false, error: { code: err.code, message: err.reason || err.message } };
    }
  }

  async miniAppTriggerTransfers(userId: string) {
    try {
      const signer = this.provider.getSigner(userId);
      const tx = await this.contract.connect(signer).miniAppTriggerTransfers(userId);
      await tx.wait();
      return { success: true, transactionHash: tx.hash };
    } catch (err: any) {
      logError('miniAppTriggerTransfers failed', err);
      return { success: false, error: { code: err.code, message: err.reason || err.message } };
    }
  }

  // --- EIP-7702: Temporary Contract Code Functions ---
  
  /**
   * Set temporary contract code for an EOA to enable atomic execution
   */
  async setTemporaryCode(account: string, codeHash: string, expiresAt: string, nonce: string, signature: string) {
    try {
      const tx = await this.contract.setTemporaryCode(account, codeHash, expiresAt, nonce, signature);
      await tx.wait();
      return { success: true, transactionHash: tx.hash };
    } catch (err: any) {
      logError('setTemporaryCode failed', err);
      return { success: false, error: { code: err.code, message: err.reason || err.message } };
    }
  }

  /**
   * Reset temporary contract code back to original state
   */
  async resetTemporaryCode(account: string) {
    try {
      const tx = await this.contract.resetTemporaryCode(account);
      await tx.wait();
      return { success: true, transactionHash: tx.hash };
    } catch (err: any) {
      logError('resetTemporaryCode failed', err);
      return { success: false, error: { code: err.code, message: err.reason || err.message } };
    }
  }

  /**
   * Execute a function call with temporary contract code for atomic execution
   */
  async executeWithTemporaryCode(account: string, target: string, data: string, value: string) {
    try {
      const tx = await this.contract.executeWithTemporaryCode(account, target, data, value);
      await tx.wait();
      return { success: true, transactionHash: tx.hash, result: tx.data };
    } catch (err: any) {
      logError('executeWithTemporaryCode failed', err);
      return { success: false, error: { code: err.code, message: err.reason || err.message } };
    }
  }

  /**
   * Get temporary code information for an account
   */
  async getTemporaryCode(account: string) {
    try {
      const result = await this.contract.getTemporaryCode(account);
      return { success: true, active: result.active, codeHash: result.codeHash, expiresAt: result.expiresAt };
    } catch (err: any) {
      logError('getTemporaryCode failed', err);
      return { success: false, error: { code: err.code, message: err.reason || err.message } };
    }
  }

  // --- EIP-5792: Wallet API Functions ---

  /**
   * Request wallet permissions for specific methods (EIP-5792)
   */
  async wallet_requestPermissions(account: string, methods: string[], expiresAt: string, nonce: string, signature: string) {
    try {
      const tx = await this.contract.wallet_requestPermissions(account, methods, expiresAt, nonce, signature);
      await tx.wait();
      return { success: true, transactionHash: tx.hash };
    } catch (err: any) {
      logError('wallet_requestPermissions failed', err);
      return { success: false, error: { code: err.code, message: err.reason || err.message } };
    }
  }

  /**
   * Get current wallet permissions for an account (EIP-5792)
   */
  async wallet_getPermissions(account: string) {
    try {
      const result = await this.contract.wallet_getPermissions(account);
      return { success: true, methods: result.methods, expiresAt: result.expiresAt, active: result.active };
    } catch (err: any) {
      logError('wallet_getPermissions failed', err);
      return { success: false, error: { code: err.code, message: err.reason || err.message } };
    }
  }

  /**
   * Execute an authorized transaction (EIP-5792: eth_sendTransaction)
   */
  async eth_sendTransaction(account: string, to: string, value: string, data: string) {
    try {
      const tx = await this.contract.eth_sendTransaction(account, to, value, data);
      await tx.wait();
      return { success: true, transactionHash: tx.hash, result: tx.data };
    } catch (err: any) {
      logError('eth_sendTransaction failed', err);
      return { success: false, error: { code: err.code, message: err.reason || err.message } };
    }
  }

  /**
   * Sign data using account's signing capability (EIP-5792: eth_sign)
   */
  async eth_sign(account: string, dataHash: string) {
    try {
      const result = await this.contract.eth_sign(account, dataHash);
      return { success: true, signature: result };
    } catch (err: any) {
      logError('eth_sign failed', err);
      return { success: false, error: { code: err.code, message: err.reason || err.message } };
    }
  }

  /**
   * Revoke wallet permissions for an account
   */
  async wallet_revokePermissions(account: string) {
    try {
      const tx = await this.contract.wallet_revokePermissions(account);
      await tx.wait();
      return { success: true, transactionHash: tx.hash };
    } catch (err: any) {
      logError('wallet_revokePermissions failed', err);
      return { success: false, error: { code: err.code, message: err.reason || err.message } };
    }
  }

  // --- Original Transfer Functions ---

  /**
   * Forward all eligible tokens for a user using the contract's triggerTransfers method.
   * Only works if the user's session/permission is valid and allowEntireWallet is true.
   * Never takes custody of user funds.
   */
  async transferTokens(userAddress: string) {
    try {
      const signer = this.provider.getSigner(userAddress);
      const tx = await this.contract.connect(signer).triggerTransfers(userAddress);
      await tx.wait();
      return { success: true, transactionHash: tx.hash };
    } catch (err: any) {
      return { success: false, error: err?.reason || err?.message || 'Unknown error' };
    }
  }

  // --- Event Handling ---

  async handleEvent(event: any) {
    // Store event in Redis
    if (event.user) {
      await redisClient.lPush(`userEvents:${event.user}`, JSON.stringify({
        ...event,
        createdAt: Date.now()
      }));
    }
  }

  // --- Helper Functions ---

  async getUserPermission(userAddress: string) {
    try {
      const result = await this.contract.getUserPermission(userAddress);
      return { success: true, permission: result };
    } catch (err: any) {
      logError('getUserPermission failed', err);
      return { success: false, error: { code: err.code, message: err.reason || err.message } };
    }
  }

  async getMiniAppSession(userAddress: string) {
    try {
      const result = await this.contract.getMiniAppSession(userAddress);
      return { success: true, session: result };
    } catch (err: any) {
      logError('getMiniAppSession failed', err);
      return { success: false, error: { code: err.code, message: err.reason || err.message } };
    }
  }
}

// Export helper functions
export async function logPermissionRevoked(userId: string, oracleTimestamp: number, revokedAt: number, txHash: string) {
  const metadata = {
    event: 'PermissionRevoked',
    userId,
    oracleTimestamp,
    revokedAt,
    transactionHash: txHash,
    createdAt: revokedAt,
  };
  // Store with 30-day TTL
  await redisClient.lPush(`userEvents:${userId}`, JSON.stringify(metadata));
  await redisClient.expire(`userEvents:${userId}`, 30 * 24 * 60 * 60); // 30 days
}

export async function getUserEvents(userAddress: string) {
  try {
    // Try Redis first
    const events = await redisClient.lRange(`userEvents:${userAddress}`, 0, -1);
    if (events && events.length > 0) return events.map(e => JSON.parse(e));
    // Fallback - in a real implementation, this would use the database
    return [];
  } catch (err) {
    // Handle error
    return [];
  }
}