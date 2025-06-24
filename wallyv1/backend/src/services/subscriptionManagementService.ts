// Subscription Management Service
import { WallyService } from './wallyService.js';
import { SubscriptionConfig } from '../types/automation.js';
import cron from 'node-cron';
import {
    validateSubscriptionConfig,
    calculateNextPaymentDate,
    checkSubscriptionHealth
} from '../utils/subscriptionManagementHelpers.js';

export const subscriptionManagementService = {
    schedulePayment(config: SubscriptionConfig, wallyService: WallyService) {
        const cronExp = subscriptionManagementService.getCronExpression(config.metadata);
        return cron.schedule(cronExp, async () => {
            await wallyService.executeTransfer({
                wallet: config.walletAddress,
                token: '0x0000000000000000000000000000000000000000', // Native token by default
                recipient: config.metadata.recipientAddress,
                amount: config.metadata.amount
            });
        });
    },

    getCronExpression(metadata: SubscriptionConfig['metadata']): string {
        const { frequency, dayOfMonth = 1, monthOfYear } = metadata;

        if (frequency === 'monthly') {
            return `0 0 ${dayOfMonth} * *`; // Run at midnight on specified day each month
        } else if (frequency === 'yearly') {
            const month = monthOfYear || 1;
            return `0 0 ${dayOfMonth} ${month} *`; // Run at midnight on specified day and month each year
        }

        return '0 0 1 * *'; // Default to monthly on 1st
    }
};
