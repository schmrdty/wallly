import { erc20Abi, PublicClient, parseUnits, zeroAddress } from 'viem';
import { WallyService } from '../services/wallyService.js';

interface AutoSaveConfig {
    id: string;
    enabled: boolean;
    walletAddress: string;
    metadata: {
        thresholdAmount: string;
        targetSavingsAddress: string;
        tokenAddress: string;
        checkInterval: number;
    };
}

export class AutoSaveAutomation {
    private wallyService: WallyService;
    private publicClient: PublicClient;
    private intervals: Map<string, NodeJS.Timeout> = new Map();

    constructor(wallyService: WallyService, publicClient: PublicClient) {
        this.wallyService = wallyService;
        this.publicClient = publicClient;
    }

    async start(config: AutoSaveConfig): Promise<void> {
        if (this.intervals.has(config.id)) return;
        const interval = setInterval(async () => {
            await this.checkAndExecute(config);
        }, config.metadata.checkInterval * 1000);
        this.intervals.set(config.id, interval);
    }

    stop(configId: string): void {
        const interval = this.intervals.get(configId);
        if (interval) clearInterval(interval);
        this.intervals.delete(configId);
    }

    private async checkAndExecute(config: AutoSaveConfig): Promise<void> {
        const { walletAddress, metadata } = config;
        const { thresholdAmount, targetSavingsAddress, tokenAddress } = metadata;
        const hasPermission = await this.wallyService.validatePermissions(walletAddress);
        if (!hasPermission) return; let balance: bigint;
        if (tokenAddress === zeroAddress) {
            balance = await this.publicClient.getBalance({ address: walletAddress as `0x${string}` });
        } else {
            // ERC20 balance
            balance = await this.publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [walletAddress as `0x${string}`]
            });
        }
        const threshold = parseUnits(thresholdAmount, 18);
        if (balance > threshold) {
            // Execute transfer
            // ...
            // Log execution
            await this.logAutomationExecution(config.id, 'txHash', thresholdAmount);
        }
    }

    private async logAutomationExecution(configId: string, txHash: string, amount: string): Promise<void> {
        console.log(`Automation ${configId} executed: ${txHash}, amount: ${amount}`);
    }
};
