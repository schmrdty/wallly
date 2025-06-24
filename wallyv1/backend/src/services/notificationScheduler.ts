import { notificationService } from './notificationService.js';
import redisClient from '../db/redisClient.js';
import logger from '../infra/mon/logger.js';

interface UserPermission {
  userAddress: string;
  expiresAt: number;
  isActive: boolean;
}

interface UserPreferences {
  reminderOption: '1day' | '1week' | 'both' | 'none';
  enableFarcasterNotifications: boolean;
  enableInAppNotifications: boolean;
}

class NotificationScheduler {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour

  /**
   * Start the notification scheduler
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Notification scheduler is already running');
      return;
    }

    this.intervalId = setInterval(() => {
      this.checkExpiriesAndNotify().catch(error => {
        logger.error('Error in notification scheduler:', error);
      });
    }, this.CHECK_INTERVAL);

    this.isRunning = true;
    logger.info('✅ Notification scheduler started');
  }

  /**
   * Stop the notification scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Notification scheduler stopped');
  }

  /**
   * Check for expiring permissions and send notifications
   */
  async checkExpiriesAndNotify(): Promise<void> {
    try {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const oneWeek = 7 * oneDay;

      logger.info('Starting expiry check for notifications');

      // Get all active permissions from Redis
      const permissions = await this.getActivePermissions();

      let notificationsSent = 0;

      for (const permission of permissions) {
        const expiresAt = permission.expiresAt;
        const timeLeft = expiresAt - now;

        // Skip if already expired
        if (timeLeft <= 0) {
          await this.handleExpiredPermission(permission);
          continue;
        }

        // Get user preferences
        const preferences = await this.getUserPreferences(permission.userAddress);

        // Check if notifications are enabled
        if (!preferences.enableInAppNotifications && !preferences.enableFarcasterNotifications) {
          continue;
        }

        // Send 1-day reminder
        if (timeLeft <= oneDay && timeLeft > (oneDay - this.CHECK_INTERVAL)) {
          if (preferences.reminderOption === '1day' || preferences.reminderOption === 'both') {
            await this.sendExpiryReminder(permission.userAddress, '1 day', timeLeft);
            notificationsSent++;
          }
        }

        // Send 1-week reminder
        if (timeLeft <= oneWeek && timeLeft > (oneWeek - this.CHECK_INTERVAL)) {
          if (preferences.reminderOption === '1week' || preferences.reminderOption === 'both') {
            await this.sendExpiryReminder(permission.userAddress, '1 week', timeLeft);
            notificationsSent++;
          }
        }
      }

      logger.info(`Expiry check completed. Notifications sent: ${notificationsSent}`);
    } catch (error) {
      logger.error('Error checking expiries:', error);
      throw error;
    }
  }

  /**
   * Get active permissions from Redis or database
   */
  private async getActivePermissions(): Promise<UserPermission[]> {
    try {
      // Try to get from Redis cache first
      const cachedPermissions = await redisClient.get('activePermissions');

      if (cachedPermissions) {
        return JSON.parse(cachedPermissions);
      }

      // TODO: Replace with actual database query
      // For now, get from Redis user events to find active permissions
      const keys = await redisClient.keys('userEvents:*');
      const permissions: UserPermission[] = [];

      for (const key of keys) {
        const userAddress = key.replace('userEvents:', '');
        const events = await redisClient.lRange(key, 0, 10);

        // Find the latest PermissionGranted event
        for (const eventStr of events) {
          const event = JSON.parse(eventStr);
          if (event.event === 'PermissionGranted' && event.expiresAt) {
            permissions.push({
              userAddress,
              expiresAt: parseInt(event.expiresAt),
              isActive: true,
            });
            break;
          }
        }
      }

      // Cache for 30 minutes
      await redisClient.setEx('activePermissions', 30 * 60, JSON.stringify(permissions));

      return permissions;
    } catch (error) {
      logger.error('Failed to get active permissions:', error);
      return [];
    }
  }

  /**
   * Get user notification preferences
   */
  private async getUserPreferences(userAddress: string): Promise<UserPreferences> {
    try {
      const prefs = await redisClient.get(`userPrefs:${userAddress}`);

      if (prefs) {
        return JSON.parse(prefs);
      }

      // Default preferences
      return {
        reminderOption: 'both',
        enableFarcasterNotifications: true,
        enableInAppNotifications: true,
      };
    } catch (error) {
      logger.error('Failed to get user preferences:', error);
      return {
        reminderOption: 'both',
        enableFarcasterNotifications: true,
        enableInAppNotifications: true,
      };
    }
  }

  /**
   * Send expiry reminder notification
   */
  private async sendExpiryReminder(
    userAddress: string,
    timeDescription: string,
    timeLeftMs: number
  ): Promise<void> {
    try {
      // Check if we already sent this reminder recently
      const reminderKey = `reminder:${userAddress}:${timeDescription}`;
      const alreadySent = await redisClient.get(reminderKey);

      if (alreadySent) {
        return; // Already sent this reminder
      }

      await notificationService.sendExpiryNotification(userAddress, timeDescription);

      // Mark as sent (expires in 25 hours to prevent duplicate 1-day reminders)
      await redisClient.setEx(reminderKey, 25 * 60 * 60, 'sent');

      logger.info('Expiry reminder sent:', { userAddress, timeDescription });
    } catch (error) {
      logger.error('Failed to send expiry reminder:', error);
    }
  }

  /**
   * Handle expired permissions
   */
  private async handleExpiredPermission(permission: UserPermission): Promise<void> {
    try {
      await notificationService.sendInAppNotification(
        permission.userAddress,
        'Permission Expired',
        'Your Wally permissions have expired. Renew to continue using automated transfers.',
        'error',
        { type: 'permission_expired' }
      );

      logger.info('Expired permission notification sent:', {
        userAddress: permission.userAddress
      });
    } catch (error) {
      logger.error('Failed to handle expired permission:', error);
    }
  }

  /**
   * Manually trigger expiry check (for testing)
   */
  async triggerExpiryCheck(): Promise<void> {
    await this.checkExpiriesAndNotify();
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userAddress: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    try {
      const currentPrefs = await this.getUserPreferences(userAddress);
      const updatedPrefs = { ...currentPrefs, ...preferences };

      await redisClient.set(
        `userPrefs:${userAddress}`,
        JSON.stringify(updatedPrefs)
      );

      logger.info('User preferences updated:', { userAddress, preferences });
    } catch (error) {
      logger.error('Failed to update user preferences:', error);
      throw error;
    }
  }

  isSchedulerRunning(): boolean {
    return this.isRunning;
  }
}

export const notificationScheduler = new NotificationScheduler();
export default notificationScheduler;
