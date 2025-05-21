import axios from 'axios';
import * as dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import path from 'path';

dotenv.config();

const API_KEY = process.env.BASESCAN_API_KEY;
const BASE_URL = 'https://api.basescan.org/api';

// Replace with actual top 100 token contract addresses
const contractAddresses: string[] = [
  '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
  // Add 99 more token contract addresses here
];

interface TokenMetadata {
  name: string;
  symbol: string;
  contractAddress: string;
  decimals: number;
  verified: boolean;
  website?: string;
  additionalInfo?: {
    totalSupply?: string;
    priceUSD?: string;
    socials?: { [platform: string]: string };
  };
}

async function fetchTokenInfo(contract: string): Promise<TokenMetadata | null> {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        module: 'token',
        action: 'tokeninfo',
        contractaddress: contract,
        apikey: API_KEY,
      },
    });

    const result = response.data.result?.[0];
    if (!result) return null;

    return {
      name: result.tokenName,
      symbol: result.symbol,
      contractAddress: result.contractAddress,
      decimals: parseInt(result.divisor, 10),
      verified: result.blueCheckmark === 'true',
      website: result.website || undefined,
      additionalInfo: {
        socials: {
          blog: result.blog,
          reddit: result.reddit,
          twitter: result.twitter,
          telegram: result.telegram,
          discord: result.discord,
          github: result.github,
        },
      },
    };
  } catch (error) {
    console.error(`Failed to fetch token at ${contract}:`, error.message);
    return null;
  }
}

async function main() {
  const tokenList: TokenMetadata[] = [];

  for (const contract of contractAddresses) {
    const metadata = await fetchTokenInfo(contract);
    if (metadata) tokenList.push(metadata);
    await new Promise(res => setTimeout(res, 400)); // avoid rate limits
  }

  const outputPath = path.join(__dirname, 'tokenlist.json');
  writeFileSync(outputPath, JSON.stringify(tokenList, null, 2));

  console.log(`✅ Token list written to ${outputPath}`);
}

main();
