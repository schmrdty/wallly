import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import { authenticateWithFarcaster, logout } from '../../utils/api';

// Mock dependencies
jest.mock('../../utils/api', () => ({
  authenticateWithFarcaster: jest.fn(),
  logout: jest.fn(),
}));

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  test('should initialize with null user and not authenticated', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.loading).toBe(false);
  });
  test('should load user from localStorage on mount', () => {
    const mockUser = { id: '123', authProvider: 'farcaster', address: '0x123' };
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });
  test('should update user when signInWithFarcaster is called', () => {
    const { result } = renderHook(() => useAuth());
    const mockUser = { id: '123', username: 'testUser', address: '0x123' };

    act(() => {
      result.current.signInWithFarcaster(mockUser);
    });

    expect(result.current.user).toEqual({ ...mockUser, authProvider: 'farcaster' });
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify({ ...mockUser, authProvider: 'farcaster' })
    );
  });
  test('should update user when signInWithEthereum is called', () => {
    const { result } = renderHook(() => useAuth());
    const mockUser = { id: '123', walletAddress: '0x123', address: '0x123' };

    act(() => {
      result.current.signInWithEthereum(mockUser);
    });

    expect(result.current.user).toEqual({ ...mockUser, authProvider: 'ethereum' });
    expect(result.current.isAuthenticated).toBe(true);
  });
  test('should handle Farcaster login success', async () => {
    const mockResult = { message: 'test', signature: 'sig' };
    const mockResponse = {
      user: { id: '123', username: 'testUser', address: '0x123' },
      session: { token: 'sessionToken' }
    };

    (authenticateWithFarcaster as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.loginWithFarcaster(mockResult);
    });

    expect(authenticateWithFarcaster).toHaveBeenCalledWith(mockResult);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual({ ...mockResponse.user, authProvider: 'farcaster' });
  });

  test('should handle logout', async () => {
    const { result } = renderHook(() => useAuth());

    // First set a user
    act(() => {
      result.current.setUser({ id: '123', authProvider: 'farcaster', address: '0x123' });
    });

    // Then logout
    await act(async () => {
      await result.current.logoutUser();
    });

    expect(logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
  });
});
