import { ethers } from 'ethers';

const RPC_URLS = [
    process.env.RPC_URL_1,
    process.env.RPC_URL_2,
    process.env.RPC_URL_3,
    process.env.RPC_URL_4,
].filter(Boolean);

let lastRpcIndex = Math.floor(Math.random() * RPC_URLS.length);

export function getProvider(): ethers.providers.JsonRpcProvider {
    // Randomized round robin with fallback
    for (let i = 0; i < RPC_URLS.length; i++) {
        const idx = (lastRpcIndex + i) % RPC_URLS.length;
        try {
            const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[idx]);
            lastRpcIndex = idx;
            return provider;
        } catch (e) {
            continue;
        }
    }
    throw new Error('No working RPC providers available');
}