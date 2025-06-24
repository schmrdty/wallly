// Bill Payment Service
import { WallyService } from './wallyService.js';
import { BillConfig } from '../types/automation.js';

export const billPaymentService = {
    async payBill(config: BillConfig, wallyService: WallyService): Promise<boolean> {
        const { walletAddress, metadata } = config;
        const { recipientAddress, amount } = metadata;
        const transfer = {
            wallet: walletAddress,
            token: '0x0000000000000000000000000000000000000000', // Native token by default
            recipient: recipientAddress,
            amount: amount
        };

        await wallyService.executeTransfer(transfer);
        return true;
    }
};
