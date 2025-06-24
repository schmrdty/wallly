import { createConnector } from 'wagmi';

export function farcasterFrameConnector() {
    return createConnector((config) => ({
        id: 'farcaster-frame',
        name: 'Farcaster Frame',
        type: 'injected',

        async connect() {
            try {
                // Check for injected provider (MetaMask, etc.)
                const provider = (window as any).ethereum;
                if (!provider) {
                    throw new Error('No Ethereum provider available');
                }

                // Request accounts
                const accounts = await provider.request({
                    method: 'eth_requestAccounts',
                }) as string[];

                if (!accounts.length) {
                    throw new Error('No accounts available');
                }

                // Get chain ID
                const chainId = await provider.request({
                    method: 'eth_chainId',
                }) as string;

                return {
                    accounts: accounts as `0x${string}`[],
                    chainId: parseInt(chainId, 16),
                };
            } catch (error) {
                console.error('Farcaster connector error:', error);
                throw error;
            }
        },

        async disconnect() {
            // Standard wallets don't need explicit disconnect
        },

        async getAccounts() {
            const provider = (window as any).ethereum;
            if (!provider) return [];

            try {
                const accounts = await provider.request({
                    method: 'eth_accounts',
                }) as string[];

                return accounts as `0x${string}`[];
            } catch {
                return [];
            }
        },

        async getChainId() {
            const provider = (window as any).ethereum;
            if (!provider) throw new Error('No provider available');

            const chainId = await provider.request({
                method: 'eth_chainId',
            }) as string;

            return parseInt(chainId, 16);
        },

        async getProvider() {
            return (window as any).ethereum;
        },

        async isAuthorized() {
            try {
                const accounts = await this.getAccounts();
                return accounts.length > 0;
            } catch {
                return false;
            }
        }, async switchChain({ chainId }) {
            const provider = (window as any).ethereum;
            if (!provider) throw new Error('No provider available');

            await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }],
            });

            const chain = config.chains.find((chain) => chain.id === chainId);
            if (!chain) throw new Error(`Chain with id ${chainId} not found`);
            return chain;
        },

        onAccountsChanged(accounts) {
            if (accounts.length === 0) {
                config.emitter.emit('disconnect');
            } else {
                config.emitter.emit('change', {
                    accounts: accounts as `0x${string}`[],
                });
            }
        },

        onChainChanged(chainId) {
            config.emitter.emit('change', {
                chainId: parseInt(chainId as string, 16),
            });
        }, async onConnect(connectInfo) {
            const chainId = parseInt(connectInfo.chainId as string, 16);
            const accounts = await this.getAccounts();
            config.emitter.emit('connect', { accounts, chainId });
        },

        onDisconnect() {
            config.emitter.emit('disconnect');
        },
    }));
}
