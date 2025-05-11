import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';

const ImportWalletPage: React.FC = () => {
  const { connectEncryptedJson, isLoading, error } = useWallet();
  const [password, setPassword] = useState('');
  const [encryptedJson, setEncryptedJson] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [importMethod, setImportMethod] = useState<'json' | 'privateKey'>('json');
  const [convertingKey, setConvertingKey] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Handle connecting to wallet
  const handleConnectWallet = async () => {
    if (importMethod === 'json') {
      if (!encryptedJson || !password) {
        alert('Please provide both encrypted JSON and password');
        return;
      }

      await connectEncryptedJson(encryptedJson, password);
    } else {
      if (!privateKey || !password) {
        alert('Please provide both private key and password');
        return;
      }

      try {
        setConvertingKey(true);
        setConversionError(null);

        // Ensure private key has 0x prefix
        const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        
        // Validate the private key format
        if (!ethers.isHexString(formattedKey, 32)) {
          throw new Error('Invalid private key format. It should be a 64-character hex string (with or without 0x prefix)');
        }

        // Create a wallet from the private key
        const wallet = new ethers.Wallet(formattedKey);
        
        // Encrypt the wallet to JSON
        const json = await wallet.encryptSync(password);
        
        // Connect with the encrypted JSON
        await connectEncryptedJson(json, password);
      } catch (err: any) {
        setConversionError(err.message || 'Failed to convert private key');
        return;
      } finally {
        setConvertingKey(false);
      }
    }
    
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

      {conversionError && (
        <div style={{backgroundColor: '#ffebee', padding: '10px', marginBottom: '15px', borderRadius: '4px'}}>
          <strong>Conversion Error:</strong> <span>{conversionError}</span>
        </div>
      )}

      {/* Import Method Tabs */}
      <div style={{marginBottom: '20px', display: 'flex', borderBottom: '1px solid #ddd'}}>
        <button 
          onClick={() => setImportMethod('json')}
          style={{
            padding: '10px 15px',
            backgroundColor: importMethod === 'json' ? '#e3f2fd' : 'transparent',
            border: 'none',
            borderBottom: importMethod === 'json' ? '2px solid #2196f3' : 'none',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Encrypted JSON
        </button>
        <button 
          onClick={() => setImportMethod('privateKey')}
          style={{
            padding: '10px 15px',
            backgroundColor: importMethod === 'privateKey' ? '#e3f2fd' : 'transparent',
            border: 'none',
            borderBottom: importMethod === 'privateKey' ? '2px solid #2196f3' : 'none',
            cursor: 'pointer'
          }}
        >
          Private Key
        </button>
      </div>

      {importMethod === 'json' ? (
        // JSON Import Section
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
      ) : (
        // Private Key Import Section
        <div style={{marginBottom: '15px'}}>
          <label style={{display: 'block', marginBottom: '5px'}}>
            Private Key:
          </label>
          <input 
            type="password" 
            value={privateKey} 
            onChange={(e) => setPrivateKey(e.target.value)}
            style={{width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px'}}
            placeholder="Enter your private key (with or without 0x prefix)"
          />
          <p style={{fontSize: '0.85em', marginTop: '5px', color: '#666'}}>
            Note: The private key will be converted to an encrypted JSON format using your password.
          </p>
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
          placeholder={importMethod === 'json' ? "Enter your wallet password" : "Create a password to encrypt your wallet"}
        />
      </div>

      <button 
        onClick={handleConnectWallet} 
        disabled={isLoading || convertingKey}
        style={{backgroundColor: '#2196f3', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: (isLoading || convertingKey) ? 'not-allowed' : 'pointer'}}
      >
        {isLoading ? 'Connecting...' : convertingKey ? 'Converting Key...' : 'Connect Wallet'}
      </button>
    </div>
  );
};

export default ImportWalletPage; 