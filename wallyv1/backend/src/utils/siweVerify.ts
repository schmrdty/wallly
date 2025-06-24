import { SiweMessage } from 'siwe';
import logger from '../infra/mon/logger.js';

/**
 * Verify SIWE message using siwe 3.0 API
 */
export async function verifySiweMessage({
  message,
  signature,
  domain,
  nonce
}: {
  message: string;
  signature: string;
  domain?: string;
  nonce?: string;
}) {
  try {
    const siweMessage = new SiweMessage(message);

    // Verify the message
    const result = await siweMessage.verify({
      signature: signature as `0x${string}`,
      domain: domain || siweMessage.domain,
      nonce: nonce || siweMessage.nonce,
      time: new Date().toISOString()
    });

    if (result.success) {
      return {
        success: true,
        address: siweMessage.address,
        data: {
          address: siweMessage.address,
          chainId: siweMessage.chainId,
          domain: siweMessage.domain,
          nonce: siweMessage.nonce
        }
      };
    } else {
      return {
        success: false,
        address: null,
        data: null,
        error: result.error
      };
    }
  } catch (error) {
    logger.error('SIWE verification failed:', error);
    return {
      success: false,
      address: null,
      data: null,
      error: error instanceof Error ? error : new Error('Unknown verification error')
    };
  }
}

export default {
  verifySiweMessage
};
