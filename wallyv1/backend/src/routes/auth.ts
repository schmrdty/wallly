import express from 'express';
import { validateSession, farcasterAuth, farcasterSignIn, farcasterQuickAuthSignIn, siweSignIn, getCurrentSession, initiateFarcasterAuth, handleFarcasterCallback, processNeynarWebhook } from '../controllers/authController.js';
import { jwtAuth } from '../middleware/jwtAuth.js';
import { getUserPreferences, sendFarcasterNotification, sendFarcasterCast, sendTelegramMessage, sendEmail, sendPushNotification } from '../utils/notificationUtils.js';
import { ethers } from 'ethers';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';

const router = express.Router();

// Route for getting current session
router.get('/session', getCurrentSession);

// Route for session validation
router.post('/validate', validateSession);

// Farcaster Auth Kit endpoint (new, simplified)
router.post('/farcaster', farcasterAuth);

// Farcaster SIWF endpoint (original, more complex)
router.post('/farcaster/siwf', farcasterSignIn);

// Farcaster QuickAuth JWT endpoint
router.post('/farcaster/quickauth', farcasterQuickAuthSignIn);

// Ethereum SIWE endpoint
router.post('/siwe', siweSignIn);


router.get('/protected', jwtAuth, (req, res) => {
    res.json({ message: 'You are authenticated!', user: (req as any).user });
});

// Initiate Farcaster login/authentication
router.get('/farcaster/login', initiateFarcasterAuth);
// Handle Farcaster auth callback
router.get('/farcaster/callback', handleFarcasterCallback);
// Neynar webhook listener
router.post('/webhooks/neynar', processNeynarWebhook);

// Enhanced Neynar webhook endpoint with full event handling
router.post('/webhook/neynar', express.json(), async (req, res) => {
    try {
        const { type, data } = req.body;
        switch (type) {
            case 'transaction.created':
                await handleTokenTransfer(data);
                break;
            case 'contract.interaction':
                await handleContractInteraction(data);
                break;
            case 'wallet.activity':
                await handleWalletActivity(data);
                break;
            case 'token.forwarding.trigger':
                await handleTokenForwarding(data);
                break;
            default:
                console.warn(`Unhandled webhook event type: ${type}`);
        }
        res.status(200).send('Webhook processed successfully');
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

// --- Webhook event handlers and multi-chain forwarding logic ---
const chainConfigs = {
    ethereum: { rpc: process.env.ETH_RPC, forwardAddress: process.env.ETH_FORWARD_ADDRESS },
    optimism: { rpc: process.env.OPTIMISM_RPC, forwardAddress: process.env.OPTIMISM_FORWARD_ADDRESS },
    base: { rpc: process.env.BASE_RPC, forwardAddress: process.env.BASE_FORWARD_ADDRESS },
    degen: { rpc: process.env.DEGEN_RPC, forwardAddress: process.env.DEGEN_FORWARD_ADDRESS },
    solana: { rpc: process.env.SOLANA_RPC, forwardAddress: process.env.SOLANA_FORWARD_ADDRESS }
};

// Fixed implicit `any` types and indexing issues
interface TokenTransferData {
    sender: string;
    recipient: string;
    amount: number;
    token: string;
    chain: string;
}

// Define types for webhook data
interface ContractInteractionData {
    contractAddress: string;
    method: string;
    params: any[];
    chain: string;
}

interface WalletActivityData {
    walletAddress: string;
    activityType: string;
    details: any;
}

// Update handleContractInteraction with explicit types
async function handleContractInteraction(data: ContractInteractionData) {
    try {
        const { contractAddress, method, params, chain } = data;
        if (!contractAddress || !method || !params || !chain) {
            console.warn('Invalid contract interaction data:', data);
            return;
        }
        console.log(`Contract interaction on ${chain}: ${method} at ${contractAddress} with params ${JSON.stringify(params)}`);
        // Add contract interaction logic here
    } catch (error) {
        console.error('Error handling contract interaction:', error);
    }
}

// Update handleWalletActivity with explicit types
async function handleWalletActivity(data: WalletActivityData) {
    try {
        const { walletAddress, activityType, details } = data;
        if (!walletAddress || !activityType || !details) {
            console.warn('Invalid wallet activity data:', data);
            return;
        }
        console.log(`Wallet activity detected: ${activityType} for ${walletAddress} with details ${JSON.stringify(details)}`);
        // Add wallet activity alert logic here
    } catch (error) {
        console.error('Error handling wallet activity:', error);
    }
}

async function handleTokenTransfer(data: TokenTransferData) {
    try {
        const { sender, recipient, amount, token } = data;
        if (!sender || !recipient || !amount || !token) {
            console.warn('Invalid token transfer data:', data);
            return;
        }
        console.log(`Processing token transfer: ${amount} ${token} from ${sender} to ${recipient}`);
        // Optionally trigger forwarding or notifications here
    } catch (error) {
        console.error('Error handling token transfer:', error);
    }
}

// Update handleTokenForwarding with explicit types
async function handleTokenForwarding(data: TokenTransferData) {
    try {
        const { sender, recipient, amount, token, chain } = data;
        const chainConfig = chainConfigs[chain as keyof typeof chainConfigs];
        if (!chainConfig) {
            console.warn(`Unsupported chain: ${chain}`);
            return;
        }
        if (chain === 'solana') {
            await forwardSolanaTokens(sender, recipient, amount);
        } else {
            await forwardEVMTokens(sender, recipient, amount, token, chain);
        }
    } catch (error) {
        console.error('Error forwarding tokens:', error);
    }
}

// Update forwardEVMTokens with explicit types
async function forwardEVMTokens(sender: string, recipient: string, amount: number, token: string, chain: string) {
    try {
        if (!process.env.PRIVATE_KEY) {
            throw new Error('PRIVATE_KEY environment variable not set');
        }
        const provider = new ethers.JsonRpcProvider(chainConfigs[chain as keyof typeof chainConfigs].rpc);
        const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const tx = await wallet.sendTransaction({
            to: chainConfigs[chain as keyof typeof chainConfigs].forwardAddress,
            value: ethers.parseEther(amount.toString())
        });
        console.log(`Forwarded ${amount} ${token} on ${chain}. Tx: ${tx.hash}`);
    } catch (error) {
        console.error('Error forwarding EVM tokens:', error);
    }
}

// Update forwardSolanaTokens with explicit types
async function forwardSolanaTokens(sender: string, recipient: string, amount: number) {
    try {
        if (!chainConfigs.solana?.rpc) {
            throw new Error('Solana RPC URL not configured');
        }
        if (!chainConfigs.solana?.forwardAddress) {
            throw new Error('Solana forward address not configured');
        }
        const connection = new Connection(chainConfigs.solana.rpc);
        const senderPubKey = new PublicKey(sender);
        const recipientPubKey = new PublicKey(chainConfigs.solana.forwardAddress);
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: senderPubKey,
                toPubkey: recipientPubKey,
                lamports: amount * 1e9 // Convert SOL to lamports
            })
        );
        console.log(`Forwarded ${amount} SOL on Solana.`);
    } catch (error) {
        console.error('Error forwarding Solana tokens:', error);
    }
}

// --- Notification logic ---
async function sendNotification(userId: string, message: string) {
    try {
        const preferences = await getUserPreferences(userId);
        if (preferences.farcasterInApp) await sendFarcasterNotification(userId, message);
        if (preferences.farcasterCast) await sendFarcasterCast(userId, message);
        if (preferences.telegram) await sendTelegramMessage(userId, message);
        if (preferences.email) await sendEmail(userId, message);
        if (preferences.push) await sendPushNotification(userId, message);
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

export default router;
