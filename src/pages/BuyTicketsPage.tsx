import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';

// Import contract hooks
import { useEventDetails, useTicketSalesInfo, useGasEstimate, useBuyTickets } from '../hooks/useContractData';

// Get contract addresses from environment
const EVENT_TICKET_SALES_ADDRESS = import.meta.env.VITE_EVENT_TICKET_SALES_ADDRESS || '';
const EVENT_TOKEN_ADDRESS = import.meta.env.VITE_EVENT_TOKEN_ADDRESS || '';

const BuyTicketsPage: React.FC = () => {
  const { wallet } = useWallet();
  const navigate = useNavigate();
  
  // State variables
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Use hooks to fetch data
  const { eventDetails, isLoading: eventDetailsLoading, error: eventDetailsError } = 
    useEventDetails(EVENT_TOKEN_ADDRESS);
  
  const { ticketSalesInfo, isLoading: salesInfoLoading, error: salesInfoError } = 
    useTicketSalesInfo(EVENT_TICKET_SALES_ADDRESS);
  
  const { gasEstimate } = useGasEstimate(
    EVENT_TICKET_SALES_ADDRESS,
    wallet,
    quantity,
    ticketSalesInfo?.ticketPrice || '0'
  );
  
  const { buyTickets, isTransacting, error: buyError, transactionHash } = 
    useBuyTickets(EVENT_TICKET_SALES_ADDRESS, wallet);
  
  // Combined loading state
  const isLoading = eventDetailsLoading || salesInfoLoading;
  
  // Calculate total cost
  const totalCost = quantity > 0 && ticketSalesInfo?.ticketPrice
    ? ethers.formatEther(ethers.parseEther(ticketSalesInfo.ticketPrice) * BigInt(quantity))
    : '0';
  
  // Format remaining time as days, hours, minutes
  const formatRemainingTime = () => {
    if (!ticketSalesInfo) return 'Loading...';
    
    const remainingTime = ticketSalesInfo.remainingTime;
    if (remainingTime <= 0) return 'Sales ended';
    
    const days = Math.floor(remainingTime / (24 * 60 * 60));
    const hours = Math.floor((remainingTime % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remainingTime % (60 * 60)) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };
  
  // Handle buying tickets
  const handleBuyTickets = async () => {
    if (!wallet || !ticketSalesInfo || quantity <= 0) return;
    
    setError(null);
    setSuccessMessage(null);
    
    const result = await buyTickets(quantity, ticketSalesInfo.ticketPrice);
    
    if (result.success) {
      setSuccessMessage(`Successfully purchased ${quantity} tickets! Transaction hash: ${result.hash}`);
      setQuantity(1);
    } else {
      setError(result.error || 'Failed to buy tickets');
    }
  };
  
  // Combine errors
  useEffect(() => {
    // Combine errors from different sources
    const combinedError = eventDetailsError || salesInfoError || buyError;
    if (combinedError) {
      setError(combinedError);
    }
  }, [eventDetailsError, salesInfoError, buyError]);
  
  // Redirect if no wallet
  useEffect(() => {
    if (!wallet) {
      navigate('/import');
    }
  }, [wallet, navigate]);

  if (isLoading) {
    return (
      <div style={{padding: '20px'}}>
        <h1>Buy Event Tickets</h1>
        <div>Loading ticket information...</div>
      </div>
    );
  }

  return (
    <div style={{padding: '20px'}}>
      <h1>Buy Event Tickets</h1>
      
      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}
      
      {successMessage && (
        <div style={{
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {successMessage}
        </div>
      )}
      
      {/* Event Details */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '15px',
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        <h2 style={{fontSize: '1.4em', marginBottom: '10px'}}>{eventDetails?.eventName}</h2>
        <div><strong>Date:</strong> {eventDetails?.eventDate}</div>
        <div><strong>Venue:</strong> {eventDetails?.eventVenue}</div>
        <div><strong>Token:</strong> {eventDetails?.name} ({eventDetails?.symbol})</div>
        <div style={{marginTop: '10px'}}>
          <strong>Ticket Price:</strong> {ticketSalesInfo?.ticketPrice} ETH
        </div>
        <div>
          <strong>Available Tickets:</strong> {ticketSalesInfo?.availableTickets} / {
            (ticketSalesInfo?.availableTickets || 0) + (ticketSalesInfo?.totalSold || 0)
          }
        </div>
        <div>
          <strong>Sales Status:</strong> {ticketSalesInfo?.salesPaused ? 'PAUSED' : 'ACTIVE'} ({formatRemainingTime()})
        </div>
      </div>
      
      {/* Purchase Form */}
      <div style={{
        border: '1px solid #ddd',
        padding: '20px',
        borderRadius: '4px'
      }}>
        <h2 style={{fontSize: '1.2em', marginBottom: '15px'}}>Purchase Tickets</h2>
        
        <div style={{marginBottom: '15px'}}>
          <label style={{display: 'block', marginBottom: '5px'}}>
            Quantity:
          </label>
          <input
            type="number"
            min="1"
            max={ticketSalesInfo?.availableTickets}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              width: '100px'
            }}
            disabled={ticketSalesInfo?.salesPaused || ticketSalesInfo?.availableTickets === 0 || isTransacting}
          />
        </div>
        
        <div style={{marginBottom: '20px'}}>
          <strong>Ticket Cost:</strong> {totalCost} ETH
        </div>
        <div style={{marginBottom: '20px'}}>
          <strong>Estimated Gas:</strong> {gasEstimate} ETH
        </div>
        <div style={{marginBottom: '20px', fontWeight: 'bold'}}>
          <strong>Total Cost (incl. gas):</strong> {
            typeof gasEstimate === 'string' && !isNaN(parseFloat(gasEstimate)) 
              ? (parseFloat(totalCost) + parseFloat(gasEstimate)).toFixed(6) 
              : `${totalCost} + gas`
          } ETH
        </div>
        
        <button
          onClick={handleBuyTickets}
          disabled={
            ticketSalesInfo?.salesPaused || 
            ticketSalesInfo?.availableTickets === 0 || 
            quantity <= 0 || 
            (ticketSalesInfo && quantity > ticketSalesInfo.availableTickets) || 
            isTransacting
          }
          style={{
            backgroundColor: (ticketSalesInfo?.salesPaused || ticketSalesInfo?.availableTickets === 0) ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: (ticketSalesInfo?.salesPaused || ticketSalesInfo?.availableTickets === 0) ? 'not-allowed' : 'pointer'
          }}
        >
          {isTransacting ? 'Processing...' : 'Buy Tickets'}
        </button>
        
        {ticketSalesInfo?.salesPaused && (
          <div style={{color: '#f44336', marginTop: '10px'}}>
            Sales are currently paused
          </div>
        )}
        
        {ticketSalesInfo?.availableTickets === 0 && (
          <div style={{color: '#f44336', marginTop: '10px'}}>
            Sold out - no tickets available
          </div>
        )}
      </div>
      
      <div style={{marginTop: '20px'}}>
        <button
          onClick={() => navigate('/wallet')}
          style={{
            backgroundColor: '#757575',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Wallet Details
        </button>
      </div>
    </div>
  );
};

export default BuyTicketsPage; 