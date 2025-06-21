import '@testing-library/jest-dom';

declare global {
  var localStorage: Storage;
  var console: Console;
  var process: {
    env: {
      [key: string]: string | undefined;
    };
  };
}

// Set up process.env for transformed code
process.env.VITE_API_URL = 'http://localhost:3000/api';
process.env.VITE_GOOGLE_CLIENT_ID = 'test-client-id';

// Mock import.meta.env for Vite environment variables
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:3000/api',
        VITE_GOOGLE_CLIENT_ID: 'test-client-id'
      }
    }
  },
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
globalThis.localStorage = localStorageMock;

// Mock console methods to reduce noise in tests
globalThis.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
} as Console; 