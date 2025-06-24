import { AutomationConfig, UserPermission, MiniAppSession, TransferRequest } from '../types/automation.js';
import { publicClient } from '../lib/publicClient.js';

export class WallyService {
    // Example: Replace with real API endpoints or on-chain logic as needed
    async getUserPermission(wallet: string): Promise<UserPermission> {
        // Fetch from backend or contract
        return fetch(`/api/permissions/${wallet}`).then(r => r.json());
    }

    async getMiniAppSession(wallet: string): Promise<MiniAppSession> {
        return fetch(`/api/sessions/${wallet}`).then(r => r.json());
    }

    async executeTransfer(transfer: TransferRequest): Promise<any> {
        // Call backend or contract
        return fetch('/api/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transfer)
        }).then(r => r.json());
    }

    async executeBatchTransfer(transfers: TransferRequest[]): Promise<any> {
        return fetch('/api/batch-transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transfers })
        }).then(r => r.json());
    }

    async validatePermissions(wallet: string): Promise<boolean> {
        try {
            const result = await this.getUserPermission(wallet);
            return result.isActive;
        } catch {
            return false;
        }
    }
}
