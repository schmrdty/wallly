import axios from "axios";
import levenshtein from "js-levenshtein";
import { logError } from "./logger";
import { sendWarpcastNotification } from "../../../backend/src/services/notificationService";

const IPFS_LISTS = [
  process.env.NEXT_PUBLIC_IPFS_LIST1,
  process.env.NEXT_PUBLIC_IPFS_LIST2,
  process.env.NEXT_PUBLIC_IPFS_LIST3,
  process.env.NEXT_PUBLIC_IPFS_LIST4,
].filter(Boolean);

// Fetch from main IPFS, fallback to secondary, then PostgreSQL via backend
export async function fuzzyFindTokenByInput(input: string, userTokens: string[]) {
  for (const url of IPFS_LISTS) {
    try {
      const { data } = await axios.get(url);
      const token = data.tokens.find(
        (t: any) =>
          t.address.toLowerCase() === input.toLowerCase() ||
          t.symbol.toLowerCase() === input.toLowerCase() ||
          t.name.toLowerCase() === input.toLowerCase()
      );
      if (token) {
        // Send notification
        await sendWarpcastNotification(
          userTokens,
          "Token Found",
          `We found the token: ${token.name} (${token.symbol})`,
          "https://your-app.com/token-details"
        );
        return token;
      }
    } catch (e) {
      logError(`Failed to fetch token list from ${url}`);
    }
  }
  return null;
}