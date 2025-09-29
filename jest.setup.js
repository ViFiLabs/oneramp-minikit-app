// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Learn more: https://jestjs.io/docs/configuration#setupfilesafterenv-array

require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');

// Polyfills for Node.js APIs needed by viem
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr) => require('crypto').randomBytes(arr.length),
    subtle: {
      digest: async (algorithm, data) => {
        const crypto = require('crypto');
        const hash = crypto.createHash(algorithm.toLowerCase().replace('-', ''));
        hash.update(data);
        return hash.digest();
      }
    }
  }
});

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
}));

// Mock window.ethereum for wallet connections (for jsdom tests)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'ethereum', {
    value: {
      request: jest.fn(),
      on: jest.fn(),
      removeListener: jest.fn(),
    },
    writable: true,
  });
}

// Mock console.warn for cleaner test output
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('deprecated') || args[0]?.includes?.('Warning')) {
    return;
  }
  originalWarn(...args);
};
