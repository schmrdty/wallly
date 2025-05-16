import { ethers } from 'ethers';
import { wallyv1Address } from '../config';
import WallyV1 from '../routes/abis/wallyv1.json';
import { fuzzyFindTokenByAddress } from './tokenListService';
import redisClient from '../../db/redisClient';
import { sendEmail, sendTelegram, sendWarpcast } from './notificationService';

/**
 * WallyService: Handles contract interactions for token/NFT forwarding and session/permission logic.
 * Uses only contract methods present in the ABI and ensures all actions are session-aware and safe.
 * Never takes custody of user funds except for relayer fee scenarios, which are handled separately.
 */
export class WallyService {
    private provider: ethers.providers.JsonRpcProvider;
    private contract: ethers.Contract;

    constructor() {
        this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
        this.contract = new ethers.Contract(wallyv1Address, WallyV1, this.provider);
    }

    /**
     * Forward all eligible tokens for a user using the contract's triggerTransfers method.
     * Only works if the user's session/permission is valid and allowEntireWallet is true.
     * Never takes custody of user funds.
     */
    async transferTokens(userAddress: string) {
        // Session/permission checks should be handled in the controller/service layer before calling this.
        try {
            const signer = this.provider.getSigner(userAddress);
            const tx = await this.contract.connect(signer).triggerTransfers(userAddress);
            await tx.wait();
            return { success: true, transactionHash: tx.hash };
        } catch (err: any) {
            return { success: false, error: err?.reason || err?.message || 'Unknown error' };
        }
    }

    /**
     * Get ERC20 token balance for a user.
     */
    async getTokenBalance(userAddress: string, tokenAddress: string) {
        const token = fuzzyFindTokenByAddress(tokenAddress);
        if (!token || token.address.toLowerCase() !== tokenAddress.toLowerCase()) {
            throw new Error('Invalid token address');
        }
        // Use standard ERC20 ABI for balanceOf
        const erc20Abi = [
            "function balanceOf(address owner) view returns (uint256)",
            "function decimals() view returns (uint8)"
        ];
        const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
        const balance = await contract.balanceOf(userAddress);
        const decimals = token.decimals || (await contract.decimals());
        return ethers.utils.formatUnits(balance, decimals);
    }

    /**
     * Get ERC721/1155 NFT balance for a user (future support).
     */
    async getNFTBalance(userAddress: string, tokenAddress: string) {
        // Use ERC721 ABI for balanceOf
        const erc721Abi = [
            "function balanceOf(address owner) view returns (uint256)"
        ];
        const contract = new ethers.Contract(tokenAddress, erc721Abi, this.provider);
        const balance = await contract.balanceOf(userAddress);
        return balance.toString();
    }

    /**
     * Get all NFTs owned by a user for a given ERC721 contract (future support).
     */
    async getNFTs(userAddress: string, tokenAddress: string) {
        // Use ERC721 Enumerable ABI
        const erc721Abi = [
            "function balanceOf(address owner) view returns (uint256)",
            "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
            "function tokenURI(uint256 tokenId) view returns (string)"
        ];
        const contract = new ethers.Contract(tokenAddress, erc721Abi, this.provider);
        const balance = await contract.balanceOf(userAddress);
        const nfts = [];
        for (let i = 0; i < balance.toNumber(); i++) {
            const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
            let metadata = {};
            try {
                const tokenURI = await contract.tokenURI(tokenId);
                metadata = await fetch(tokenURI).then(res => res.json());
            } catch {
                // Ignore metadata fetch errors
            }
            nfts.push({ tokenId: tokenId.toString(), metadata });
        }
        return nfts;
    }

    /**
     * Listen for contract events and handle them (e.g., for notifications, DB updates).
     * In-app notifications are sent only on permission granted and revoked.
     * User data is wiped from Redis except for minimal metadata after revoke/expiry.
     */
    listenForEvents() {
        // TransferPerformed event
        this.contract.on('TransferPerformed', async (
            user, token, amount, destination, userRemaining, oracleTimestamp, blockTimestamp, event
        ) => {
            await this.handleEvent({
                event: 'TransferPerformed',
                user,
                token,
                amount,
                destination,
                userRemaining,
                oracleTimestamp,
                blockTimestamp,
                transactionHash: event.transactionHash
            });
        });

        // MiniAppSessionGranted event
        this.contract.on('MiniAppSessionGranted', async (
            user, delegate, tokens, allowEntireWallet, expiresAt, event
        ) => {
            await this.handleEvent({
                event: 'MiniAppSessionGranted',
                user,
                delegate,
                tokens,
                allowEntireWallet,
                expiresAt,
                transactionHash: event.transactionHash
            });
        });

        // PermissionGranted event (in-app notification)
        this.contract.on('PermissionGranted', async (
            user, withdrawalAddress, allowEntireWallet, expiresAt, tokenList, minBalances, limits, event
        ) => {
            await this.handleEvent({
                event: 'PermissionGranted',
                user,
                withdrawalAddress,
                allowEntireWallet,
                expiresAt,
                tokenList,
                minBalances,
                limits,
                transactionHash: event.transactionHash
            });
            await this.sendInAppNotification(user, 'Permission granted', 'Your permission has been granted.');
        });

        // PermissionRevoked event (in-app notification + data wipe)
        this.contract.on('PermissionRevoked', async (
            user, event
        ) => {
            await this.handleEvent({
                event: 'PermissionRevoked',
                user,
                transactionHash: event.transactionHash
            });
            await this.sendInAppNotification(user, 'Permission revoked', 'Your permission has been revoked.');
            await this.wipeUserDataExceptMetadata(user, event);
        });
    }

    /**
     * Handle contract events (to be extended for notifications, DB, etc).
     */
    async handleEvent(event: any) {
        console.log('Contract Event:', event);
        if (event.user) {
            await redisClient.lPush(`userEvents:${event.user}`, JSON.stringify({
                ...event,
                createdAt: Date.now()
            }));
        }
    }

    async startWatchingToken(userAddress: string, tokenAddress: string) {
        // Fetch current permission
        const permission = await this.contract.getUserPermission(userAddress);
        let tokenList = permission.tokenList.map((addr: string) => addr.toLowerCase());
        if (!tokenList.includes(tokenAddress.toLowerCase())) {
            tokenList.push(tokenAddress.toLowerCase());
        }
        // Call contract to update permission (assume withdrawalAddress, allowEntireWallet, expiresAt, minBalances, limits are unchanged)
        const signer = this.provider.getSigner(userAddress);
        await this.contract.connect(signer).grantOrUpdatePermission(
            permission.withdrawalAddress,
            false, // allowEntireWallet
            permission.expiresAt,
            tokenList,
            permission.minBalances,
            permission.limits
        );
        // Optionally update in Redis/DB as well
    }

    async stopWatchingToken(userAddress: string, tokenAddress: string) {
        const permission = await this.contract.getUserPermission(userAddress);
        let tokenList = permission.tokenList.map((addr: string) => addr.toLowerCase());
        tokenList = tokenList.filter((addr: string) => addr !== tokenAddress.toLowerCase());
        const signer = this.provider.getSigner(userAddress);
        await this.contract.connect(signer).grantOrUpdatePermission(
            permission.withdrawalAddress,
            false,
            permission.expiresAt,
            tokenList,
            permission.minBalances,
            permission.limits
        );
        // Optionally update in Redis/DB as well
    }

    /**
     * Send an in-app notification to the user.
     */
    async sendInAppNotification(userAddress: string, title: string, message: string) {
        await redisClient.lPush(`notifications:${userAddress}`, JSON.stringify({
            title,
            message,
            timestamp: Date.now()
        }));
    }

        async miniAppTriggerTransfers(userAddress: string) {
        const signer = this.provider.getSigner(userAddress);
        const tx = await this.contract.connect(signer).miniAppTriggerTransfers(userAddress);
        await tx.wait();
        return { success: true, transactionHash: tx.hash };
    }
    async batchTransferTokens(userAddress: string, transfers: Array<{token: string, to: string, amount: string, data?: string}>) {
        // Each transfer: {token, to, amount, data}
        // ABI: executeBatch((address target, uint256 value, bytes data)[])
        const calls = transfers.map(t => ({
            target: t.token,
            value: ethers.utils.parseEther(t.amount),
            data: t.data || '0x'
        }));
        const signer = this.provider.getSigner(userAddress);
        const tx = await this.contract.connect(signer).executeBatch(calls);
        await tx.wait();
        return { success: true, transactionHash: tx.hash };
    }

    async metaTransferTokens(userAddress: string, metaTxData: any) {
        // ABI: executeMetaTx(address from, address to, uint256 value, bytes data, uint256 fee, address feeToken, address relayer, uint256 nonce, bytes signature)
        const signer = this.provider.getSigner(userAddress);
        const tx = await this.contract.connect(signer).executeMetaTx(
            metaTxData.from,
            metaTxData.to,
            ethers.utils.parseEther(metaTxData.value),
            metaTxData.data || '0x',
            ethers.utils.parseEther(metaTxData.fee),
            metaTxData.feeToken,
            metaTxData.relayer,
            metaTxData.nonce,
            metaTxData.signature
        );
        await tx.wait();
        return { success: true, transactionHash: tx.hash };
    }
}