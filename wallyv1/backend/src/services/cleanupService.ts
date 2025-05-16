import redisClient from '../../db/redisClient';
import { deliverUserDataBeforeCleanup } from './wallyService';

// Get user delivery preferences and contact info from DB/session
async function getUserContactAndPrefs(userAddress: string) {
  // Replace with real DB/session lookup
  return {
    deliveryMethods: ['email', 'telegram'],
    userContact: {
      email: 'user@example.com',
      telegramId: '123456789',
      warpcastFid: undefined,
    },
  };
}

export async function cleanupUser(userAddress: string) {
  const { deliveryMethods, userContact } = await getUserContactAndPrefs(userAddress);
  const userEvents = await redisClient.lRange(`userEvents:${userAddress}`, 0, -1);
  const userData = userEvents.map(e => JSON.parse(e)).join('\n');
  await deliverUserDataBeforeCleanup(userAddress, deliveryMethods, userData, userContact);

  // Remove all but minimal metadata
  await redisClient.del(`userEvents:${userAddress}`);
  await redisClient.set(`userMinimal:${userAddress}`, JSON.stringify({
    wallet: userAddress,
    revokedAt: Date.now(),
  }));
}

export async function deliverUserDataBeforeCleanup(
    userAddress: string,
    deliveryMethods: string[],
    userData: string,
    userContact: { email?: string; telegramId?: string; warpcastFid?: string }
) {
    for (const method of deliveryMethods) {
        if (method === 'email' && userContact.email) {
            await sendEmail(userContact.email, 'Your Wally Data', userData);
        }
        if (method === 'telegram' && userContact.telegramId) {
            await sendTelegram(userContact.telegramId, userData);
        }
        if (method === 'warpcast' && userContact.warpcastFid) {
            await sendWarpcast(userContact.warpcastFid, userData);
        }
    }
}
/**
 * Wipe all user data from Redis except minimal metadata after revoke/expiry.
 * Keeps: earliest oracle/block timestamp, revoke date, wallet address, and delivery method(s).
 */
async wipeUserDataExceptMetadata(userAddress: string, event: any) {
    const events = await redisClient.lRange(`userEvents:${userAddress}`, 0, -1);
    let earliestOracle = null;
    let earliestBlock = null;
    for (const e of events) {
        try {
            const parsed = JSON.parse(e);
            if (parsed.oracleTimestamp && (!earliestOracle || parsed.oracleTimestamp < earliestOracle)) {
                earliestOracle = parsed.oracleTimestamp;
            }
            if (parsed.blockTimestamp && (!earliestBlock || parsed.blockTimestamp < earliestBlock)) {
                earliestBlock = parsed.blockTimestamp;
            }
        } catch {}
    }
    const deliveryMethods = await redisClient.get(`deliveryMethods:${userAddress}`) || 'unknown';
    await redisClient.del(`userEvents:${userAddress}`);
    await redisClient.del(`notifications:${userAddress}`);
    await redisClient.set(`userMinimal:${userAddress}`, JSON.stringify({
        wallet: userAddress,
        revokedAt: Date.now(),
        earliestOracle,
        earliestBlock,
        deliveryMethods
    }));
}