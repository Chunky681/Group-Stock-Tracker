// Google Sheets API Integration

const GOOGLE_SHEETS_API_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

const getApiKey = () => {
  return import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '';
};

const getSheetId = () => {
  return import.meta.env.VITE_GOOGLE_SHEET_ID || '';
};

export const readSheetData = async (range = 'Sheet1!A1:D1000') => {
  const apiKey = getApiKey();
  const sheetId = getSheetId();
  
  if (!apiKey || !sheetId) {
    throw new Error('Google Sheets API key or Sheet ID not configured. Please check your environment variables.');
  }

  try {
    const response = await fetch(
      `${GOOGLE_SHEETS_API_URL}/${sheetId}/values/${range}?key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to read sheet: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('Error reading sheet:', error);
    throw error;
  }
};

export const appendRow = async (rowData) => {
  const apiKey = getApiKey();
  const sheetId = getSheetId();
  
  if (!apiKey || !sheetId) {
    throw new Error('Google Sheets API key or Sheet ID not configured. Please check your environment variables.');
  }

  const range = 'Sheet1!A:D';
  
  try {
    const response = await fetch(
      `${GOOGLE_SHEETS_API_URL}/${sheetId}/values/${range}:append?valueInputOption=RAW&key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowData],
      }),
    }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to append row: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error appending row:', error);
    throw error;
  }
};

export const updateRow = async (rowIndex, rowData) => {
  const apiKey = getApiKey();
  const sheetId = getSheetId();
  
  if (!apiKey || !sheetId) {
    throw new Error('Google Sheets API key or Sheet ID not configured. Please check your environment variables.');
  }

  const range = `Sheet1!A${rowIndex}:D${rowIndex}`;
  
  try {
    const response = await fetch(
      `${GOOGLE_SHEETS_API_URL}/${sheetId}/values/${range}?valueInputOption=RAW&key=${apiKey}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowData],
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to update row: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating row:', error);
    throw error;
  }
};

export const initializeSheet = async () => {
  try {
    const data = await readSheetData('Sheet1!A1:D1');
    
    if (!data || data.length === 0 || data[0][0] !== 'Username') {
      const headers = [['Username', 'Ticker', 'Shares', 'Last Updated']];
      await updateRow(1, headers[0]);
    }
  } catch (error) {
    console.error('Error initializing sheet:', error);
    try {
      await appendRow(['Username', 'Ticker', 'Shares', 'Last Updated']);
    } catch (e) {
      console.error('Could not create headers:', e);
    }
  }
};
