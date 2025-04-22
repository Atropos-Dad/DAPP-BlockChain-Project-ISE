import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { WalletProvider } from './contexts/WalletContext'
import CreateWalletPage from './pages/CreateWalletPage'
import ImportWalletPage from './pages/ImportWalletPage'
import RestoreWalletPage from './pages/RestoreWalletPage'
import WalletDetails from './pages/WalletDetails'

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <div style={{width: '100%', maxWidth: '1200px', margin: '0 auto'}}>
          <nav style={{padding: '10px', borderBottom: '1px solid #ccc'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h1>Blockchain Wallet</h1>
              <div>
                <Link to="/" style={{marginRight: '15px', textDecoration: 'none'}}>Create Wallet</Link>
                <Link to="/import" style={{marginRight: '15px', textDecoration: 'none'}}>Import Wallet</Link>
                <Link to="/restore" style={{textDecoration: 'none'}}>Restore from Mnemonic</Link>
              </div>
            </div>
          </nav>
          
          <div style={{padding: '20px'}}>
            <Routes>
              <Route path="/" element={<CreateWalletPage />} />
              <Route path="/import" element={<ImportWalletPage />} />
              <Route path="/restore" element={<RestoreWalletPage />} />
              <Route path="/wallet" element={<WalletDetails />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </WalletProvider>
  )
}

export default App
