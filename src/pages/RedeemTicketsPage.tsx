import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useWallet } from '../contexts/WalletContext';
import { redeemTickets } from '../services/contractService';
import { Navigate, useNavigate } from 'react-router-dom';

interface ScanResult {
  holder: string;
  tokenAddress: string;
  amount: number;
}

const RedeemTicketsPage: React.FC = () => {
  const { wallet } = useWallet();
  const navigate = useNavigate();
  const [scanData, setScanData] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [txHash, setTxHash] = useState<string | undefined>();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState<number>(1);
  const [manualInput, setManualInput] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);

  // Redirect if no wallet is connected
  if (!wallet) return <Navigate to="/import" replace />;

  const handleScan = (decoded: string | null) => {
    if (!decoded) return;
    try {
      const parsed = JSON.parse(decoded) as ScanResult;
      setScanData(parsed);
      setError(undefined);
      // Default to full amount or 1 if zero
      setRedeemAmount(parsed.amount > 0 ? parsed.amount : 1);
    } catch (err) {
      setError('Invalid QR code. The scanned payload is not in the expected format.');
    }
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      setError('Please enter QR code data');
      return;
    }
    
    handleScan(manualInput);
  };

  const doRedeem = async () => {
    if (!scanData || redeemAmount <= 0) return;
    
    setIsRedeeming(true);
    setError(undefined);
    
    try {
      if (redeemAmount > scanData.amount) {
        throw new Error(`Cannot redeem ${redeemAmount} tickets. User only has ${scanData.amount} available.`);
      }
      
      const receipt = await redeemTickets(
        scanData.tokenAddress,
        wallet,
        scanData.holder,
        redeemAmount
      );
      
      setTxHash(receipt.hash);
    } catch (err: any) {
      console.error('Redemption error:', err);
      // Handle different types of errors
      if (err.message.includes('caller is not a redemption agent')) {
        setError('Permission denied: Your wallet is not registered as a redemption agent.');
      } else {
        setError(err.message || 'Redemption failed. Please try again.');
      }
    } finally {
      setIsRedeeming(false);
    }
  };

  const resetScanner = () => {
    setScanData(null);
    setError(undefined);
    setTxHash(undefined);
    setManualInput('');
  };

  const toggleManualInput = () => {
    setShowManualInput(!showManualInput);
    if (!showManualInput) {
      setManualInput('');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>Ticket Redemption</h1>
      
      {!scanData && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
            <button
              onClick={toggleManualInput}
              style={{
                backgroundColor: '#607d8b',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {showManualInput ? 'Use Scanner' : 'Manual Input (For Testing)'}
            </button>
          </div>
          
          {showManualInput ? (
            // Manual input for testing
            <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
              <p style={{ marginBottom: '10px' }}>Paste QR code data here:</p>
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                style={{ 
                  width: '100%', 
                  minHeight: '120px', 
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  marginBottom: '10px',
                  fontFamily: 'monospace',
                  fontSize: '14px'
                }}
                placeholder='{"holder":"0x...","tokenAddress":"0x...","amount":1}'
              />
              <button
                onClick={handleManualSubmit}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Process Data
              </button>
            </div>
          ) : (
            // QR Scanner
            <>
              <p style={{ marginBottom: '20px' }}>Scan the attendee's QR code</p>
              <div style={{ width: '320px', height: '320px', margin: '0 auto', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                <Scanner
                  onScan={(codes) => {
                    if (codes.length > 0) {
                      handleScan(codes[0].rawValue);
                    }
                  }}
                  onError={(err) => console.error('Scanner error:', err)}
                  scanDelay={500}
                  constraints={{ facingMode: 'environment' }}
                />
              </div>
            </>
          )}
        </div>
      )}
      
      {error && (
        <div style={{ 
          margin: '20px 0', 
          padding: '10px 15px', 
          backgroundColor: '#ffebee', 
          color: '#d32f2f',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
      
      {scanData && !txHash && (
        <div style={{ 
          margin: '20px 0', 
          padding: '20px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '8px'
        }}>
          <h2 style={{ marginBottom: '15px', fontSize: '1.2em' }}>Ticket Information</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <p><strong>Holder:</strong> {scanData.holder}</p>
            <p><strong>Available Tickets:</strong> {scanData.amount}</p>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <strong>Number of Tickets to Redeem:</strong>
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                min="1"
                max={scanData.amount}
                value={redeemAmount}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setRedeemAmount(isNaN(val) ? 1 : Math.min(Math.max(val, 1), scanData.amount));
                }}
                style={{ 
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  width: '80px',
                  marginRight: '10px'
                }}
              />
              <span>of {scanData.amount}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={doRedeem}
              disabled={isRedeeming}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '4px',
                cursor: isRedeeming ? 'not-allowed' : 'pointer',
                opacity: isRedeeming ? 0.7 : 1,
                flex: 1
              }}
            >
              {isRedeeming ? 'Processing...' : 'Redeem Tickets'}
            </button>
            
            <button
              onClick={resetScanner}
              disabled={isRedeeming}
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '4px',
                cursor: isRedeeming ? 'not-allowed' : 'pointer',
                opacity: isRedeeming ? 0.7 : 1
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {txHash && (
        <div style={{ 
          margin: '20px 0', 
          padding: '20px', 
          backgroundColor: '#e8f5e9', 
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '15px', color: '#2e7d32', fontSize: '1.2em' }}>
            Tickets Redeemed Successfully!
          </h2>
          
          <p style={{ marginBottom: '15px' }}>
            Transaction Hash:<br />
            <span style={{ wordBreak: 'break-all', fontSize: '0.9em' }}>{txHash}</span>
          </p>
          
          <button
            onClick={resetScanner}
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Scan Next Ticket
          </button>
        </div>
      )}
      
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            backgroundColor: '#607d8b',
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

export default RedeemTicketsPage; 