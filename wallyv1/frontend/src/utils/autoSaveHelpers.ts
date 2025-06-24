// Auto-Save Flow Helpers
import { ethers } from 'ethers';
import { AutomationConfig } from '../types/automation.js';

export const autoSaveHelpers = {
    formatThreshold(thresholdAmount: string): string {
        return `${Number(thresholdAmount).toLocaleString()} tokens`;
    },
    getNextCheckTime(config: AutomationConfig): Date {
        return new Date(Date.now() + (config.metadata?.checkInterval || 3600) * 1000);
    }
};
