import { Farcaster } from 'farcaster-js';
import { verifySignature } from '../utils/signature';
import { Session } from '../utils/session';

const farcasterClient = new Farcaster();

export const authenticateUser = async (farcasterAddress: string, signature: string): Promise<boolean> => {
    const isValid = verifySignature(farcasterAddress, signature);
    if (!isValid) {
        throw new Error('Invalid signature');
    }
    const session = await Session.createSession(farcasterAddress);
    return session.isActive;
};

export const validateSession = async (sessionId: string): Promise<boolean> => {
    const session = await Session.getSession(sessionId);
    return session.isValid;
};

export const revokeSession = async (sessionId: string): Promise<void> => {
    await Session.revokeSession(sessionId);
};

export const getUserFarcasterData = async (farcasterAddress: string): Promise<any> => {
    const userData = await farcasterClient.getUser(farcasterAddress);
    return userData;
};