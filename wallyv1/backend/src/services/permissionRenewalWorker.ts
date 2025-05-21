import redisClient from '../../db/redisClient';
import { WallyService } from './wallyService';

const wallyService = new WallyService();

export async function processScheduledRenewals() {
  const keys = await redisClient.keys('scheduledRenew:*');
  const now = Date.now();

  for (const key of keys) {
    const data = JSON.parse(await redisClient.get(key));
    if (data.renewAt <= now) {
      const purgeMode = await redisClient.get(`purgeMode:${data.userId}`);
      // Always keep minimal metadata
      const minimalMetadata = {
        event: 'PermissionRevokedOrPurged',
        userId: data.userId,
        oracleTimestamp: data.oracleTimestamp || null,
        revokedAt: now,
        transactionHash: data.transactionHash || null,
        createdAt: now
      };
      await redisClient.lPush('userMetadataBackup', JSON.stringify(minimalMetadata));
      await redisClient.lPush(`userMetadata:${data.userId}`, JSON.stringify(minimalMetadata));

      if (purgeMode === 'true') {
        // Delete audit logs immediately on revoke/expiry
        await redisClient.del(`userEvents:${data.userId}`);
      } else {
        // Set a 30-day TTL for audit logs if not already set
        await redisClient.expire(`userEvents:${data.userId}`, 30 * 24 * 60 * 60);
      }
      // Remove the scheduled renewal
      await redisClient.del(key);
      continue;
    }
    // Otherwise, renew permission as usual
    await wallyService.grantPermissionOnChain(data.args);
    await wallyService.handleUserDataOnRenew(data.userId);
    await redisClient.del(key);
  }
}

// Schedule this function with setInterval or a cron job