import { ethers } from 'ethers';

// Read the Sepolia RPC URL from environment variables
const SEPOLIA_RPC_URL = import.meta.env.VITE_REACT_APP_SEPOLIA_RPC_URL;

// Create and export a JSON-RPC provider with batching disabled
export const provider = new ethers.JsonRpcProvider(
  SEPOLIA_RPC_URL,
  undefined,
  {
    batchMaxCount: 1,     // Disable batching (any value ≤ 1)
    staticNetwork: true,  // Skip unnecessary chainId calls
    pollingInterval: 20000 // Increase polling interval to reduce request frequency
  }
);

// Helper function to instantiate a signer with the provider
export const getSigner = (privateKey: string) => {
  return new ethers.Wallet(privateKey, provider);
};

// Helper to create a contract instance with a signer
export const getContract = (address: string, abi: any, signer: ethers.Signer) => {
  return new ethers.Contract(address, abi, signer);
};

// Helper to connect an encrypted JSON wallet
export const getWalletFromEncryptedJson = async (json: string, password: string) => {
  const wallet = await ethers.Wallet.fromEncryptedJson(json, password);
  return wallet.connect(provider);
}; 