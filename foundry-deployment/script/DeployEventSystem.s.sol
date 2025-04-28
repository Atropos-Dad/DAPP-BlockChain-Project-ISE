// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/EventToken.sol";
import "../src/EventTicketSales.sol";

contract DeployEventSystem is Script {
    // Event configuration
    string public constant EVENT_NAME = "Ethereum Summer Conference";
    string public constant EVENT_DATE = "2024-08-15";
    string public constant EVENT_VENUE = "Crypto Convention Center";
    uint256 public constant MAX_SUPPLY = 5000; // 5000 tickets
    
    // Sales configuration
    uint256 public constant TICKET_PRICE = 0.1 ether;
    uint256 public constant SALES_DURATION = 60 days;
    uint256 public constant REFUND_DURATION = 14 days;
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy ticket token contract
        EventTicketToken token = new EventTicketToken(
            "Ethereum Conference Ticket",
            "ETHCONF",
            EVENT_NAME,
            EVENT_DATE,
            EVENT_VENUE,
            MAX_SUPPLY
        );
        
        // Deploy sales contract
        EventTicketSales sales = new EventTicketSales(
            address(token),
            TICKET_PRICE,
            SALES_DURATION,
            REFUND_DURATION
        );
        
        // Authorize sales contract to perform privileged operations
        token.addSalesContract(address(sales));
        
        // Pre-mint ALL tickets to the sales contract (key part of the pre-mint pattern)
        token.mintBatch(address(sales), MAX_SUPPLY);
        
        console.log("Deployment completed successfully!");
        console.log("EventTicketToken deployed at:", address(token));
        console.log("EventTicketSales deployed at:", address(sales));
        console.log("Pre-minted", MAX_SUPPLY, "tickets to the sales contract");
        
        vm.stopBroadcast();
    }
} 