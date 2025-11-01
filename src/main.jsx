import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Handle OAuth redirect - check for token in URL on page load
if (window.location && window.location.hash) {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  if (accessToken) {
    // Token found in URL - clean up URL immediately
    console.log('OAuth token detected in URL on page load');
    window.history.replaceState(null, '', window.location.pathname);
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

