import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';
import { provider } from '../chain';

const WalletDetails: React.FC = () => {
  const { wallet, disconnect } = useWallet();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [networkInfo, setNetworkInfo] = useState<{name: string, chainId: number} | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState<boolean>(false);
  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Address copied to clipboard!');
  };

  // Function to temporarily display private key for Foundry testing
  const displayPrivateKey = () => {
    if (!wallet) return;
    setShowPrivateKey(!showPrivateKey);
    
    // Auto-hide after 30 seconds for security
    if (!showPrivateKey) {
      setTimeout(() => {
        setShowPrivateKey(false);
      }, 30000);
    }
  };

  // Function to hide private key
  const hidePrivateKey = () => {
    setShowPrivateKey(false);
  };

  useEffect(() => {
    // If no wallet is connected, redirect back to import page
    if (!wallet) {
      navigate('/import');
      return;
    }

    // Get network information
    const fetchNetworkInfo = async () => {
      try {
        const network = await provider.getNetwork();
        setNetworkInfo({
          name: network.name,
          chainId: Number(network.chainId)
        });
      } catch (error) {
        console.error('Error fetching network info:', error);
      }
    };

    // Get wallet ETH balance
    const fetchBalance = async () => {
      try {
        setIsLoading(true);
        const ethBalance = await provider.getBalance(wallet.address);
        setBalance(ethers.formatEther(ethBalance));
      } catch (error) {
        console.error('Error fetching balance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Get recent transactions
    const fetchTransactions = async () => {
      if (!wallet) return;
      
      try {
        setIsLoadingTxs(true);
        //TODO THIS IS BAD ! _
        // Using ethers v6 to get the most recent transactions
        // Note: This is a simplified implementation and may not work on all networks
        // For production, you might want to use a service like Etherscan API
        const blockNumber = await provider.getBlockNumber();
        // Search up to the last 1000 blocks for transactions
        const searchDepth = Math.min(blockNumber, 1000); 
        const blocksToSearch = Array.from({length: searchDepth}, (_, i) => blockNumber - i);

        const txs: any[] = [];
        // Search blocks from latest to oldest within the defined depth
        for (const blockNum of blocksToSearch) { 
          // Ensure we don't go below block 0
          if (blockNum < 0) break; 

          const blockData = await provider.getBlock(blockNum);
          if (blockData && blockData.transactions) {
            // We'll get detailed info for each transaction
            for (const txHash of blockData.transactions) {
              const tx = await provider.getTransaction(txHash);
              if (tx && (tx.from === wallet.address || tx.to === wallet.address)) {
                txs.push(tx);
              }
              // Limit to 5 transactions to avoid too many requests
              if (txs.length >= 5) break;
            }
          }
          if (txs.length >= 5) break;
        }
        
        setTransactions(txs);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setIsLoadingTxs(false);
      }
    };

    fetchNetworkInfo();
    fetchBalance();
    fetchTransactions();
  }, [wallet, navigate]);

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  const openEtherscan = () => {
    if (!wallet) return;
    
    // Determine the correct Etherscan URL based on network
    let etherscanUrl = 'https://sepolia.etherscan.io/address/';
    if (networkInfo?.name === 'homestead') {
      etherscanUrl = 'https://etherscan.io/address/';
    }
    
    window.open(etherscanUrl + wallet.address, '_blank');
  };

  if (!wallet) {
    return null; // Will redirect in useEffect
  }

  return (
    <div style={{border: '1px solid #ddd', borderRadius: '5px', padding: '20px', margin: '10px 0'}}>
      <h1 style={{marginBottom: '20px'}}>Wallet Details</h1>
      
      {networkInfo && (
        <div style={{marginBottom: '15px', backgroundColor: '#f0f8ff', padding: '10px', borderRadius: '4px'}}>
          <h2 style={{fontSize: '1.2em', marginBottom: '10px'}}>Network</h2>
          <div>
            <span style={{fontWeight: 'bold'}}>{networkInfo.name}</span> (Chain ID: {networkInfo.chainId})
          </div>
        </div>
      )}
      
      <div style={{margin: '20px 0'}}>
        <div style={{marginBottom: '15px'}}>
          <h2 style={{fontSize: '1.2em', marginBottom: '10px'}}>Wallet Address</h2>
          <div style={{
            padding: '10px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '4px', 
            wordBreak: 'break-all',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{wallet.address}</span>
            <div>
              <button 
                onClick={() => copyToClipboard(wallet.address)}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  marginRight: '5px',
                  cursor: 'pointer'
                }}
              >
                Copy
              </button>
              <button 
                onClick={openEtherscan}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                View on Etherscan
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <h2 style={{fontSize: '1.2em', marginBottom: '10px'}}>ETH Balance</h2>
          {isLoading ? (
            <div style={{padding: '10px'}}>
              <div style={{color: '#666'}}>Loading balance...</div>
            </div>
          ) : (
            <div style={{fontSize: '1.2em', fontWeight: 'bold'}}>
              <span>{balance}</span> ETH
            </div>
          )}
        </div>
      </div>
      
      {/* Foundry Testing Section */}
      <div style={{margin: '20px 0', borderTop: '1px solid #eee', paddingTop: '20px'}}>
        <h2 style={{fontSize: '1.2em', marginBottom: '10px'}}>Foundry Testing Options</h2>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <button 
            onClick={displayPrivateKey}
            style={{
              backgroundColor: showPrivateKey ? '#f44336' : '#FF9800',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showPrivateKey ? 'Hide Private Key' : 'Show Private Key (For Testing Only)'}
          </button>
          <span style={{fontSize: '0.8em', color: '#666', marginLeft: '10px'}}>
            Use only for development/testing!
          </span>
        </div>
        
        {showPrivateKey && (
          <div style={{
            marginTop: '15px',
            padding: '15px',
            backgroundColor: '#ffe6e6',
            borderRadius: '4px',
            border: '1px solid #f44336'
          }}>
            <div style={{fontWeight: 'bold', color: '#f44336', marginBottom: '10px'}}>
              WARNING: NEVER share this with anyone or expose in production!
            </div>
            <div style={{
              wordBreak: 'break-all',
              backgroundColor: '#fff',
              padding: '10px',
              borderRadius: '4px',
              fontFamily: 'monospace'
            }}>
              {wallet.privateKey}
            </div>
            <div style={{marginTop: '15px'}}>
              <h3 style={{fontSize: '1em', marginBottom: '5px'}}>Foundry Cast Command Example:</h3>
              <div style={{
                backgroundColor: '#333',
                color: '#fff',
                padding: '10px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9em'
              }}>
                cast send --rpc-url=$RPC_URL &lt;contract-address&gt; "methodName(address)" &lt;address&gt; --private-key={wallet.privateKey}
              </div>
            </div>
            <button 
              onClick={hidePrivateKey}
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '15px'
              }}
            >
              Hide Private Key Now
            </button>
          </div>
        )}
      </div>
      
      <div style={{margin: '20px 0'}}>
        <h2 style={{fontSize: '1.2em', marginBottom: '10px'}}>Recent Transactions</h2>
        {isLoadingTxs ? (
          <div style={{padding: '10px'}}>
            <div style={{color: '#666'}}>Loading transactions...</div>
          </div>
        ) : transactions.length > 0 ? (
          <div style={{maxHeight: '300px', overflowY: 'auto'}}>
            {transactions.map((tx, index) => (
              <div key={index} style={{
                padding: '10px',
                backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff',
                borderBottom: '1px solid #eee'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                  <div>
                    <strong>{tx.from === wallet.address ? 'Sent' : 'Received'}</strong>
                  </div>
                  <div>{tx.value ? ethers.formatEther(tx.value) + ' ETH' : 'Contract Interaction'}</div>
                </div>
                <div style={{fontSize: '0.8em', color: '#666', marginTop: '5px'}}>
                  Hash: {tx.hash.substring(0, 10)}...
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px'}}>
            No recent transactions found
          </div>
        )}
      </div>
      
      <div style={{marginTop: '20px', display: 'flex', gap: '10px'}}>
        <button 
          onClick={handleDisconnect}
          style={{
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Disconnect Wallet
        </button>
        
        <button 
          onClick={() => navigate('/buy-tickets')}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Buy Event Tickets
        </button>

        <button 
          onClick={() => navigate('/redeem')}
          style={{
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Redeem Tickets (Agent)
        </button>
      </div>
    </div>
  );
};

export default WalletDetails; 