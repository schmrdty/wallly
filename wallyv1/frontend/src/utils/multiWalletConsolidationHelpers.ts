// Multi-Wallet Consolidation Flow Helpers
export const multiWalletConsolidationHelpers = {
    getActiveWallets(wallets: any[]): any[] {
        return wallets.filter(w => w.enabled);
    },
    formatAmount(amount: string): string {
        return `${Number(amount).toLocaleString()} tokens`;
    }
};
