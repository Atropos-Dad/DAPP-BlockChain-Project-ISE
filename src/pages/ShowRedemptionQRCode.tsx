import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { useWallet } from '../contexts/WalletContext';
import { useTicketBalance } from '../hooks/useContractData';
import { Navigate, useNavigate } from 'react-router-dom';

// Default token address, but can be configured or passed as a prop
// In production, use an environment variable like process.env.REACT_APP_EVENT_TOKEN_ADDRESS
const DEFAULT_TOKEN_ADDRESS = import.meta.env.VITE_EVENT_TOKEN_ADDRESS;

const ShowRedemptionQRCode: React.FC = () => {
  const { wallet } = useWallet();
  const navigate = useNavigate();
  const [tokenAddress, setTokenAddress] = useState<string>(DEFAULT_TOKEN_ADDRESS);
  const { balance, isLoading, error } = useTicketBalance(tokenAddress, wallet?.address);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Redirect if no wallet is connected
  if (!wallet) return <Navigate to="/import" replace />;

  // Create the data payload for the QR code
  const payload = JSON.stringify({
    holder: wallet.address,
    tokenAddress,
    amount: balance
  });

  // Function to copy QR data to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(payload)
      .then(() => {
        setCopySuccess(true);
        // Reset the success message after 3 seconds
        setTimeout(() => setCopySuccess(false), 3000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Your Ticket QR Code</h1>
      
      {error && (
        <div style={{ color: 'red', margin: '15px 0' }}>
          Error: {error}
        </div>
      )}
      
      {isLoading ? (
        <div style={{ margin: '40px 0' }}>Loading your ticket information...</div>
      ) : (
        <>
          <div style={{ margin: '20px 0' }}>
            <p><strong>Wallet Address:</strong> {wallet.address}</p>
            <p><strong>Tickets Available:</strong> {balance}</p>
          </div>
          
          {balance > 0 ? (
            <div style={{ margin: '30px auto', maxWidth: '300px' }}>
              <div style={{ padding: '15px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                <QRCode 
                  value={payload} 
                  size={256} 
                  style={{ height: 'auto', maxWidth: '100%' }} 
                />
              </div>
              <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                Show this QR code to the redemption agent to redeem your tickets.
              </p>
              
              {/* Test functionality to copy QR data */}
              <div style={{ marginTop: '20px' }}>
                <button 
                  onClick={copyToClipboard}
                  style={{
                    backgroundColor: '#FF9800',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Copy QR Data (For Testing)
                </button>
                {copySuccess && (
                  <p style={{ color: 'green', marginTop: '8px', fontSize: '14px' }}>
                    Data copied to clipboard!
                  </p>
                )}
              </div>
              
              {/* For debugging - show the raw payload data */}
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '4px',
                fontSize: '12px',
                wordBreak: 'break-all',
                textAlign: 'left'
              }}>
                <strong>Raw QR Data:</strong>
                <pre style={{ margin: '5px 0 0 0', whiteSpace: 'pre-wrap' }}>
                  {payload}
                </pre>
              </div>
            </div>
          ) : (
            <div style={{ margin: '30px 0', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
              <p>You don't have any tickets to redeem.</p>
              <button 
                onClick={() => navigate('/buy-tickets')}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '15px'
                }}
              >
                Buy Tickets
              </button>
            </div>
          )}
        </>
      )}
      
      <div style={{ marginTop: '30px' }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default ShowRedemptionQRCode; 