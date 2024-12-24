import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Appointment from './Appointmentallocation';
import QuotationScreen from './Quotes';
import ClientList from './ClienList';
import InvoiceManager from './ClientDetailScreen';
import Generation from './Generation';

// Ensure paths to Appointment and QuotationScreen are correct

function App() {
  return (
    <Router>
      <div style={styles.appContainer}>
        {/* Header with Navigation */}
        <header style={styles.header}>
          <h1>🗓️ Geoplan Management System</h1>
          <nav style={styles.nav}>
            <Link to="/" style={styles.navLink}>Home</Link>
            <Link to="/appointments" style={styles.navLink}>Appointments</Link>
            <Link to="/Generator" style={styles.navLink}>Client Management</Link>
            <Link to="/Gener" style={styles.navLink}>Client Invoice Generator</Link>
            <Link to="/quotations" style={styles.navLink}>Quotations</Link>
          </nav>
        </header>
        
        {/* Main Content */}
        <main style={styles.mainContent}>
          <Routes>
            <Route
              path="/"
              element={
                <div style={styles.container}>
                  <h2>Welcome to Geoplan Management System</h2>
                  <p>Manage your appointments and quotations efficiently!</p>
                </div>
              }
            />
            <Route
              path="/appointments"
              element={
                <div style={styles.container}>
                  <h2>Manage Your Appointments</h2>
                  <Appointment />
                </div>
              }
            />
            <Route
              path="/Gener"
              element={
                <div style={styles.container}>
                  <h2>Invoice</h2>
                  <Generation/>
                </div>
              }
            />
            <Route
              path="/Generator"
              element={
                <div style={styles.container}>
                  <h2>Manage Your Appointments</h2>
                  <InvoiceManager />
                </div>
              }
            />
            <Route
              path="/quotations"
              element={
                <div style={styles.container}>
                  <h2>Quotation Management</h2>
                  <QuotationScreen />
                </div>
              }
            />
            <Route
              path="/invoice"
              element={
                <div style={styles.container}>
                  <h2>Client Invoice Management</h2>
                  <ClientList />
                </div>
              }
            />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer style={styles.footer}>
          <p>© {new Date().getFullYear()} Geoplan Management System. All Rights Reserved.</p>
        </footer>
      </div>
    </Router>
  );
}

// Styles
const styles = {
  appContainer: {
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#4caf50',
    color: 'white',
    padding: '20px 0',
    textAlign: 'center',
    fontSize: '24px',
  },
  nav: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '10px',
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '16px',
    padding: '5px 10px',
    borderRadius: '4px',
    backgroundColor: '#388e3c',
    transition: 'background 0.3s',
  },
  navLinkHover: {
    backgroundColor: '#2e7d32',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    alignItems: 'center',
    padding: '20px',
  },
  container: {
    width: '90%',
    maxWidth: '800px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    margin: '20px 0',
  },
  footer: {
    textAlign: 'center',
    padding: '10px',
    backgroundColor: '#4caf50',
    color: 'white',
    marginTop: 'auto',
  },
};

export default App;




