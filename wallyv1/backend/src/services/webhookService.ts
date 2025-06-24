import type { NeynarWebhookEvent } from '../types/index.js';
import { handleERC20Transfer, handleNativeTransfer, handleContractInteraction, handleWalletAlert, handleAutoForwarding } from './blockchainService.js';

export async function processWebhookEvent(event: NeynarWebhookEvent): Promise<void> {
    switch (event.type) {
        case 'erc20_transfer':
            await handleERC20Transfer(event.payload);
            break;
        case 'native_transfer':
            await handleNativeTransfer(event.payload);
            break;
        case 'contract_interaction':
            await handleContractInteraction(event.payload);
            break;
        case 'wallet_activity_alert':
            await handleWalletAlert(event.payload);
            break;
        case 'auto_forwarding':
            await handleAutoForwarding(event.payload);
            break;
        default:
            console.warn('Unhandled webhook event type:', event.type);
            throw new Error('Unhandled webhook event type');
    }
}
