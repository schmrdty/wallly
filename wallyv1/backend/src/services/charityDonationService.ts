// Charity Donation Service
import { WallyService } from './wallyService.js';
import { CharityConfig } from '../types/automation.js';

export const charityDonationService = {
    async donate(config: CharityConfig, wallyService: WallyService): Promise<boolean> {
        const { walletAddress, metadata } = config;
        const { charityAddress, amount } = metadata;

        const hasPermission = await wallyService.validatePermissions(walletAddress);
        if (!hasPermission) return false;

        const transfer = {
            wallet: walletAddress,
            token: '0x0000000000000000000000000000000000000000', // Native token by default
            recipient: charityAddress,
            amount: amount || '0'
        };

        await wallyService.executeTransfer(transfer);
        return true;
    }
};
