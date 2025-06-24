import { jest } from '@jest/globals';
// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: typeof globalThis.jest !== 'undefined' && typeof globalThis.jest.fn === 'function' ? globalThis.jest.fn() : () => {},
    setItem: typeof globalThis.jest !== 'undefined' && typeof globalThis.jest.fn === 'function' ? globalThis.jest.fn() : () => {},
    removeItem: typeof globalThis.jest !== 'undefined' && typeof globalThis.jest.fn === 'function' ? globalThis.jest.fn() : () => {},
  },
  writable: true,
});

Object.defineProperty(window, 'crypto', {
    value: {
        getRandomValues: (arr) => {
            for (let i = 0; i < arr.byteLength; i++) {
                (new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength))[i] = Math.floor(Math.random() * 256);
            }
            return arr;
        },
    },
});

// Mock the Farcaster SDK
jest.mock('@farcaster/frame-sdk', () => ({
  sdk: {
    actions: {
      ready: jest.fn(),
      signIn: jest.fn(),
    },
  },
}));
