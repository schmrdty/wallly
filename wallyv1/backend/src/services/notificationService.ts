import axios from 'axios';
import redisClient from '../db/redisClient.js';
import logger from '../infra/mon/logger.js';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
  data?: Record<string, any>;
}

export interface FarcasterNotificationPayload {
  notificationId: string;
  title: string;
  body: string;
  targetUrl: string;
  tokens: string[];
}

class NotificationService {
  /**
   * Send a Farcaster frame notification
   */
  async sendFarcasterNotification(
    tokens: string[],
    title: string,
    body: string,
    targetUrl: string
  ): Promise<any> {
    const payload: FarcasterNotificationPayload = {
      notificationId: `wally-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      body,
      targetUrl,
      tokens,
    };

    try {
      const response = await axios.post(
        'https://api.farcaster.xyz/v1/frame-notifications',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.FARCASTER_API_KEY}`,
          },
          timeout: 10000,
        }
      );

      logger.info('Farcaster notification sent successfully:', {
        notificationId: payload.notificationId,
        tokens: tokens.length,
        title,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to send Farcaster notification:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * Send an in-app notification
   */
  async sendInAppNotification(
    userAddress: string,
    title: string,
    message: string,
    type: NotificationData['type'] = 'info',
    data?: Record<string, any>
  ): Promise<void> {
    const notification: NotificationData = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false,
      data,
    };

    try {
      // Store in Redis
      await redisClient.lPush(
        `notifications:${userAddress}`,
        JSON.stringify(notification)
      );

      // Keep only last 100 notifications
      await redisClient.lTrim(`notifications:${userAddress}`, 0, 99);

      // Set expiration (30 days)
      await redisClient.expire(`notifications:${userAddress}`, 60 * 60 * 24 * 30);

      logger.info('In-app notification sent:', {
        userAddress,
        title,
        type,
        notificationId: notification.id,
      });

      // TODO: Send real-time notification via WebSocket/SSE if connected
      // await this.sendRealTimeNotification(userAddress, notification);
    } catch (error) {
      logger.error('Failed to send in-app notification:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userAddress: string,
    limit = 50,
    offset = 0
  ): Promise<NotificationData[]> {
    try {
      const notifications = await redisClient.lRange(
        `notifications:${userAddress}`,
        offset,
        offset + limit - 1
      );

      return notifications.map((notif) => JSON.parse(notif));
    } catch (error) {
      logger.error('Failed to get user notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(
    userAddress: string,
    notificationId: string
  ): Promise<boolean> {
    try {
      const notifications = await redisClient.lRange(`notifications:${userAddress}`, 0, -1);

      for (let i = 0; i < notifications.length; i++) {
        const notif: NotificationData = JSON.parse(notifications[i]);

        if (notif.id === notificationId) {
          notif.read = true;
          await redisClient.lSet(`notifications:${userAddress}`, i, JSON.stringify(notif));
          logger.info('Notification marked as read:', { userAddress, notificationId });
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(userAddress: string): Promise<void> {
    try {
      const notifications = await redisClient.lRange(`notifications:${userAddress}`, 0, -1);

      const updatedNotifications = notifications.map((notif) => {
        const parsed: NotificationData = JSON.parse(notif);
        parsed.read = true;
        return JSON.stringify(parsed);
      });

      // Clear and repopulate
      await redisClient.del(`notifications:${userAddress}`);
      if (updatedNotifications.length > 0) {
        await redisClient.rPush(`notifications:${userAddress}`, updatedNotifications);
      }

      logger.info('All notifications marked as read:', { userAddress });
    } catch (error) {
      logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userAddress: string): Promise<number> {
    try {
      const notifications = await redisClient.lRange(`notifications:${userAddress}`, 0, -1);

      return notifications.filter((notif) => {
        const parsed: NotificationData = JSON.parse(notif);
        return !parsed.read;
      }).length;
    } catch (error) {
      logger.error('Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(
    userAddress: string,
    notificationId: string
  ): Promise<boolean> {
    try {
      const notifications = await redisClient.lRange(`notifications:${userAddress}`, 0, -1);

      for (const notif of notifications) {
        const parsed: NotificationData = JSON.parse(notif);

        if (parsed.id === notificationId) {
          await redisClient.lRem(`notifications:${userAddress}`, 1, notif);
          logger.info('Notification deleted:', { userAddress, notificationId });
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Failed to delete notification:', error);
      return false;
    }
  }

  /**
   * Send notification for permission expiry
   */
  async sendExpiryNotification(
    userAddress: string,
    timeUntilExpiry: string,
    userPreferences?: { reminderOption?: string }
  ): Promise<void> {
    const title = 'Wally Permission Expiring';
    const message = `Your Wally permissions will expire in ${timeUntilExpiry}. Renew to continue automated transfers.`;

    await this.sendInAppNotification(userAddress, title, message, 'warning', {
      type: 'permission_expiry',
      timeUntilExpiry,
    });

    // Send Farcaster notification if user has tokens
    // TODO: Get user's Farcaster tokens from database
    // const userTokens = await getUserFarcasterTokens(userAddress);
    // if (userTokens.length > 0) {
    //   await this.sendFarcasterNotification(
    //     userTokens,
    //     title,
    //     message,
    //     `${process.env.NEXT_PUBLIC_APP_URL}/permissions`
    //   );
    // }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    notifications: Array<{
      userAddress: string;
      title: string;
      message: string;
      type?: NotificationData['type'];
      data?: Record<string, any>;
    }>
  ): Promise<void> {
    const promises = notifications.map((notif) =>
      this.sendInAppNotification(
        notif.userAddress,
        notif.title,
        notif.message,
        notif.type,
        notif.data
      )
    );

    try {
      await Promise.allSettled(promises);
      logger.info(`Bulk notifications sent: ${notifications.length} notifications`);
    } catch (error) {
      logger.error('Failed to send bulk notifications:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
