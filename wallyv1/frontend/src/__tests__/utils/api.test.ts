import { api } from '../../utils/api';
import axios from 'axios';
import { getSessionId } from '../../utils/session';

// Mock dependencies
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn()
      }
    }
  }))
}));

jest.mock('../../utils/session', () => ({
  getSessionId: jest.fn()
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    contractEvent: jest.fn(),
    contractError: jest.fn(),
  }
}));

describe('API Utility', () => {
  test('should add Authorization header when sessionId is available', () => {
    // Setup
    const mockSessionId = 'test-session-id';
    const mockConfig = { headers: {} };
    (getSessionId as jest.Mock).mockReturnValue(mockSessionId);
    
    // Get the request interceptor function and call it
    const requestInterceptor = (api.interceptors.request as any).use.mock.calls[0][0];
    const result = requestInterceptor(mockConfig);
    
    // Assertions
    expect(result.headers?.Authorization).toBe(`Bearer ${mockSessionId}`);
  });
  
  test('should not add Authorization header when sessionId is null', () => {
    // Setup
    const mockConfig = { headers: {} };
    (getSessionId as jest.Mock).mockReturnValue(null);
    
    // Get the request interceptor function and call it
    const requestInterceptor = (api.interceptors.request as any).use.mock.calls[0][0];
    const result = requestInterceptor(mockConfig);
    
    // Assertions
    expect(result.headers?.Authorization).toBeUndefined();
  });
});
