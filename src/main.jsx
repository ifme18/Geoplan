import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';  // Import the GoogleOAuthProvider

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Wrap your app with GoogleOAuthProvider */}
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">  {/* Replace with your actual Google OAuth client ID */}
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);

