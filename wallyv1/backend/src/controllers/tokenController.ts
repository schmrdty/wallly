import { Request, Response } from 'express';
import { wallyService } from '../services/wallyService';
import { roundRobinFindToken } from '../services/tokenListService';

export const resolveToken = async (req: Request, res: Response) => {
  const { query } = req.body;
  try {
    const token = await roundRobinFindToken(query);
    if (token) {
      res.json({ valid: true, ...token });
    } else {
      res.json({ valid: false, message: "Token not found." });
    }
  } catch (error) {
    logError('Error resolving token', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const startWatchingToken = async (req: Request, res: Response) => {
  const { userAddress, tokenAddress } = req.body;
  try {
    await wallyService.startWatchingToken(userAddress, tokenAddress);
    res.status(200).json({ message: 'Started watching token.' });
  } catch (error) {
    logError('Error starting to watch token', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const stopWatchingToken = async (req: Request, res: Response) => {
  const { userAddress, tokenAddress } = req.body;
  try {
    await wallyService.stopWatchingToken(userAddress, tokenAddress);
    res.status(200).json({ message: 'Stopped watching token.' });
  } catch (error) {
    logError('Error stopping to watch token', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add other token-related stubs as needed
export const listWatchedTokens = async (req: Request, res: Response) => {
  // TODO: Implement
  res.status(501).json({ message: 'Not implemented' });
};