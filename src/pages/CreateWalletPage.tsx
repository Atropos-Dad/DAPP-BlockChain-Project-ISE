import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

const CreateWalletPage: React.FC = () => {
  const { createRandomWallet, isLoading, error } = useWallet();
  const [password, setPassword] = useState('');
  const [walletInfo, setWalletInfo] = useState<{
    address: string;
    mnemonic: string | undefined;
  } | null>(null);
  const navigate = useNavigate();

  // Handle wallet creation
  const handleCreateWallet = async () => {
    if (!password) {
      alert('Please enter a password');
      return;
    }

    try {
      const result = await createRandomWallet(password);
      setWalletInfo({
        address: result.address,
        mnemonic: result.mnemonic
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
      console.error('Error creating wallet:', err);
    }
  };

  return (
    <div style={{border: '1px solid #ddd', borderRadius: '5px', padding: '20px', margin: '10px 0'}}>
      <h1 style={{marginBottom: '20px'}}>Create New Wallet</h1>
      
      {error && (
        <div style={{backgroundColor: '#ffebee', padding: '10px', marginBottom: '15px', borderRadius: '4px'}}>
          <strong>Error:</strong> <span>{error}</span>
        </div>
      )}

      <div style={{marginBottom: '15px'}}>
        <label style={{display: 'block', marginBottom: '5px'}} htmlFor="password">
          Password:
        </label>
        <input 
          id="password"
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
          placeholder="Enter a secure password"
        />
      </div>

      <button 
        onClick={handleCreateWallet} 
        disabled={isLoading}
        style={{backgroundColor: '#4caf50', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: isLoading ? 'not-allowed' : 'pointer'}}
      >
        {isLoading ? 'Creating...' : 'Create Random Wallet'}
      </button>

      {walletInfo && (
        <div style={{backgroundColor: '#fff3e0', padding: '15px', marginTop: '20px', borderRadius: '4px'}}>
          <h2 style={{marginBottom: '15px'}}>New Wallet Created</h2>
          <p style={{marginBottom: '10px'}}>
            <strong>Address:</strong> {walletInfo.address}
          </p>
          
          {walletInfo.mnemonic && (
            <div>
              <p style={{marginBottom: '10px'}}><strong>⚠️ Mnemonic (STORE SAFELY):</strong></p>
              <pre style={{backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflowX: 'auto'}}>
                {walletInfo.mnemonic}
              </pre>
              <p style={{color: 'red', marginTop: '10px'}}>
                ⚠️ Save this mnemonic phrase and NEVER share it! Anyone with this phrase can access your wallet.
              </p>
              <p style={{marginTop: '10px'}}>
                You can use this mnemonic phrase to <Link to="/restore" style={{color: '#2196f3'}}>restore your wallet</Link> if you lose access to your JSON file.
              </p>
            </div>
          )}
          
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

export default CreateWalletPage; 