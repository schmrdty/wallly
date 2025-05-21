import { Request, Response } from 'express';
import { sessionService } from '../services/sessionService';
import { fuzzyFindTokenByAddress } from '../services/tokenListService';
import { WallyService } from '../services/wallyService';
import { logError } from '../infra/monitoring/logger';

const wallyService = new WallyService();
export const getTokenBalance = async (req: Request, res: Response) => {
    const { userAddress, tokenAddress } = req.body;

    try {
        // Validate user session
        const isValidSession = await sessionService.validateSession(userAddress);
        if (!isValidSession) {
            return res.status(401).json({ message: 'Invalid session or signature.' });
        }

        // Validate token address using fuzzy match and token list service
        const token = fuzzyFindTokenByAddress(tokenAddress);
        if (!token) {
            return res.status(400).json({ message: 'Invalid token address.', suggestion: null });
        }
        if (token.address.toLowerCase() !== tokenAddress.toLowerCase()) {
            return res.status(400).json({ message: 'Invalid token address.', suggestion: token.address, symbol: token.symbol });
        }

        // Fetch balance
        const balance = await wallyService.getTokenBalance(userAddress, tokenAddress);
        res.status(200).json({ balance });
    } catch (error: any) {
        logError(`Error occurred while fetching balance: ${error}`);
        return res.status(500).json({ message: 'An error occurred while fetching the balance.', error: error.message });
    }
}

export const transferTokens = async (req: Request, res: Response) => {
    const { userAddress, tokenAddress, amount, signature } = req.body;

    try {
        // Validate user session
        const isValidSession = await sessionService.validateSession(userAddress);
        if (!isValidSession) {
            return res.status(401).json({ message: 'Invalid session or signature.' });
        }

        // Validate amount
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({ message: 'Invalid transfer amount.' });
        }

        // Validate token address using fuzzy match and token list service
        const token = fuzzyFindTokenByAddress(tokenAddress);
        if (!token) {
            return res.status(400).json({ 
                message: 'Invalid token address.', 
                suggestion: null 
            });
        }
        if (token.address.toLowerCase() !== tokenAddress.toLowerCase()) {
            return res.status(400).json({ 
                message: 'Invalid token address.', 
                suggestion: token.address, 
                symbol: token.symbol 
            });
        }

        // Execute token transfer
        const transferResult = await wallyService.transferTokens(userAddress, tokenAddress, amount);
        if (transferResult.success) {
            return res.status(200).json({ message: 'Transfer successful.', transactionHash: transferResult.transactionHash });
        } else {
            return res.status(500).json({ message: 'Transfer failed.', error: transferResult.error });
        }
    } catch (error: any) {
        logError(`Error occurred during transfer: ${error}`);
        return res.status(500).json({ message: 'An error occurred during the transfer.', error: error.message });
    }
};

export const batchTransferTokens = async (req: Request, res: Response) => {
    const { userAddress, transfers } = req.body; // transfers: [{tokenAddress, amount, to}]
    try {
        const result = await wallyService.batchTransferTokens(userAddress, transfers);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ message: 'An error occurred during the batch transfer.', error: error.message });
    }
};

export const metaTransferTokens = async (req: Request, res: Response) => {
    const { userAddress, metaTxData } = req.body;
    try {
        const result = await wallyService.metaTransferTokens(userAddress, metaTxData);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(500).json({ message: 'An error occurred during a meta token transfer.', error: error.message });
    }
};