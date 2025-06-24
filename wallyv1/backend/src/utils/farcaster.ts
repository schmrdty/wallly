import type { Request } from 'express';
import axios from 'axios';

export const generateFarcasterAuthUrl = (): string => {
    const clientId = process.env.FARCASTER_CLIENT_ID;
    const redirectUri = process.env.FARCASTER_REDIRECT_URI;
    return `https://farcaster.xyz/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=profile`;
};

export const handleFarcasterAuthCallback = async (code: string): Promise<any> => {
    const response = await axios.post('https://api.farcaster.xyz/oauth/token', {
        client_id: process.env.FARCASTER_CLIENT_ID,
        client_secret: process.env.FARCASTER_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.FARCASTER_REDIRECT_URI,
    });
    return response.data;
};

export const verifyNeynarWebhook = (req: Request): any => {
    const signature = req.headers['x-neynar-signature'];
    const payload = req.body;
    // TODO: Implement HMAC verification using Neynar webhook secret
    if (!signature) throw new Error('Invalid webhook signature');
    return payload;
};

export const sendFarcasterNotification = async (message: string): Promise<void> => {
    const neynarApiKey = process.env.NEYNAR_API_KEY;
    await axios.post('https://api.neynar.xyz/v2/farcaster/cast', {
        text: message,
    }, {
        headers: { Authorization: `Bearer ${neynarApiKey}` },
    });
};
