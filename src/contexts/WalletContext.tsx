import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ethers } from 'ethers';
import { provider, getWalletFromEncryptedJson } from '../chain';

// Define wallet type that includes both Wallet and HDNodeWallet
type WalletType = ethers.Wallet | ethers.HDNodeWallet | undefined;

// Define the context type
interface WalletContextType {
  wallet: WalletType;
  connectEncryptedJson: (json: string, password: string) => Promise<void>;
  disconnect: () => void;
  createRandomWallet: (password: string) => Promise<{ 
    json: string; 
    address: string; 
    mnemonic: string | undefined;
  }>;
  restoreFromMnemonic: (mnemonic: string, password: string) => Promise<{
    json: string;
    address: string;
  }>;
  isLoading: boolean;
  error: string | null;
}

// Create context with default values
const WalletContext = createContext<WalletContextType>({
  wallet: undefined,
  connectEncryptedJson: async () => {},
  disconnect: () => {},
  createRandomWallet: async () => ({ json: '', address: '', mnemonic: undefined }),
  restoreFromMnemonic: async () => ({ json: '', address: '' }),
  isLoading: false,
  error: null
});

// Hook to use wallet context
export const useWallet = () => useContext(WalletContext);

// Provider component
export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletType>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect wallet using encrypted JSON
  const connectEncryptedJson = async (json: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const connectedWallet = await getWalletFromEncryptedJson(json, password);
      setWallet(connectedWallet);
    } catch (err) {
      setError(`Failed to connect wallet: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    setWallet(undefined);
    setError(null);
  };

  // Create a random wallet
  const createRandomWallet = async (password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create random wallet and connect it to provider
      const randomWallet = ethers.Wallet.createRandom().connect(provider);
      
      // Set as current wallet
      setWallet(randomWallet);
      
      // Encrypt the wallet
      const json = await randomWallet.encryptSync(password);
      
      // Get mnemonic
      const mnemonic = randomWallet.mnemonic?.phrase;
      
      return {
        json,
        address: randomWallet.address,
        mnemonic
      };
    } catch (err) {
      setError(`Failed to create wallet: ${err instanceof Error ? err.message : String(err)}`);
      return { json: '', address: '', mnemonic: undefined };
    } finally {
      setIsLoading(false);
    }
  };

  // Restore wallet from mnemonic phrase
  const restoreFromMnemonic = async (mnemonic: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create wallet from mnemonic and connect to provider
      const restoredWallet = ethers.Wallet.fromPhrase(mnemonic).connect(provider);
      
      // Set as current wallet
      setWallet(restoredWallet);
      
      // Encrypt the wallet
      const json = await restoredWallet.encryptSync(password);
      
      return {
        json,
        address: restoredWallet.address
      };
    } catch (err) {
      setError(`Failed to restore wallet: ${err instanceof Error ? err.message : String(err)}`);
      return { json: '', address: '' };
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    wallet,
    connectEncryptedJson,
    disconnect,
    createRandomWallet,
    restoreFromMnemonic,
    isLoading,
    error
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 