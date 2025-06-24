import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../middleware/auth.ts';
import { logError } from '../../infra/mon/logger.js';

// Mock dependencies
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

jest.mock('../../infra/mon/logger', () => ({
  logError: jest.fn()
}));

describe('Authentication Middleware', () => {
  // Setup common test objects
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  test('should return 401 if no authorization header is present', () => {
    // Execute the middleware
    authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    // Assertions
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized: No token provided' });
    expect(nextFunction).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith('Unauthorized: No token provided');
  });

  test('should return 401 if authorization header does not start with Bearer', () => {
    // Setup
    mockRequest.headers = { authorization: 'Basic token123' };

    // Execute the middleware
    authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    // Assertions
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized: No token provided' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  test('should return 401 if token is invalid', () => {
    // Setup
    mockRequest.headers = { authorization: 'Bearer invalidToken' };
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    // Execute the middleware
    authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    // Assertions
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized: Invalid token' });
    expect(nextFunction).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith('Unauthorized: Invalid token');
  });

  test('should call next and set req.user if token is valid', () => {
    // Setup
    mockRequest.headers = { authorization: 'Bearer validToken' };
    const decodedUser = { id: '123', username: 'testuser' };
    (jwt.verify as jest.Mock).mockReturnValue(decodedUser);

    // Execute the middleware
    authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    // Assertions
    expect(jwt.verify).toHaveBeenCalledWith('validToken', expect.any(String));
    expect((mockRequest as any).user).toEqual(decodedUser);
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });
});
