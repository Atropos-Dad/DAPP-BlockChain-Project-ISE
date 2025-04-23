import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to Your Blockchain Wallet</h1>
      <p>Please choose an option to get started:</p>
      <div style={{ marginTop: '30px' }}>
        <Link to="/create" style={{ margin: '0 10px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Create New Wallet
        </Link>
        <Link to="/import" style={{ margin: '0 10px', padding: '10px 20px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          Import Existing Wallet
        </Link>
        <Link to="/restore" style={{ margin: '0 10px', padding: '10px 20px', backgroundColor: '#ffc107', color: 'black', textDecoration: 'none', borderRadius: '5px' }}>
          Restore from Mnemonic
        </Link>
      </div>
    </div>
  );
};

export default LandingPage; 