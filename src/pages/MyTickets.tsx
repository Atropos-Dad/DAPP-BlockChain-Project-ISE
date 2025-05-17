import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';

// Import custom hooks
import { useEventDetails, useTicketBalance, useRefundSales, useVenueDashboard } from '../hooks/useContractData';

// Get contract address from environment variables
const EVENT_TOKEN_ADDRESS = import.meta.env.VITE_EVENT_TOKEN_ADDRESS || '';
const EVENT_SALES_ADDRESS = import.meta.env.VITE_EVENT_TICKET_SALES_ADDRESS || '';

const MyTickets: React.FC = () => {
  const { wallet } = useWallet();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(1);

  // Use custom hooks to fetch data
  const { eventDetails, isLoading: eventDetailsLoading, error: eventDetailsError } = 
    useEventDetails(EVENT_TOKEN_ADDRESS);
  
  const { balance: ticketBalance, isLoading: balanceLoading, error: balanceError } = 
    useTicketBalance(EVENT_TOKEN_ADDRESS, wallet?.address);
  
  const { 
    refund, 
    isApproving: isApprovingRefund,
    isTransacting: isRefunding, 
    error: refundError, 
    transactionHash: refundTxHash 
  } = useRefundSales(EVENT_SALES_ADDRESS, EVENT_TOKEN_ADDRESS, wallet);
  
  // Get venue data to check refund period
  const { data: venueData, loading: venueDataLoading } = 
    useVenueDashboard(EVENT_SALES_ADDRESS, EVENT_TOKEN_ADDRESS, wallet);
  
  // Combined loading state
  const isLoading = eventDetailsLoading || balanceLoading || venueDataLoading;

  // Handle errors from hooks
  useEffect(() => {
    const combinedError = eventDetailsError || balanceError || refundError;
    if (combinedError) {
      setError(combinedError);
    }
  }, [eventDetailsError, balanceError, refundError]);

  // Redirect if no wallet
  useEffect(() => {
    if (!wallet) {
      navigate('/import');
    }
  }, [wallet, navigate]);

  // Handle refund submission
  const handleRefund = async () => {
    if (!ticketBalance || ticketBalance < refundAmount) {
      setError(`Cannot refund ${refundAmount} tickets. You only have ${ticketBalance} available.`);
      return;
    }
    
    if (refundAmount <= 0) {
      setError('Please enter a valid refund amount');
      return;
    }
    
    await refund(refundAmount);
  };

  // Format time remaining in hours and minutes
  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Expired';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };

  const calculateExpectedRefundEth = () => {
    if (venueData?.ticketPrice && venueData?.refundPercentage && refundAmount > 0) {
      try {
        const ticketPriceWei = ethers.parseUnits(venueData.ticketPrice, 'ether');
        const totalTicketValueWei = ticketPriceWei * BigInt(refundAmount);
        const actualRefundWei = (totalTicketValueWei * BigInt(venueData.refundPercentage)) / 100n;
        return ethers.formatEther(actualRefundWei);
      } catch (e) {
        console.error("Error calculating refund ETH:", e);
        return 'Error';
      }
    }
    return null;
  };

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Loading your tickets...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '5px', padding: '20px', margin: '10px 0' }}>
      <h1 style={{ marginBottom: '20px' }}>My Tickets</h1>

      {eventDetails && (
        <div style={{ marginBottom: '20px', backgroundColor: '#f0f8ff', padding: '15px', borderRadius: '4px' }}>
          <h2 style={{ fontSize: '1.3em', marginBottom: '10px' }}>Event Details</h2>
          <div><strong>Event:</strong> {eventDetails.eventName}</div>
          <div><strong>Date:</strong> {eventDetails.eventDate}</div>
          <div><strong>Venue:</strong> {eventDetails.eventVenue}</div>
          <div><strong>Token:</strong> {eventDetails.name} ({eventDetails.symbol})</div>
        </div>
      )}

      <div style={{ margin: '20px 0' }}>
        <h2 style={{ fontSize: '1.2em', marginBottom: '10px' }}>Your Ticket Balance</h2>
        {ticketBalance > 0 ? (
          <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
            You currently hold {ticketBalance} ticket(s).
          </div>
        ) : (
          <div style={{ fontStyle: 'italic' }}>
            You do not currently hold any tickets for this event.
          </div>
        )}
      </div>

      {/* Refund Section */}
      {ticketBalance > 0 && (
        <div style={{ 
          margin: '20px 0', 
          padding: '15px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '4px'
        }}>
          <h2 style={{ fontSize: '1.2em', marginBottom: '10px' }}>Refund Tickets</h2>
          <p style={{ marginBottom: '15px', fontSize: '0.9em' }}>
            You can refund your tickets during the refund period to get your ETH back.
          </p>
          
          {refundTxHash && (
            <div style={{ 
              margin: '15px 0', 
              padding: '10px', 
              backgroundColor: '#e8f5e9', 
              color: '#2e7d32',
              borderRadius: '4px',
              fontSize: '0.9em'
            }}>
              Refund processed successfully! Transaction: {refundTxHash.substring(0, 10)}...
            </div>
          )}
          
          {venueData?.remainingRefundTime !== undefined && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px',
              padding: '8px',
              backgroundColor: venueData.remainingRefundTime > 0 ? '#e8f5e9' : '#ffebee',
              borderRadius: '4px'
            }}>
              <div>Refund Period Remaining:</div>
              <div style={{ 
                fontWeight: 'bold',
                color: venueData.remainingRefundTime <= 0 ? '#d32f2f' : '#2e7d32'
              }}>
                {formatTimeRemaining(venueData.remainingRefundTime)}
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <input
              type="number"
              min="1"
              max={ticketBalance}
              value={refundAmount}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setRefundAmount(isNaN(val) ? 1 : Math.min(Math.max(val, 1), ticketBalance));
              }}
              style={{ 
                padding: '8px 10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                width: '80px'
              }}
            />
            <span>of {ticketBalance} ticket(s)</span>
            
            <button
              onClick={handleRefund}
              disabled={isApprovingRefund || isRefunding || !(venueData && venueData.remainingRefundTime > 0)}
              style={{
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: (isApprovingRefund || isRefunding || !(venueData && venueData.remainingRefundTime > 0)) ? 'not-allowed' : 'pointer',
                opacity: (isApprovingRefund || isRefunding || !(venueData && venueData.remainingRefundTime > 0)) ? 0.7 : 1,
                marginLeft: 'auto'
              }}
            >
              {isApprovingRefund ? 'Approving...' : isRefunding ? 'Refunding...' : 'Refund Tickets'}
            </button>
          </div>
          
          {/* Display calculated refund amount and percentage */}
          {venueData?.ticketPrice && venueData?.refundPercentage && refundAmount > 0 && (
            <div style={{ fontSize: '0.9em', marginTop: '8px', color: '#444', backgroundColor: '#eef2f7', padding: '8px', borderRadius: '4px' }}>
              You will receive approximately <strong>{calculateExpectedRefundEth()} ETH</strong> back.
              (Refund rate: {venueData.refundPercentage}%)
            </div>
          )}
          
          {venueData?.remainingRefundTime !== undefined && venueData.remainingRefundTime <= 0 && (
            <div style={{ fontSize: '0.8em', color: '#d32f2f' }}>
              The refund period has ended. Refunds are no longer available.
            </div>
          )}
          
          {venueData?.remainingRefundTime !== undefined && venueData.remainingRefundTime > 0 && (
            <div style={{ fontSize: '0.8em', color: '#666' }}>
              Note: Refunds are only available during the refund period set by the event organizer.
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '30px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {ticketBalance > 0 && (
          <button
            onClick={() => navigate('/show-qr')}
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Show Ticket QR Code
          </button>
        )}
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
          Buy More Tickets
        </button>
        <button
          onClick={() => navigate('/wallet')}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Wallet
        </button>
      </div>
    </div>
  );
};

export default MyTickets; 