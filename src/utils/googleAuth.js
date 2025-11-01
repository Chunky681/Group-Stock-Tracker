// Google OAuth2 Authentication for Google Sheets API
// This is required for write operations (API keys only work for read)

let accessToken = null;
let tokenClient = null;
let gapiLoaded = false;
let gisLoaded = false;

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

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.access_token) {
        accessToken = response.access_token;
      }
    },
  });
};

// Get valid access token (prompts login if needed)
export const getAccessToken = async () => {
  if (accessToken) {
    // Check if token is still valid (simple check - in production, check expiry)
    return accessToken;
  }

  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google OAuth not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file. See instructions in env.example');
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
  tokenClient.callback = (response) => {
    if (response.error) {
      reject(new Error(response.error));
      return;
    }
    if (response.access_token) {
      accessToken = response.access_token;
      resolve(accessToken);
    } else {
      reject(new Error('No access token received'));
    }
  };

  // Request token (will prompt user to login if not already)
  // Use 'select_account' to show account chooser, or 'none' to use cached token
  tokenClient.requestAccessToken({ prompt: 'select_account' });
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

