import levenshtein from "js-levenshtein";

export interface Token {
  address: string;
  symbol: string;
  name: string;
  [key: string]: any;
}

export function findToken(tokens: Token[], input: string): Token | undefined {
  const inputLower = input.toLowerCase();
  return tokens.find(
    t =>
      t.address.toLowerCase() === inputLower ||
      t.symbol.toLowerCase() === inputLower ||
      t.name.toLowerCase() === inputLower
  );
}

export function fuzzyMatchToken(tokens: Token[], input: string): { token: Token | null, distance: number } {
  let bestMatch: Token | null = null;
  let bestDistance = Infinity;
  const inputLower = input.toLowerCase();
  for (const t of tokens) {
    const distances = [
      levenshtein(t.symbol.toLowerCase(), inputLower),
      levenshtein(t.name.toLowerCase(), inputLower),
    ];
    const minDist = Math.min(...distances);
    if (minDist < bestDistance) {
      bestDistance = minDist;
      bestMatch = t;
    }
  }
  return { token: bestMatch, distance: bestDistance };
}
