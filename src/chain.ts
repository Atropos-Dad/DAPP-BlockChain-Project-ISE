import { ethers } from 'ethers';

// Read the Sepolia RPC URL from environment variables
const SEPOLIA_RPC_URL = import.meta.env.VITE_REACT_APP_SEPOLIA_RPC_URL;

// Create and export a JSON-RPC provider
export const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

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