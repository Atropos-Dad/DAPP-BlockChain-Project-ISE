import { ethers } from 'ethers';
import { provider } from '../chain';
import EventTicketSalesABI from '../abis/EventTicketSales.json';
import EventTicketTokenABI from '../abis/EventTicketToken.json';

// Helper function to add a small delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Event Token Contract Functions
export const getTokenContract = (tokenAddress: string, signer?: ethers.Signer) => {
  return new ethers.Contract(
    tokenAddress,
    EventTicketTokenABI.abi,
    signer || provider
  );
};

export const getSalesContract = (salesAddress: string, signer?: ethers.Signer) => {
  return new ethers.Contract(
    salesAddress,
    EventTicketSalesABI.abi,
    signer || provider
  );
};

// Event Details Functions
export const getEventDetails = async (tokenAddress: string) => {
  const tokenContract = getTokenContract(tokenAddress);
  
  try {
    // Make calls sequentially to avoid hitting provider rate-limits
    const name = await tokenContract.name();
    await delay(100); // Add small delay between calls
    
    const symbol = await tokenContract.symbol();
    await delay(100);
    
    const eventName = await tokenContract.eventName();
    await delay(100);
    
    const eventDate = await tokenContract.eventDate();
    await delay(100);
    
    const eventVenue = await tokenContract.eventVenue();
    
    return { name, symbol, eventName, eventDate, eventVenue };
  } catch (error) {
    console.error("Error fetching event details:", error);
    throw error;
  }
};

// Ticket Sales Functions
export const getTicketSalesInfo = async (salesAddress: string) => {
  const salesContract = getSalesContract(salesAddress);
  
  try {
    // Make calls sequentially to reduce burst load on RPC
    const price = await salesContract.ticketPrice();
    await delay(100); // Add small delay between calls
    
    const available = await salesContract.availableTickets();
    await delay(100);
    
    const sold = await salesContract.totalSold();
    await delay(100);
    
    const remaining = await salesContract.remainingSalesTime();
    await delay(100);
    
    const paused = await salesContract.salesPaused();
    await delay(100);
    
    const refundRemaining = await salesContract.remainingRefundTime();
    await delay(100); // Add delay

    // Fetch the actual ETH balance of the contract
    const contractBalanceWei = await provider.getBalance(salesAddress);
    
    return {
      ticketPrice: ethers.formatEther(price),
      availableTickets: Number(available),
      totalSold: Number(sold),
      remainingTime: Number(remaining),
      salesPaused: paused,
      remainingRefundTime: Number(refundRemaining),
      // Add the formatted contract balance here
      contractBalanceEth: ethers.formatEther(contractBalanceWei) 
    };
  } catch (error) {
    console.error("Error fetching ticket sales info:", error);
    throw error;
  }
};

export const getTicketBalance = async (tokenAddress: string, walletAddress: string) => {
  const tokenContract = getTokenContract(tokenAddress);
  const balance = await tokenContract.balanceOf(walletAddress);
  return Number(balance);
};

export const estimateGasCost = async (
  salesAddress: string,
  signer: ethers.Signer,
  quantity: number,
  ticketPrice: string
) => {
  try {
    // Get current gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits('50', 'gwei'); // Default if null
    
    let gasEstimateWei;
    try {
      // Create contract with signer
      const salesContract = getSalesContract(salesAddress, signer);
      const totalWei = ethers.parseEther(ticketPrice) * BigInt(quantity);
      
      // Estimate gas
      gasEstimateWei = await salesContract.buyTickets.estimateGas(quantity, {
        value: totalWei
      });
    } catch (estimateErr) {
      console.log('Gas estimation failed, using median value:', estimateErr);
      // Use median gas value as fallback
      gasEstimateWei = BigInt(135283);
    }
    
    // Calculate total gas cost
    const gasCostWei = gasEstimateWei * gasPrice;
    return ethers.formatEther(gasCostWei);
  } catch (err) {
    console.error('Error calculating gas cost:', err);
    return 'Unable to estimate';
  }
};

export const buyTickets = async (
  salesAddress: string,
  signer: ethers.Signer,
  quantity: number,
  ticketPrice: string
) => {
  // Create contract with signer
  const salesContract = getSalesContract(salesAddress, signer);
  
  // Calculate total cost in wei
  const totalWei = ethers.parseEther(ticketPrice) * BigInt(quantity);
  
  // Call the buyTickets function
  const tx = await salesContract.buyTickets(quantity, {
    value: totalWei
  });
  
  // Wait for transaction to be mined
  const receipt = await tx.wait();
  
  return receipt;
};

/**
 * Refund tickets through the sales contract
 */
export const refundSalesTickets = async (
  salesAddress: string,
  signer: ethers.Signer,
  amount: number
) => {
  const salesContract = getSalesContract(salesAddress, signer);
  const tx = await salesContract.refundTickets(amount);
  return tx.wait();
};

/**
 * Add a redemption agent to the token contract
 */
export const addRedemptionAgent = async (
  tokenAddress: string,
  signer: ethers.Signer,
  agent: string
) => {
  const tokenContract = getTokenContract(tokenAddress, signer);
  const tx = await tokenContract.addRedemptionAgent(agent);
  return tx.wait();
};

/**
 * Remove a redemption agent from the token contract
 */
export const removeRedemptionAgent = async (
  tokenAddress: string,
  signer: ethers.Signer,
  agent: string
) => {
  const tokenContract = getTokenContract(tokenAddress, signer);
  const tx = await tokenContract.removeRedemptionAgent(agent);
  return tx.wait();
};

export const redeemTickets = async (
  tokenAddress: string,
  signer: ethers.Signer,
  holder: string,
  amount: number
) => {
  const tokenContract = getTokenContract(tokenAddress, signer);
  const tx = await tokenContract.redeem(holder, amount);
  return tx.wait();
}; 