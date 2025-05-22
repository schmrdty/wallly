import { sendInAppNotification } from './notificationServices';
import { Permission } from '../db/models';
import redisClient from '../db/redisClient';

export async function checkExpiriesAndNotify() {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;

  const permissions = await Permission.findAll({ where: { isActive: true } });
  for (const perm of permissions) {
    const expiresAt = new Date(perm.expiresAt).getTime();
    const timeLeft = expiresAt - now;
    const prefs = await redisClient.get(`userPrefs:${perm.userAddress}`);
    const parsedPrefs = prefs ? JSON.parse(prefs) : { reminderOption: 'both' };

    if ((parsedPrefs.reminderOption === 'both' || parsedPrefs.reminderOption === '1day') && timeLeft < oneDay) {
      await sendInAppNotification(perm.userAddress, 'Wally Reminders:', 'Wally loses sight and access in 1 day.');
    }
    if ((parsedPrefs.reminderOption === 'both' || parsedPrefs.reminderOption === '1week') && timeLeft < oneWeek) {
      await sendInAppNotification(perm.userAddress, 'Wally Reminders:', 'Wally loses sight and access in 1 week.');
    }
  }
}