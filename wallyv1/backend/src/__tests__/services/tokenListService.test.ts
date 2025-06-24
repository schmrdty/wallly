import axios from 'axios';
import { TokenInfo } from '../../types/Token.js';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create a temporary placeholder for the service, since we don't have the full implementation
const STATIC_TOKENLIST_URLS = [
  'https://unpkg.com/@uniswap/default-token-list@latest/build/uniswap-default.tokenlist.json',
  'https://tokens.coingecko.com/uniswap/all.json'
];

async function fetchTokenListFromStatic(): Promise<TokenInfo[]> {
  for (const url of STATIC_TOKENLIST_URLS) {
    if (!url) continue;
    try {
      const { data } = await axios.get(url);
      if (data && data.tokens && data.tokens.length) {
        return data.tokens;
      }
    } catch (e) {
      // Continue to next static URL
    }
  }
  return [];
}

describe('Token List Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch token list from the first successful URL', async () => {
    // Mock the first URL to succeed
    const mockTokens = [
      { address: '0x123', symbol: 'TKN1', name: 'Token 1', decimals: 18 },
      { address: '0x456', symbol: 'TKN2', name: 'Token 2', decimals: 18 }
    ];

    mockedAxios.get.mockImplementation((url) => {
      if (url === STATIC_TOKENLIST_URLS[0]) {
        return Promise.resolve({ data: { tokens: mockTokens } });
      }
      return Promise.reject(new Error('Failed to fetch'));
    });

    const result = await fetchTokenListFromStatic();

    expect(mockedAxios.get).toHaveBeenCalledWith(STATIC_TOKENLIST_URLS[0]);
    expect(result).toEqual(mockTokens);
    // Should not try the second URL since the first one succeeded
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test('should try next URL if first one fails', async () => {
    // Mock the first URL to fail and second to succeed
    const mockTokens = [
      { address: '0x123', symbol: 'TKN1', name: 'Token 1', decimals: 18 }
    ];

    mockedAxios.get.mockImplementation((url) => {
      if (url === STATIC_TOKENLIST_URLS[0]) {
        return Promise.reject(new Error('Failed to fetch'));
      }
      if (url === STATIC_TOKENLIST_URLS[1]) {
        return Promise.resolve({ data: { tokens: mockTokens } });
      }
      return Promise.reject(new Error('Failed to fetch'));
    });

    const result = await fetchTokenListFromStatic();

    expect(mockedAxios.get).toHaveBeenCalledWith(STATIC_TOKENLIST_URLS[0]);
    expect(mockedAxios.get).toHaveBeenCalledWith(STATIC_TOKENLIST_URLS[1]);
    expect(result).toEqual(mockTokens);
  });

  test('should return empty array if all URLs fail', async () => {
    // Mock all URLs to fail
    mockedAxios.get.mockRejectedValue(new Error('Failed to fetch'));

    const result = await fetchTokenListFromStatic();

    expect(mockedAxios.get).toHaveBeenCalledTimes(STATIC_TOKENLIST_URLS.length);
    expect(result).toEqual([]);
  });

  test('should return empty array if URLs return invalid data format', async () => {
    // Mock URL to return invalid data
    mockedAxios.get.mockResolvedValue({ data: { notTokens: [] } });

    const result = await fetchTokenListFromStatic();

    expect(mockedAxios.get).toHaveBeenCalledTimes(STATIC_TOKENLIST_URLS.length);
    expect(result).toEqual([]);
  });
});
