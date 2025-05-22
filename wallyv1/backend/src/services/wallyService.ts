import { ethers } from 'ethers';
import wallyV1Abi from '../routes/abis/wallyv1.json';
import redisClient from '../db/redisClient';
import express from 'express';
import { createWallet, getWalletInfo, updateWallet, deleteWallet } from '../controllers/walletController';
import { authenticate } from '../middleware/authenticate';
/**
 * WallyService: Handles contract interactions for token/NFT forwarding and session/permission logic.
 * Uses only contract methods present in the ABI and ensures all actions are session-aware and safe.
 * Never takes custody of user funds except for relayer fee scenarios, which are handled separately.
 */
export class WallyService {
  private provider: ethers.providers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    this.contract = new ethers.Contract(process.env.WALLY_CONTRACT_ADDRESS!, wallyV1Abi, this.provider);
  }

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
    /**
     * Trigger transfers for a user using the Mini-App's triggerTransfers method.
     * Only works if the user's session/permission is valid and allowEntireWallet is true.
     * Never takes custody of user funds.
     */
  async miniAppTriggerTransfers(userId: string, delegate: string) {
    try {
      const signer = this.provider.getSigner(userId);
      const tx = await this.contract.connect(signer).miniAppTriggerTransfers(userId, delegate);
      await tx.wait();
      return { success: true, transactionHash: tx.hash };
    } catch (err: any) {
      logError('miniAppTriggerTransfers failed', err);
    const tx = await this.contract.miniAppTriggerTransfers(userId, delegate);
    await tx.wait();
  }

  /**
   * Forward all eligible tokens for a user using the contract's triggerTransfers method.
   * Only works if the user's session/permission is valid and allowEntireWallet is true.
   * Never takes custody of user funds.
   */
  async transferTokens(userAddress: string) {
    // Session/permission checks should be handled in the controller/service layer before calling this.
    try {
      const signer = this.provider.getSigner(userAddress);
      const tx = await this.contract.connect(signer).triggerTransfers(userAddress);
      await tx.wait();
      return { success: true, transactionHash: tx.hash };
    } catch (err: any) {
      return { success: false, error: err?.reason || err?.message || 'Unknown error' };
    }
  }

  /**
   * Get ERC20 token balance for a user.
   */
  async getTokenBalance(userAddress: string, tokenAddress: string) {
    const token = fuzzyFindTokenByAddress(tokenAddress);
    if (!token || token.address.toLowerCase() !== tokenAddress.toLowerCase()) {
      throw new Error('Invalid token address');
    }
    // Use standard ERC20 ABI for balanceOf
    const erc20Abi = [
      "function balanceOf(address owner) view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];
    const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
    const balance = await contract.balanceOf(userAddress);
    const decimals = token.decimals || (await contract.decimals());
    return ethers.utils.formatUnits(balance, decimals);
  }

  /**
   * Get ERC721/1155 NFT balance for a user (future support).
   */
  async getNFTBalance(userAddress: string, tokenAddress: string) {
    // Use ERC721 ABI for balanceOf
    const erc721Abi = [
      "function balanceOf(address owner) view returns (uint256)"
    ];
    const contract = new ethers.Contract(tokenAddress, erc721Abi, this.provider);
    const balance = await contract.balanceOf(userAddress);
    return balance.toString();
  }

  /**
   * Get all NFTs owned by a user for a given ERC721 contract (future support).
   */
  async getNFTs(userAddress: string, tokenAddress: string) {
    // Use ERC721 Enumerable ABI
    const erc721Abi = [
      "function balanceOf(address owner) view returns (uint256)",
      "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
      "function tokenURI(uint256 tokenId) view returns (string)"
    ];
    const contract = new ethers.Contract(tokenAddress, erc721Abi, this.provider);
    const balance = await contract.balanceOf(userAddress);
    const nfts = [];
    for (let i = 0; i < balance.toNumber(); i++) {
      const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
      let metadata = {};
      try {
        const tokenURI = await contract.tokenURI(tokenId);
        metadata = await fetch(tokenURI).then(res => res.json());
      } catch {
        // Ignore metadata fetch errors
      }
      nfts.push({ tokenId: tokenId.toString(), metadata });
    }
    return nfts;
  }

  listenForEvents() {
    // TransferPerformed event
    this.contract.on('TransferPerformed', async (
      user, token, amount, destination, userRemaining, oracleTimestamp, blockTimestamp, event
    ) => {
      await this.handleEvent({
        event: 'TransferPerformed',
        user,
        token,
        amount,
        destination,
        userRemaining,
        oracleTimestamp,
        blockTimestamp,
        transactionHash: event.transactionHash
      });
    });

    // MiniAppSessionGranted event
    this.contract.on('MiniAppSessionGranted', async (
      user, delegate, tokens, allowEntireWallet, expiresAt, event
    ) => {
      await this.handleEvent({
        event: 'MiniAppSessionGranted',
        user,
        delegate,
        tokens,
        allowEntireWallet,
        expiresAt,
        transactionHash: event.transactionHash
      });
    });

    // PermissionGranted event (in-app notification)
    this.contract.on('PermissionGranted', async (
      user, withdrawalAddress, allowEntireWallet, expiresAt, tokenList, minBalances, limits, event
    ) => {
      await this.handleEvent({
        event: 'PermissionGranted',
        user,
        withdrawalAddress,
        allowEntireWallet,
        expiresAt,
        tokenList,
        minBalances,
        limits,
        transactionHash: event.transactionHash
      });
      await this.sendInAppNotification(user, 'Permission granted', 'Your permission has been granted.');
      await this.auditLog('PermissionGranted', { user, withdrawalAddress, expiresAt });
    });

    // PermissionRevoked event (in-app notification + data wipe)
    this.contract.on('PermissionRevoked', async (
      user, event
    ) => {
      await this.
      handlePermissionRevoked(user, event);
      await this.handleUserDataOnRevoke(user);
    });
  }

  async handleEvent(event: any) {
    // Always push to Redis
    if (event.user) {
      await redisClient.lPush(`userEvents:${event.user}`, JSON.stringify({
        ...event,
        createdAt: Date.now()
      }));
      // Backup to PostgreSQL
      await UserEvent.create({
        userAddress: event.user,
        eventType: event.event,
        eventData: JSON.stringify(event),
        transactionHash: event.transactionHash,
        createdAt: new Date()
      });
    }
  }

  async handlePermissionRevoked(user, event) {
    // Fetch last PermissionGranted event for this user
    const events = await redisClient.lRange(`userEvents:${user}`, 0, -1);
    let lastGranted = null;
    for (const e of events) {
      const parsed = JSON.parse(e);
      if (parsed.event === 'PermissionGranted') {
        lastGranted = parsed;
        break;
      }
    }
    const oracleTimestamp = lastGranted?.oracleTimestamp || lastGranted?.expiresAt || null;
    const revokedAt = Date.now();

    // Compose metadata
    const metadata = {
      event: 'PermissionRevoked',
      user,
      oracleTimestamp,
      revokedAt,
      transactionHash: event.transactionHash,
      createdAt: revokedAt
    };

    // Send in-app notification with both timestamps
    let message = `Your permission has been revoked.\nGranted at: ${oracleTimestamp ? new Date(Number(oracleTimestamp)).toLocaleString() : 'unknown'}\nRevoked at: ${new Date(revokedAt).toLocaleString()}`;
    await this.sendInAppNotification(user, 'Permission revoked', message);

    // Wipe user data except minimal metadata
    await this.wipeUserDataExceptMetadata(user, event);

    // Store minimal metadata
    await redisClient.lPush(`userEvents:${user}`, JSON.stringify(metadata));

    // Before deleting, send data to user (e.g., via email or download link)
    const userData = await redisClient.lRange(`userEvents:${user}`, 0, -1);
    await sendEmail(user.email, 'Your Wally Data', JSON.stringify(userData));
  }

  async startWatchingToken(userAddress: string, tokenAddress: string) {
    // Fetch current permission from contract
    const permission = await this.contract.getUserPermission(userAddress);
    let tokenList = permission.tokenList.map((addr: string) => addr.toLowerCase());
    if (!tokenList.includes(tokenAddress.toLowerCase())) {
      tokenList.push(tokenAddress.toLowerCase());
    }
    // Call contract to update permission
    const signer = this.provider.getSigner(userAddress);
    await this.contract.connect(signer).grantOrUpdatePermission(
      permission.withdrawalAddress,
      permission.allowEntireWallet,
      permission.expiresAt,
      tokenList,
      permission.minBalances,
      permission.limits
    );
    // Optionally update in Redis/DB as well
  }

  async stopWatchingToken(userAddress: string, tokenAddress: string) {
    const permission = await this.contract.getUserPermission(userAddress);
    let tokenList = permission.tokenList.map((addr: string) => addr.toLowerCase());
    tokenList = tokenList.filter((addr: string) => addr !== tokenAddress.toLowerCase());
    const signer = this.provider.getSigner(userAddress);
    await this.contract.connect(signer).grantOrUpdatePermission(
      permission.withdrawalAddress,
      permission.allowEntireWallet,
      permission.expiresAt,
      tokenList,
      permission.minBalances,
      permission.limits
    );
    // Optionally update in Redis/DB as well
    await redisClient.lPush(`userEvents:${userAddress}`, JSON.stringify({
      event: 'PermissionRevoked',
      userId: userAddress,
      oracleTimestamp: permission.oracleTimestamp,
      revokedAt: Date.now(),
      transactionHash: permission.transactionHash,
      createdAt: Date.now()
    }));
  }

  /**
   * Send an in-app notification to the user.
   */
  async sendInAppNotification(userAddress: string, title: string, message: string) {
    await redisClient.lPush(`notifications:${userAddress}`, JSON.stringify({
      title,
      message,
      timestamp: Date.now()
    }));
  }

  async batchTransferTokens(userAddress: string, transfers: Array<{token: string, to: string, amount: string, data?: string}>) {
    // Each transfer: {token, to, amount, data}
    // ABI: executeBatch((address target, uint256 value, bytes data)[])
    const calls = transfers.map(t => ({
      target: t.token,
      value: ethers.utils.parseEther(t.amount),
      data: t.data || '0x'
    }));
    const signer = this.provider.getSigner(userAddress);
    const tx = await this.contract.connect(signer).executeBatch(calls);
    await tx.wait();
    return { success: true, transactionHash: tx.hash };
  }

  async metaTransferTokens(userAddress: string, metaTxData: any) {
    // ABI: executeMetaTx(address from, address to, uint256 value, bytes data, uint256 fee, address feeToken, address relayer, uint256 nonce, bytes signature)
    const signer = this.provider.getSigner(userAddress);
    const tx = await this.contract.connect(signer).executeMetaTx(
      metaTxData.from,
      metaTxData.to,
      ethers.utils.parseEther(metaTxData.value),
      metaTxData.data || '0x',
      ethers.utils.parseEther(metaTxData.fee),
      metaTxData.feeToken,
      metaTxData.relayer,
      metaTxData.nonce,
      metaTxData.signature
    );
    await tx.wait();
    return { success: true, transactionHash: tx.hash };
  }

  async auditLog(action: string, details: any) {
    await redisClient.lPush('auditLog', JSON.stringify({
      action,
      details,
      timestamp: Date.now()
    }));
  }

  /**
   * Handle user data cleanup logic on revoke.
   * - If purge enabled: delete immediately except metadata.
   * - If renew enabled: set 30-day timer for deletion.
   * - If neither: set 30-day timer for deletion.
   */
  async handleUserDataOnRevoke(userAddress: string) {
    const purgeMode = await redisClient.get(`purgeMode:${userAddress}`);
    const autoRenew = await redisClient.get(`autorenewEnabled:${userAddress}`);

    if (purgeMode === 'true') {
      // Immediate deletion except metadata
      await this.wipeUserDataExceptMetadata(userAddress, {});
    } else {
      // Set 30-day timer for deletion
      await redisClient.expire(`userEvents:${userAddress}`, 30 * 24 * 60 * 60);
      // Optionally, store a flag/timer key for tracking
      await redisClient.set(`scheduledCleanup:${userAddress}`, Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
  async wipeUserDataExceptMetadata(userAddress: string, event: any) {
    // Delete all user data except minimal metadata
    await redisClient.del(`userEvents:${userAddress}`);
    await redisClient.del(`userMetadata:${userAddress}`);
    // Optionally, log the event
    await this.auditLog('UserDataWiped', { userAddress, event });
  }
  
  const router = express.Router();
  
  // Health check route (no auth)
  router.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', timestamp: Date.now() });
  });
  
  // All routes below require authentication
  router.use(authenticate);
  
  // Wallet routes
  router.get('/:id', getWalletInfo);
  router.post('/', createWallet);
  router.put('/:id', updateWallet);
  router.delete('/:id', deleteWallet);
  
  // Test route (optional)
  router.get('/', (req, res) => {
      res.status(200).json({ message: 'Wallet routes are working!' });
  });
  
  export default router;
  
  /**
   * On renew, clear any pending deletion timers.
   */
  async handleUserDataOnRenew(userAddress: string) {
    // Remove scheduled cleanup
    await redisClient.del(`scheduledCleanup:${userAddress}`);
    // Remove expiry on userEvents (make persistent again)
    await redisClient.persist(`userEvents:${userAddress}`);
  }
}

// Restore logic (example for controller/service)
async function getUserEvents(userAddress: string) {
  try {
    // Try Redis first
    const events = await redisClient.lRange(`userEvents:${userAddress}`, 0, -1);
    if (events && events.length > 0) return events.map(e => JSON.parse(e));
    // Fallback to PostgreSQL
    const dbEvents = await UserEvent.findAll({ where: { userAddress }, order: [['createdAt', 'DESC']] });
    return dbEvents.map(e => JSON.parse(e.eventData));
  } catch (err) {
    // Handle error
    return [];
  }
}

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