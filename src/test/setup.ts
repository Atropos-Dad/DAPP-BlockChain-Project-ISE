import { expect, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { Buffer } from 'buffer';

// Polyfill Buffer for ethers.js browser-based decryption in jsdom environment
(globalThis as any).Buffer = Buffer;

// Set up environment variables for testing
process.env.VITE_REACT_APP_SEPOLIA_RPC_URL = 'https://eth-sepolia-test.example.com';

// Clean up after each test
afterEach(() => {
  // Any cleanup needed between tests
}); 