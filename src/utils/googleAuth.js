// Google OAuth2 Authentication for Google Sheets API
// This is required for write operations (API keys only work for read)

let accessToken = null;
let tokenClient = null;
let gapiLoaded = false;
let gisLoaded = false;
let pendingOAuthResolve = null; // Store pending promise resolve when OAuth redirects

// Check if we're returning from OAuth redirect (token might be in URL)
// This handles the case where OAuth redirects the main window
if (typeof window !== 'undefined') {
  // Store token from URL hash if present (Google OAuth sometimes puts it there)
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const tokenFromHash = hashParams.get('access_token');
  if (tokenFromHash) {
    accessToken = tokenFromHash;
    console.log('OAuth token restored from URL hash');
    // Clean up URL
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '';
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4'];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

// Load Google API scripts
export const initializeGoogleAuth = () => {
  return new Promise((resolve, reject) => {
    let bothLoaded = false;
    
    const tryResolve = () => {
      if (bothLoaded) return; // Prevent multiple resolutions
      if (gapiLoaded && gisLoaded) {
        bothLoaded = true;
        initializeGapiClient().then(() => resolve()).catch(reject);
      }
    };

    // Load gapi (Google API client library)
    if (!window.gapi) {
      const script1 = document.createElement('script');
      script1.src = 'https://apis.google.com/js/api.js';
      script1.onerror = () => reject(new Error('Failed to load Google API script'));
      script1.onload = () => {
        window.gapi.load('client', () => {
          gapiLoaded = true;
          tryResolve();
        });
      };
      document.head.appendChild(script1);
    } else {
      gapiLoaded = true;
      tryResolve();
    }

    // Load GIS (Google Identity Services)
    if (!window.google) {
      const script2 = document.createElement('script');
      script2.src = 'https://accounts.google.com/gsi/client';
      script2.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
      script2.onload = () => {
        gisLoaded = true;
        initializeTokenClient();
        tryResolve();
      };
      document.head.appendChild(script2);
    } else {
      gisLoaded = true;
      initializeTokenClient();
      tryResolve();
    }
  });
};

const initializeGapiClient = async () => {
  if (!GOOGLE_API_KEY || !GOOGLE_CLIENT_ID) {
    console.warn('Google API key or Client ID not configured - OAuth will not be available');
    return false;
  }

  try {
    await window.gapi.client.init({
      apiKey: GOOGLE_API_KEY,
      clientId: GOOGLE_CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    });
    return true;
  } catch (error) {
    console.error('Error initializing GAPI client:', error);
    return false;
  }
};

const initializeTokenClient = () => {
  if (!window.google || !GOOGLE_CLIENT_ID) {
    return;
  }

  try {
    // Use explicit redirect URI to avoid "not secure" errors
    // For localhost, we use the current origin
    const redirectUri = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: '', // Will be set dynamically in requestAccessToken
      // Add hint parameter to help with authentication
      hint: '', // Can be set to user's email if known
    });
    console.log('Token client initialized with redirect URI:', redirectUri);
  } catch (error) {
    console.error('Error initializing token client:', error);
  }
};

// Get valid access token (prompts login if needed)
export const getAccessToken = async () => {
  if (accessToken) {
    // Check if token is still valid (simple check - in production, check expiry)
    return accessToken;
  }

  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google OAuth not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file.');
  }

  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      initializeGoogleAuth().then(() => {
        if (!tokenClient) {
          reject(new Error('Google OAuth not initialized. Please configure VITE_GOOGLE_CLIENT_ID.'));
          return;
        }
        requestAccessToken(resolve, reject);
      });
    } else {
      requestAccessToken(resolve, reject);
    }
  });
};

const requestAccessToken = (resolve, reject) => {
  if (!tokenClient) {
    reject(new Error('Token client not initialized'));
    return;
  }

  // Store the resolve/reject for potential redirect handling
  pendingOAuthResolve = { resolve, reject };

  // Set up timeout for OAuth flow (if user doesn't complete in 5 minutes)
  const timeoutId = setTimeout(() => {
    pendingOAuthResolve = null;
    reject(new Error('OAuth authentication timed out. Please try again.'));
  }, 5 * 60 * 1000); // 5 minutes

  // Store resolve/reject in tokenClient for callback
  tokenClient.callback = (response) => {
    clearTimeout(timeoutId);
    pendingOAuthResolve = null;
    console.log('OAuth callback received:', response);
    
    if (response.error) {
      console.error('OAuth error:', response.error);
      let errorMessage = `OAuth error: ${response.error}`;
      
      // Provide specific help for common errors
      if (response.error === 'popup_closed_by_user') {
        errorMessage += '. The authentication popup was closed. Please try again.';
      } else if (response.error === 'access_denied') {
        errorMessage += '. Access was denied. Please check that you\'re added as a test user in Google Cloud Console.';
      } else if (response.error.includes('redirect_uri')) {
        errorMessage += '. Please add http://localhost:5173 to Authorized redirect URIs in Google Cloud Console.';
      } else {
        errorMessage += '\n\nTo fix "browser or app may not be secure" error:\n';
        errorMessage += '1. Go to Google Cloud Console > APIs & Services > OAuth consent screen\n';
        errorMessage += '2. If app is in "Testing" mode, add your email as a TEST USER\n';
        errorMessage += '3. In Credentials > OAuth 2.0 Client ID, add http://localhost:5173 to Authorized redirect URIs\n';
        errorMessage += '4. Make sure Google Sheets API is enabled';
      }
      
      reject(new Error(errorMessage));
      return;
    }
    
    if (response.access_token) {
      console.log('OAuth token received successfully');
      accessToken = response.access_token;
      resolve(accessToken);
    } else {
      reject(new Error('No access token received in OAuth response'));
    }
  };

  // Request token (will open popup or redirect for user to authorize)
  // The callback will fire when user completes OAuth flow
  try {
    console.log('Requesting OAuth access token - if page redirects, token will be saved automatically');
    // Request token - use 'consent' to force re-authentication if needed
    // This helps when Google detects automation and blocks sign-in
    tokenClient.requestAccessToken({ 
      prompt: 'consent', // Use 'consent' to force account selection and consent
    });
    
    // If we still have the page (popup mode), check immediately for token in URL
    // This handles cases where OAuth puts token in URL hash
    setTimeout(() => {
      if (window.location && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const tokenFromHash = hashParams.get('access_token');
        if (tokenFromHash && pendingOAuthResolve) {
          clearTimeout(timeoutId);
          accessToken = tokenFromHash;
          console.log('OAuth token found in URL hash');
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          const { resolve: pendingResolve } = pendingOAuthResolve;
          pendingOAuthResolve = null;
          pendingResolve(accessToken);
        }
      }
    }, 1000);
  } catch (error) {
    clearTimeout(timeoutId);
    pendingOAuthResolve = null;
    console.error('Error requesting access token:', error);
    reject(new Error(`Failed to request access token: ${error.message}`));
  }
};

// Clear access token (logout)
export const revokeAccessToken = () => {
  if (accessToken && window.google) {
    window.google.accounts.oauth2.revoke(accessToken);
    accessToken = null;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!accessToken;
};

