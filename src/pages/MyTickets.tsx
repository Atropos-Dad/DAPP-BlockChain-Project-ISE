import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';
import { provider } from '../chain';
import EventTicketTokenABI from '../abis/EventTicketToken.json'; // Import Token ABI

// Get contract address from environment variables
const EVENT_TOKEN_ADDRESS = import.meta.env.VITE_EVENT_TOKEN_ADDRESS || '';

const MyTickets: React.FC = () => {
  const { wallet } = useWallet();
  const navigate = useNavigate();
  const [ticketBalance, setTicketBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [eventDetails, setEventDetails] = useState<{
    name: string;
    symbol: string;
    eventName: string;
    eventDate: string;
    eventVenue: string;
  } | null>(null);

  useEffect(() => {
    if (!wallet) {
      navigate('/import'); // Redirect if wallet not connected
      return;
    }

    const fetchTicketData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!EVENT_TOKEN_ADDRESS) {
          throw new Error('Ticket contract address is not configured in environment variables.');
        }

        // Create contract instance
        const tokenContract = new ethers.Contract(
          EVENT_TOKEN_ADDRESS,
          EventTicketTokenABI.abi,
          provider
        );

        // Fetch balance and event details
        const [balance, name, symbol, eventName, eventDate, eventVenue] = await Promise.all([
          tokenContract.balanceOf(wallet.address),
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.eventName(),
          tokenContract.eventDate(),
          tokenContract.eventVenue()
        ]);

        setTicketBalance(Number(balance));
        setEventDetails({ name, symbol, eventName, eventDate, eventVenue });

      } catch (err) {
        console.error('Error fetching ticket data:', err);
        setError(`Failed to load ticket information: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicketData();
  }, [wallet, navigate]);

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

      <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
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