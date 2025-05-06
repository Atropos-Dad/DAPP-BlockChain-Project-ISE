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
    
    // Redemption agent configuration - hardcoded list for testing
    address[] private redemptionAgentAddresses = [
        // Add your test wallet addresses here.
        address(0xCd8bAab24352c0261134e84FeA9543aB41D6DEE8)
        // Example: address(0x1234567890123456789012345678901234567890) 
        // Make sure to uncomment and replace with actual addresses or leave empty.
    ];
    
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
        
        // Set up redemption agents from the hardcoded list
        setupRedemptionAgents(token);
        
        // Pre-mint ALL tickets to the sales contract (key part of the pre-mint pattern)
        token.mintBatch(address(sales), MAX_SUPPLY);
        
        console.log("Deployment completed successfully!");
        console.log("EventTicketToken deployed at:", address(token));
        console.log("EventTicketSales deployed at:", address(sales));
        console.log("Pre-minted", MAX_SUPPLY, "tickets to the sales contract");
        
        vm.stopBroadcast();
    }
    
    /**
     * @dev Set up redemption agents from a hardcoded list in the script.
     */
    function setupRedemptionAgents(EventTicketToken token) internal {
        uint256 agentsAdded = 0;
        
        for (uint256 i = 0; i < redemptionAgentAddresses.length; i++) {
            address agent = redemptionAgentAddresses[i];
            if (agent != address(0)) { // Ensure the address is not the zero address
                token.addRedemptionAgent(agent);
                console.log("Added redemption agent:", agent);
                agentsAdded++;
            }
        }
        
        if (agentsAdded > 0) {
            console.log("Total redemption agents added:", agentsAdded);
        } else {
            console.log("No redemption agents specified in the hardcoded list.");
        }
    }
} 