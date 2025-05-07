Objectives

    Learn the mechanics of a blockchain distributed application.
    Gain a foundation in Solidity,  a smart contract programming language.
    Through practice, gain a appreciation of the applications of blockchain beyond cryptocurrency.

Description

Create a Web3 Distributed Application (DApp) that implements simple ticketing system.  You should use the Ethereum Sepolia Testnet as you blockchain for Solidity smart contract deployments,  and HTML, CSS and Javascript for your front end.  You are free to use any development environments that you are comfortable with, however examples in this module will be demonstrated using Visual Studio Code and the Online Remix Solidity compiler and deployment tool.

Front End:
    - [X] Page allowing a user to create a wallet.
        - [X] Should provide the ability to download the created wallet.
        - [X] Should display wallet details once created.
    - [X] Page allowing a user to check their current crypto and ticket token balance.
        - [X] To be used by the following actors:
            - [X] Person attending the event so that they can confirm their purchase.
            - [X] Doorman, so they can confirm a wallet is the holder of the ticket.
            - [ ] Venue, so they can check on distribution of tickets
    - [X] Page allowing a user to buy a ticket (token).
    - [X] Page allowing a user to transfer a ticket back to the vendor.

Blockchain Backend:
- [x] Smart contract implementing the ERC-20 standard and extended to allow tickets to be purchased using the native cryptocurrency of Sepolia (SETH)
- [ ] Project should be submitted as a zipped solution via Brightspace
- [ ] The project should be accompanied by a report detailing the following:
    - [ ] Code overview.
    - [ ] Design description.
    - [ ] Links to transactions on Sepolia's blockchain explorer showing:
        - [ ] A successful deployment of your contract
        - [ ] A successful execution of your contract to buy a token
        - [ ] A successful topping up of separate wallets for:
            - [ ] Contract creator
            - [ ] Ticket Purchaser
            - [ ] Vendor / Doorman
- [ ] Peer Review:  3 Weeks Prior to submission you will engage in a peer review session with a colleague which you will document and submit
