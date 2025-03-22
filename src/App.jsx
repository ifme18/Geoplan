import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Appointment from './Appointmentallocation';
import QuotationScreen from './Quotes';
import ClientList from './ClienList';
import InvoiceManager from './ClientDetailScreen';
import Generation from './Generation';

function App() {
  return (
    <Router>
      <DashboardLayout />
    </Router>
  );
}

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  return (
    <div style={styles.dashboard}>
      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        width: sidebarOpen ? '250px' : '70px',
      }}>
        <div style={styles.sidebarHeader}>
          <h2 style={{
            ...styles.logo,
            opacity: sidebarOpen ? 1 : 0,
            width: sidebarOpen ? 'auto' : 0,
            transition: 'opacity 0.3s, width 0.3s'
          }}>Geoplan</h2>
          <button style={styles.menuToggle} onClick={toggleSidebar}>
            {sidebarOpen ? '✕' : '☰'}
          </button>
        </div>
        
        <nav style={styles.nav}>
          <NavItem 
            to="/" 
            icon="🏠" 
            text="Dashboard" 
            isActive={location.pathname === '/'} 
            expanded={sidebarOpen} 
          />
          <NavItem 
            to="/appointments" 
            icon="📅" 
            text="Appointments" 
            isActive={location.pathname === '/appointments'} 
            expanded={sidebarOpen} 
          />
          <NavItem 
            to="/Generator" 
            icon="👥" 
            text="Client Management" 
            isActive={location.pathname === '/Generator'} 
            expanded={sidebarOpen} 
          />
          <NavItem 
            to="/Gener" 
            icon="💳" 
            text="Invoices" 
            isActive={location.pathname === '/Gener'} 
            expanded={sidebarOpen} 
          />
          <NavItem 
            to="/quotations" 
            icon="📄" 
            text="Quotations" 
            isActive={location.pathname === '/quotations'} 
            expanded={sidebarOpen} 
          />
        </nav>
      </div>
      
      {/* Main Content Area */}
      <div style={{
        ...styles.content,
        marginLeft: sidebarOpen ? '250px' : '70px',
      }}>
        {/* Header */}
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>
            {getPageTitle(location.pathname)}
          </h1>
          <div style={styles.userProfile}>
            <div style={styles.avatar}>GP</div>
            <span style={styles.username}>Admin</span>
          </div>
        </header>
        
        {/* Main Content */}
        <main style={styles.mainContent}>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/Generator" element={<ClientManagementPage />} />
            <Route path="/Gener" element={<InvoicePage />} />
            <Route path="/quotations" element={<QuotationsPage />} />
            <Route path="/invoice" element={<Navigate to="/Gener" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer style={styles.footer}>
          <p>© {new Date().getFullYear()} Geoplan Management System</p>
        </footer>
      </div>
    </div>
  );
}

// Navigation Item Component
function NavItem({ to, icon, text, isActive, expanded }) {
  return (
    <Link to={to} style={{
      ...styles.navItem,
      ...(isActive ? styles.activeNavItem : {}),
      justifyContent: expanded ? 'flex-start' : 'center',
    }}>
      <span style={styles.navIcon}>{icon}</span>
      <span style={{
        ...styles.navText,
        opacity: expanded ? 1 : 0,
        width: expanded ? 'auto' : 0,
        transition: 'opacity 0.3s, width 0.3s'
      }}>{text}</span>
    </Link>
  );
}

// Dashboard Home with Card Navigation
function DashboardHome() {
  return (
    <div>
      <div style={styles.welcomeSection}>
        <h2>Welcome to Geoplan Management System</h2>
        <p>Select a category below to get started with your workflow</p>
      </div>
      
      <div style={styles.cardGrid}>
        <DashboardCard 
          title="Appointments" 
          icon="📅"
          description="Schedule and manage client appointments"
          linkTo="/appointments"
          color="#4caf50"
        />
        <DashboardCard 
          title="Client Management" 
          icon="👥"
          description="Manage client profiles and information"
          linkTo="/Generator"
          color="#2196f3"
        />
        <DashboardCard 
          title="Invoice Generator" 
          icon="💳"
          description="Create and manage client invoices"
          linkTo="/Gener"
          color="#f44336"
        />
        <DashboardCard 
          title="Quotations" 
          icon="📄"
          description="Create and track client quotations"
          linkTo="/quotations"
          color="#ff9800"
        />
      </div>
    </div>
  );
}

// Dashboard Card Component
function DashboardCard({ title, icon, description, linkTo, color }) {
  return (
    <Link to={linkTo} style={styles.cardLink}>
      <div style={styles.card} onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
      }} onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
      }}>
        <div style={{
          ...styles.cardIcon,
          backgroundColor: `${color}10`,
          border: `1px solid ${color}30`,
        }}>
          <span style={{ fontSize: '28px' }}>{icon}</span>
        </div>
        <h3 style={{ ...styles.cardTitle, color: color }}>{title}</h3>
        <p style={styles.cardDescription}>{description}</p>
      </div>
    </Link>
  );
}

// Page Components
function AppointmentsPage() {
  return (
    <div style={styles.pageContainer}>
      <Appointment />
    </div>
  );
}

function ClientManagementPage() {
  return (
    <div style={styles.pageContainer}>
      <InvoiceManager />
    </div>
  );
}

function InvoicePage() {
  return (
    <div style={styles.pageContainer}>
      <Generation />
    </div>
  );
}

function QuotationsPage() {
  return (
    <div style={styles.pageContainer}>
      <QuotationScreen />
    </div>
  );
}

// Helper function to get page title
function getPageTitle(pathname) {
  switch(pathname) {
    case '/':
      return 'Dashboard';
    case '/appointments':
      return 'Appointment Management';
    case '/Generator':
      return 'Client Management';
    case '/Gener':
      return 'Invoice Generator';
    case '/quotations':
      return 'Quotation Management';
    default:
      return 'Geoplan Management System';
  }
}

// Updated Styles
const styles = {
  dashboard: {
    fontFamily: "'Roboto', 'Segoe UI', sans-serif",
    display: 'flex',
    height: '100vh',      // Changed from minHeight to height
    width: '100vw',       // Added full width
    backgroundColor: '#f5f7fa',
    color: '#333',
    margin: 0,            // Remove default margins
    padding: 0,           // Remove default padding
    overflow: 'hidden',   // Prevent unwanted scrolling
    position: 'fixed',    // Fix position to viewport
    top: 0,
    left: 0,
  },
  sidebar: {
    position: 'fixed',
    height: '100vh',
    backgroundColor: '#1e293b',
    color: 'white',
    transition: 'width 0.3s ease',
    boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
    zIndex: 100,
    overflowX: 'hidden',
  },
  content: {
    flex: 1,
    transition: 'margin-left 0.3s ease',
    display: 'flex',           // Already present
    flexDirection: 'column',   // Already present
    height: '100vh',           // Added to ensure full height
    width: 'auto',            // Changed from calc to auto
    marginLeft: '250px',      // Already present
  },
  mainContent: {
    padding: '30px',
    flex: 1,
    overflowY: 'auto',
    height: '100%',           // Added to fill available space
  },
  // Rest of your styles remain unchanged
  sidebarHeader: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #2c3e50',
  },
  logo: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 600,
  },
  menuToggle: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '20px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    padding: '15px 0',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 20px',
    color: '#cbd5e1',
    textDecoration: 'none',
    transition: 'background-color 0.2s, color 0.2s',
    borderRadius: '4px',
    margin: '4px 8px',
  },
  activeNavItem: {
    backgroundColor: '#2c3e50',
    color: '#4caf50',
    fontWeight: 500,
  },
  navIcon: {
    marginRight: '15px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '18px',
  },
  navText: {
    whiteSpace: 'nowrap',
  },
  header: {
    backgroundColor: 'white',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 500,
    margin: 0,
    color: '#333',
  },
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#4caf50',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  username: {
    fontWeight: 500,
  },
  footer: {
    padding: '15px 30px',
    textAlign: 'center',
    borderTop: '1px solid #e5e7eb',
    color: '#6b7280',
    backgroundColor: 'white',
  },
  welcomeSection: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  cardLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '25px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    minHeight: '220px',
    justifyContent: 'center',
    cursor: 'pointer',
    border: '1px solid #e5e7eb',
  },
  cardIcon: {
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '70px',
    height: '70px',
    borderRadius: '50%',
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 10px 0',
  },
  cardDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
  pageContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    width: '100%',
    height: '100%',           // Added to fill container
  },
};

export default App;




