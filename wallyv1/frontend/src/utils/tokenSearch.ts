import axios from "axios";
import levenshtein from "js-levenshtein";

// Fetch from main IPFS, fallback to secondary, then PostgreSQL via backend
export async function fuzzyFindTokenByInput(input: string) {
  let tokenList;
  try {
    const res = await axios.get("https://main-ipfs-gateway/tokenlist.json");
    tokenList = res.data.tokens;
  } catch {
    try {
      const res = await axios.get("https://secondary-ipfs-gateway/tokenlist.json");
      tokenList = res.data.tokens;
    } catch {
      const res = await axios.get("/api/tokens/search", { params: { q: input } });
      tokenList = res.data.tokens;
    }
  }
  // Find exact match by address, then by symbol/name
  let token = tokenList.find(t => t.address.toLowerCase() === input.toLowerCase());
  if (token) return { valid: true, symbol: token.symbol };
  token = tokenList.find(t => t.symbol.toLowerCase() === input.toLowerCase() || t.name.toLowerCase() === input.toLowerCase());
  if (token) return { valid: true, symbol: token.symbol };

  // Fuzzy match with Levenshtein
  let suggestion = null;
  let minDist = 3; // threshold
  for (const t of tokenList) {
    const dist = levenshtein(input.toLowerCase(), t.symbol.toLowerCase());
    if (dist < minDist) {
      suggestion = t;
      minDist = dist;
    }
  }
  return { valid: false, suggestion: suggestion?.address, symbol: suggestion?.symbol };
}