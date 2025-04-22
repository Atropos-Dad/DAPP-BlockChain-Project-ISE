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

  useEffect(() => {
    // If no wallet is connected, redirect back to import page
    if (!wallet) {
      navigate('/import');
      return;
    }

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

    fetchBalance();
  }, [wallet, navigate]);

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  if (!wallet) {
    return null; // Will redirect in useEffect
  }

  return (
    <div style={{border: '1px solid #ddd', borderRadius: '5px', padding: '20px', margin: '10px 0'}}>
      <h1 style={{marginBottom: '20px'}}>Wallet Details</h1>
      
      <div style={{margin: '20px 0'}}>
        <div style={{marginBottom: '15px'}}>
          <h2 style={{fontSize: '1.2em', marginBottom: '10px'}}>Wallet Address</h2>
          <div style={{padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', wordBreak: 'break-all'}}>
            {wallet.address}
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
      
      <div style={{textAlign: 'center', marginTop: '20px'}}>
        <button 
          onClick={handleDisconnect}
          style={{backgroundColor: '#f44336', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer'}}
        >
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
};

export default WalletDetails; 