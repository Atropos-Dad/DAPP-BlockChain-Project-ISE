import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import * as contractService from '../services/contractService';

// Hook for fetching event details
export const useEventDetails = (tokenAddress: string) => {
  const [eventDetails, setEventDetails] = useState<{
    name: string;
    symbol: string;
    eventName: string;
    eventDate: string;
    eventVenue: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!tokenAddress) {
        setError('Token address is not provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const details = await contractService.getEventDetails(tokenAddress);
        setEventDetails(details);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(`Failed to load event details: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tokenAddress]);

  return { eventDetails, isLoading, error };
};

// Hook for fetching ticket sales information
export const useTicketSalesInfo = (salesAddress: string) => {
  const [ticketSalesInfo, setTicketSalesInfo] = useState<{
    ticketPrice: string;
    availableTickets: number;
    totalSold: number;
    remainingTime: number;
    salesPaused: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!salesAddress) {
        setError('Sales contract address is not provided');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const info = await contractService.getTicketSalesInfo(salesAddress);
        setTicketSalesInfo(info);
      } catch (err) {
        console.error('Error fetching ticket sales info:', err);
        setError(`Failed to load ticket sales information: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [salesAddress]);

  return { ticketSalesInfo, isLoading, error };
};

// Hook for fetching ticket balance
export const useTicketBalance = (tokenAddress: string, walletAddress: string | undefined) => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!tokenAddress || !walletAddress) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const ticketBalance = await contractService.getTicketBalance(tokenAddress, walletAddress);
        setBalance(ticketBalance);
      } catch (err) {
        console.error('Error fetching ticket balance:', err);
        setError(`Failed to load ticket balance: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [tokenAddress, walletAddress]);

  return { balance, isLoading, error };
};

// Hook for gas estimation
export const useGasEstimate = (
  salesAddress: string, 
  signer: ethers.Signer | undefined, 
  quantity: number, 
  ticketPrice: string
) => {
  const [gasEstimate, setGasEstimate] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const estimateGas = async () => {
      if (!salesAddress || !signer || quantity <= 0 || !ticketPrice) return;

      try {
        setIsLoading(true);
        setError(null);
        const estimate = await contractService.estimateGasCost(
          salesAddress,
          signer,
          quantity,
          ticketPrice
        );
        setGasEstimate(estimate);
      } catch (err) {
        console.error('Error estimating gas:', err);
        setError(`Failed to estimate gas: ${err instanceof Error ? err.message : String(err)}`);
        setGasEstimate('Unable to estimate');
      } finally {
        setIsLoading(false);
      }
    };

    estimateGas();
  }, [salesAddress, signer, quantity, ticketPrice]);

  return { gasEstimate, isLoading, error };
};

// Hook for buying tickets
export const useBuyTickets = (salesAddress: string, signer: ethers.Signer | undefined) => {
  const [isTransacting, setIsTransacting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const buyTickets = async (quantity: number, ticketPrice: string) => {
    if (!salesAddress || !signer || quantity <= 0 || !ticketPrice) {
      return { success: false, error: 'Invalid parameters' };
    }

    try {
      setIsTransacting(true);
      setError(null);
      setTransactionHash(null);

      const receipt = await contractService.buyTickets(
        salesAddress,
        signer,
        quantity,
        ticketPrice
      );

      setTransactionHash(receipt.hash);
      return { success: true, hash: receipt.hash };
    } catch (err) {
      console.error('Error buying tickets:', err);
      const errorMessage = `Failed to buy tickets: ${err instanceof Error ? err.message : String(err)}`;
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsTransacting(false);
    }
  };

  return { buyTickets, isTransacting, error, transactionHash };
}; 