import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { WalletProvider, useWallet } from './contexts/WalletContext'
import CreateWalletPage from './pages/CreateWalletPage'
import ImportWalletPage from './pages/ImportWalletPage'
import RestoreWalletPage from './pages/RestoreWalletPage'
import WalletDetails from './pages/WalletDetails'
import BuyTicketsPage from './pages/BuyTicketsPage'
import LandingPage from './pages/LandingPage'
import MyTickets from './pages/MyTickets'
import ShowRedemptionQRCode from './pages/ShowRedemptionQRCode'
import RedeemTicketsPage from './pages/RedeemTicketsPage'
import VenueDashboard from './pages/VenueDashboard'

function AppRoutes() {
  const { wallet } = useWallet();

  return (
    <Routes>
      <Route 
        path="/" 
        element={!wallet ? <LandingPage /> : <Navigate replace to="/wallet" />} 
      />
      <Route 
        path="/create" 
        element={!wallet ? <CreateWalletPage /> : <Navigate replace to="/wallet" />} 
      />
      <Route 
        path="/import" 
        element={!wallet ? <ImportWalletPage /> : <Navigate replace to="/wallet" />} 
      />
      <Route 
        path="/restore" 
        element={!wallet ? <RestoreWalletPage /> : <Navigate replace to="/wallet" />} 
      />
      <Route 
        path="/wallet" 
        element={wallet ? <WalletDetails /> : <Navigate replace to="/" />} 
      />
      <Route 
        path="/buy-tickets" 
        element={wallet ? <BuyTicketsPage /> : <Navigate replace to="/" />} 
      />
      <Route
        path="/my-tickets"
        element={wallet ? <MyTickets /> : <Navigate replace to="/" />}
      />
      <Route
        path="/show-qr"
        element={wallet ? <ShowRedemptionQRCode /> : <Navigate replace to="/" />}
      />
      <Route
        path="/redeem"
        element={wallet ? <RedeemTicketsPage /> : <Navigate replace to="/" />}
      />
      <Route
        path="/venue"
        element={wallet ? <VenueDashboard /> : <Navigate replace to="/" />}
      />
    </Routes>
  );
}

function Navigation() {
  const { wallet } = useWallet();

  return (
    <nav style={{padding: '10px', borderBottom: '1px solid #ccc'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <Link to={wallet ? "/wallet" : "/"} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h1>Blockchain Wallet</h1>
        </Link>
        <div>
          {!wallet ? (
            <>
              <Link to="/create" style={{marginRight: '15px', textDecoration: 'none'}}>Create Wallet</Link>
              <Link to="/import" style={{marginRight: '15px', textDecoration: 'none'}}>Import Wallet</Link>
              <Link to="/restore" style={{textDecoration: 'none'}}>Restore</Link>
            </>
          ) : (
            <>
              <Link to="/wallet" style={{marginRight: '15px', textDecoration: 'none'}}>Wallet Details</Link>
              <Link to="/buy-tickets" style={{marginRight: '15px', textDecoration: 'none'}}>Buy Tickets</Link>
              <Link to="/my-tickets" style={{marginRight: '15px', textDecoration: 'none'}}>My Tickets</Link>
              <Link to="/show-qr" style={{marginRight: '15px', textDecoration: 'none'}}>Show Tickets</Link>
              <Link to="/redeem" style={{marginRight: '15px', textDecoration: 'none'}}>Redeem Tickets</Link>
              <Link to="/venue" style={{textDecoration: 'none'}}>Venue Dashboard</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <div style={{width: '100%', maxWidth: '1200px', margin: '0 auto'}}>
          <Navigation />
          <div style={{padding: '20px'}}>
            <AppRoutes />
          </div>
        </div>
      </BrowserRouter>
    </WalletProvider>
  )
}

export default App
