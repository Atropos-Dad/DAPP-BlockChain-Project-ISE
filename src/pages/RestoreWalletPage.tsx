import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

const RestoreWalletPage: React.FC = () => {
  const { restoreFromMnemonic, isLoading, error } = useWallet();
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [restoredInfo, setRestoredInfo] = useState<{
    address: string;
  } | null>(null);
  const navigate = useNavigate();

  // Handle wallet restoration
  const handleRestoreWallet = async () => {
    if (!mnemonic) {
      alert('Please enter your mnemonic phrase');
      return;
    }
    
    if (!password) {
      alert('Please enter a password');
      return;
    }

    try {
      const result = await restoreFromMnemonic(mnemonic, password);
      setRestoredInfo({
        address: result.address
      });

      // Trigger download of the encrypted JSON
      if (result.json) {
        const blob = new Blob([result.json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wallet-${result.address.slice(0, 8)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error restoring wallet:', err);
    }
  };

  return (
    <div style={{border: '1px solid #ddd', borderRadius: '5px', padding: '20px', margin: '10px 0'}}>
      <h1 style={{marginBottom: '20px'}}>Restore Wallet from Mnemonic</h1>
      
      {error && (
        <div style={{backgroundColor: '#ffebee', padding: '10px', marginBottom: '15px', borderRadius: '4px'}}>
          <strong>Error:</strong> <span>{error}</span>
        </div>
      )}

      <div style={{marginBottom: '15px'}}>
        <label style={{display: 'block', marginBottom: '5px'}} htmlFor="mnemonic">
          Mnemonic Phrase:
        </label>
        <textarea 
          id="mnemonic"
          value={mnemonic} 
          onChange={(e) => setMnemonic(e.target.value)}
          style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px'}}
          placeholder="Enter your 12-word recovery phrase (separated by spaces)"
        />
      </div>

      <div style={{marginBottom: '15px'}}>
        <label style={{display: 'block', marginBottom: '5px'}} htmlFor="password">
          New Password:
        </label>
        <input 
          id="password"
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
          placeholder="Create a secure password for your wallet"
        />
      </div>

      <button 
        onClick={handleRestoreWallet} 
        disabled={isLoading}
        style={{backgroundColor: '#ff9800', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: isLoading ? 'not-allowed' : 'pointer'}}
      >
        {isLoading ? 'Restoring...' : 'Restore Wallet'}
      </button>

      {restoredInfo && (
        <div style={{backgroundColor: '#e8f5e9', padding: '15px', marginTop: '20px', borderRadius: '4px'}}>
          <h2 style={{marginBottom: '15px'}}>Wallet Restored Successfully</h2>
          <p style={{marginBottom: '10px'}}>
            <strong>Address:</strong> {restoredInfo.address}
          </p>
          <p style={{marginBottom: '10px'}}>
            Your wallet has been restored and the encrypted JSON file has been downloaded. Keep this file safe!
          </p>
          <div style={{marginTop: '15px'}}>
            <button
              onClick={() => navigate('/wallet')}
              style={{backgroundColor: '#2196f3', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer'}}
            >
              Go to Wallet Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestoreWalletPage; 