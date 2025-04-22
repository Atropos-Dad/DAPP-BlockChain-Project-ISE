// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/EventToken.sol";
import "../src/EventTicketSales.sol";

contract DeployEventTickets is Script {
    // Configuration parameters
    string public constant TOKEN_NAME = "Concert Ticket";
    string public constant TOKEN_SYMBOL = "CTIX";
    string public constant EVENT_NAME = "Summer Music Festival";
    string public constant EVENT_DATE = "2024-07-15";
    string public constant EVENT_VENUE = "Central Park";
    uint256 public constant MAX_SUPPLY = 5000;
    uint256 public constant TICKET_PRICE = 0.05 ether;
    uint256 public constant SALES_DURATION = 60 days;
    uint256 public constant REFUND_DURATION = 14 days;

    function run() public {
        // Get the private key from the environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the token contract
        EventTicketToken token = new EventTicketToken(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            EVENT_NAME,
            EVENT_DATE,
            EVENT_VENUE,
            MAX_SUPPLY
        );
        
        // Deploy the sales contract
        EventTicketSales sales = new EventTicketSales(
            address(token),
            TICKET_PRICE,
            SALES_DURATION,
            REFUND_DURATION
        );
        
        // Authorize the sales contract to mint/burn tokens
        token.addSalesContract(address(sales));
        
        // Log the deployed contract addresses
        console.log("EventTicketToken deployed at:", address(token));
        console.log("EventTicketSales deployed at:", address(sales));
        
        vm.stopBroadcast();
    }
} 