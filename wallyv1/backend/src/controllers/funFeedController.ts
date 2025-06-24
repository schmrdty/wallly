import { Request, Response } from 'express';
import axios from 'axios';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || process.env.NEXT_PUBLIC_NEYNAR_KEY;
const MADE_HISTORY_CHANNEL_ID = 'madehistory'; // Replace with actual channel ID if needed

export const getFunFeed = async (req: Request, res: Response) => {
  try {
    if (!NEYNAR_API_KEY) {
      return res.status(500).json({ error: 'Neynar API key not set' });
    }
    // Neynar API endpoint for channel casts
    const url = `https://api.neynar.com/v2/farcaster/channel/casts?channel_id=${MADE_HISTORY_CHANNEL_ID}&limit=5`;
    const response = await axios.get(url, {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY
      }
    });
    const casts = response.data.casts || [];
    // Format for frontend
    const formatted = casts.map((cast: any) => ({
      hash: cast.hash,
      text: cast.text,
      author: cast.author?.username || 'unknown',
      timestamp: cast.timestamp,
      url: cast.url || '',
      pfp: cast.author?.pfp_url || '',
    }));
    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch funfeed' });
  }
};
