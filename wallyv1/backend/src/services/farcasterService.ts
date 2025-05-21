import { verifySignature } from '../utils/signature';
import { Session } from '../utils/session';
import { appClient } from 'your-farcaster-client-lib'; // Replace with actual Farcaster client import

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

export const farcasterService = {
  validateSignature: async ({
    domain,
    nonce,
    message,
    signature,
  }: {
    domain: string;
    nonce: string;
    message: string;
    signature: string;
  }) => {
    const result = await appClient.verifySignInMessage({
      nonce,
      domain,
      message,
      signature,
    });

    // You can return the whole result or just what you need
    return {
      success: result.success,
      fid: result.fid,
      data: result.data,
      isError: result.isError,
      error: result.error,
    };
  },
};