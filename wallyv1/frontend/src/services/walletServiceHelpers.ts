import { logger } from '../utils/logger.ts';

export function handleWalletServiceError(error: any, context: string): never {
  logger.error(`[WalletService] ${context}`, error);
  throw new Error(error?.response?.data?.message || `Failed to ${context}`);
}
