// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/EventToken.sol";
import "../src/EventTicketSales.sol";

contract EventTicketTest is Test {
    EventTicketToken public token;
    EventTicketSales public sales;
    
    address public organizer;
    address public buyer;
    
    // Test parameters
    string public constant EVENT_NAME = "Test Concert";
    string public constant EVENT_DATE = "2024-05-01";
    string public constant EVENT_VENUE = "Test Arena";
    uint256 public constant MAX_SUPPLY = 1000;
    uint256 public constant TICKET_PRICE = 0.1 ether;
    uint256 public constant SALES_DURATION = 30 days;
    uint256 public constant REFUND_DURATION = 7 days;
    
    function setUp() public {
        // Setup accounts
        organizer = address(this);
        buyer = makeAddr("buyer");
        vm.deal(buyer, 10 ether); // Give buyer some ETH
        
        // Deploy token
        token = new EventTicketToken(
            "Test Concert Ticket",
            "TCT",
            EVENT_NAME,
            EVENT_DATE,
            EVENT_VENUE,
            MAX_SUPPLY
        );
        
        // Deploy sales contract
        sales = new EventTicketSales(
            address(token),
            TICKET_PRICE,
            SALES_DURATION,
            REFUND_DURATION
        );
        
        // Authorize sales contract
        token.addSalesContract(address(sales));
        
        // Pre-mint all tickets to the sales contract
        token.mintBatch(address(sales), MAX_SUPPLY);
    }
    
    function testBuyTickets() public {
        uint256 buyAmount = 2;
        uint256 cost = TICKET_PRICE * buyAmount;
        
        // Buy tickets as buyer
        vm.prank(buyer);
        sales.buyTickets{value: cost}(buyAmount);
        
        // Check results
        assertEq(token.balanceOf(buyer), buyAmount);
        assertEq(sales.purchases(buyer), buyAmount);
        assertEq(address(sales).balance, cost);
        assertEq(sales.totalSold(), buyAmount);
    }
    
    function testRefundTickets() public {
        // First buy tickets
        uint256 buyAmount = 2;
        uint256 cost = TICKET_PRICE * buyAmount;
        
        vm.prank(buyer);
        sales.buyTickets{value: cost}(buyAmount);
        
        // Then approve and refund one ticket
        uint256 refundAmount = 1;
        uint256 buyerBalanceBefore = address(buyer).balance;
        
        // Approve the sales contract to transfer tokens back
        vm.prank(buyer);
        token.approve(address(sales), refundAmount);
        
        vm.prank(buyer);
        sales.refundTickets(refundAmount);
        
        // Check results
        assertEq(token.balanceOf(buyer), buyAmount - refundAmount);
        assertEq(sales.purchases(buyer), buyAmount - refundAmount);
        assertEq(address(sales).balance, TICKET_PRICE * (buyAmount - refundAmount));
        assertEq(address(buyer).balance, buyerBalanceBefore + TICKET_PRICE * refundAmount);
        assertEq(sales.totalSold(), buyAmount - refundAmount);
    }
    
    function testToggleSales() public {
        // Initially sales are active
        assertEq(sales.salesPaused(), false);
        
        // Toggle sales
        sales.toggleSales(true);
        assertEq(sales.salesPaused(), true);
        
        // Try to buy tickets (should fail)
        vm.prank(buyer);
        vm.expectRevert("EventTicketSales: sales are paused");
        sales.buyTickets{value: TICKET_PRICE}(1);
        
        // Re-enable sales
        sales.toggleSales(false);
        assertEq(sales.salesPaused(), false);
        
        // Should be able to buy now
        vm.prank(buyer);
        sales.buyTickets{value: TICKET_PRICE}(1);
    }
    
    function testAvailableTickets() public {
        // Initially all tickets are available
        assertEq(sales.availableTickets(), MAX_SUPPLY);
        
        // Buy some tickets
        uint256 buyAmount = 5;
        uint256 cost = TICKET_PRICE * buyAmount;
        
        vm.prank(buyer);
        sales.buyTickets{value: cost}(buyAmount);
        
        // Check available tickets
        assertEq(sales.availableTickets(), MAX_SUPPLY - buyAmount);
    }

    /**
     * @notice Test withdrawing funds from the sales contract
     * @dev This test uses a completely new environment instead of the setup() environment for these reasons:
     *   1. In the main setup, the organizer is set to address(this) (the test contract itself)
     *      which cannot receive ETH since it has no fallback/receive functions
     *   2. Withdrawing funds to the test contract would fail with "withdrawal failed" error
     *   3. Using a separate EOA-like address as organizer lets us test the complete withdrawal flow
     *   4. This approach isolates the test from any state changes in other tests
     */
    function testWithdrawFunds() public {
        // Create a completely new test environment for this test
        // ... existing code ...
    }
} 