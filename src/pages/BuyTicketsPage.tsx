import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';
import { provider, getContract } from '../chain';

// Import ABI and contract addresses
import EventTicketSalesABI from '../abis/EventTicketSales.json'; // Import Sales ABI
import EventTokenABI from '../abis/EventTicketToken.json'; // Import Token ABI
const EVENT_TICKET_SALES_ADDRESS = import.meta.env.VITE_EVENT_TICKET_SALES_ADDRESS || '';
const EVENT_TOKEN_ADDRESS = import.meta.env.VITE_EVENT_TOKEN_ADDRESS || '';

// TODO - ABIs simplified for the required functions
// Removed hardcoded ABIs

const BuyTicketsPage: React.FC = () => {
  const { wallet } = useWallet();
  const navigate = useNavigate();
  
  // State variables
  const [ticketPrice, setTicketPrice] = useState<string>('');
  const [availableTickets, setAvailableTickets] = useState<number>(0);
  const [totalSold, setTotalSold] = useState<number>(0);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [salesPaused, setSalesPaused] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTransacting, setIsTransacting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<{
    name: string;
    symbol: string;
    eventName: string;
    eventDate: string;
    eventVenue: string;
  }>({
    name: '',
    symbol: '',
    eventName: '',
    eventDate: '',
    eventVenue: ''
  });
  
  // Calculate total cost
  const totalCost = quantity > 0 && ticketPrice 
    ? ethers.formatEther(ethers.parseEther(ticketPrice) * BigInt(quantity))
    : '0';

  useEffect(() => {
    // If no wallet is connected, redirect to import page
    if (!wallet) {
      navigate('/import');
      return;
    }

    const loadContracts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Validate contract addresses
        if (!EVENT_TICKET_SALES_ADDRESS || !EVENT_TOKEN_ADDRESS) {
          throw new Error('Contract addresses are not configured');
        }

        // Create contract instances
        const tokenContract = new ethers.Contract(
          EVENT_TOKEN_ADDRESS,
          EventTokenABI.abi, // Access the .abi property
          provider
        );
        
        const salesContract = new ethers.Contract(
          EVENT_TICKET_SALES_ADDRESS,
          EventTicketSalesABI.abi, // Access the .abi property
          provider
        );

        // Fetch event details
        const [
          name,
          symbol,
          eventName,
          eventDate,
          eventVenue,
          price,
          available,
          sold,
          remaining,
          paused
        ] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.eventName(),
          tokenContract.eventDate(),
          tokenContract.eventVenue(),
          salesContract.ticketPrice(),
          tokenContract.availableSupply(),
          salesContract.totalSold(),
          salesContract.remainingSalesTime(),
          salesContract.salesPaused()
        ]);

        // Update state with fetched data
        setEventDetails({
          name,
          symbol,
          eventName,
          eventDate,
          eventVenue
        });
        setTicketPrice(ethers.formatEther(price));
        setAvailableTickets(Number(available));
        setTotalSold(Number(sold));
        setRemainingTime(Number(remaining));
        setSalesPaused(paused);
      } catch (err) {
        console.error('Error loading contract data:', err);
        setError(`Failed to load ticket information: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadContracts();
  }, [wallet, navigate]);

  // Handle buying tickets
  const handleBuyTickets = async () => {
    if (!wallet || quantity <= 0) return;
    
    try {
      setIsTransacting(true);
      setError(null);
      setSuccessMessage(null);
      
      // Create signer from wallet
      const signer = wallet;
      
      // Create contract instance with signer
      const salesContract = new ethers.Contract(
        EVENT_TICKET_SALES_ADDRESS,
        EventTicketSalesABI.abi, // Access the .abi property
        signer
      );
      
      // Calculate total cost in wei
      const totalWei = ethers.parseEther(ticketPrice) * BigInt(quantity);
      
      // Call the buyTickets function
      const tx = await salesContract.buyTickets(quantity, {
        value: totalWei
      });
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Show success message with transaction hash
      setSuccessMessage(`Successfully purchased ${quantity} tickets! Transaction hash: ${receipt.hash}`);
      
      // Reset quantity
      setQuantity(1);
      
      // Refresh contract data
      const [available, sold] = await Promise.all([
        new ethers.Contract(EVENT_TOKEN_ADDRESS, EventTokenABI.abi, provider).availableSupply(), // Access the .abi property
        salesContract.totalSold()
      ]);
      
      setAvailableTickets(Number(available));
      setTotalSold(Number(sold));
    } catch (err) {
      console.error('Error buying tickets:', err);
      setError(`Failed to buy tickets: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsTransacting(false);
    }
  };

  // Format remaining time as days, hours, minutes
  const formatRemainingTime = () => {
    if (remainingTime <= 0) return 'Sales ended';
    
    const days = Math.floor(remainingTime / (24 * 60 * 60));
    const hours = Math.floor((remainingTime % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((remainingTime % (60 * 60)) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

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
        <h2 style={{fontSize: '1.4em', marginBottom: '10px'}}>{eventDetails.eventName}</h2>
        <div><strong>Date:</strong> {eventDetails.eventDate}</div>
        <div><strong>Venue:</strong> {eventDetails.eventVenue}</div>
        <div><strong>Token:</strong> {eventDetails.name} ({eventDetails.symbol})</div>
        <div style={{marginTop: '10px'}}>
          <strong>Ticket Price:</strong> {ticketPrice} ETH
        </div>
        <div>
          <strong>Available Tickets:</strong> {availableTickets} / {availableTickets + totalSold}
        </div>
        <div>
          <strong>Sales Status:</strong> {salesPaused ? 'PAUSED' : 'ACTIVE'} ({formatRemainingTime()})
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
            max={availableTickets}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              width: '100px'
            }}
            disabled={salesPaused || availableTickets === 0 || isTransacting}
          />
        </div>
        
        <div style={{marginBottom: '20px'}}>
          <strong>Total Cost:</strong> {totalCost} ETH
        </div>
        
        <button
          onClick={handleBuyTickets}
          disabled={
            salesPaused || 
            availableTickets === 0 || 
            quantity <= 0 || 
            quantity > availableTickets || 
            isTransacting
          }
          style={{
            backgroundColor: (salesPaused || availableTickets === 0) ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: (salesPaused || availableTickets === 0) ? 'not-allowed' : 'pointer'
          }}
        >
          {isTransacting ? 'Processing...' : 'Buy Tickets'}
        </button>
        
        {salesPaused && (
          <div style={{color: '#f44336', marginTop: '10px'}}>
            Sales are currently paused
          </div>
        )}
        
        {availableTickets === 0 && (
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