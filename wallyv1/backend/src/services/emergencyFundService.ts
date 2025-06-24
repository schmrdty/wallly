// Emergency Fund Service
import { WallyService } from './wallyService.js';
import { EmergencyFundConfig } from '../types/automation.js';

export const emergencyFundService = {
    async topUpFund(config: EmergencyFundConfig, wallyService: WallyService): Promise<boolean> {
        const { walletAddress, metadata } = config;
        const { monthlyContribution, targetAmount, currentAmount } = metadata;

        const hasPermission = await wallyService.validatePermissions(walletAddress);
        if (!hasPermission) return false;

        // Only top up if we haven't reached target
        const current = parseFloat(currentAmount);
        const target = parseFloat(targetAmount);

        if (current >= target) return false;

        const transfer = {
            wallet: walletAddress,
            token: '0x0000000000000000000000000000000000000000', // Native token by default
            recipient: walletAddress, // Self-transfer to designated fund wallet
            amount: monthlyContribution
        };

        await wallyService.executeTransfer(transfer);
        return true;
    }
};
