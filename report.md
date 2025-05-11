The project should be accompanied by a report detailing the following:

    Code overview.
    Design description.
    Links to transactions on Sepolia's blockchain explorer showing:
        A successful deployment of your contract
        A successful execution of your contract to buy a token
        A successful topping up of separate wallets for:
            Contract creator
            Ticket Purchaser
            Vendor / Doorman

---

# Code overview

The project implements a decentralized ticketing system using Ethereum's Sepolia testnet. The backend consists of Solidity smart contracts, primarily an `EventTicketToken` contract, which is an ERC-20 standard token representing tickets, and an `EventTicketSales` contract to manage the sale of these tokens. The `EventTicketToken` contract has been extended to include functionalities like ticket redemption and management of authorized redemption agents.

The frontend is a React-based web application developed with TypeScript and Vite. It allows users to interact with the blockchain. Key frontend features include wallet management (creation, import, and display of details including balance and transaction history), purchasing tickets, viewing owned tickets, and a mechanism for ticket redemption, potentially involving QR codes. The application utilizes `ethers.js` for blockchain interactions.

# Design description

The system's design focuses on providing a user-friendly interface for managing and purchasing event tickets on the blockchain. The initial development roadmap outlined a phased approach, starting with project setup, implementing global wallet state management using React Context (`WalletContext`), and then building out pages for wallet creation, wallet import/viewing, and ticket purchasing.

A significant architectural decision involved refactoring the contract interaction layer. Initially, contract interaction logic was duplicated across React components. To address this and improve maintainability, scalability, and adherence to the DRY principle, a service layer (`src/services/contractService.ts`) was introduced. This layer centralizes all blockchain interaction logic using `ethers.js`. Custom React hooks (`src/hooks/useContractData.ts`) were then developed on top of this service layer. These hooks manage component-specific state (like loading and error states) and provide a clean API for UI components (e.g., `BuyTicketsPage.tsx`, `MyTickets.tsx`) to fetch data and perform blockchain transactions. This layered architecture (UI Components -> Custom Hooks -> Service Layer -> Blockchain) ensures a clear separation of concerns.

The user experience allows for in-app wallet generation, where users can create a new Sepolia wallet, choose a password, and download the encrypted JSON keystore. They are also shown their wallet address and mnemonic. An import feature allows users to unlock existing wallets using their keystore file and password. Once connected, users can view their ETH and ticket token balances. The ticket purchasing page, accessible only with a connected wallet, fetches the ticket price from the smart contract and allows users to buy tickets, with transaction status updates provided. The system also includes functionality for ticket redemption, where a doorman or vendor could verify and redeem tickets.

This design aims to provide a secure and seamless experience, with considerations for error handling and clear user feedback. Future enhancements considered include MetaMask/WalletConnect integration and real-time balance updates.

# Links to transactions on Sepolia:
TBD 
