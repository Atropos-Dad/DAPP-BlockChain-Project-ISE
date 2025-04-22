import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';

const ImportWalletPage: React.FC = () => {
  const { connectEncryptedJson, isLoading, error } = useWallet();
  const [password, setPassword] = useState('');
  const [encryptedJson, setEncryptedJson] = useState('');
  const navigate = useNavigate();

  // Handle connecting to wallet
  const handleConnectWallet = async () => {
    if (!encryptedJson || !password) {
      alert('Please provide both encrypted JSON and password');
      return;
    }

    await connectEncryptedJson(encryptedJson, password);
    
    // Navigate to wallet details page if wallet is connected successfully
    if (!error) {
      navigate('/wallet');
    }
  };

  // Handle file upload for the encrypted JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setEncryptedJson(content);
    };
    reader.readAsText(file);
  };

  return (
    <div style={{border: '1px solid #ddd', borderRadius: '5px', padding: '20px', margin: '10px 0'}}>
      <h1 style={{marginBottom: '20px'}}>Import Wallet</h1>
      
      {error && (
        <div style={{backgroundColor: '#ffebee', padding: '10px', marginBottom: '15px', borderRadius: '4px'}}>
          <strong>Error:</strong> <span>{error}</span>
        </div>
      )}

      <div style={{marginBottom: '15px'}}>
        <label style={{display: 'block', marginBottom: '5px'}}>
          Encrypted JSON:
        </label>
        <div style={{marginBottom: '10px'}}>
          <input 
            type="file" 
            onChange={handleFileUpload}
            style={{width: '100%', padding: '8px'}}
          />
        </div>
        <p style={{fontSize: '0.85em', marginBottom: '5px'}}>or paste JSON:</p>
        <textarea 
          value={encryptedJson} 
          onChange={(e) => setEncryptedJson(e.target.value)}
          style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '100px'}}
          placeholder="Paste your encrypted JSON here"
        />
      </div>

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
          placeholder="Enter your wallet password"
        />
      </div>

      <button 
        onClick={handleConnectWallet} 
        disabled={isLoading}
        style={{backgroundColor: '#2196f3', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: isLoading ? 'not-allowed' : 'pointer'}}
      >
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
};

export default ImportWalletPage; 