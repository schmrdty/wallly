// Zero-Out Old Wallet Helpers
export const zeroOutOldWalletHelpers = {
    sortAssetsByPriority(assets: any[], order: string): any[] {
        if (order === 'value') {
            return [...assets].sort((a, b) => b.valueUSD - a.valueUSD);
        } else if (order === 'gas-efficient') {
            return [...assets].sort((a, b) => Number(a.gasEstimate) - Number(b.gasEstimate));
        } else if (order === 'type') {
            return [...assets].sort((a, b) => a.type.localeCompare(b.type));
        }
        return assets;
    },
    formatAsset(asset: any): string {
        return `${asset.symbol || asset.type}: ${asset.balance}`;
    }
};
