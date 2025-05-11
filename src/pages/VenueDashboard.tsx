import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { useEventDetails, useVenueDashboard, useManageAgents } from '../hooks/useContractData';

// Get contract addresses from environment variables
const EVENT_TOKEN_ADDRESS = import.meta.env.VITE_EVENT_TOKEN_ADDRESS || '';
const EVENT_SALES_ADDRESS = import.meta.env.VITE_EVENT_TICKET_SALES_ADDRESS || '';

const VenueDashboard: React.FC = () => {
  const { wallet } = useWallet();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  // Form state for redemption agents
  const [agentAddress, setAgentAddress] = useState<string>('');

  // Check if required environment variables are set
  useEffect(() => {
    if (!EVENT_TOKEN_ADDRESS) {
      setError('Event token address is not configured. Please check your environment variables.');
    } else if (!EVENT_SALES_ADDRESS) {
      setError('Event sales address is not configured. Please check your environment variables.');
    }
  }, []);

  // Use custom hooks to fetch data
  const { eventDetails, isLoading: eventDetailsLoading, error: eventDetailsError } = 
    useEventDetails(EVENT_TOKEN_ADDRESS);
  
  const { data: venueData, loading: venueDataLoading, error: venueDataError } = 
    useVenueDashboard(EVENT_SALES_ADDRESS, EVENT_TOKEN_ADDRESS, wallet);
  
  const { addAgent, removeAgent, isWorking: isAgentWorking, error: agentError, transactionHash: agentTxHash } = 
    useManageAgents(EVENT_TOKEN_ADDRESS, wallet);

  // Combined loading state
  const isLoading = eventDetailsLoading || venueDataLoading;

  // Handle errors from hooks
  useEffect(() => {
    let finalErrorMessage: string | null = null;

    // Check agentError first for ownership issues
    if (agentError) {
      if (typeof agentError === 'string' && agentError.toLowerCase().includes('execution reverted')) {
        finalErrorMessage = "Authorization Error: Only the contract owner can manage agents.";
      } else {
        finalErrorMessage = agentError;
      }
    // Otherwise, use other errors as they are
    } else if (eventDetailsError) {
      finalErrorMessage = eventDetailsError;
    } else if (venueDataError) {
      finalErrorMessage = venueDataError;
    }

    // Set the determined error message (or null to clear existing errors)
    setError(finalErrorMessage);

  }, [eventDetailsError, venueDataError, agentError]);

  // Redirect if no wallet
  useEffect(() => {
    if (!wallet) {
      navigate('/import');
    }
  }, [wallet, navigate]);

  // Handle adding redemption agent
  const handleAddAgent = async () => {
    if (!agentAddress || !ethers.isAddress(agentAddress)) {
      setError('Please enter a valid Ethereum address');
      return;
    }
    
    const result = await addAgent(agentAddress);
    if (result?.success) {
      setAgentAddress(''); // Clear input on success
    }
  };

  // Format time remaining in hours and minutes
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Expired';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Loading dashboard data...</h2>
        {error && (
          <div style={{ 
            margin: '15px 0', 
            padding: '10px 15px', 
            backgroundColor: '#ffebee', 
            color: '#d32f2f',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '5px', padding: '20px', margin: '10px 0' }}>
      <h1 style={{ marginBottom: '20px' }}>Venue Dashboard</h1>

      {error && (
        <div style={{ 
          margin: '15px 0', 
          padding: '10px 15px', 
          backgroundColor: '#ffebee', 
          color: '#d32f2f',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {/* Event Details Section */}
      {eventDetails && (
        <div style={{ marginBottom: '20px', backgroundColor: '#f0f8ff', padding: '15px', borderRadius: '4px' }}>
          <h2 style={{ fontSize: '1.3em', marginBottom: '10px' }}>Event Information</h2>
          <div><strong>Event:</strong> {eventDetails.eventName}</div>
          <div><strong>Date:</strong> {eventDetails.eventDate}</div>
          <div><strong>Venue:</strong> {eventDetails.eventVenue}</div>
          <div><strong>Token:</strong> {eventDetails.name} ({eventDetails.symbol})</div>
        </div>
      )}

      {/* Ticket Sales Summary */}
      {venueData && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '15px', 
          marginBottom: '30px'
        }}>
          <div style={{ 
            flex: '1 1 200px', 
            backgroundColor: '#e8f5e9', 
            padding: '15px', 
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '5px', fontSize: '1em' }}>Tickets Sold</h3>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold' }}>{venueData.totalSold}</div>
          </div>
          
          <div style={{ 
            flex: '1 1 200px', 
            backgroundColor: '#e3f2fd', 
            padding: '15px', 
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '5px', fontSize: '1em' }}>Available Tickets</h3>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold' }}>{venueData.availableTickets}</div>
          </div>
          
          <div style={{ 
            flex: '1 1 200px', 
            backgroundColor: '#fff8e1', 
            padding: '15px', 
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: '5px', fontSize: '1em' }}>Contract Balance</h3>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold' }}>{venueData.contractBalanceEth ? `${venueData.contractBalanceEth} ETH` : 'Loading...'}</div>
          </div>
        </div>
      )}

      {/* Times remaining */}
      {venueData && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '15px', 
          marginBottom: '30px'
        }}>
          <div style={{ 
            flex: '1 1 300px', 
            backgroundColor: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '4px'
          }}>
            <h3 style={{ marginBottom: '5px', fontSize: '1.1em' }}>Sales Period</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>Time Remaining:</div>
              <div style={{ 
                fontWeight: 'bold',
                color: venueData.remainingSalesTime <= 0 ? '#d32f2f' : '#2e7d32'
              }}>
                {formatTimeRemaining(venueData.remainingSalesTime)}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
              <div>Sales Status:</div>
              <div style={{ 
                fontWeight: 'bold',
                color: venueData.salesPaused ? '#d32f2f' : '#2e7d32'
              }}>
                {venueData.salesPaused ? 'Paused' : 'Active'}
              </div>
            </div>
          </div>
          
          <div style={{ 
            flex: '1 1 300px', 
            backgroundColor: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '4px'
          }}>
            <h3 style={{ marginBottom: '5px', fontSize: '1.1em' }}>Refund Period</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>Time Remaining:</div>
              <div style={{ 
                fontWeight: 'bold',
                color: venueData.remainingRefundTime <= 0 ? '#d32f2f' : '#2e7d32'
              }}>
                {formatTimeRemaining(venueData.remainingRefundTime)}
              </div>
            </div>
            <div style={{ fontSize: '0.9em', marginTop: '5px', color: '#666' }}>
              Refunds are only possible during this period.
            </div>
          </div>
        </div>
      )}

      {/* Redemption Agents Section */}
      <div style={{ 
        margin: '30px 0', 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px'
      }}>
        <h2 style={{ marginBottom: '15px', fontSize: '1.2em' }}>Manage Door Staff</h2>
        <p style={{ marginBottom: '15px' }}>
          Add staff members who can scan and redeem tickets at the venue.
        </p>
        
        {agentTxHash && (
          <div style={{ 
            margin: '15px 0', 
            padding: '10px 15px', 
            backgroundColor: '#e8f5e9', 
            color: '#2e7d32',
            borderRadius: '4px'
          }}>
            Staff updated successfully! Transaction: {agentTxHash.substring(0, 10)}...
          </div>
        )}
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <strong>Staff Member Address:</strong>
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={agentAddress}
              onChange={(e) => setAgentAddress(e.target.value)}
              placeholder="0x..."
              style={{ 
                padding: '10px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
                flex: 1
              }}
            />
            <button
              onClick={handleAddAgent}
              disabled={isAgentWorking}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '4px',
                cursor: isAgentWorking ? 'not-allowed' : 'pointer',
                opacity: isAgentWorking ? 0.7 : 1
              }}
            >
              {isAgentWorking ? 'Processing...' : 'Add Staff Member'}
            </button>
            <button
              onClick={() => {
                if (agentAddress) removeAgent(agentAddress);
              }}
              disabled={isAgentWorking || !agentAddress}
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '4px',
                cursor: (isAgentWorking || !agentAddress) ? 'not-allowed' : 'pointer',
                opacity: (isAgentWorking || !agentAddress) ? 0.7 : 1
              }}
            >
              Remove
            </button>
          </div>
        </div>
      </div>

      {/* Refund Section */}
      {/* <div style={{ 
        margin: '30px 0', 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px'
      }}>
        <h2 style={{ marginBottom: '15px', fontSize: '1.2em' }}>Issue Refunds</h2>
        <p style={{ marginBottom: '15px' }}>
          Refund tickets back to the venue. Note: This will only work during the refund period
          and only for tickets you purchased as the organizer.
        </p>
        
        {refundTxHash && (
          <div style={{ 
            margin: '15px 0', 
            padding: '10px 15px', 
            backgroundColor: '#e8f5e9', 
            color: '#2e7d32',
            borderRadius: '4px'
          }}>
            Refund processed successfully! Transaction: {refundTxHash.substring(0, 10)}...
          </div>
        )}
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            <strong>Number of Tickets to Refund:</strong>
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="number"
              min="1"
              value={refundAmount}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setRefundAmount(isNaN(val) ? 1 : Math.max(val, 1));
              }}
              style={{ 
                padding: '10px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
                width: '100px'
              }}
            />
            <button
              onClick={handleRefund}
              disabled={isApprovingRefund || isRefunding || (venueData?.remainingRefundTime || 0) <= 0}
              style={{
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                padding: '10px 15px',
                borderRadius: '4px',
                cursor: (isApprovingRefund || isRefunding || (venueData?.remainingRefundTime || 0) <= 0) ? 'not-allowed' : 'pointer',
                opacity: (isApprovingRefund || isRefunding || (venueData?.remainingRefundTime || 0) <= 0) ? 0.7 : 1
              }}
            >
              {isApprovingRefund ? 'Approving...' : isRefunding ? 'Processing...' : 'Issue Refund'}
            </button>
          </div>
          {venueData?.remainingRefundTime !== undefined && venueData.remainingRefundTime <= 0 && (
            <div style={{ fontSize: '0.9em', marginTop: '5px', color: '#d32f2f' }}>
              Refund period has ended.
            </div>
          )}
        </div>
      </div> */}
      
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

export default VenueDashboard; 