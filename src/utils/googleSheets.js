// Google Sheets API Integration
import { getAccessToken, initializeGoogleAuth } from './googleAuth';

const GOOGLE_SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

// Cache for sheet data to reduce API calls
const sheetDataCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache for sheet data

// Clear cache for a specific range or all caches
export const clearSheetCache = (range = null) => {
  if (range) {
    sheetDataCache.delete(range);
  } else {
    sheetDataCache.clear();
  }
};

// Helper function to format date for HoldingsHistory and Sheet1 timestamp columns
// Format: YYYY-MM-DDTHH:mm:ss-HH:MM (e.g., 2025-11-02T20:30:00-05:00)
export const formatHoldingsHistoryDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Get timezone offset in minutes and convert to HH:MM format
  // Note: getTimezoneOffset() returns positive for timezones behind UTC (like EST -05:00)
  // So we need to invert the sign for the ISO format
  const offsetMinutes = date.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
  const offsetMins = Math.abs(offsetMinutes) % 60;
  const offsetSign = offsetMinutes <= 0 ? '+' : '-'; // Inverted because getTimezoneOffset returns opposite
  const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetStr}`;
};

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

export const readSheetData = async (range = 'Sheet1!A1:D1000', forceRefresh = false) => {
  const apiKey = getApiKey();
  const sheetId = getSheetId();
  
  // Check cache first
  if (!forceRefresh) {
    const cached = sheetDataCache.get(range);
    if (cached && cached.timestamp) {
      const now = Date.now();
      if (now - cached.timestamp < CACHE_DURATION) {
        console.log(`Using cached data for ${range}`);
        return cached.data;
      }
    }
  }
  
  // Debug logging (only on first call or when cache misses)
  if (forceRefresh || !sheetDataCache.has(range)) {
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
  }
  
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
    
    const values = data.values || [];
    
    // Cache the result
    sheetDataCache.set(range, {
      data: values,
      timestamp: Date.now()
    });
    
    return values;
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

  // Extend range to include LastPositionChange column (E) if rowData has 5 elements
  const range = rowData.length >= 5 
    ? 'Sheet1!A:E'
    : 'Sheet1!A:D';
  
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
    
    // Clear cache for Sheet1 since we added a row
    clearSheetCache('Sheet1!A1:E1000');
    
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

  // Extend range to include LastPositionChange column (E) if rowData has 5 elements
  const range = rowData.length >= 5 
    ? `Sheet1!A${rowIndex}:E${rowIndex}`
    : `Sheet1!A${rowIndex}:D${rowIndex}`;
  
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
    
    // Clear cache for Sheet1 since we updated a row
    clearSheetCache('Sheet1!A1:D1000');
    
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
    
    // Clear cache for Sheet1 since we deleted a row
    clearSheetCache('Sheet1!A1:D1000');
    
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

// Update chat message in HoldingsHistory sheet
// Finds the most recent record for the given username and ticker combination and updates/adds chat message
export const updateHoldingsHistoryChat = async (ticker, chatMessage, postingUser, positionUsername) => {
  const sheetId = getSheetId();
  
  if (!sheetId) {
    throw new Error('Google Sheet ID not configured. Please check your environment variables.');
  }

  if (!positionUsername) {
    throw new Error('Position username is required to update chat');
  }

  // Get OAuth access token
  let accessToken;
  try {
    await initializeGoogleAuth();
    accessToken = await getAccessToken();
  } catch (error) {
    console.error('OAuth error:', error);
    throw new Error(`Authentication required: ${error.message}. Please ensure VITE_GOOGLE_CLIENT_ID is configured and you're signed in.`);
  }

  try {
    // First, read HoldingsHistory to find the most recent record for this username and ticker combination
    const response = await fetch(
      `${GOOGLE_SHEETS_API_URL}/${sheetId}/values/HoldingsHistory!A1:E10000?key=${getApiKey()}`
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to read HoldingsHistory: ${data.error?.message || response.status}`);
    }
    
    const rows = data.values || [];
    // If HoldingsHistory only has headers or is empty, that's okay - we'll create a new record
    // Only throw an error if the response itself failed
    if (rows.length === 0) {
      throw new Error('Failed to read HoldingsHistory: No data returned');
    }
    
    // Skip header row and find the most recent record for this username and ticker combination
    let mostRecentRow = null;
    let mostRecentRowIndex = -1;
    let mostRecentDate = null;
    
    // Only search through rows if we have data rows (more than just headers)
    if (rows.length >= 2) {
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 4) continue;
        
        const rowUsername = row[1]?.trim() || '';
        const rowTicker = row[2]?.trim().toUpperCase() || '';
        
        // Filter by both username and ticker (case-insensitive for username)
        if (rowUsername.toLowerCase() !== positionUsername.trim().toLowerCase() || rowTicker !== ticker.toUpperCase()) continue;
        
        // Parse snapshot time
        const snapshotTime = row[0]?.trim() || '';
        let date;
        try {
          date = new Date(snapshotTime);
          if (isNaN(date.getTime())) continue;
        } catch (e) {
          continue;
        }
        
        // Track the most recent record
        if (!mostRecentDate || date > mostRecentDate) {
          mostRecentDate = date;
          mostRecentRow = row;
          mostRecentRowIndex = i + 1; // +1 because Google Sheets uses 1-based indexing
        }
      }
    }
    
    if (!mostRecentRow || mostRecentRowIndex === -1) {
      // No record found in HoldingsHistory - need to create one from Sheet1 data
      console.log(`No record found in HoldingsHistory for user "${positionUsername}" and ticker "${ticker}". Creating new record from Sheet1 data.`);
      
      // Read Sheet1 to get current holdings for this user and ticker
      const sheet1Response = await fetch(
        `${GOOGLE_SHEETS_API_URL}/${sheetId}/values/Sheet1!A1:D10000?key=${getApiKey()}`
      );
      
      const sheet1Data = await sheet1Response.json();
      
      if (!sheet1Response.ok) {
        throw new Error(`Failed to read Sheet1: ${sheet1Data.error?.message || sheet1Response.status}`);
      }
      
      const sheet1Rows = sheet1Data.values || [];
      if (sheet1Rows.length < 2) {
        throw new Error(`No holdings found in Sheet1 for user "${positionUsername}" and ticker "${ticker}"`);
      }
      
      // Find all rows matching the username and ticker, sum up shares
      let totalShares = 0;
      for (let i = 1; i < sheet1Rows.length; i++) {
        const row = sheet1Rows[i];
        if (!row || row.length < 3) continue;
        
        const rowUsername = row[0]?.trim() || '';
        const rowTicker = row[1]?.trim().toUpperCase() || '';
        
        if (rowUsername.toLowerCase() === positionUsername.trim().toLowerCase() && 
            rowTicker === ticker.toUpperCase()) {
          const shares = parseFloat(row[2]) || 0;
          totalShares += shares;
        }
      }
      
      if (totalShares === 0) {
        throw new Error(`No holdings found in Sheet1 for user "${positionUsername}" and ticker "${ticker}"`);
      }
      
      // Create new row in HoldingsHistory: A=current time, B=username, C=ticker, D=shares, E=empty (will add chat)
      const currentTime = formatHoldingsHistoryDate();
      const newRow = [
        currentTime, // Column A: Snapshot time
        positionUsername.trim(), // Column B: Name
        ticker.toUpperCase(), // Column C: Ticker
        totalShares.toString(), // Column D: Quantity
        '', // Column E: Chat (empty initially)
      ];
      
      // Append the new row to HoldingsHistory
      const appendResponse = await fetch(
        `${GOOGLE_SHEETS_API_URL}/${sheetId}/values/HoldingsHistory!A:E:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            values: [newRow],
          }),
        }
      );
      
      const appendData = await appendResponse.json();
      
      if (!appendResponse.ok) {
        const errorMsg = appendData.error?.message || `HTTP ${appendResponse.status}`;
        console.error('Google Sheets API error:', appendData);
        throw new Error(`Failed to create HoldingsHistory record: ${errorMsg}`);
      }
      
      // Get the row index of the newly created row
      // The append response should include updatedRange with the new row number
      let newRowIndex = rows.length + 1; // Default to next row
      if (appendData.updates?.updatedRange) {
        // Extract row number from range like "HoldingsHistory!A15:E15"
        const match = appendData.updates.updatedRange.match(/!A(\d+):/);
        if (match) {
          newRowIndex = parseInt(match[1], 10);
        }
      }
      
      // Now add the chat message to the newly created row
      const timestamp = new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      const newChatEntry = `${postingUser}: ${chatMessage} (${timestamp})`;
      
      // Update the cell in column E
      const range = `HoldingsHistory!E${newRowIndex}`;
      
      const updateResponse = await fetch(
        `${GOOGLE_SHEETS_API_URL}/${sheetId}/values/${range}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            values: [[newChatEntry]],
          }),
        }
      );
      
      const updateData = await updateResponse.json();
      
      if (!updateResponse.ok) {
        const errorMsg = updateData.error?.message || `HTTP ${updateResponse.status}`;
        console.error('Google Sheets API error:', updateData);
        throw new Error(`Failed to update chat: ${errorMsg}`);
      }
      
      // Clear cache for HoldingsHistory since we updated it
      clearSheetCache('HoldingsHistory!A1:E10000');
      
      return updateData;
    }
    
    // Existing record found - update it with chat message
    // Get existing chat messages (column E, index 4)
    const existingChats = mostRecentRow[4]?.trim() || '';
    
    // Format new chat message: "Username: Message (timestamp)"
    const timestamp = new Date().toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const newChatEntry = `${postingUser}: ${chatMessage} (${timestamp})`;
    
    // Append new chat to existing chats, separated by newline
    const updatedChats = existingChats 
      ? `${existingChats}\n${newChatEntry}`
      : newChatEntry;
    
    // Update the cell in column E (index 4, so column E is column 5)
    const range = `HoldingsHistory!E${mostRecentRowIndex}`;
    
    const updateResponse = await fetch(
      `${GOOGLE_SHEETS_API_URL}/${sheetId}/values/${range}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          values: [[updatedChats]],
        }),
      }
    );
    
    const updateData = await updateResponse.json();
    
    if (!updateResponse.ok) {
      const errorMsg = updateData.error?.message || `HTTP ${updateResponse.status}`;
      console.error('Google Sheets API error:', updateData);
      throw new Error(`Failed to update chat: ${errorMsg}`);
    }
    
    // Clear cache for HoldingsHistory since we updated it
    clearSheetCache('HoldingsHistory!A1:E10000');
    
    return updateData;
  } catch (error) {
    console.error('Error updating holdings history chat:', error);
    throw error;
  }
};

// Sheet2 operations (Stock Data Sheet)
export const appendRowToSheet2 = async (rowData) => {
  const sheetId = getSheetId();
  
  if (!sheetId) {
    throw new Error('Google Sheet ID not configured. Please check your environment variables.');
  }

  // Get OAuth access token
  let accessToken;
  try {
    await initializeGoogleAuth();
    accessToken = await getAccessToken();
  } catch (error) {
    console.error('OAuth error:', error);
    throw new Error(`Authentication required: ${error.message}. Please ensure VITE_GOOGLE_CLIENT_ID is configured and you're signed in.`);
  }

  const range = 'Sheet2!A:Q';
  
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
      throw new Error(`Failed to append row to Sheet2: ${errorMsg}`);
    }
    
    // Clear cache for Sheet2 since we added a row
    clearSheetCache('Sheet2!A1:Q1000');
    
    return data;
  } catch (error) {
    console.error('Error appending row to Sheet2:', error);
    throw error;
  }
};

// Append a new row to Sheet2 but only write to the Symbol column (column B)
// This preserves formulas in other columns (like Name in column C)
export const appendRowToSheet2SymbolOnly = async (symbol) => {
  const sheetId = getSheetId();
  
  if (!sheetId) {
    throw new Error('Google Sheet ID not configured. Please check your environment variables.');
  }

  // Get OAuth access token
  let accessToken;
  try {
    await initializeGoogleAuth();
    accessToken = await getAccessToken();
  } catch (error) {
    console.error('OAuth error:', error);
    throw new Error(`Authentication required: ${error.message}. Please ensure VITE_GOOGLE_CLIENT_ID is configured and you're signed in.`);
  }

  // Append a row but only provide value for column B (Symbol)
  // By only providing values for columns A and B (A empty, B with symbol),
  // we leave other columns untouched so formulas can populate
  const range = 'Sheet2!A:B';
  
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
          values: [['', symbol]], // Only write to columns A (empty) and B (symbol)
        }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      console.error('Google Sheets API error:', data);
      throw new Error(`Failed to append symbol to Sheet2: ${errorMsg}`);
    }
    
    // Clear cache for Sheet2 since we added a symbol
    clearSheetCache('Sheet2!A1:Q1000');
    
    return data;
  } catch (error) {
    console.error('Error appending symbol to Sheet2:', error);
    throw error;
  }
};

export const updateRowInSheet2 = async (rowIndex, rowData) => {
  const sheetId = getSheetId();
  
  if (!sheetId) {
    throw new Error('Google Sheet ID not configured. Please check your environment variables.');
  }

  // Get OAuth access token
  let accessToken;
  try {
    await initializeGoogleAuth();
    accessToken = await getAccessToken();
  } catch (error) {
    console.error('OAuth error:', error);
    throw new Error(`Authentication required: ${error.message}. Please ensure VITE_GOOGLE_CLIENT_ID is configured and you're signed in.`);
  }

  const range = `Sheet2!A${rowIndex}:Q${rowIndex}`;
  
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
      throw new Error(`Failed to update row in Sheet2: ${errorMsg}`);
    }
    
    // Clear cache for Sheet2 since we updated a row
    clearSheetCache('Sheet2!A1:Q1000');
    
    return data;
  } catch (error) {
    console.error('Error updating row in Sheet2:', error);
    throw error;
  }
};

export const deleteRowFromSheet2 = async (rowIndex) => {
  const sheetId = getSheetId();
  
  if (!sheetId) {
    throw new Error('Google Sheet ID not configured. Please check your environment variables.');
  }

  // Get OAuth access token
  let accessToken;
  try {
    await initializeGoogleAuth();
    accessToken = await getAccessToken();
  } catch (error) {
    console.error('OAuth error:', error);
    throw new Error(`Authentication required: ${error.message}. Please ensure VITE_GOOGLE_CLIENT_ID is configured and you're signed in.`);
  }

  // Use the Google Sheets API v4 batchUpdate to delete a row from Sheet2
  // First, we need to get the sheet ID for Sheet2
  try {
    // Read Sheet2 to find the sheet ID
    const sheetsResponse = await fetch(
      `${GOOGLE_SHEETS_API_URL}/${sheetId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    const sheetsData = await sheetsResponse.json();
    
    if (!sheetsResponse.ok) {
      throw new Error(`Failed to get sheet info: ${sheetsData.error?.message || sheetsResponse.status}`);
    }
    
    // Find Sheet2's sheet ID
    const sheet2Info = sheetsData.sheets?.find(sheet => sheet.properties.title === 'Sheet2');
    if (!sheet2Info) {
      throw new Error('Sheet2 not found');
    }
    
    const sheet2Id = sheet2Info.properties.sheetId;
    
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
                  sheetId: sheet2Id,
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
      throw new Error(`Failed to delete row from Sheet2: ${errorMsg}`);
    }
    
    // Clear cache for Sheet2 since we deleted a row
    clearSheetCache('Sheet2!A1:Q1000');
    
    return data;
  } catch (error) {
    console.error('Error deleting row from Sheet2:', error);
    throw error;
  }
};