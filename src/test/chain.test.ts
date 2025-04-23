import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

// Move mock before importing ethers and chain.ts modules
// Use synchronous mock function instead of async
vi.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: vi.fn(),
    Wallet: vi.fn(() => ({
      connect: vi.fn()
    })),
    Contract: vi.fn(),
  }
}));

// Import after mock is defined
import { ethers } from 'ethers';

// Variables to hold module exports after dynamic import
let provider: any;
let getSigner: (privateKey: string) => any;
let getContract: (address: string, abi: any, signer: any) => any;
let getWalletFromEncryptedJson: (json: string, password: string) => Promise<any>;

describe('Blockchain Helper Functions', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.resetModules();

    // Setup wallet mock for getWalletFromEncryptedJson test
    (ethers.Wallet as any).fromEncryptedJson = vi.fn();

    // Dynamically re-import chain module after mocks applied
    const mod = await import('../chain');
    provider = mod.provider;
    getSigner = mod.getSigner;
    getContract = mod.getContract;
    getWalletFromEncryptedJson = mod.getWalletFromEncryptedJson;
  });

  it('provider should be an instance of JsonRpcProvider', () => {
    // Test that provider is created correctly
    expect(provider).toBeDefined();
    expect(ethers.JsonRpcProvider).toHaveBeenCalledWith(
      process.env.VITE_REACT_APP_SEPOLIA_RPC_URL
    );
  });

  it('getSigner should return a Wallet instance connected to the provider', () => {
    // Setup
    const mockPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const mockWalletInstance = { address: '0xMockedAddress' };
    
    // Mock implementation
    (ethers.Wallet as any).mockReturnValue(mockWalletInstance);
    
    // Execute
    const signer = getSigner(mockPrivateKey);
    
    // Verify
    expect(ethers.Wallet).toHaveBeenCalledWith(mockPrivateKey, provider);
    expect(signer).toEqual(mockWalletInstance);
  });

  it('getContract should create a Contract instance with the given parameters', () => {
    // Setup
    const mockAddress = '0xContractAddress';
    const mockAbi = [{ name: 'test', type: 'function' }];
    const mockSigner = mock<ethers.Signer>();
    const mockContractInstance = { address: mockAddress };
    
    // Mock implementation
    (ethers.Contract as any).mockReturnValue(mockContractInstance);
    
    // Execute
    const contract = getContract(mockAddress, mockAbi, mockSigner);
    
    // Verify
    expect(ethers.Contract).toHaveBeenCalledWith(mockAddress, mockAbi, mockSigner);
    expect(contract).toEqual(mockContractInstance);
  });

  it('getWalletFromEncryptedJson should decrypt a wallet and connect it to the provider', async () => {
    // Setup
    const mockJson = '{"version":3,"id":"mock-id"}';
    const mockPassword = 'password123';
    const mockWalletInstance = {
      connect: vi.fn().mockReturnValue({ address: '0xDecryptedAddress' })
    };
    
    // Mock implementation
    (ethers.Wallet.fromEncryptedJson as any).mockResolvedValue(mockWalletInstance);
    
    // Execute
    const wallet = await getWalletFromEncryptedJson(mockJson, mockPassword);
    
    // Verify
    expect(ethers.Wallet.fromEncryptedJson).toHaveBeenCalledWith(mockJson, mockPassword);
    expect(mockWalletInstance.connect).toHaveBeenCalledWith(provider);
    expect(wallet).toEqual({ address: '0xDecryptedAddress' });
  });
}); 