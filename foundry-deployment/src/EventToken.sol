// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title EventTicketToken
 * @dev ERC-20 token for event ticketing system with minting/burning capabilities
 */
contract EventTicketToken {
    // Token metadata
    string public name;
    string public symbol;
    uint8 public constant decimals = 0; // Each token represents 1 ticket (no decimals)
    uint256 private _totalSupply;
    
    // Token balances and allowances
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // Access control
    address public owner;
    mapping(address => bool) public salesContracts; // Authorized sales contracts
    
    // Event metadata
    string public eventName;
    string public eventDate;
    string public eventVenue;
    uint256 public maxSupply; // Maximum number of tickets
    
    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event SalesContractAdded(address indexed salesContract);
    event SalesContractRemoved(address indexed salesContract);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "EventTicketToken: caller is not the owner");
        _;
    }
    
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
    ) {
        name = _name;
        symbol = _symbol;
        eventName = _eventName;
        eventDate = _eventDate;
        eventVenue = _eventVenue;
        maxSupply = _maxSupply;
        owner = msg.sender;
    }
    
    /**
     * @dev Returns the total supply of tokens
     */
    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }
    
    /**
     * @dev Returns the balance of an account
     */
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
    
    /**
     * @dev Transfers tokens to recipient
     */
    function transfer(address recipient, uint256 amount) external returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }
    
    /**
     * @dev Returns the amount of tokens approved for spender
     */
    function allowance(address tokenOwner, address spender) external view returns (uint256) {
        return _allowances[tokenOwner][spender];
    }
    
    /**
     * @dev Approves spender to spend tokens
     */
    function approve(address spender, uint256 amount) external returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @dev Transfers tokens from sender to recipient using allowance
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool) {
        _transfer(sender, recipient, amount);
        
        uint256 currentAllowance = _allowances[sender][msg.sender];
        require(currentAllowance >= amount, "EventTicketToken: transfer amount exceeds allowance");
        unchecked {
            _approve(sender, msg.sender, currentAllowance - amount);
        }
        
        return true;
    }
    
    /**
     * @dev Internal transfer function
     */
    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "EventTicketToken: transfer from the zero address");
        require(recipient != address(0), "EventTicketToken: transfer to the zero address");
        require(_balances[sender] >= amount, "EventTicketToken: transfer amount exceeds balance");
        
        _balances[sender] -= amount;
        _balances[recipient] += amount;
        
        emit Transfer(sender, recipient, amount);
    }
    
    /**
     * @dev Internal approve function
     */
    function _approve(address tokenOwner, address spender, uint256 amount) internal {
        require(tokenOwner != address(0), "EventTicketToken: approve from the zero address");
        require(spender != address(0), "EventTicketToken: approve to the zero address");
        
        _allowances[tokenOwner][spender] = amount;
        emit Approval(tokenOwner, spender, amount);
    }
    
    /**
     * @dev Mints new tickets - only callable by authorized sales contracts
     */
    function mint(address to, uint256 amount) external onlySalesContract returns (bool) {
        require(to != address(0), "EventTicketToken: mint to the zero address");
        require(_totalSupply + amount <= maxSupply, "EventTicketToken: max supply exceeded");
        
        _totalSupply += amount;
        _balances[to] += amount;
        
        emit Transfer(address(0), to, amount);
        return true;
    }
    
    /**
     * @dev Burns tickets - used when tickets are checked in/used
     */
    function burn(address from, uint256 amount) external onlySalesContract returns (bool) {
        require(from != address(0), "EventTicketToken: burn from the zero address");
        require(_balances[from] >= amount, "EventTicketToken: burn amount exceeds balance");
        
        _balances[from] -= amount;
        _totalSupply -= amount;
        
        emit Transfer(from, address(0), amount);
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
     * @dev Transfer ownership of the contract
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "EventTicketToken: new owner is the zero address");
        owner = newOwner;
    }
    
    /**
     * @dev Returns available ticket supply
     */
    function availableSupply() external view returns (uint256) {
        return maxSupply - _totalSupply;
    }
}