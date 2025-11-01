// Google Sheets API Integration
import { getAccessToken, initializeGoogleAuth } from './googleAuth';

const GOOGLE_SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

const getApiKey = () => {
  const key = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '';
  if (!key || key === 'your_api_key_here' || key.trim() === '') {
    console.warn('Google Sheets API key not found in environment variables');
    return '';
  }
  return key.trim();
};

const getSheetId = () => {
  const id = import.meta.env.VITE_GOOGLE_SHEET_ID || '';
  if (!id || id === 'your_sheet_id_here' || id.trim() === '') {
    console.warn('Google Sheet ID not found in environment variables');
    return '';
  }
  return id.trim();
};

export const readSheetData = async (range = 'Sheet1!A1:D1000') => {
  const apiKey = getApiKey();
  const sheetId = getSheetId();
  
  // Debug logging
  console.log('Environment check:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'none',
    hasSheetId: !!sheetId,
    sheetIdLength: sheetId?.length || 0,
    rawEnv: {
      VITE_GOOGLE_SHEETS_API_KEY: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY ? 'set' : 'not set',
      VITE_GOOGLE_SHEET_ID: import.meta.env.VITE_GOOGLE_SHEET_ID ? 'set' : 'not set'
    }
  });
  
  if (!apiKey || !sheetId) {
    const missing = [];
    if (!apiKey) missing.push('API Key (VITE_GOOGLE_SHEETS_API_KEY)');
    if (!sheetId) missing.push('Sheet ID (VITE_GOOGLE_SHEET_ID)');
    throw new Error(`Google Sheets ${missing.join(' and ')} not configured. Please check your .env file and restart the dev server.`);
  }

  try {
    const response = await fetch(
      `${GOOGLE_SHEETS_API_URL}/${sheetId}/values/${range}?key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.error?.message || data.error?.message || `HTTP ${response.status}`;
      console.error('Google Sheets API error:', data);
      throw new Error(`Failed to read sheet: ${errorMsg}`);
    }
    
    return data.values || [];
  } catch (error) {
    console.error('Error reading sheet:', error);
    throw error;
  }
};

export const appendRow = async (rowData) => {
  const sheetId = getSheetId();
  
  if (!sheetId) {
    throw new Error('Google Sheet ID not configured. Please check your environment variables.');
  }

  // Get OAuth access token (will initialize and prompt user login if needed)
  let accessToken;
  try {
    await initializeGoogleAuth();
    accessToken = await getAccessToken();
  } catch (error) {
    console.error('OAuth error:', error);
    throw new Error(`Authentication required: ${error.message}. Please ensure VITE_GOOGLE_CLIENT_ID is configured and you're signed in.`);
  }

  const range = 'Sheet1!A:D';
  
  try {
    const response = await fetch(
      `${GOOGLE_SHEETS_API_URL}/${sheetId}/values/${range}:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          values: [rowData],
      }),
    }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      console.error('Google Sheets API error:', data);
      throw new Error(`Failed to append row: ${errorMsg}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error appending row:', error);
    throw error;
  }
};

export const updateRow = async (rowIndex, rowData) => {
  const sheetId = getSheetId();
  
  if (!sheetId) {
    throw new Error('Google Sheet ID not configured. Please check your environment variables.');
  }

  // Get OAuth access token (will initialize and prompt user login if needed)
  let accessToken;
  try {
    await initializeGoogleAuth();
    accessToken = await getAccessToken();
  } catch (error) {
    console.error('OAuth error:', error);
    throw new Error(`Authentication required: ${error.message}. Please ensure VITE_GOOGLE_CLIENT_ID is configured and you're signed in.`);
  }

  const range = `Sheet1!A${rowIndex}:D${rowIndex}`;
  
  try {
    const response = await fetch(
      `${GOOGLE_SHEETS_API_URL}/${sheetId}/values/${range}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          values: [rowData],
        }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      console.error('Google Sheets API error:', data);
      throw new Error(`Failed to update row: ${errorMsg}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error updating row:', error);
    throw error;
  }
};

export const deleteRow = async (rowIndex) => {
  const sheetId = getSheetId();
  
  if (!sheetId) {
    throw new Error('Google Sheet ID not configured. Please check your environment variables.');
  }

  // Get OAuth access token (will initialize and prompt user login if needed)
  let accessToken;
  try {
    await initializeGoogleAuth();
    accessToken = await getAccessToken();
  } catch (error) {
    console.error('OAuth error:', error);
    throw new Error(`Authentication required: ${error.message}. Please ensure VITE_GOOGLE_CLIENT_ID is configured and you're signed in.`);
  }

  // Use the Google Sheets API v4 batchUpdate to delete a row
  try {
    const response = await fetch(
      `${GOOGLE_SHEETS_API_URL}/${sheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: 0, // Sheet1 is typically sheetId 0
                  dimension: 'ROWS',
                  startIndex: rowIndex - 1, // Convert 1-based to 0-based index
                  endIndex: rowIndex, // Delete just one row
                },
              },
            },
          ],
        }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      console.error('Google Sheets API error:', data);
      throw new Error(`Failed to delete row: ${errorMsg}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error deleting row:', error);
    throw error;
  }
};

export const initializeSheet = async () => {
  try {
    const data = await readSheetData('Sheet1!A1:D1');
    
    if (!data || data.length === 0 || data[0][0] !== 'Username') {
      const headers = [['Username', 'Ticker', 'Shares', 'Last Updated']];
      try {
        await updateRow(1, headers[0]);
      } catch (updateError) {
        // If update fails, try append instead
        console.log('Update failed, trying append:', updateError.message);
        await appendRow(['Username', 'Ticker', 'Shares', 'Last Updated']);
      }
    }
  } catch (error) {
    console.error('Error initializing sheet:', error);
    // Silently fail - sheet might already have headers or OAuth not configured
  }
};
