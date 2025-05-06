import React, { ReactNode } from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WalletProvider, useWallet } from '../contexts/WalletContext';
import * as EthersModule from 'ethers'; // Import all as EthersModule for mock access

// Mock a child component to consume the context
const TestConsumerComponent = () => {
  const { 
    wallet, 
    connectEncryptedJson, 
    disconnect, 
    createRandomWallet, 
    restoreFromMnemonic, 
    isLoading, 
    error 
  } = useWallet();

  return (
    <div>
      <div data-testid="wallet-address">{wallet?.address}</div>
      <div data-testid="is-loading">{isLoading.toString()}</div>
      <div data-testid="error-message">{error}</div>
      <button onClick={async () => connectEncryptedJson('{}', 'password')}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
      <button onClick={async () => createRandomWallet('password')}>Create Wallet</button>
      <button onClick={async () => restoreFromMnemonic('mnemonic phrase', 'password')}>Restore Wallet</button>
    </div>
  );
};

// Mocking the ethers library
vi.mock('ethers', async (importOriginal) => {
  const originalEthers = await importOriginal() as typeof EthersModule;
  return {
    // Spread originalEthers if it contains other named exports you want to preserve
    ...originalEthers,
    // Explicitly mock the 'ethers' named export if it's an object with static members
    ethers: {
      ...originalEthers.ethers, // if 'ethers' is a namespace/object
      Wallet: {
        createRandom: vi.fn(),
        fromPhrase: vi.fn(),
        fromEncryptedJson: vi.fn(),
      },
      JsonRpcProvider: vi.fn(),
    },
    // If Wallet, JsonRpcProvider are top-level exports, mock them directly:
    // Wallet: {
    //   createRandom: vi.fn(),
    //   fromPhrase: vi.fn(),
    //   fromEncryptedJson: vi.fn(),
    // },
    // JsonRpcProvider: vi.fn(),
  };
});


// Mocking the chain module (specifically getWalletFromEncryptedJson and provider)
vi.mock('../chain', async (importOriginal) => {
  const originalChainModule = await importOriginal() as Record<string, any>; // Treat as an object
  return {
    ...originalChainModule, // Spread its properties
    provider: {
      getNetwork: vi.fn().mockResolvedValue({ chainId: 1337 }),
    },
    getWalletFromEncryptedJson: vi.fn(),
  };
});


describe('WalletContext', () => {
  let mockGetWalletFromEncryptedJson: ReturnType<typeof vi.fn>;
  let mockEthersWallet: typeof EthersModule.ethers.Wallet; // Correctly type the mock
  
  beforeEach(async () => {
    vi.resetAllMocks();

    const chainMock = await import('../chain');
    mockGetWalletFromEncryptedJson = chainMock.getWalletFromEncryptedJson as ReturnType<typeof vi.fn>;

    // Access Wallet through the EthersModule.ethers path if that's how it's structured
    // If Wallet is a top-level export, it would be EthersModule.Wallet
    mockEthersWallet = EthersModule.ethers.Wallet;

    (mockEthersWallet.createRandom as ReturnType<typeof vi.fn>).mockReturnValue({
      address: 'mockAddressRandom',
      mnemonic: { phrase: 'mock mnemonic phrase' },
      encryptSync: vi.fn().mockResolvedValue('mockEncryptedJsonRandom'),
      connect: vi.fn().mockReturnThis(),
    });

    (mockEthersWallet.fromPhrase as ReturnType<typeof vi.fn>).mockReturnValue({
      address: 'mockAddressMnemonic',
      encryptSync: vi.fn().mockResolvedValue('mockEncryptedJsonMnemonic'),
      connect: vi.fn().mockReturnThis(),
    });
    
    mockGetWalletFromEncryptedJson.mockResolvedValue({
        address: 'mockAddressJson',
        connect: vi.fn().mockReturnThis(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProvider = (component: ReactNode) => {
    return render(
      <WalletProvider>
        {component}
      </WalletProvider>
    );
  };

  it('initial state is correct', () => {
    renderWithProvider(<TestConsumerComponent />);
    expect(screen.getByTestId('wallet-address')).toBeEmptyDOMElement();
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error-message')).toBeEmptyDOMElement();
  });

  it('createRandomWallet successfully creates a wallet', async () => {
    const mockWalletInstance = {
      address: 'newRandomAddress',
      mnemonic: { phrase: 'new random mnemonic' },
      encryptSync: vi.fn().mockResolvedValue('newEncryptedJson'),
      connect: vi.fn().mockReturnThis(),
    };
    (mockEthersWallet.createRandom as ReturnType<typeof vi.fn>).mockReturnValue(mockWalletInstance);

    renderWithProvider(<TestConsumerComponent />);
    
    await act(async () => {
      screen.getByText('Create Wallet').click();
    });

    expect(mockEthersWallet.createRandom).toHaveBeenCalled();
    expect(mockWalletInstance.encryptSync).toHaveBeenCalledWith('password');
    expect(screen.getByTestId('wallet-address')).toHaveTextContent('newRandomAddress');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error-message')).toBeEmptyDOMElement();
  });

  it('createRandomWallet handles errors', async () => {
    (mockEthersWallet.createRandom as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Creation failed');
    });

    renderWithProvider(<TestConsumerComponent />);

    await act(async () => {
      screen.getByText('Create Wallet').click();
    });

    expect(screen.getByTestId('wallet-address')).toBeEmptyDOMElement();
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to create wallet: Creation failed');
  });

  it('restoreFromMnemonic successfully restores a wallet', async () => {
    const mockWalletInstance = {
      address: 'restoredAddress',
      encryptSync: vi.fn().mockResolvedValue('restoredEncryptedJson'),
      connect: vi.fn().mockReturnThis(),
    };
    (mockEthersWallet.fromPhrase as ReturnType<typeof vi.fn>).mockReturnValue(mockWalletInstance);

    renderWithProvider(<TestConsumerComponent />);

    await act(async () => {
      screen.getByText('Restore Wallet').click();
    });
    
    expect(mockEthersWallet.fromPhrase).toHaveBeenCalledWith('mnemonic phrase');
    expect(mockWalletInstance.encryptSync).toHaveBeenCalledWith('password');
    expect(screen.getByTestId('wallet-address')).toHaveTextContent('restoredAddress');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error-message')).toBeEmptyDOMElement();
  });

  it('restoreFromMnemonic handles errors', async () => {
    (mockEthersWallet.fromPhrase as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('Restore failed');
    });
    renderWithProvider(<TestConsumerComponent />);

    await act(async () => {
      screen.getByText('Restore Wallet').click();
    });

    expect(screen.getByTestId('wallet-address')).toBeEmptyDOMElement();
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to restore wallet: Restore failed');
  });


  it('connectEncryptedJson successfully connects a wallet', async () => {
    // const mockJson = '{"data":"encrypted"}'; // Not used due to button click
    // const mockPassword = 'testpassword'; // Not used due to button click
    const connectedWalletMock = { address: 'connectedWalletAddress', connect: vi.fn().mockReturnThis() };
    // Override the default beforeEach mock for this specific test case for clarity
    mockGetWalletFromEncryptedJson.mockResolvedValue(connectedWalletMock);

    renderWithProvider(<TestConsumerComponent />);

    await act(async () => {
       screen.getByText('Connect').click(); 
    });
    
    expect(mockGetWalletFromEncryptedJson).toHaveBeenCalledWith('{}', 'password'); 
    expect(screen.getByTestId('wallet-address')).toHaveTextContent('connectedWalletAddress');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error-message')).toBeEmptyDOMElement();
  });
  

  it('connectEncryptedJson handles connection errors', async () => {
    mockGetWalletFromEncryptedJson.mockRejectedValue(new Error('Decryption failed'));
    
    renderWithProvider(<TestConsumerComponent />);

    await act(async () => {
      screen.getByText('Connect').click();
    });

    expect(screen.getByTestId('wallet-address')).toBeEmptyDOMElement();
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to connect wallet: Decryption failed');
  });

  it('disconnect clears the wallet and error', async () => {
    const disconnectTestWalletMock = { address: 'testAddressToDisconnect', connect: vi.fn().mockReturnThis() };
    mockGetWalletFromEncryptedJson.mockResolvedValue(disconnectTestWalletMock);
    renderWithProvider(<TestConsumerComponent />);
    
    await act(async () => {
      screen.getByText('Connect').click();
    });
    expect(screen.getByTestId('wallet-address')).toHaveTextContent('testAddressToDisconnect');

    // Now disconnect
    await act(async () => {
      screen.getByText('Disconnect').click();
    });

    expect(screen.getByTestId('wallet-address')).toBeEmptyDOMElement();
    expect(screen.getByTestId('error-message')).toBeEmptyDOMElement();
    expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
  });
});
