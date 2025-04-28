// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title EventTicketToken
 * @dev ERC-20 token for event ticketing system with minting/burning capabilities
 */
contract EventTicketToken is ERC20, Ownable {
    // Token metadata
    uint8 private constant _decimals = 0; // Each token represents 1 ticket (no decimals)
    
    // Access control
    mapping(address => bool) public salesContracts; // Authorized sales contracts
    
    // Event metadata
    string public eventName;
    string public eventDate;
    string public eventVenue;
    uint256 public maxSupply; // Maximum number of tickets
    
    // Events
    event SalesContractAdded(address indexed salesContract);
    event SalesContractRemoved(address indexed salesContract);
    
    modifier onlySalesContract() {
        require(salesContracts[msg.sender], "EventTicketToken: caller is not a sales contract");
        _;
    }
    
    /**
     * @dev Constructor to create token with event details
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _eventName,
        string memory _eventDate,
        string memory _eventVenue,
        uint256 _maxSupply
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        eventName = _eventName;
        eventDate = _eventDate;
        eventVenue = _eventVenue;
        maxSupply = _maxSupply;
    }
    
    /**
     * @dev Override decimals to return 0 (each token is one ticket)
     */
    function decimals() public pure override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @dev Mints new tickets - only callable by authorized sales contracts
     */
    function mint(address to, uint256 amount) external onlySalesContract returns (bool) {
        require(to != address(0), "EventTicketToken: mint to the zero address");
        require(totalSupply() + amount <= maxSupply, "EventTicketToken: max supply exceeded");
        
        _mint(to, amount);
        return true;
    }
    
    /**
     * @dev Mints entire batch of tickets to a destination (for pre-minting pattern)
     */
    function mintBatch(address to, uint256 amount) external onlyOwner returns (bool) {
        require(to != address(0), "EventTicketToken: mint to the zero address");
        require(totalSupply() + amount <= maxSupply, "EventTicketToken: max supply exceeded");
        
        _mint(to, amount);
        return true;
    }
    
    /**
     * @dev Burns tickets - used when tickets are checked in/used
     */
    function burn(address from, uint256 amount) external onlySalesContract returns (bool) {
        require(from != address(0), "EventTicketToken: burn from the zero address");
        require(balanceOf(from) >= amount, "EventTicketToken: burn amount exceeds balance");
        
        _burn(from, amount);
        return true;
    }
    
    /**
     * @dev Add a sales contract that can mint tokens
     */
    function addSalesContract(address salesContract) external onlyOwner {
        require(salesContract != address(0), "EventTicketToken: invalid sales contract address");
        salesContracts[salesContract] = true;
        emit SalesContractAdded(salesContract);
    }
    
    /**
     * @dev Remove a sales contract
     */
    function removeSalesContract(address salesContract) external onlyOwner {
        salesContracts[salesContract] = false;
        emit SalesContractRemoved(salesContract);
    }
    
    /**
     * @dev Returns available ticket supply
     */
    function availableSupply() external view returns (uint256) {
        return maxSupply - totalSupply();
    }
}