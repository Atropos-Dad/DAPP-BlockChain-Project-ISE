// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./EventToken.sol";

/**
 * @title EventTicketSales
 * @dev Contract for selling event tickets with refund functionality
 */
contract EventTicketSales {
    // State variables
    EventTicketToken public ticketToken;
    address public organizer;
    uint256 public ticketPrice;
    uint256 public salesEndTime;
    uint256 public refundEndTime;
    bool public salesPaused;
    uint256 public refundPercentage; // Represents the percentage (1-100) of the ticket price to be refunded
    
    // Sale tracking
    mapping(address => uint256) public purchases; // Tracks how many tickets each address purchased
    mapping(address => uint256) public purchaseTimes; // Tracks when tickets were purchased
    uint256 public totalSold;
    
    // Events
    event TicketsPurchased(address indexed buyer, uint256 amount, uint256 totalPrice);
    event TicketsRefunded(address indexed buyer, uint256 amount, uint256 refundAmount);
    event SalesPaused(bool paused);
    event PriceUpdated(uint256 newPrice);
    event DeadlineExtended(uint256 newSalesEndTime, uint256 newRefundEndTime);
    
    modifier onlyOrganizer() {
        require(msg.sender == organizer, "EventTicketSales: caller is not the organizer");
        _;
    }
    
    modifier salesActive() {
        require(!salesPaused, "EventTicketSales: sales are paused");
        require(block.timestamp <= salesEndTime, "EventTicketSales: sales period has ended");
        _;
    }
    
    modifier refundsActive() {
        require(block.timestamp <= refundEndTime, "EventTicketSales: refund period has ended");
        _;
    }
    
    /**
     * @dev Constructor to create sales contract with pricing and deadlines
     */
    constructor(
        address _ticketToken,
        uint256 _ticketPrice,
        uint256 _salesDuration,
        uint256 _refundDuration,
        uint256 _refundPercentage // New parameter for refund percentage
    ) {
        require(_ticketToken != address(0), "EventTicketSales: invalid token address");
        require(_ticketPrice > 0, "EventTicketSales: ticket price must be greater than zero");
        require(_salesDuration > 0, "EventTicketSales: sales duration must be greater than zero");
        require(_refundPercentage > 0 && _refundPercentage <= 100, "EventTicketSales: refund percentage must be between 1 and 100"); // Validation for refund percentage
        
        ticketToken = EventTicketToken(_ticketToken);
        organizer = msg.sender;
        ticketPrice = _ticketPrice;
        salesEndTime = block.timestamp + _salesDuration;
        refundEndTime = salesEndTime + _refundDuration;
        refundPercentage = _refundPercentage; // Assign refund percentage
    }
    
    /**
     * @dev Purchase tickets
     */
    function buyTickets(uint256 amount) external payable salesActive {
        require(amount > 0, "EventTicketSales: amount must be greater than zero");
        require(msg.value == ticketPrice * amount, "EventTicketSales: incorrect ETH amount sent");
        
        uint256 contractBalance = ticketToken.balanceOf(address(this));
        require(amount <= contractBalance, "EventTicketSales: not enough tickets available");
        
        // Transfer tickets from contract to buyer
        ticketToken.transfer(msg.sender, amount);
        
        // Update purchase records
        purchases[msg.sender] += amount;
        purchaseTimes[msg.sender] = block.timestamp;
        totalSold += amount;
        
        emit TicketsPurchased(msg.sender, amount, msg.value);
    }
    
    /**
     * @dev Refund tickets
     */
    function refundTickets(uint256 amount) external refundsActive {
        require(amount > 0, "EventTicketSales: amount must be greater than zero");
        
        uint256 balance = ticketToken.balanceOf(msg.sender);
        require(balance >= amount, "EventTicketSales: not enough tickets to refund");
        require(purchases[msg.sender] >= amount, "EventTicketSales: you can only refund tickets you purchased");
        
        // Calculate refund amount based on the configured refund percentage
        uint256 calculatedRefundAmount = (ticketPrice * amount * refundPercentage) / 100; 
        
        // Ensure contract has enough balance for refund
        require(address(this).balance >= calculatedRefundAmount, "EventTicketSales: insufficient contract balance for refund");
        
        // Transfer tickets back to contract (requires approval)
        ticketToken.transferFrom(msg.sender, address(this), amount);
        
        // Update purchase records
        purchases[msg.sender] -= amount;
        totalSold -= amount;
        
        // Send refund
        (bool success, ) = payable(msg.sender).call{value: calculatedRefundAmount}("");
        require(success, "EventTicketSales: refund transfer failed");
        
        emit TicketsRefunded(msg.sender, amount, calculatedRefundAmount);
    }
    
    /**
     * @dev Toggle ticket sales
     */
    function toggleSales(bool paused) external onlyOrganizer {
        salesPaused = paused;
        emit SalesPaused(paused);
    }
    
    /**
     * @dev Update ticket price
     */
    function updateTicketPrice(uint256 newPrice) external onlyOrganizer {
        require(newPrice > 0, "EventTicketSales: ticket price must be greater than zero");
        ticketPrice = newPrice;
        emit PriceUpdated(newPrice);
    }
    
    /**
     * @dev Extend sales and refund deadlines
     */
    function extendDeadlines(uint256 newSalesDuration, uint256 newRefundDuration) external onlyOrganizer {
        require(newSalesDuration > 0, "EventTicketSales: new sales duration must be greater than zero");
        
        salesEndTime = block.timestamp + newSalesDuration;
        refundEndTime = salesEndTime + newRefundDuration;
        
        emit DeadlineExtended(salesEndTime, refundEndTime);
    }
    
    /**
     * @dev Withdraw funds to organizer
     */
    function withdrawFunds() external onlyOrganizer {
        // Only allow withdrawal after refund period ends to ensure funds for refunds
        require(block.timestamp > refundEndTime, "EventTicketSales: cannot withdraw before refund period ends");
        
        uint256 balance = address(this).balance;
        require(balance > 0, "EventTicketSales: no funds to withdraw");
        
        (bool success, ) = payable(organizer).call{value: balance}("");
        require(success, "EventTicketSales: withdrawal failed");
    }
    
    /**
     * @dev Get remaining sales time
     */
    function remainingSalesTime() external view returns (uint256) {
        if (block.timestamp >= salesEndTime) return 0;
        return salesEndTime - block.timestamp;
    }
    
    /**
     * @dev Get remaining refund time
     */
    function remainingRefundTime() external view returns (uint256) {
        if (block.timestamp >= refundEndTime) return 0;
        return refundEndTime - block.timestamp;
    }
    
    /**
     * @dev Get available ticket supply
     */
    function availableTickets() external view returns (uint256) {
        return ticketToken.balanceOf(address(this));
    }
} 