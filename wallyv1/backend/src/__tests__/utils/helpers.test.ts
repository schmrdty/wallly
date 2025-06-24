import { addressesEqual, isValidEthereumAddress, safeJsonParse, fuzzyFindTokenByAddress } from '../../utils/helpers.js';
import { levenshtein } from '../../utils/levenshtein.js';

// Mock dependencies
jest.mock('../../utils/levenshtein', () => ({
  levenshtein: jest.fn()
}));

describe('Helper Functions', () => {
  describe('addressesEqual', () => {
    test('should return true for identical addresses', () => {
      expect(addressesEqual('0x123', '0x123')).toBe(true);
    });

    test('should return true for case-insensitive matches', () => {
      expect(addressesEqual('0xAbc', '0xabc')).toBe(true);
    });

    test('should return true after trimming whitespace', () => {
      expect(addressesEqual(' 0x123 ', '0x123')).toBe(true);
    });

    test('should return false for different addresses', () => {
      expect(addressesEqual('0x123', '0x456')).toBe(false);
    });
  });

  describe('isValidEthereumAddress', () => {
    test('should return true for valid Ethereum address', () => {
      expect(isValidEthereumAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
    });

    test('should return false for invalid Ethereum address', () => {
      expect(isValidEthereumAddress('0x123')).toBe(false);
      expect(isValidEthereumAddress('not-an-address')).toBe(false);
      expect(isValidEthereumAddress('')).toBe(false);
    });
  });

  describe('safeJsonParse', () => {
    test('should parse valid JSON', () => {
      const json = '{"key":"value"}';
      const fallback = { default: true };
      expect(safeJsonParse(json, fallback)).toEqual({ key: 'value' });
    });

    test('should return fallback for invalid JSON', () => {
      const json = '{invalid:json}';
      const fallback = { default: true };
      expect(safeJsonParse(json, fallback)).toEqual(fallback);
    });
  });

  describe('fuzzyFindTokenByAddress', () => {
    beforeEach(() => {
      (levenshtein as jest.Mock).mockImplementation((a, b) => {
        // Simple mock implementation that returns the difference in string length
        return Math.abs(a.length - b.length);
      });
    });

    test('should return null for empty inputs', () => {
      expect(fuzzyFindTokenByAddress('', [])).toBeNull();
      expect(fuzzyFindTokenByAddress('0x123', [])).toBeNull();
    });

    test('should find closest match using levenshtein distance', () => {
      const tokens = [
        { address: '0x123456' },
        { address: '0xabcdef' },
        { address: '0x111222' }
      ];

      // Mock levenshtein to make '0xabcdef' the closest match
      (levenshtein as jest.Mock).mockImplementation((a, b) => {
        if (b === '0xabcdef') return 1;
        return 5;
      });

      const result = fuzzyFindTokenByAddress('0x123', tokens);
      expect(result).toEqual({ address: '0xabcdef' });
      expect(levenshtein).toHaveBeenCalledTimes(3); // Called once per token
    });

    test('should normalize addresses for comparison', () => {
      const tokens = [
        { address: '0xABC123' },
        { address: '0xdef456' }
      ];

      fuzzyFindTokenByAddress('0xabc123', tokens);

      // Check if levenshtein was called with lowercase addresses
      expect(levenshtein).toHaveBeenCalledWith('0xabc123', '0xabc123');
      expect(levenshtein).toHaveBeenCalledWith('0xabc123', '0xdef456');
    });
  });
});
